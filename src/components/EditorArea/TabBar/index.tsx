import { useEditorStore } from '../../../store/editorStore'
import { saveFile } from '../../../services/drive'
import styles from './TabBar.module.css'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, markSaved } = useEditorStore()

  async function handleSave(tabId: string) {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return
    const isDirty = tab.content !== tab.originalContent
    if (!isDirty) return
    try {
      await saveFile(tab.driveFileId, tab.content, tab.mimeType)
      markSaved(tabId)
    } catch (err) {
      alert(`Save failed: ${err}`)
    }
  }

  function handleTabClick(id: string) {
    setActiveTab(id)
  }

  function handleTabClose(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const tab = tabs.find(t => t.id === id)
    if (tab && tab.content !== tab.originalContent) {
      const confirmed = confirm(`Save changes to "${tab.name}" before closing?`)
      if (confirmed) handleSave(id).then(() => closeTab(id))
      else closeTab(id)
      return
    }
    closeTab(id)
  }

  function handleTabMiddleClick(e: React.MouseEvent, id: string) {
    if (e.button === 1) {
      e.preventDefault()
      handleTabClose(e, id)
    }
  }

  return (
    <div className={styles.tabBar} role="tablist">
      {tabs.map(tab => {
        const isDirty = tab.content !== tab.originalContent
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabClick(tab.id)}
            onMouseDown={e => handleTabMiddleClick(e, tab.id)}
            title={tab.path}
          >
            {isDirty && <span className={styles.dirty} title="Unsaved changes" />}
            <span className={styles.name}>{tab.name}</span>
            <button
              className={styles.close}
              onClick={e => handleTabClose(e, tab.id)}
              title="Close"
              aria-label={`Close ${tab.name}`}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
