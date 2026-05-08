import { useRef, useState, useCallback, useEffect } from 'react'
import { DiffEditor, loader, Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useUIStore, type MergeConflictState } from '../../store/uiStore'
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

interface DiffPanelProps {
  conflict: MergeConflictState
  tabName: string
  onSave: (content: string) => void
  onClose: () => void
}

function DiffPanel({ conflict, tabName, onSave, onClose }: DiffPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [editedContent, setEditedContent] = useState(conflict.ours)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    el.showModal()
    const handleClose = () => onClose()
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose])

  function handleBeforeMount(monaco: Monaco) {
    defineMarkedTheme(monaco)
  }

  const handleEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor) => {
    const modified = diffEditor.getModifiedEditor()
    modified.onDidChangeModelContent(() => {
      setEditedContent(modified.getValue())
    })
  }, [])

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-label="Merge conflict">
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Merge Conflict — {tabName}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.diffContainer}>
          <DiffEditor
            original={conflict.theirs}
            modified={editedContent}
            language={tabName.match(/\.(md|markdown)$/i) ? 'markdown' : 'plaintext'}
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
          <button className={styles.btnDanger} onClick={() => void onSave(conflict.theirs)}>
            Accept Theirs
          </button>
          <button className={styles.btnSecondary} onClick={() => void onSave(conflict.ours)}>
            Accept Yours
          </button>
          <button className={styles.btnPrimary} onClick={() => void onSave(editedContent)}>
            Save Merged
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default function MergeConflictDialog() {
  const { mergeConflict, setMergeConflict } = useUIStore()
  const { tabs } = useEditorStore()

  const tab = mergeConflict ? tabs.find(t => t.id === mergeConflict.tabId) : null

  const handleSave = useCallback(async (content: string) => {
    if (!tab || !mergeConflict) return
    const success = await saveResolvedContent(tab, content)
    if (success) setMergeConflict(null)
  }, [tab, mergeConflict, setMergeConflict])

  const handleClose = useCallback(() => setMergeConflict(null), [setMergeConflict])

  if (!mergeConflict || !tab) return null

  return (
    <DiffPanel
      key={mergeConflict.tabId}
      conflict={mergeConflict}
      tabName={tab.name}
      onSave={handleSave}
      onClose={handleClose}
    />
  )
}
