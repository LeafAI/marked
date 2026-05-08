import { useEffect, useRef, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { useEditorStore } from '../../store/editorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { renderMarkdown } from '../../services/markdown'
import { renderDiagram, clearKrokiStore, fetchKrokiDiagram, getKrokiEntry } from '../../services/markdown/diagrams'
import { getEditorInstance } from '../../services/editorRef'
import styles from './PreviewPanel.module.css'

// File extensions that map directly to diagram languages (standalone diagram files)
const DIAGRAM_FILE_EXTS: Record<string, string> = {
  '.mmd': 'mermaid',
  '.mermaid': 'mermaid',
  '.dot': 'dot',
  '.gv': 'graphviz',
  '.puml': 'plantuml',
  '.plantuml': 'plantuml',
  '.ditaa': 'ditaa',
  '.erd': 'erd',
  '.nomnoml': 'nomnoml',
  '.svgbob': 'svgbob',
  '.vg': 'vegalite',
  '.vega-lite': 'vegalite',
}

function getDiagramLanguage(name: string): string | null {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  return DIAGRAM_FILE_EXTS[ext] || null
}

// Mermaid is loaded lazily on first use
let mermaidInitialized = false
async function initMermaid() {
  if (mermaidInitialized) return
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    fontFamily: 'var(--font-mono)',
  })
  mermaidInitialized = true
  return mermaid
}

async function runMermaid(container: HTMLElement) {
  const mermaid = await initMermaid()
  if (!mermaid) return
  const elements = container.querySelectorAll<HTMLElement>('pre.mermaid')
  if (elements.length === 0) return
  try {
    await mermaid.run({ nodes: Array.from(elements) })
  } catch {
    // Individual diagram errors are shown inline by mermaid
  }
}

async function renderKrokiDiagrams(container: HTMLElement) {
  const elements = container.querySelectorAll<HTMLElement>('.kroki-diagram')
  if (elements.length === 0) return

  const tasks = Array.from(elements).map(async el => {
    const id = el.getAttribute('data-kroki-id')
    if (!id) return
    const entry = getKrokiEntry(id)
    if (!entry) return

    try {
      const svg = await fetchKrokiDiagram(entry.type, entry.code)
      el.innerHTML = DOMPurify.sanitize(svg, {
        ADD_TAGS: ['svg', 'use', 'foreignObject'],
        ADD_ATTR: ['viewBox', 'xmlns', 'xlink', 'fill', 'stroke', 'd', 'transform', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'rx', 'ry'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
      })
    } catch {
      el.innerHTML = `<span class="diagram-error">Failed to render ${entry.type} diagram</span>`
    }
  })

  await Promise.allSettled(tasks)
}

export default function PreviewPanel() {
  const { tabs, activeTabId } = useEditorStore()
  const { diagrams } = useSettingsStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const activeFile = tabs.find(t => t.id === activeTabId)

  const isMarkdown = useMemo(
    () =>
      activeFile?.name.endsWith('.md') ||
      activeFile?.name.endsWith('.markdown') ||
      activeFile?.mimeType === 'text/markdown',
    [activeFile?.name, activeFile?.mimeType]
  )

  const diagramLanguage = useMemo(
    () => (activeFile?.name ? getDiagramLanguage(activeFile.name) : null),
    [activeFile]
  )

  const isPreviewable = isMarkdown || !!diagramLanguage

  const html = useMemo(() => {
    if (!activeFile || !isPreviewable) return ''

    if (diagramLanguage) {
      clearKrokiStore()
      const inner = renderDiagram(activeFile.content, diagramLanguage, diagrams)
      return inner ? `<div class="markdown-body">${inner}</div>` : ''
    }

    return renderMarkdown(activeFile.content, diagrams)
  }, [activeFile?.content, diagrams, isPreviewable, diagramLanguage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!containerRef.current || !html) return
    containerRef.current.innerHTML = html

    // Post-process diagrams after HTML injection
    if (diagrams.mermaid === 'local') {
      runMermaid(containerRef.current)
    }
    renderKrokiDiagrams(containerRef.current)
  }, [html, diagrams.mermaid])

  // Scroll sync: map editor scroll proportionally to preview
  useEffect(() => {
    if (!isPreviewable) return

    let disposed = false
    let cleanup: (() => void) | null = null

    const poll = setInterval(() => {
      const editor = getEditorInstance()
      if (!editor || disposed) return

      clearInterval(poll)

      const handleScroll = () => {
        const body = bodyRef.current
        if (!body) return

        const editorScrollTop = editor.getScrollTop()
        const editorScrollHeight = editor.getScrollHeight()
        const editorHeight = editor.getLayoutInfo().height

        const editorMax = editorScrollHeight - editorHeight
        if (editorMax <= 0) return

        const ratio = Math.max(0, Math.min(1, editorScrollTop / editorMax))
        const previewMax = body.scrollHeight - body.clientHeight

        body.scrollTop = ratio * previewMax
      }

      const disposable = editor.onDidScrollChange(handleScroll)
      cleanup = () => disposable.dispose()
    }, 100)

    return () => {
      disposed = true
      clearInterval(poll)
      cleanup?.()
    }
  }, [isPreviewable, activeTabId])

  if (!activeFile) {
    return (
      <div className={styles.preview}>
        <div className={styles.empty}>No file open</div>
      </div>
    )
  }

  if (!isPreviewable) {
    return (
      <div className={styles.preview}>
        <div className={styles.empty}>Preview only available for markdown and diagram files</div>
      </div>
    )
  }

  return (
    <div className={styles.preview}>
      <div className={styles.header}>
        <span className={styles.title}>PREVIEW</span>
        <span className={styles.fileName}>{activeFile.name}</span>
      </div>
      <div ref={bodyRef} className={styles.body}>
        <div
          ref={containerRef}
          className="markdown-body"
          aria-label="Markdown preview"
        />
      </div>
    </div>
  )
}
