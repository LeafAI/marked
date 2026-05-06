import { create } from 'zustand'
import { OpenFile } from '../types'

interface EditorState {
  tabs: OpenFile[]
  activeTabId: string | null
  openFile: (file: OpenFile) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateContent: (id: string, content: string) => void
  markSaved: (id: string) => void
  getActiveFile: () => OpenFile | undefined
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openFile: file => {
    const existing = get().tabs.find(t => t.driveFileId === file.driveFileId)
    if (existing) {
      set({ activeTabId: existing.id })
      return
    }
    set(state => ({
      tabs: [...state.tabs, file],
      activeTabId: file.id,
    }))
  },

  closeTab: id => {
    set(state => {
      const tabs = state.tabs.filter(t => t.id !== id)
      let activeTabId = state.activeTabId
      if (activeTabId === id) {
        const idx = state.tabs.findIndex(t => t.id === id)
        activeTabId = tabs[Math.max(0, idx - 1)]?.id ?? null
      }
      return { tabs, activeTabId }
    })
  },

  setActiveTab: id => set({ activeTabId: id }),

  updateContent: (id, content) => {
    set(state => ({
      tabs: state.tabs.map(t => (t.id === id ? { ...t, content } : t)),
    }))
  },

  markSaved: id => {
    set(state => ({
      tabs: state.tabs.map(t =>
        t.id === id ? { ...t, originalContent: t.content } : t
      ),
    }))
  },

  getActiveFile: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId)
  },
}))
