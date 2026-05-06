import { useRef, useCallback, useEffect } from 'react'
import ActivityBar from './components/ActivityBar'
import SidePanel from './components/SidePanel'
import EditorArea from './components/EditorArea'
import PreviewPanel from './components/PreviewPanel'
import StatusBar from './components/StatusBar'
import ResizeHandle from './components/ResizeHandle'
import WelcomeScreen from './components/WelcomeScreen'
import SettingsPanel from './components/SettingsPanel'
import { useUIStore } from './store/uiStore'
import { useEditorStore } from './store/editorStore'
import styles from './App.module.css'

export default function App() {
  const appRef = useRef<HTMLDivElement>(null)
  const { sidebarVisible, previewVisible, sidebarWidth, previewWidth, setSidebarWidth, setPreviewWidth } =
    useUIStore()
  const { activeTabId, tabs } = useEditorStore()

  const handleSidebarResize = useCallback(
    (delta: number) => {
      setSidebarWidth(Math.max(160, Math.min(600, sidebarWidth + delta)))
    },
    [sidebarWidth, setSidebarWidth]
  )

  const handlePreviewResize = useCallback(
    (delta: number) => {
      setPreviewWidth(Math.max(200, Math.min(900, previewWidth - delta)))
    },
    [previewWidth, setPreviewWidth]
  )

  // Apply CSS custom properties for panel widths
  useEffect(() => {
    const el = appRef.current
    if (!el) return
    el.style.setProperty('--sidebar-width', sidebarVisible ? `${sidebarWidth}px` : '0px')
    el.style.setProperty('--preview-width', previewVisible ? `${previewWidth}px` : '0px')
  }, [sidebarVisible, previewVisible, sidebarWidth, previewWidth])

  // Warn before unloading when there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasDirty = tabs.some(t => t.content !== t.originalContent)
      if (!hasDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [tabs])

  return (
    <div ref={appRef} className={styles.app}>
      <ActivityBar />

      <div
        className={styles.sidePanel}
        style={{ width: sidebarVisible ? sidebarWidth : 0, overflow: sidebarVisible ? undefined : 'hidden' }}
      >
        {sidebarVisible && <SidePanel />}
      </div>

      {sidebarVisible && (
        <ResizeHandle direction="vertical" onDrag={handleSidebarResize} />
      )}

      <div className={styles.editorArea}>
        {activeTabId ? <EditorArea /> : <WelcomeScreen />}
      </div>

      {previewVisible && (
        <ResizeHandle direction="vertical" onDrag={handlePreviewResize} />
      )}

      <div
        className={styles.previewPanel}
        style={{ width: previewVisible ? previewWidth : 0, overflow: previewVisible ? undefined : 'hidden' }}
      >
        {previewVisible && <PreviewPanel />}
      </div>

      <StatusBar />
      <SettingsPanel />
    </div>
  )
}
