import { create } from 'zustand'
import { SidePanelView } from '../types'

export interface MergeConflictState {
  tabId: string
  base: string
  ours: string
  theirs: string
}

interface UIState {
  sidebarVisible: boolean
  previewVisible: boolean
  sidebarWidth: number
  previewWidth: number
  activeSidePanelView: SidePanelView
  settingsOpen: boolean
  mergeConflict: MergeConflictState | null
  toggleSidebar: () => void
  togglePreview: () => void
  setSidebarWidth: (w: number) => void
  setPreviewWidth: (w: number) => void
  setActiveSidePanelView: (view: SidePanelView) => void
  setSettingsOpen: (open: boolean) => void
  setMergeConflict: (conflict: MergeConflictState | null) => void
}

export const useUIStore = create<UIState>(set => ({
  sidebarVisible: true,
  previewVisible: true,
  sidebarWidth: 240,
  previewWidth: 420,
  activeSidePanelView: 'explorer',
  settingsOpen: false,
  mergeConflict: null,

  toggleSidebar: () => set(state => ({ sidebarVisible: !state.sidebarVisible })),
  togglePreview: () => set(state => ({ previewVisible: !state.previewVisible })),
  setSidebarWidth: w => set({ sidebarWidth: w }),
  setPreviewWidth: w => set({ previewWidth: w }),
  setActiveSidePanelView: view => set({ activeSidePanelView: view }),
  setSettingsOpen: open => set({ settingsOpen: open }),
  setMergeConflict: conflict => set({ mergeConflict: conflict }),
}))
