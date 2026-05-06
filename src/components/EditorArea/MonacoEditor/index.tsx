import { useRef, useEffect, useCallback } from 'react'
import Editor, { loader, Monaco } from '@monaco-editor/react'
import type * as MonacoType from 'monaco-editor'
import { useEditorStore } from '../../../store/editorStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { setEditorInstance } from '../../../services/editorRef'
import styles from './MonacoEditor.module.css'

// Load Monaco from CDN — avoids complex Vite worker configuration
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs',
  },
})

function defineMarkedTheme(monaco: Monaco) {
  monaco.editor.defineTheme('marked-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.md', foreground: '569cd6' },
      { token: 'string.md', foreground: 'ce9178' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editor.lineHighlightBackground': '#282828',
      'editorCursor.foreground': '#aeafad',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41',
    },
  })
}

export default function MonacoEditor() {
  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null)
  const { tabs, activeTabId, updateContent } = useEditorStore()
  const { editor: editorSettings } = useSettingsStore()
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeFile = tabs.find(t => t.id === activeTabId)

  function handleBeforeMount(monaco: Monaco) {
    defineMarkedTheme(monaco)
  }

  function handleMount(editor: MonacoType.editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor
    setEditorInstance(editor)

    // Ctrl+S / Cmd+S → save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const { tabs: currentTabs, activeTabId: currentId, markSaved } = useEditorStore.getState()
      const file = currentTabs.find(t => t.id === currentId)
      if (!file) return
      import('../../../services/drive/files').then(({ saveFile }) => {
        saveFile(file.driveFileId, file.content, file.mimeType)
          .then(() => markSaved(file.id))
          .catch(() => {})
      })
    })
  }

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateContent(activeTabId, value)

        // Debounced auto-save (2 seconds)
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          const { tabs: currentTabs, markSaved } = useEditorStore.getState()
          const file = currentTabs.find(t => t.id === activeTabId)
          if (!file || file.content === file.originalContent) return
          import('../../../services/drive/files').then(({ saveFile }) => {
            saveFile(file.driveFileId, file.content, file.mimeType)
              .then(() => markSaved(activeTabId))
              .catch(() => {})
          })
        }, 2000)
      }
    },
    [activeTabId, updateContent]
  )

  // Clear the global editor ref on unmount
  useEffect(() => () => setEditorInstance(null), [])

  // Sync editor content when active tab changes
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !activeFile) return
    const model = editor.getModel()
    if (model && model.getValue() !== activeFile.content) {
      model.setValue(activeFile.content)
    }
  }, [activeFile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeFile) return null

  const language = activeFile.name.match(/\.(md|markdown)$/i) ? 'markdown' : 'plaintext'

  return (
    <div className={styles.monacoWrapper}>
      <Editor
        key={activeFile.id}
        height="100%"
        language={language}
        value={activeFile.content}
        theme="marked-dark"
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          wordWrap: editorSettings.wordWrap ? 'on' : 'off',
          fontSize: editorSettings.fontSize,
          fontFamily: editorSettings.fontFamily,
          minimap: { enabled: editorSettings.minimap },
          lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          tabSize: 2,
          insertSpaces: true,
          folding: true,
          glyphMargin: false,
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  )
}
