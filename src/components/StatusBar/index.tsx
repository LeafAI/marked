import { useEditorStore } from '../../store/editorStore'
import { useDriveStore } from '../../store/driveStore'
import styles from './StatusBar.module.css'

export default function StatusBar() {
  const { tabs, activeTabId } = useEditorStore()
  const { isAuthenticated, userEmail } = useDriveStore()

  const activeFile = tabs.find(t => t.id === activeTabId)
  const isDirty = activeFile && activeFile.content !== activeFile.originalContent

  const language = activeFile
    ? activeFile.name.match(/\.(md|markdown)$/i)
      ? 'Markdown'
      : 'Plain Text'
    : ''

  return (
    <div className={styles.statusBar} role="status">
      <div className={styles.left}>
        {activeFile && (
          <>
            <span className={styles.item} title={activeFile.path}>
              {isDirty ? '● ' : ''}{activeFile.path || activeFile.name}
            </span>
          </>
        )}
      </div>

      <div className={styles.right}>
        {language && <span className={styles.item}>{language}</span>}

        {isAuthenticated ? (
          <span className={styles.item} title={`Signed in as ${userEmail}`}>
            ✓ {userEmail}
          </span>
        ) : (
          <span className={`${styles.item} ${styles.disconnected}`}>
            Google Drive: not connected
          </span>
        )}
      </div>
    </div>
  )
}
