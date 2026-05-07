import { useEffect, useState } from 'react'
import { useDriveStore } from '../../../store/driveStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useEditorStore } from '../../../store/editorStore'
import { useUIStore } from '../../../store/uiStore'
import {
  listFolder,
  readFileWithMeta,
  resolveFilePath,
  isMarkdownFile,
  startAuth,
  getUserEmail,
  getAccessToken,
  createFile,
  createFolder,
  listSharedDrives,
  renameFile,
  trashFile,
  moveFile,
} from '../../../services/drive'
import { OpenFile, DriveItem, isDriveFolder } from '../../../types'
import { NewFileIconThemed, NewFolderIconThemed, RefreshIconThemed } from '../../icons'
import ContextMenu from './ContextMenu'
import FileTreeNode from './FileTreeNode'
import type { InlineInputMode } from './FileTreeNode'
import styles from './FileExplorer.module.css'

interface ContextMenuState {
  x: number
  y: number
  item: DriveItem
}

export default function FileExplorer() {
  const {
    isAuthenticated,
    rootItems,
    sharedDrives,
    isLoadingFolder,
    error,
    currentFolderId,
    setAuthenticated,
    setRootItems,
    setSharedDrives,
    updateFolder,
    setLoadingFolder,
    setError,
    setCurrentFolder,
    renameItem,
    removeItem,
    moveItem,
  } = useDriveStore()
  const { googleClientId, iconTheme } = useSettingsStore()
  const { openFile } = useEditorStore()
  const { setActiveSidePanelView, setSettingsOpen } = useUIStore()

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState('')
  const [inlineTargetFolderId, setInlineTargetFolderId] = useState<string | null>(null)
  const [inlineMode, setInlineMode] = useState<InlineInputMode>(null)
  const [inlineName, setInlineName] = useState('')

  // Restore session if a token is still valid in sessionStorage
  useEffect(() => {
    const token = getAccessToken()
    if (!token) return
    getUserEmail(token)
      .then(email => setAuthenticated(email))
      .catch(() => {})
  }, [setAuthenticated])

  // Load root folder when authenticated
  useEffect(() => {
    if (!isAuthenticated || rootItems.length > 0) return
    setLoadingFolder(true)
    listFolder('root')
      .then(items => setRootItems(items))
      .catch(err => setError(String(err)))
      .finally(() => setLoadingFolder(false))
  }, [isAuthenticated, rootItems.length, setRootItems, setLoadingFolder, setError])

  // Load shared drives when authenticated
  useEffect(() => {
    if (!isAuthenticated || sharedDrives.length > 0) return
    listSharedDrives()
      .then(drives => setSharedDrives(drives))
      .catch(() => {}) // shared drives are optional — don't block on failure
  }, [isAuthenticated, sharedDrives.length, setSharedDrives])

  async function handleConnect() {
    if (!googleClientId) {
      setSettingsOpen(true)
      return
    }
    setError(null)
    try {
      await startAuth(googleClientId)
      const token = getAccessToken()
      if (token) {
        const email = await getUserEmail(token)
        setAuthenticated(email)
      }
    } catch (err) {
      const msg = String(err)
      if (!msg.includes('popup_closed') && !msg.includes('access_denied')) {
        setError(msg)
      }
    }
  }

  async function expandParentFolders(fileId: string) {
    const { toggleFolder, updateFolder: update } = useDriveStore.getState()
    const path = await resolveFilePath(fileId)
    const segments = path.split('/').filter(Boolean)
    const isSharedDrivePath = segments[0] !== 'root'
    const folderNames = isSharedDrivePath ? segments.slice(0, -1) : segments.slice(1, -1)

    let currentItems: DriveItem[] = isSharedDrivePath
      ? useDriveStore.getState().sharedDrives
      : useDriveStore.getState().rootItems
    let driveId: string | undefined

    for (const folderName of folderNames) {
      const folder = currentItems.find(
        item => item.name === folderName && item.mimeType === 'application/vnd.google-apps.folder'
      )
      if (!folder) break

      if (isSharedDrivePath && !driveId) driveId = folder.id

      const allItems = [...useDriveStore.getState().rootItems, ...useDriveStore.getState().sharedDrives]
      const findFolder = (items: DriveItem[]): DriveItem | undefined => {
        for (const item of items) {
          if (item.id === folder.id) return item
          if (isDriveFolder(item) && item.children) {
            const found = findFolder(item.children)
            if (found) return found
          }
        }
        return undefined
      }
      const folderData = findFolder(allItems)
      if (folderData && isDriveFolder(folderData) && !folderData.isExpanded) {
        toggleFolder(folder.id)
      }

      if (!folderData || !isDriveFolder(folderData) || !folderData.isLoaded) {
        try {
          const children = await listFolder(folder.id, driveId)
          update(folder.id, children)
        } catch {
          // Ignore errors during expansion
        }
      }

      const updatedFolder = findFolder([...useDriveStore.getState().rootItems, ...useDriveStore.getState().sharedDrives])
      currentItems = updatedFolder && isDriveFolder(updatedFolder) ? updatedFolder.children || [] : []
    }
  }

  async function handleFileOpen(fileId: string, fileName: string, mimeType: string) {
    try {
      setLoadingFolder(true)

      await expandParentFolders(fileId)

      const [{ content, modifiedTime }, path] = await Promise.all([
        readFileWithMeta(fileId),
        resolveFilePath(fileId),
      ])
      const file: OpenFile = {
        id: crypto.randomUUID(),
        driveFileId: fileId,
        name: fileName,
        mimeType,
        content,
        originalContent: content,
        path,
        baseModifiedTime: modifiedTime,
      }
      openFile(file)

      const parentSegments = path.split('/').filter(Boolean)
      if (parentSegments.length > 1) {
        const parentName = parentSegments[parentSegments.length - 2]
        const findFolderId = (items: typeof rootItems): string | null => {
          for (const item of items) {
            if (item.name === parentName && item.mimeType === 'application/vnd.google-apps.folder') {
              return item.id
            }
            if ('children' in item && item.children) {
              const found = findFolderId(item.children)
              if (found) return found
            }
          }
          return null
        }
        const parentId = findFolderId(rootItems)
        if (parentId) {
          setSelectedFolderId(parentId)
          setCurrentFolder(parentId)
        }
      }

      if (isMarkdownFile({ id: fileId, name: fileName, mimeType })) {
        setActiveSidePanelView('outline')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoadingFolder(false)
    }
  }

  function findDriveId(folderId: string): string | undefined {
    const { sharedDrives: drives } = useDriveStore.getState()
    for (const drive of drives) {
      if (drive.id === folderId) return drive.id
      if (drive.children) {
        const find = (items: DriveItem[]): boolean =>
          items.some(i => i.id === folderId || (isDriveFolder(i) && i.children ? find(i.children) : false))
        if (find(drive.children)) return drive.id
      }
    }
    return undefined
  }

  function handleFolderSelect(folderId: string) {
    setCurrentFolder(folderId)
    setSelectedFolderId(folderId)
  }

  async function handleFolderToggle(folderId: string) {
    const { toggleFolder, updateFolder: update } = useDriveStore.getState()
    toggleFolder(folderId)
    handleFolderSelect(folderId)
    try {
      const driveId = findDriveId(folderId)
      const children = await listFolder(folderId, driveId)
      update(folderId, children)
    } catch (err) {
      setError(String(err))
    }
  }

  // ── Context menu ──────────────────────────────────────────────────────────

  function handleContextMenu(e: React.MouseEvent, item: DriveItem) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, item })
  }

  function handleContextNewFile(folderId: string) {
    setSelectedFolderId(folderId)
    setInlineTargetFolderId(folderId)
    setInlineMode('file')
    setInlineName('')
  }

  function handleContextNewFolder(folderId: string) {
    setSelectedFolderId(folderId)
    setInlineTargetFolderId(folderId)
    setInlineMode('folder')
    setInlineName('')
  }

  function handleContextRename(item: DriveItem) {
    setRenamingItemId(item.id)
    setRenamingName(item.name)
  }

  async function handleContextDelete(item: DriveItem) {
    if (!window.confirm(`Delete "${item.name}"? This will move it to Trash.`)) return
    try {
      await trashFile(item.id)
      removeItem(item.id)
    } catch (err) {
      setError(String(err))
    }
  }

  // ── Inline rename ─────────────────────────────────────────────────────────

  function handleRenamingNameChange(name: string) {
    setRenamingName(name)
  }

  async function handleRenameConfirm() {
    const name = renamingName.trim()
    const id = renamingItemId
    if (!id || !name) {
      setRenamingItemId(null)
      setRenamingName('')
      return
    }
    try {
      await renameFile(id, name)
      renameItem(id, name)
    } catch (err) {
      setError(String(err))
    } finally {
      setRenamingItemId(null)
      setRenamingName('')
    }
  }

  function handleRenameCancel() {
    setRenamingItemId(null)
    setRenamingName('')
  }

  // ── Inline new file/folder ────────────────────────────────────────────────

  function handleInlineNameChange(name: string) {
    setInlineName(name)
  }

  async function handleInlineConfirm() {
    const name = inlineName.trim()
    if (!name) {
      setInlineMode(null)
      setInlineName('')
      setInlineTargetFolderId(null)
      return
    }
    const parentId = inlineTargetFolderId || selectedFolderId || currentFolderId || 'root'
    try {
      setLoadingFolder(true)
      if (inlineMode === 'folder') {
        await createFolder(name, parentId)
      } else {
        await createFile({ name: name.endsWith('.md') ? name : `${name}.md`, parentId })
      }
      const items = await listFolder(parentId)
      if (parentId === 'root') {
        setRootItems(items)
      } else {
        updateFolder(parentId, items)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoadingFolder(false)
      setInlineMode(null)
      setInlineName('')
      setInlineTargetFolderId(null)
    }
  }

  function handleInlineCancel() {
    setInlineMode(null)
    setInlineName('')
    setInlineTargetFolderId(null)
  }

  // ── Drag and drop ─────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, item: DriveItem) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
    setDraggedItemId(item.id)
  }

  function handleDragOver(e: React.DragEvent, _item: DriveItem) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDragEnd() {
    setDraggedItemId(null)
  }

  function handleDragLeave(_e: React.DragEvent) {
    // No-op — CSS handles visual feedback via :hover on dragTarget
  }

  async function handleDrop(e: React.DragEvent, targetFolder: DriveItem) {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain')
    setDraggedItemId(null)

    if (!itemId || itemId === targetFolder.id) return
    if (!isDriveFolder(targetFolder)) return

    // Find the dragged item to get its current parent
    const findItem = (items: DriveItem[]): DriveItem | undefined => {
      for (const item of items) {
        if (item.id === itemId) return item
        if (isDriveFolder(item) && item.children) {
          const found = findItem(item.children)
          if (found) return found
        }
      }
      return undefined
    }

    // Find parent folder of the dragged item
    const findParent = (items: DriveItem[]): string | undefined => {
      for (const item of items) {
        if (isDriveFolder(item) && item.children) {
          if (item.children.some(c => c.id === itemId)) return item.id
          const found = findParent(item.children)
          if (found) return found
        }
      }
      return undefined
    }

    const allItems = [...useDriveStore.getState().rootItems, ...useDriveStore.getState().sharedDrives]
    const draggedItem = findItem(allItems)
    const oldParentId = findParent(allItems)

    if (!draggedItem || !oldParentId) return

    try {
      await moveFile(itemId, targetFolder.id, oldParentId)
      moveItem(itemId, oldParentId, targetFolder.id, draggedItem)
    } catch (err) {
      setError(String(err))
    }
  }

  // ── Toolbar inline input (new file/folder at root) ────────────────────────

  function handleToolbarNewFile() {
    const targetId = selectedFolderId || currentFolderId || 'root'
    setInlineTargetFolderId(targetId)
    setInlineMode('file')
    setInlineName('')
  }

  function handleToolbarNewFolder() {
    const targetId = selectedFolderId || currentFolderId || 'root'
    setInlineTargetFolderId(targetId)
    setInlineMode('folder')
    setInlineName('')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isSessionExpired =
    error?.toLowerCase().includes('session expired') ||
    error?.toLowerCase().includes('not authenticated')

  if (!isAuthenticated) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Connect your Google Drive to browse files.</p>
        <button className={styles.connectBtn} onClick={handleConnect}>
          {googleClientId ? 'Connect Google Drive' : 'Configure Client ID first →'}
        </button>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    )
  }

  const treeProps = {
    selectedFolderId,
    iconTheme,
    draggedItemId,
    renamingItemId,
    renamingName,
    inlineTargetFolderId,
    inlineMode,
    inlineName,
    onFileOpen: handleFileOpen,
    onFolderToggle: handleFolderToggle,
    onFolderSelect: handleFolderSelect,
    onContextMenu: handleContextMenu,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onRenamingNameChange: handleRenamingNameChange,
    onRenameConfirm: handleRenameConfirm,
    onRenameCancel: handleRenameCancel,
    onInlineNameChange: handleInlineNameChange,
    onInlineConfirm: handleInlineConfirm,
    onInlineCancel: handleInlineCancel,
  }

  return (
    <div className={styles.explorer}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarPath} title={currentFolderId}>
          {currentFolderId === 'root' ? 'My Drive' : '…'}
        </span>
        <button
          className={styles.toolbarBtn}
          title="New file (.md)"
          onClick={handleToolbarNewFile}
          disabled={isLoadingFolder}
        >
          <NewFileIconThemed theme={iconTheme} />
        </button>
        <button
          className={styles.toolbarBtn}
          title="New folder"
          onClick={handleToolbarNewFolder}
          disabled={isLoadingFolder}
        >
          <NewFolderIconThemed theme={iconTheme} />
        </button>
        <button
          className={styles.toolbarBtn}
          title="Refresh"
          onClick={() => {
            setLoadingFolder(true)
            Promise.all([
              listFolder('root').then(items => setRootItems(items)),
              listSharedDrives().then(drives => setSharedDrives(drives)).catch(() => {}),
            ])
              .catch(err => setError(String(err)))
              .finally(() => setLoadingFolder(false))
          }}
          disabled={isLoadingFolder}
        >
          <RefreshIconThemed theme={iconTheme} />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          {isSessionExpired ? (
            <button className={styles.reconnectBtn} onClick={handleConnect}>
              Reconnect
            </button>
          ) : (
            <button className={styles.dismissBtn} onClick={() => setError(null)}>×</button>
          )}
        </div>
      )}

      {isLoadingFolder && rootItems.length === 0 && (
        <div className={styles.loading}>Loading…</div>
      )}

      <div className={styles.tree} role="tree">
        {rootItems.map(item => (
          <FileTreeNode key={item.id} item={item} depth={0} {...treeProps} />
        ))}
        {sharedDrives.length > 0 && (
          <div className={styles.sectionDivider}>
            <span>Shared drives</span>
          </div>
        )}
        {sharedDrives.map(drive => (
          <FileTreeNode key={drive.id} item={drive} depth={0} {...treeProps} />
        ))}
      </div>

      {/* Context menu overlay */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onNewFile={handleContextNewFile}
          onNewFolder={handleContextNewFolder}
          onRename={handleContextRename}
          onDelete={handleContextDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
