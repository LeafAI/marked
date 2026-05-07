import { DriveItem, DriveFolder, isDriveFolder } from '../../../types'
import type { IconTheme } from '../../../types'
import {
  FolderIconThemed,
  MarkdownIconThemed,
  TextFileIconThemed,
  ConfigFileIconThemed,
  CodeFileIconThemed,
  ChevronIconThemed,
} from '../../icons'
import styles from './FileExplorer.module.css'

interface FileTreeNodeProps {
  item: DriveItem
  depth: number
  selectedFolderId: string | null
  iconTheme: IconTheme
  onFileOpen: (id: string, name: string, mimeType: string) => void
  onFolderToggle: (id: string) => void
}

const MARKDOWN_EXTS = new Set(['.md', '.markdown'])
const CONFIG_EXTS = new Set(['.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.conf'])
const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h'])
const DIAGRAM_EXTS = new Set(['.mmd', '.mermaid', '.dot', '.gv', '.puml', '.plantuml', '.ditaa', '.erd', '.nomnoml', '.svgbob', '.vg', '.vega-lite'])

function getFileIcon(name: string, mimeType: string, theme: IconTheme) {
  if (mimeType === 'application/vnd.google-apps.folder') {
    return <FolderIconThemed className={styles.icon} theme={theme} />
  }
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  if (MARKDOWN_EXTS.has(ext)) return <MarkdownIconThemed className={styles.icon} theme={theme} />
  if (DIAGRAM_EXTS.has(ext)) return <CodeFileIconThemed className={styles.icon} theme={theme} />
  if (CONFIG_EXTS.has(ext)) return <ConfigFileIconThemed className={styles.icon} theme={theme} />
  if (CODE_EXTS.has(ext)) return <CodeFileIconThemed className={styles.icon} theme={theme} />
  return <TextFileIconThemed className={styles.icon} theme={theme} />
}

export default function FileTreeNode({ item, depth, selectedFolderId, iconTheme, onFileOpen, onFolderToggle }: FileTreeNodeProps) {
  const isFolder = isDriveFolder(item)
  const folder = item as DriveFolder
  const indent = depth * 12 + 8
  const isSelected = isFolder && item.id === selectedFolderId

  if (isFolder) {
    return (
      <div role="treeitem" aria-expanded={folder.isExpanded}>
        <button
          className={`${styles.treeItem} ${isSelected ? styles.selected : ''}`}
          style={{ paddingLeft: indent }}
          onClick={() => onFolderToggle(item.id)}
        >
          <ChevronIconThemed className={styles.arrow} expanded={!!folder.isExpanded} theme={iconTheme} />
          <FolderIconThemed className={styles.icon} theme={iconTheme} />
          <span className={styles.name}>{item.name}</span>
        </button>
        {folder.isExpanded && folder.children && (
          <div>
            {folder.children.map(child => (
              <FileTreeNode
                key={child.id}
                item={child}
                depth={depth + 1}
                selectedFolderId={selectedFolderId}
                iconTheme={iconTheme}
                onFileOpen={onFileOpen}
                onFolderToggle={onFolderToggle}
              />
            ))}
            {folder.isLoaded && folder.children.length === 0 && (
              <div className={styles.emptyFolder} style={{ paddingLeft: indent + 20 }}>
                Empty folder
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      className={styles.treeItem}
      style={{ paddingLeft: indent + 16 }}
      onClick={() => onFileOpen(item.id, item.name, item.mimeType)}
      role="treeitem"
    >
      {getFileIcon(item.name, item.mimeType, iconTheme)}
      <span className={styles.name}>{item.name}</span>
    </button>
  )
}
