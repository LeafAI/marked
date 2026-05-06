import { useEffect, useState, useRef } from 'react'
import { useDriveStore } from '../../../store/driveStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useEditorStore } from '../../../store/editorStore'
import { useUIStore } from '../../../store/uiStore'
import {
  listFolder,
  readFile,
  resolveFilePath,
  isMarkdownFile,
  startAuth,
  getUserEmail,
  getAccessToken,
  createFile,
  createFolder,
} from '../../../services/drive'
import { OpenFile, isDriveFolder } from '../../../types'
import { FolderIconThemed, MarkdownIconThemed, NewFileIconThemed, NewFolderIconThemed, RefreshIconThemed } from '../../icons'
import FileTreeNode from './FileTreeNode'
import styles from './FileExplorer.module.css'

type InlineInputMode = 'file' | 'folder' | null

export default function FileExplorer() {
  const {
    isAuthenticated,
    rootItems,
    isLoadingFolder,
    error,
    currentFolderId,
    setAuthenticated,
    setRootItems,
    updateFolder,
    setLoadingFolder,
    setError,
    setCurrentFolder,
  } = useDriveStore()
  const { googleClientId, iconTheme } = useSettingsStore()
  const { openFile } = useEditorStore()
  const { setActiveSidePanelView, setSettingsOpen } = useUIStore()

  const [inlineMode, setInlineMode] = useState<InlineInputMode>(null)
  const [inlineName, setInlineName] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const inlineRef = useRef<HTMLInputElement>(null)

  // Focus inline input when it appears
  useEffect(() => {
    if (inlineMode) inlineRef.current?.focus()
  }, [inlineMode])

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
      // User closed popup or access denied — show message only for real errors
      const msg = String(err)
      if (!msg.includes('popup_closed') && !msg.includes('access_denied')) {
        setError(msg)
      }
    }
  }

  async function expandParentFolders(fileId: string) {
    const { toggleFolder, updateFolder: update } = useDriveStore.getState()
    const path = await resolveFilePath(fileId)
    // path is like "root/Parent/Child/file.md" — extract folder names
    const segments = path.split('/').filter(Boolean)
    // Skip 'root' prefix and the file name (last segment)
    const folderNames = segments.slice(segments[0] === 'root' ? 1 : 0, -1)

    let currentItems = useDriveStore.getState().rootItems
    for (const folderName of folderNames) {
      const folder = currentItems.find(
        item => item.name === folderName && item.mimeType === 'application/vnd.google-apps.folder'
      )
      if (!folder) break

      // Expand the folder if not already expanded
      const folderState = useDriveStore.getState().rootItems
      const findFolder = (items: typeof folderState): typeof folder | undefined => {
        for (const item of items) {
          if (item.id === folder.id) return item
          if ('children' in item && item.children) {
            const found = findFolder(item.children)
            if (found) return found
          }
        }
        return undefined
      }
      const folderData = findFolder(folderState)
      if (folderData && isDriveFolder(folderData) && !folderData.isExpanded) {
        toggleFolder(folder.id)
      }

      // Load children if not loaded
      if (!folderData || !isDriveFolder(folderData) || !folderData.isLoaded) {
        try {
          const children = await listFolder(folder.id)
          update(folder.id, children)
        } catch {
          // Ignore errors during expansion
        }
      }

      // Move to children for next iteration
      const updatedFolder = findFolder(useDriveStore.getState().rootItems)
      currentItems = updatedFolder && isDriveFolder(updatedFolder) ? updatedFolder.children || [] : []
    }
  }

  async function handleFileOpen(fileId: string, fileName: string, mimeType: string) {
    try {
      setLoadingFolder(true)

      // Expand parent folders first so the file is visible in the tree
      await expandParentFolders(fileId)

      const [content, path] = await Promise.all([
        readFile(fileId),
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
      }
      openFile(file)

      // Select the parent folder
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

  async function handleFolderToggle(folderId: string) {
    const { toggleFolder, updateFolder: update } = useDriveStore.getState()
    toggleFolder(folderId)
    setCurrentFolder(folderId)
    setSelectedFolderId(folderId)
    try {
      const children = await listFolder(folderId)
      update(folderId, children)
    } catch (err) {
      setError(String(err))
    }
  }

  async function handleInlineConfirm() {
    const name = inlineName.trim()
    if (!name) {
      setInlineMode(null)
      return
    }
    const parentId = selectedFolderId || currentFolderId || 'root'
    try {
      setLoadingFolder(true)
      if (inlineMode === 'folder') {
        await createFolder(name, parentId)
      } else {
        await createFile({ name: name.endsWith('.md') ? name : `${name}.md`, parentId })
      }
      // Refresh the parent folder's children in the tree
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
    }
  }

  function handleInlineKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleInlineConfirm()
    if (e.key === 'Escape') {
      setInlineMode(null)
      setInlineName('')
    }
  }

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
          onClick={() => { setInlineMode('file'); setInlineName('') }}
          disabled={isLoadingFolder}
        >
          <NewFileIconThemed theme={iconTheme} />
        </button>
        <button
          className={styles.toolbarBtn}
          title="New folder"
          onClick={() => { setInlineMode('folder'); setInlineName('') }}
          disabled={isLoadingFolder}
        >
          <NewFolderIconThemed theme={iconTheme} />
        </button>
        <button
          className={styles.toolbarBtn}
          title="Refresh"
          onClick={() => {
            setLoadingFolder(true)
            listFolder('root')
              .then(items => setRootItems(items))
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

      {/* Inline name input */}
      {inlineMode && (
        <div className={styles.inlineInput}>
          <span className={styles.inlineIcon}>{inlineMode === 'folder' ? <FolderIconThemed theme={iconTheme} /> : <MarkdownIconThemed theme={iconTheme} />}</span>
          <input
            ref={inlineRef}
            type="text"
            className={styles.inlineField}
            value={inlineName}
            onChange={e => setInlineName(e.target.value)}
            onKeyDown={handleInlineKeyDown}
            onBlur={handleInlineConfirm}
            placeholder={inlineMode === 'folder' ? 'Folder name' : 'filename.md'}
          />
        </div>
      )}

      {isLoadingFolder && rootItems.length === 0 && (
        <div className={styles.loading}>Loading…</div>
      )}

      <div className={styles.tree} role="tree">
        {rootItems.map(item => (
          <FileTreeNode
            key={item.id}
            item={item}
            depth={0}
            selectedFolderId={selectedFolderId}
            iconTheme={iconTheme}
            onFileOpen={handleFileOpen}
            onFolderToggle={handleFolderToggle}
          />
        ))}
      </div>
    </div>
  )
}
