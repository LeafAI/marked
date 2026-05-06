import { OutlineItem } from '../../types'

const HEADING_RE = /^(#{1,6})\s+(.+)/

export function extractOutline(markdown: string): OutlineItem[] {
  const lines = markdown.split('\n')
  const items: OutlineItem[] = []
  let inFence = false

  lines.forEach((line, index) => {
    // Skip content inside fenced code blocks
    if (line.startsWith('```') || line.startsWith('~~~')) {
      inFence = !inFence
      return
    }
    if (inFence) return

    const match = HEADING_RE.exec(line)
    if (!match) return

    const level = match[1].length
    const raw = match[2].trim()
    // Strip inline markdown from heading text for display
    const text = raw
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .trim()

    items.push({ id: `outline-${index}`, level, text, line: index + 1 })
  })

  return items
}
