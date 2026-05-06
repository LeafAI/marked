import { useMemo, useState, useCallback, useEffect } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { extractOutline } from '../../../services/markdown'
import { ChevronIconThemed } from '../../icons'
import type { OutlineItem } from '../../../types'
import styles from './OutlinePanel.module.css'

interface OutlineTreeNode {
  item: OutlineItem
  children: OutlineTreeNode[]
}

function buildTree(items: OutlineItem[]): OutlineTreeNode[] {
  const root: OutlineTreeNode[] = []
  const stack: OutlineTreeNode[] = []

  for (const item of items) {
    const node: OutlineTreeNode = { item, children: [] }

    while (stack.length > 0 && stack[stack.length - 1].item.level >= item.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  }

  return root
}

function collectIds(nodes: OutlineTreeNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    ids.push(node.item.id)
    ids.push(...collectIds(node.children))
  }
  return ids
}

interface OutlinePanelProps {
  onHeadingClick?: (line: number) => void
}

function TreeNodes({
  nodes,
  expanded,
  iconTheme,
  onToggle,
  onClick,
}: {
  nodes: OutlineTreeNode[]
  expanded: Set<string>
  iconTheme: 'material' | 'seti' | 'minimal'
  onToggle: (id: string) => void
  onClick: (line: number) => void
}) {
  return (
    <>
      {nodes.map(node => {
        const hasChildren = node.children.length > 0
        const isExpanded = expanded.has(node.item.id)

        return (
          <div key={node.item.id} role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
            <button
              className={styles.item}
              style={{ paddingLeft: (node.item.level - 1) * 12 + 8 }}
              onClick={() => onClick(node.item.line)}
              title={`Line ${node.item.line}: ${node.item.text}`}
            >
              {hasChildren ? (
                <span
                  className={styles.toggle}
                  onClick={e => { e.stopPropagation(); onToggle(node.item.id) }}
                >
                  <ChevronIconThemed expanded={isExpanded} theme={iconTheme} />
                </span>
              ) : (
                <span className={styles.toggleSpacer} />
              )}
              <span className={`${styles.level} ${styles[`level${node.item.level}`]}`}>
                {'H' + node.item.level}
              </span>
              <span className={styles.text}>{node.item.text}</span>
            </button>
            {hasChildren && isExpanded && (
              <TreeNodes
                nodes={node.children}
                expanded={expanded}
                iconTheme={iconTheme}
                onToggle={onToggle}
                onClick={onClick}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export default function OutlinePanel({ onHeadingClick }: OutlinePanelProps) {
  const { tabs, activeTabId } = useEditorStore()
  const { iconTheme } = useSettingsStore()
  const activeFile = tabs.find(t => t.id === activeTabId)

  const tree = useMemo(() => {
    if (!activeFile) return []
    const isMarkdown =
      activeFile.name.endsWith('.md') || activeFile.name.endsWith('.markdown')
    if (!isMarkdown) return []
    return buildTree(extractOutline(activeFile.content))
  }, [activeFile])

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Expand all nodes when the tree changes (new file or content change)
  useEffect(() => {
    setExpanded(new Set(collectIds(tree)))
  }, [tree])

  const handleToggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  if (!activeFile) {
    return <div className={styles.empty}>No file open</div>
  }

  if (tree.length === 0) {
    return <div className={styles.empty}>No headings found</div>
  }

  return (
    <div className={styles.panel}>
      <div className={styles.list} role="tree">
        <TreeNodes
          nodes={tree}
          expanded={expanded}
          iconTheme={iconTheme}
          onToggle={handleToggle}
          onClick={line => onHeadingClick?.(line)}
        />
      </div>
    </div>
  )
}
