import { create } from 'zustand'
import { SidePanelView } from '../types'

interface UIState {
  sidebarVisible: boolean
  previewVisible: boolean
  sidebarWidth: number
  previewWidth: number
  activeSidePanelView: SidePanelView
  settingsOpen: boolean
  toggleSidebar: () => void
  togglePreview: () => void
  setSidebarWidth: (w: number) => void
  setPreviewWidth: (w: number) => void
  setActiveSidePanelView: (view: SidePanelView) => void
  setSettingsOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>(set => ({
  sidebarVisible: true,
  previewVisible: true,
  sidebarWidth: 240,
  previewWidth: 420,
  activeSidePanelView: 'explorer',
  settingsOpen: false,

  toggleSidebar: () => set(state => ({ sidebarVisible: !state.sidebarVisible })),
  togglePreview: () => set(state => ({ previewVisible: !state.previewVisible })),
  setSidebarWidth: w => set({ sidebarWidth: w }),
  setPreviewWidth: w => set({ previewWidth: w }),
  setActiveSidePanelView: view => set({ activeSidePanelView: view }),
  setSettingsOpen: open => set({ settingsOpen: open }),
}))
