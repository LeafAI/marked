import type * as MonacoType from 'monaco-editor'

// Module-level singleton — avoids prop-drilling the editor instance
// across the deep ActivityBar → SidePanel → OutlinePanel → [needs editor] chain.
let instance: MonacoType.editor.IStandaloneCodeEditor | null = null

export function setEditorInstance(editor: MonacoType.editor.IStandaloneCodeEditor | null) {
  instance = editor
}

export function getEditorInstance(): MonacoType.editor.IStandaloneCodeEditor | null {
  return instance
}

export function revealLine(line: number) {
  if (!instance) return
  instance.revealLineInCenter(line)
  instance.setPosition({ lineNumber: line, column: 1 })
  instance.focus()
}
