import { useEffect, useRef } from 'react'
import type { DriveItem } from '../../../types'
import { isDriveFolder } from '../../../types'
import styles from './FileExplorer.module.css'

export interface ContextMenuProps {
  x: number
  y: number
  item: DriveItem
  onNewFile: (folderId: string) => void
  onNewFolder: (folderId: string) => void
  onRename: (item: DriveItem) => void
  onDelete: (item: DriveItem) => void
  onClose: () => void
}

export default function ContextMenu({ x, y, item, onNewFile, onNewFolder, onRename, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isFolder = isDriveFolder(item)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div ref={ref} className={styles.contextMenu} style={{ left: x, top: y }}>
      {isFolder && (
        <>
          <button className={styles.contextMenuItem} onClick={() => { onNewFile(item.id); onClose() }}>
            New File
          </button>
          <button className={styles.contextMenuItem} onClick={() => { onNewFolder(item.id); onClose() }}>
            New Folder
          </button>
          <div className={styles.contextMenuDivider} />
        </>
      )}
      <button className={styles.contextMenuItem} onClick={() => { onRename(item); onClose() }}>
        Rename
      </button>
      <button className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`} onClick={() => { onDelete(item); onClose() }}>
        Delete
      </button>
    </div>
  )
}
