import { useEffect, useRef, useState, useCallback } from 'react'
import { DiffEditor, loader, Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useUIStore } from '../../store/uiStore'
import { useEditorStore } from '../../store/editorStore'
import { saveResolvedContent } from '../../services/saveManager'
import styles from './MergeConflictDialog.module.css'

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

export default function MergeConflictDialog() {
  const { mergeConflict, setMergeConflict } = useUIStore()
  const { tabs } = useEditorStore()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [editedContent, setEditedContent] = useState('')

  const tab = mergeConflict ? tabs.find(t => t.id === mergeConflict.tabId) : null

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (mergeConflict) {
      setEditedContent(mergeConflict.ours)
      el.showModal()
    } else {
      el.close()
    }
  }, [mergeConflict])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const onClose = () => setMergeConflict(null)
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [setMergeConflict])

  const handleSave = useCallback(async (content: string) => {
    if (!tab) return
    const success = await saveResolvedContent(tab, content)
    if (success) setMergeConflict(null)
  }, [tab, setMergeConflict])

  function handleBeforeMount(monaco: Monaco) {
    defineMarkedTheme(monaco)
  }

  const handleEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor) => {
    const modified = diffEditor.getModifiedEditor()
    modified.onDidChangeModelContent(() => {
      setEditedContent(modified.getValue())
    })
  }, [])

  if (!mergeConflict || !tab) return null

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-label="Merge conflict">
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Merge Conflict — {tab.name}</span>
          <button className={styles.closeBtn} onClick={() => setMergeConflict(null)} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.diffContainer}>
          <DiffEditor
            original={mergeConflict.theirs}
            modified={editedContent}
            language={tab.name.match(/\.(md|markdown)$/i) ? 'markdown' : 'plaintext'}
            theme="marked-dark"
            beforeMount={handleBeforeMount}
            onMount={handleEditorMount}
            options={{
              readOnly: false,
              renderSideBySide: true,
              enableSplitViewResizing: true,
              minimap: { enabled: false },
              fontSize: 13,
              padding: { top: 8, bottom: 8 },
            }}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.btnDanger} onClick={() => void handleSave(mergeConflict.theirs)}>
            Accept Theirs
          </button>
          <button className={styles.btnSecondary} onClick={() => void handleSave(mergeConflict.ours)}>
            Accept Yours
          </button>
          <button className={styles.btnPrimary} onClick={() => void handleSave(editedContent)}>
            Save Merged
          </button>
        </div>
      </div>
    </dialog>
  )
}
