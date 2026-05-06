import { useUIStore } from '../../store/uiStore'
import { useDriveStore } from '../../store/driveStore'
import styles from './ActivityBar.module.css'

interface IconButtonProps {
  title: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}

function IconButton({ title, active, onClick, children }: IconButtonProps) {
  return (
    <button
      className={`${styles.iconBtn} ${active ? styles.active : ''}`}
      title={title}
      onClick={onClick}
      aria-label={title}
    >
      {children}
    </button>
  )
}

export default function ActivityBar() {
  const { sidebarVisible, previewVisible, activeSidePanelView, toggleSidebar, togglePreview, setActiveSidePanelView, setSettingsOpen } =
    useUIStore()
  const { isAuthenticated } = useDriveStore()

  function handleExplorerClick() {
    if (activeSidePanelView === 'explorer' && sidebarVisible) {
      toggleSidebar()
    } else {
      setActiveSidePanelView('explorer')
      if (!sidebarVisible) toggleSidebar()
    }
  }

  function handleOutlineClick() {
    if (activeSidePanelView === 'outline' && sidebarVisible) {
      toggleSidebar()
    } else {
      setActiveSidePanelView('outline')
      if (!sidebarVisible) toggleSidebar()
    }
  }

  return (
    <aside className={styles.activityBar} aria-label="Activity bar">
      <div className={styles.top}>
        {/* File explorer */}
        <IconButton
          title="Explorer"
          active={sidebarVisible && activeSidePanelView === 'explorer'}
          onClick={handleExplorerClick}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        </IconButton>

        {/* Outline */}
        <IconButton
          title="Outline"
          active={sidebarVisible && activeSidePanelView === 'outline'}
          onClick={handleOutlineClick}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </IconButton>

        {/* Preview toggle */}
        <IconButton title="Toggle Preview" active={previewVisible} onClick={togglePreview}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
        </IconButton>

        {/* Google Drive auth */}
        <IconButton title={isAuthenticated ? 'Google Drive (connected)' : 'Connect Google Drive'} active={isAuthenticated} onClick={() => setActiveSidePanelView('explorer')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 19h20L12 2z" />
            <path d="M2 19l5-8.5" />
            <path d="M22 19l-5-8.5" />
          </svg>
        </IconButton>
      </div>

      <div className={styles.bottom}>
        {/* Settings */}
        <IconButton title="Settings" onClick={() => setSettingsOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </IconButton>
      </div>
    </aside>
  )
}
