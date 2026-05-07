import { useDriveStore } from '../../store/driveStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useUIStore } from '../../store/uiStore'
import { startAuth, getUserEmail, getAccessToken } from '../../services/drive'
import styles from './WelcomeScreen.module.css'

export default function WelcomeScreen() {
  const { isAuthenticated, setAuthenticated, setError } = useDriveStore()
  const { googleClientId } = useSettingsStore()
  const { toggleSidebar, sidebarVisible, setActiveSidePanelView, setSettingsOpen } = useUIStore()

  function openExplorer() {
    setActiveSidePanelView('explorer')
    if (!sidebarVisible) toggleSidebar()
  }

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
        openExplorer()
      }
    } catch (err) {
      const msg = String(err)
      if (!msg.includes('popup_closed') && !msg.includes('access_denied')) {
        setError(msg)
      }
    }
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
            <button className={styles.primaryBtn} onClick={handleConnect}>
              {googleClientId ? 'Connect Google Drive' : 'Configure Client ID first →'}
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
