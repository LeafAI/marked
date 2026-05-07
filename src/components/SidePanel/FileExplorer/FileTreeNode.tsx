import type { DriveItem, DriveFolder, IconTheme } from '../../../types'
import { isDriveFolder } from '../../../types'
import {
  FolderIconThemed,
  MarkdownIconThemed,
  TextFileIconThemed,
  ConfigFileIconThemed,
  CodeFileIconThemed,
  ChevronIconThemed,
} from '../../icons'
import styles from './FileExplorer.module.css'

export type InlineInputMode = 'file' | 'folder' | null

interface FileTreeNodeProps {
  item: DriveItem
  depth: number
  selectedFolderId: string | null
  iconTheme: IconTheme
  draggedItemId: string | null
  renamingItemId: string | null
  renamingName: string
  inlineTargetFolderId: string | null
  inlineMode: InlineInputMode
  inlineName: string
  onFileOpen: (id: string, name: string, mimeType: string) => void
  onFolderToggle: (id: string) => void
  onFolderSelect: (id: string) => void
  onContextMenu: (e: React.MouseEvent, item: DriveItem) => void
  onDragStart: (e: React.DragEvent, item: DriveItem) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, item: DriveItem) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, item: DriveItem) => void
  onRenamingNameChange: (name: string) => void
  onRenameConfirm: () => void
  onRenameCancel: () => void
  onInlineNameChange: (name: string) => void
  onInlineConfirm: () => void
  onInlineCancel: () => void
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

export default function FileTreeNode({
  item, depth, selectedFolderId, iconTheme, draggedItemId, renamingItemId, renamingName,
  inlineTargetFolderId, inlineMode, inlineName,
  onFileOpen, onFolderToggle, onFolderSelect, onContextMenu, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onRenamingNameChange, onRenameConfirm, onRenameCancel,
  onInlineNameChange, onInlineConfirm, onInlineCancel,
}: FileTreeNodeProps) {
  const isFolder = isDriveFolder(item)
  const folder = item as DriveFolder
  const indent = depth * 12 + 8
  const isSelected = isFolder && item.id === selectedFolderId
  const isRenaming = item.id === renamingItemId
  const isDragTarget = isFolder && draggedItemId !== null && draggedItemId !== item.id

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onRenameConfirm()
    if (e.key === 'Escape') onRenameCancel()
  }

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onInlineConfirm()
    if (e.key === 'Escape') onInlineCancel()
  }

  if (isFolder) {
    const showInline = inlineTargetFolderId === item.id && inlineMode !== null

    return (
      <div role="treeitem" aria-expanded={folder.isExpanded}>
        <button
          className={`${styles.treeItem} ${isSelected ? styles.selected : ''} ${isDragTarget ? styles.dragTarget : ''}`}
          style={{ paddingLeft: indent }}
          onClick={() => onFolderSelect(item.id)}
          onContextMenu={e => onContextMenu(e, item)}
          draggable
          onDragStart={e => onDragStart(e, item)}
          onDragEnd={onDragEnd}
          onDragOver={e => { if (isDragTarget) onDragOver(e, item) }}
          onDragLeave={onDragLeave}
          onDrop={e => onDrop(e, item)}
        >
          <span className={styles.arrow} onClick={e => { e.stopPropagation(); onFolderToggle(item.id) }}>
            <ChevronIconThemed expanded={!!folder.isExpanded} theme={iconTheme} />
          </span>
          <FolderIconThemed className={styles.icon} theme={iconTheme} />
          {isRenaming ? (
            <input
              className={styles.renameInput}
              value={renamingName}
              onChange={e => onRenamingNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={onRenameConfirm}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className={styles.name}>{item.name}</span>
          )}
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
                draggedItemId={draggedItemId}
                renamingItemId={renamingItemId}
                renamingName={renamingName}
                inlineTargetFolderId={inlineTargetFolderId}
                inlineMode={inlineMode}
                inlineName={inlineName}
                onFileOpen={onFileOpen}
                onFolderToggle={onFolderToggle}
                onFolderSelect={onFolderSelect}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onRenamingNameChange={onRenamingNameChange}
                onRenameConfirm={onRenameConfirm}
                onRenameCancel={onRenameCancel}
                onInlineNameChange={onInlineNameChange}
                onInlineConfirm={onInlineConfirm}
                onInlineCancel={onInlineCancel}
              />
            ))}
            {showInline && (
              <div className={styles.inlineInput} style={{ paddingLeft: (depth + 1) * 12 + 8 + 16 }}>
                <span className={styles.inlineIcon}>
                  {inlineMode === 'folder' ? <FolderIconThemed theme={iconTheme} /> : <MarkdownIconThemed theme={iconTheme} />}
                </span>
                <input
                  className={styles.inlineField}
                  value={inlineName}
                  onChange={e => onInlineNameChange(e.target.value)}
                  onKeyDown={handleInlineKeyDown}
                  onBlur={onInlineConfirm}
                  placeholder={inlineMode === 'folder' ? 'Folder name' : 'filename.md'}
                  autoFocus
                />
              </div>
            )}
            {folder.isLoaded && folder.children.length === 0 && !showInline && (
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
      onContextMenu={e => onContextMenu(e, item)}
      draggable
      onDragStart={e => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      role="treeitem"
    >
      {getFileIcon(item.name, item.mimeType, iconTheme)}
      {isRenaming ? (
        <input
          className={styles.renameInput}
          value={renamingName}
          onChange={e => onRenamingNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onRenameConfirm}
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className={styles.name}>{item.name}</span>
      )}
    </button>
  )
}
