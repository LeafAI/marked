import { create } from 'zustand'
import { AppSettings, DiagramRendererConfig, EditorSettings, IconTheme } from '../types'

const STORAGE_KEY = 'marked:settings'

const defaultDiagrams: DiagramRendererConfig = {
  mermaid: 'local',
  plantuml: 'plantuml.com',
  graphviz: 'kroki',
}

const defaultEditor: EditorSettings = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { googleClientId: '', diagrams: defaultDiagrams, editor: defaultEditor, iconTheme: 'material' }
    return { ...{ googleClientId: '', diagrams: defaultDiagrams, editor: defaultEditor, iconTheme: 'material' as const }, ...JSON.parse(raw) }
  } catch {
    return { googleClientId: '', diagrams: defaultDiagrams, editor: defaultEditor, iconTheme: 'material' }
  }
}

interface SettingsState extends AppSettings {
  updateDiagramRenderer: (update: Partial<DiagramRendererConfig>) => void
  updateEditorSettings: (update: Partial<EditorSettings>) => void
  setGoogleClientId: (id: string) => void
  setIconTheme: (theme: IconTheme) => void
}

function persist(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),

  updateDiagramRenderer: update => {
    set(state => {
      const next = { ...state, diagrams: { ...state.diagrams, ...update } }
      persist(next)
      return next
    })
  },

  updateEditorSettings: update => {
    set(state => {
      const next = { ...state, editor: { ...state.editor, ...update } }
      persist(next)
      return next
    })
  },

  setGoogleClientId: id => {
    set(state => {
      const next = { ...state, googleClientId: id }
      persist(next)
      return next
    })
  },

  setIconTheme: theme => {
    set(state => {
      const next = { ...state, iconTheme: theme }
      persist(next)
      return next
    })
  },

  // Expose getter for non-reactive usage
  getDiagramConfig: () => get().diagrams,
}))
