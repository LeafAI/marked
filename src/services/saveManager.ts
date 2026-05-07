import type { OpenFile } from '../types'
import { getFileModifiedTime, saveFile as driveSaveFile, readFile } from './drive/files'
import { threeWayMerge } from './merge'
import { useEditorStore } from '../store/editorStore'

export type SaveOutcome = 'saved' | 'no-change' | 'conflict-detected' | 'error'

export interface SaveOptions {
  /** If true, skip the conflict dialog on conflict (used by auto-save). */
  silent?: boolean
}

export async function performSave(
  tab: OpenFile,
  options: SaveOptions = {}
): Promise<SaveOutcome> {
  if (tab.content === tab.originalContent) return 'no-change'

  try {
    const remoteModifiedTime = await getFileModifiedTime(tab.driveFileId)

    if (remoteModifiedTime === tab.baseModifiedTime) {
      await driveSaveFile(tab.driveFileId, tab.content, tab.mimeType)
      const freshTime = await getFileModifiedTime(tab.driveFileId)
      useEditorStore.getState().markSaved(tab.id, freshTime)
      return 'saved'
    }

    const remoteContent = await readFile(tab.driveFileId)
    const result = threeWayMerge(tab.originalContent, tab.content, remoteContent)

    if (result.kind === 'clean') {
      await driveSaveFile(tab.driveFileId, result.merged, tab.mimeType)
      const freshTime = await getFileModifiedTime(tab.driveFileId)
      useEditorStore.getState().updateContent(tab.id, result.merged)
      useEditorStore.getState().markSaved(tab.id, freshTime)
      return 'saved'
    }

    if (options.silent) {
      return 'conflict-detected'
    }

    return 'conflict-detected'
  } catch {
    return 'error'
  }
}

export async function saveResolvedContent(
  tab: OpenFile,
  resolvedContent: string
): Promise<boolean> {
  try {
    await driveSaveFile(tab.driveFileId, resolvedContent, tab.mimeType)
    const freshTime = await getFileModifiedTime(tab.driveFileId)
    useEditorStore.getState().updateContent(tab.id, resolvedContent)
    useEditorStore.getState().markSaved(tab.id, freshTime)
    return true
  } catch {
    return false
  }
}
