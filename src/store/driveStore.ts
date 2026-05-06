import { create } from 'zustand'
import { DriveItem, DriveFolder } from '../types'

interface DriveState {
  isAuthenticated: boolean
  userEmail: string | null
  rootItems: DriveItem[]
  currentFolderId: string
  isLoadingFolder: boolean
  error: string | null
  setAuthenticated: (email: string) => void
  clearAuth: () => void
  setRootItems: (items: DriveItem[]) => void
  updateFolder: (folderId: string, children: DriveItem[]) => void
  toggleFolder: (folderId: string) => void
  setCurrentFolder: (id: string) => void
  setLoadingFolder: (loading: boolean) => void
  setError: (error: string | null) => void
}

function updateFolderInTree(items: DriveItem[], folderId: string, update: Partial<DriveFolder>): DriveItem[] {
  return items.map(item => {
    if (item.id === folderId && item.mimeType === 'application/vnd.google-apps.folder') {
      return { ...item, ...update } as DriveFolder
    }
    const folder = item as DriveFolder
    if (folder.children) {
      return { ...folder, children: updateFolderInTree(folder.children, folderId, update) }
    }
    return item
  })
}

export const useDriveStore = create<DriveState>(set => ({
  isAuthenticated: false,
  userEmail: null,
  rootItems: [],
  currentFolderId: 'root',
  isLoadingFolder: false,
  error: null,

  setAuthenticated: email => set({ isAuthenticated: true, userEmail: email, error: null }),

  clearAuth: () =>
    set({ isAuthenticated: false, userEmail: null, rootItems: [], currentFolderId: 'root' }),

  setRootItems: items => set({ rootItems: items }),

  updateFolder: (folderId, children) => {
    set(state => ({
      rootItems: updateFolderInTree(state.rootItems, folderId, {
        children,
        isLoaded: true,
      }),
    }))
  },

  toggleFolder: folderId => {
    set(state => ({
      rootItems: updateFolderInTree(state.rootItems, folderId, {
        isExpanded: !(state.rootItems.find(i => i.id === folderId) as DriveFolder | undefined)
          ?.isExpanded,
      }),
    }))
  },

  setCurrentFolder: id => set({ currentFolderId: id }),
  setLoadingFolder: loading => set({ isLoadingFolder: loading }),
  setError: error => set({ error }),
}))
