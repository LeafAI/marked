import { marked, Renderer, Tokens } from 'marked'
import hljs from 'highlight.js'
import katex from 'katex'
import { DiagramRendererConfig } from '../../types'
import { renderDiagram, DIAGRAM_LANGUAGES, clearKrokiStore } from './diagrams'

let configuredDiagramConfig: DiagramRendererConfig | null = null

// ─── Line map for scroll sync ─────────────────────────────────────────────────

interface LineMapEntry {
  type: 'heading' | 'code' | 'blockquote' | 'list' | 'paragraph'
  line: number
}

function buildLineMap(source: string): LineMapEntry[] {
  const entries: LineMapEntry[] = []
  const lines = source.split('\n')
  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        entries.push({ type: 'code', line: i + 1 })
      } else {
        inCodeBlock = false
      }
      continue
    }

    if (inCodeBlock) continue

    if (/^#{1,6}\s/.test(trimmed)) {
      entries.push({ type: 'heading', line: i + 1 })
    } else if (trimmed.startsWith('>')) {
      entries.push({ type: 'blockquote', line: i + 1 })
    } else if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      entries.push({ type: 'list', line: i + 1 })
    } else if (trimmed.length > 0 && !/^[-*_]{3,}$/.test(trimmed)) {
      entries.push({ type: 'paragraph', line: i + 1 })
    }
  }

  return entries
}

// ─── Custom renderer ──────────────────────────────────────────────────────────

let lineMap: LineMapEntry[] = []
let lineMapPos = 0

function nextLine(): number {
  if (lineMapPos < lineMap.length) {
    return lineMap[lineMapPos++].line
  }
  return 0
}

function buildRenderer(diagramConfig: DiagramRendererConfig): Renderer {
  const renderer = new Renderer()

  renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
    const line = nextLine()
    const language = (lang ?? '').toLowerCase().trim()
    const lineAttr = line ? ` data-line="${line}"` : ''

    if (language && DIAGRAM_LANGUAGES.has(language)) {
      const html = renderDiagram(text, language, diagramConfig)
      if (html) return `<div${lineAttr}>${html}</div>`
    }

    if (language) {
      try {
        const highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value
        return `<pre${lineAttr}><code class="hljs language-${language}">${highlighted}</code></pre>`
      } catch {
        // unknown language — fall through
      }
    }

    const escaped = hljs.highlightAuto(text).value
    return `<pre${lineAttr}><code class="hljs">${escaped}</code></pre>`
  }

  const originalHeading = renderer.heading.bind(renderer)
  renderer.heading = (token: Tokens.Heading) => {
    const line = nextLine()
    const text = token.tokens.map((t: Tokens.Generic) => t.raw || t.text || '').join('')
    const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '')
    const content = originalHeading(token)
    return content.replace(/^<h(\d)/, `<h$1 data-line="${line}" id="${id}"`)
  }

  const originalBlockquote = renderer.blockquote.bind(renderer)
  renderer.blockquote = (token: Tokens.Blockquote) => {
    const line = nextLine()
    const content = originalBlockquote(token)
    return content.replace(/^<blockquote/, `<blockquote data-line="${line}"`)
  }

  const originalList = renderer.list.bind(renderer)
  renderer.list = (token: Tokens.List) => {
    const line = nextLine()
    const content = originalList(token)
    return content.replace(/^<(ul|ol)/, `<$1 data-line="${line}"`)
  }

  const originalParagraph = renderer.paragraph.bind(renderer)
  renderer.paragraph = (token: Tokens.Paragraph) => {
    const line = nextLine()
    const content = originalParagraph(token)
    return content.replace(/^<p/, `<p data-line="${line}"`)
  }

  return renderer
}

// ─── Math inline preprocessing ────────────────────────────────────────────────

function processMathSegment(text: string): string {
  // Block math: $$...$$
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math: string) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return `<span class="diagram-error">Math error</span>`
    }
  })

  // Inline math: $...$
  result = result.replace(/\$([^\n$]+?)\$/g, (_match, math: string) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `<span class="diagram-error">Math error</span>`
    }
  })

  return result
}

function renderMath(text: string): string {
  // Split by fenced code blocks to avoid processing math inside code
  const parts = text.split(/(^```\w*\n[\s\S]*?^\s*```[ \t]*$|^~~~\w*\n[\s\S]*?^\s*~~~[ \t]*$)/gm)
  return parts
    .map((part, i) => (i % 2 === 0 ? processMathSegment(part) : part))
    .join('')
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function renderMarkdown(source: string, diagramConfig: DiagramRendererConfig): string {
  // Clear Kroki store so stale entries from previous renders are discarded
  clearKrokiStore()

  // Re-use renderer instance if config hasn't changed (avoids repeated setup)
  if (configuredDiagramConfig !== diagramConfig) {
    configuredDiagramConfig = diagramConfig
    marked.setOptions({ renderer: buildRenderer(diagramConfig) })
  }

  // Build line map for scroll sync
  lineMap = buildLineMap(source)
  lineMapPos = 0

  // Pre-process math before marked (to avoid marked escaping $ signs)
  const withMath = renderMath(source)
  return marked.parse(withMath) as string
}
