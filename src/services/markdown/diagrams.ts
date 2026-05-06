import { DiagramRendererConfig } from '../../types'

const KROKI = 'https://kroki.io'
const MERMAID_INK = 'https://mermaid.ink'
const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml'

// Diagram language tags handled here (not passed to highlight.js)
export const DIAGRAM_LANGUAGES = new Set([
  'mermaid',
  'dot',
  'graphviz',
  'plantuml',
  'c4plantuml',
  'ditaa',
  'blockdiag',
  'seqdiag',
  'nwdiag',
  'actdiag',
  'packetdiag',
  'rackdiag',
  'erd',
  'pikchr',
  'structurizr',
  'vegalite',
  'nomnoml',
  'svgbob',
])

// ─── Kroki diagram store ─────────────────────────────────────────────────────
// Diagram code is stored here by ID during rendering, then retrieved by
// PreviewPanel after HTML injection. This avoids embedding code in HTML attributes.

interface KrokiEntry {
  type: string
  code: string
}

let krokiStore: Map<string, KrokiEntry> = new Map()
let krokiCounter = 0

export function clearKrokiStore() {
  krokiStore = new Map()
  krokiCounter = 0
}

export function getKrokiEntry(id: string): KrokiEntry | undefined {
  return krokiStore.get(id)
}

// ─── Encoding helpers ─────────────────────────────────────────────────────────

function encodeBase64(text: string): string {
  // UTF-8 safe base64
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach(b => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function encodeBase64Url(text: string): string {
  return encodeBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// PlantUML server accepts ~h<hex> as an encoding (avoids custom deflate algo)
function hexEncodePlantUML(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `~h${hex}`
}

// ─── Render functions ─────────────────────────────────────────────────────────

function wrapDiagram(inner: string): string {
  return `<div class="diagram-container">${inner}</div>`
}

function imgTag(src: string, alt: string): string {
  return `<img src="${src}" alt="${alt}" loading="lazy" />`
}

// Mermaid local: emit a <div class="mermaid"> placeholder;
// mermaid.run() will process it after HTML injection.
export function renderMermaidLocal(code: string): string {
  // Escape HTML entities inside the pre-rendered source
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return wrapDiagram(`<pre class="mermaid">${escaped}</pre>`)
}

export function renderMermaidInk(code: string): string {
  const payload = encodeBase64(JSON.stringify({ code, mermaid: { theme: 'dark' } }))
  return wrapDiagram(imgTag(`${MERMAID_INK}/svg/${payload}`, 'Mermaid diagram'))
}

export function renderMermaidKroki(code: string): string {
  return wrapDiagram(imgTag(`${KROKI}/mermaid/svg/${encodeBase64Url(code)}`, 'Mermaid diagram'))
}

export function renderPlantUMLServer(code: string): string {
  return wrapDiagram(
    imgTag(`${PLANTUML_SERVER}/svg/${hexEncodePlantUML(code)}`, 'PlantUML diagram')
  )
}

// Kroki diagrams: store code in memory, render a placeholder with just the ID.
export function renderKrokiPlaceholder(code: string, type: string): string {
  const id = `kroki-${++krokiCounter}`
  krokiStore.set(id, { type, code })
  return wrapDiagram(
    `<div class="kroki-diagram" data-kroki-id="${id}"><span class="diagram-loading">Rendering…</span></div>`
  )
}

// Fetch diagram SVG from Kroki via POST (called from PreviewPanel after HTML injection)
export async function fetchKrokiDiagram(type: string, code: string): Promise<string> {
  const res = await fetch(`${KROKI}/${type}/svg`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: code,
  })
  if (!res.ok) throw new Error(`Kroki returned ${res.status}`)
  return res.text()
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function renderDiagram(code: string, language: string, config: DiagramRendererConfig): string {
  const lang = language.toLowerCase().trim()

  switch (lang) {
    case 'mermaid':
      if (config.mermaid === 'local') return renderMermaidLocal(code)
      if (config.mermaid === 'mermaid.ink') return renderMermaidInk(code)
      return renderMermaidKroki(code)

    case 'dot':
    case 'graphviz':
      return renderKrokiPlaceholder(code, 'graphviz')

    case 'plantuml':
      if (config.plantuml === 'plantuml.com') return renderPlantUMLServer(code)
      return renderKrokiPlaceholder(code, 'plantuml')

    case 'c4plantuml':
      if (config.plantuml === 'plantuml.com') return renderPlantUMLServer(code)
      return renderKrokiPlaceholder(code, 'c4plantuml')

    case 'ditaa':
      return renderKrokiPlaceholder(code, 'ditaa')

    case 'blockdiag':
    case 'seqdiag':
    case 'nwdiag':
    case 'actdiag':
    case 'packetdiag':
    case 'rackdiag':
      return renderKrokiPlaceholder(code, lang)

    case 'erd':
    case 'pikchr':
    case 'structurizr':
    case 'nomnoml':
    case 'svgbob':
      return renderKrokiPlaceholder(code, lang)

    case 'vegalite':
    case 'vega-lite':
      return renderKrokiPlaceholder(code, 'vegalite')

    default:
      // Not a known diagram type — caller should fall back to highlight.js
      return ''
  }
}
