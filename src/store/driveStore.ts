import { create } from 'zustand'
import { DriveItem, DriveFolder } from '../types'

interface DriveState {
  isAuthenticated: boolean
  userEmail: string | null
  rootItems: DriveItem[]
  sharedDrives: DriveFolder[]
  currentFolderId: string
  isLoadingFolder: boolean
  error: string | null
  setAuthenticated: (email: string) => void
  clearAuth: () => void
  setRootItems: (items: DriveItem[]) => void
  setSharedDrives: (drives: DriveFolder[]) => void
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
  sharedDrives: [],
  currentFolderId: 'root',
  isLoadingFolder: false,
  error: null,

  setAuthenticated: email => set({ isAuthenticated: true, userEmail: email, error: null }),

  clearAuth: () =>
    set({ isAuthenticated: false, userEmail: null, rootItems: [], sharedDrives: [], currentFolderId: 'root' }),

  setRootItems: items => set({ rootItems: items }),

  setSharedDrives: drives => set({ sharedDrives: drives }),

  updateFolder: (folderId, children) => {
    set(state => ({
      rootItems: updateFolderInTree(state.rootItems, folderId, {
        children,
        isLoaded: true,
      }),
      sharedDrives: updateFolderInTree(state.sharedDrives, folderId, {
        children,
        isLoaded: true,
      }) as DriveFolder[],
    }))
  },

  toggleFolder: folderId => {
    set(state => {
      const findFolder = (items: DriveItem[]): DriveFolder | undefined => {
        for (const item of items) {
          if (item.id === folderId && item.mimeType === 'application/vnd.google-apps.folder') {
            return item as DriveFolder
          }
          const folder = item as DriveFolder
          if (folder.children) {
            const found = findFolder(folder.children)
            if (found) return found
          }
        }
        return undefined
      }
      const target = findFolder([...state.rootItems, ...state.sharedDrives])
      const newExpanded = !target?.isExpanded
      return {
        rootItems: updateFolderInTree(state.rootItems, folderId, { isExpanded: newExpanded }),
        sharedDrives: updateFolderInTree(state.sharedDrives, folderId, { isExpanded: newExpanded }) as DriveFolder[],
      }
    })
  },

  setCurrentFolder: id => set({ currentFolderId: id }),
  setLoadingFolder: loading => set({ isLoadingFolder: loading }),
  setError: error => set({ error }),
}))
