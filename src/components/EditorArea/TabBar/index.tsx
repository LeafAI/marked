import { useEditorStore } from '../../../store/editorStore'
import { useUIStore } from '../../../store/uiStore'
import styles from './TabBar.module.css'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore()

  async function handleSave(tabId: string): Promise<boolean> {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return true
    const isDirty = tab.content !== tab.originalContent
    if (!isDirty) return true
    const { performSave } = await import('../../../services/saveManager')
    const outcome = await performSave(tab)
    if (outcome === 'conflict-detected') {
      const { readFile } = await import('../../../services/drive/files')
      const remoteContent = await readFile(tab.driveFileId)
      useUIStore.getState().setMergeConflict({
        tabId: tab.id,
        base: tab.originalContent,
        ours: tab.content,
        theirs: remoteContent,
      })
      return false
    }
    if (outcome === 'error') {
      alert('Save failed')
      return false
    }
    return true
  }

  function handleTabClick(id: string) {
    setActiveTab(id)
  }

  async function handleTabClose(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const tab = tabs.find(t => t.id === id)
    if (tab && tab.content !== tab.originalContent) {
      const confirmed = confirm(`Save changes to "${tab.name}" before closing?`)
      if (confirmed) {
        const saved = await handleSave(id)
        if (saved) closeTab(id)
      } else {
        closeTab(id)
      }
      return
    }
    closeTab(id)
  }

  function handleTabMiddleClick(e: React.MouseEvent, id: string) {
    if (e.button === 1) {
      e.preventDefault()
      void handleTabClose(e, id)
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
