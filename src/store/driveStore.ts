import { create } from 'zustand'
import { DriveItem, DriveFolder, isDriveFolder } from '../types'

interface DriveState {
  isAuthenticated: boolean
  userEmail: string | null
  rootItems: DriveItem[]
  sharedDrives: DriveFolder[]
  sharedWithMe: DriveItem[]
  currentFolderId: string
  isLoadingFolder: boolean
  error: string | null
  setAuthenticated: (email: string) => void
  clearAuth: () => void
  setRootItems: (items: DriveItem[]) => void
  setSharedDrives: (drives: DriveFolder[]) => void
  setSharedWithMe: (items: DriveItem[]) => void
  updateFolder: (folderId: string, children: DriveItem[]) => void
  toggleFolder: (folderId: string) => void
  renameItem: (itemId: string, newName: string) => void
  removeItem: (itemId: string) => void
  moveItem: (itemId: string, oldParentId: string, newParentId: string, item: DriveItem) => void
  setCurrentFolder: (id: string) => void
  setLoadingFolder: (loading: boolean) => void
  setError: (error: string | null) => void
}

function updateItemInTree(items: DriveItem[], itemId: string, update: Partial<DriveItem>): DriveItem[] {
  return items.map(item => {
    if (item.id === itemId) {
      return { ...item, ...update }
    }
    const folder = item as DriveFolder
    if (folder.children) {
      return { ...folder, children: updateItemInTree(folder.children, itemId, update) }
    }
    return item
  })
}

function removeFromTree(items: DriveItem[], itemId: string): DriveItem[] {
  return items
    .filter(item => item.id !== itemId)
    .map(item => {
      if (isDriveFolder(item) && item.children) {
        return { ...item, children: removeFromTree(item.children, itemId) }
      }
      return item
    })
}

function insertIntoFolder(items: DriveItem[], folderId: string, newItem: DriveItem): DriveItem[] {
  return items.map(item => {
    if (item.id === folderId && isDriveFolder(item)) {
      return { ...item, children: [...(item.children ?? []), newItem] }
    }
    if (isDriveFolder(item) && item.children) {
      return { ...item, children: insertIntoFolder(item.children, folderId, newItem) }
    }
    return item
  })
}

export const useDriveStore = create<DriveState>(set => ({
  isAuthenticated: false,
  userEmail: null,
  rootItems: [],
  sharedDrives: [],
  sharedWithMe: [],
  currentFolderId: 'root',
  isLoadingFolder: false,
  error: null,

  setAuthenticated: email => set({ isAuthenticated: true, userEmail: email, error: null }),

  clearAuth: () =>
    set({ isAuthenticated: false, userEmail: null, rootItems: [], sharedDrives: [], sharedWithMe: [], currentFolderId: 'root' }),

  setRootItems: items => set({ rootItems: items }),

  setSharedDrives: drives => set({ sharedDrives: drives }),

  setSharedWithMe: items => set({ sharedWithMe: items }),

  updateFolder: (folderId, children) => {
    set(state => ({
      rootItems: updateItemInTree(state.rootItems, folderId, {
        children,
        isLoaded: true,
      }),
      sharedDrives: updateItemInTree(state.sharedDrives, folderId, {
        children,
        isLoaded: true,
      }) as DriveFolder[],
      sharedWithMe: updateItemInTree(state.sharedWithMe, folderId, {
        children,
        isLoaded: true,
      }),
    }))
  },

  toggleFolder: folderId => {
    set(state => {
      const allItems = [...state.rootItems, ...state.sharedDrives, ...state.sharedWithMe]
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
      const target = findFolder(allItems)
      const newExpanded = !target?.isExpanded
      return {
        rootItems: updateItemInTree(state.rootItems, folderId, { isExpanded: newExpanded }),
        sharedDrives: updateItemInTree(state.sharedDrives, folderId, { isExpanded: newExpanded }) as DriveFolder[],
        sharedWithMe: updateItemInTree(state.sharedWithMe, folderId, { isExpanded: newExpanded }),
      }
    })
  },

  renameItem: (itemId, newName) => {
    set(state => ({
      rootItems: updateItemInTree(state.rootItems, itemId, { name: newName }),
      sharedDrives: updateItemInTree(state.sharedDrives, itemId, { name: newName }) as DriveFolder[],
      sharedWithMe: updateItemInTree(state.sharedWithMe, itemId, { name: newName }),
    }))
  },

  removeItem: itemId => {
    set(state => ({
      rootItems: removeFromTree(state.rootItems, itemId),
      sharedDrives: removeFromTree(state.sharedDrives, itemId) as DriveFolder[],
      sharedWithMe: removeFromTree(state.sharedWithMe, itemId),
    }))
  },

  moveItem: (itemId, _oldParentId, newParentId, item) => {
    set(state => {
      const rootItems = insertIntoFolder(
        removeFromTree(state.rootItems, itemId),
        newParentId,
        item
      )
      const sharedDrives = insertIntoFolder(
        removeFromTree(state.sharedDrives, itemId),
        newParentId,
        item
      ) as DriveFolder[]
      const sharedWithMe = insertIntoFolder(
        removeFromTree(state.sharedWithMe, itemId),
        newParentId,
        item
      )
      return { rootItems, sharedDrives, sharedWithMe }
    })
  },

  setCurrentFolder: id => set({ currentFolderId: id }),
  setLoadingFolder: loading => set({ isLoadingFolder: loading }),
  setError: error => set({ error }),
}))
