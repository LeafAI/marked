import { useUIStore } from '../../store/uiStore'
import { revealLine } from '../../services/editorRef'
import FileExplorer from './FileExplorer'
import OutlinePanel from './OutlinePanel'
import styles from './SidePanel.module.css'

export default function SidePanel() {
  const { activeSidePanelView } = useUIStore()

  return (
    <div className={styles.sidePanel}>
      <div className={styles.header}>
        <span className={styles.title}>
          {activeSidePanelView === 'explorer' ? 'EXPLORER' : 'OUTLINE'}
        </span>
      </div>
      <div className={styles.content}>
        {activeSidePanelView === 'explorer' ? (
          <FileExplorer />
        ) : (
          <OutlinePanel onHeadingClick={revealLine} />
        )}
      </div>
    </div>
  )
}
