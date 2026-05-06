import { useDriveStore } from '../../store/driveStore'
import { useUIStore } from '../../store/uiStore'
import styles from './WelcomeScreen.module.css'

export default function WelcomeScreen() {
  const { isAuthenticated } = useDriveStore()
  const { toggleSidebar, sidebarVisible, setActiveSidePanelView } = useUIStore()

  function openExplorer() {
    setActiveSidePanelView('explorer')
    if (!sidebarVisible) toggleSidebar()
  }

  return (
    <div className={styles.welcome}>
      <div className={styles.content}>
        <div className={styles.logo}>M↓</div>
        <h1 className={styles.title}>Markdown Studio</h1>
        <p className={styles.subtitle}>A VSCode-like markdown editor for Google Drive</p>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <button className={styles.primaryBtn} onClick={openExplorer}>
              Browse Google Drive
            </button>
          ) : (
            <button className={styles.primaryBtn} onClick={openExplorer}>
              Connect Google Drive
            </button>
          )}
        </div>

        <div className={styles.shortcuts}>
          <div className={styles.shortcut}>
            <kbd>Ctrl</kbd>+<kbd>B</kbd>
            <span>Toggle sidebar</span>
          </div>
          <div className={styles.shortcut}>
            <kbd>Ctrl</kbd>+<kbd>S</kbd>
            <span>Save file</span>
          </div>
          <div className={styles.shortcut}>
            <kbd>Ctrl</kbd>+<kbd>\</kbd>
            <span>Toggle preview</span>
          </div>
        </div>
      </div>
    </div>
  )
}
