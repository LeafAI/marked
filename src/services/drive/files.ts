import { DriveFile, DriveFolder, DriveItem, isDriveFolder } from '../../types'
import { getAccessToken, clearAuth } from './auth'

const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

// ─── Request helper ───────────────────────────────────────────────────────────

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  if (!token) {
    clearAuth()
    throw new Error('Not authenticated')
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    clearAuth()
    throw new Error('Session expired — please reconnect Google Drive')
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive API error ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── File listing ─────────────────────────────────────────────────────────────

interface FileListResponse {
  files: DriveFile[]
  nextPageToken?: string
}

export async function listFolder(folderId = 'root', driveId?: string): Promise<DriveItem[]> {
  const q = `'${folderId}' in parents and trashed = false`
  const fields = 'files(id,name,mimeType,parents,modifiedTime,size)'
  const params: Record<string, string> = {
    q, fields, orderBy: 'folder,name', pageSize: '200',
    supportsAllDrives: 'true', includeItemsFromAllDrives: 'true',
  }
  if (driveId) {
    params.corpora = 'drive'
    params.driveId = driveId
  }

  const data = await request<FileListResponse>(`${API}/files?${new URLSearchParams(params)}`)

  return data.files.map(f =>
    f.mimeType === 'application/vnd.google-apps.folder'
      ? ({ ...f, isLoaded: false, isExpanded: false } as DriveFolder)
      : f
  )
}

// ─── Shared with me ────────────────────────────────────────────────────────

export async function listSharedWithMe(): Promise<DriveItem[]> {
  const q = 'sharedWithMe = true and trashed = false'
  const fields = 'files(id,name,mimeType,parents,modifiedTime,size)'
  const params = new URLSearchParams({
    q, fields, orderBy: 'folder,name', pageSize: '200',
    supportsAllDrives: 'true', includeItemsFromAllDrives: 'true',
  })

  const data = await request<FileListResponse>(`${API}/files?${params}`)

  return data.files.map(f =>
    f.mimeType === 'application/vnd.google-apps.folder'
      ? ({ ...f, isLoaded: false, isExpanded: false } as DriveFolder)
      : f
  )
}

// ─── Shared drives ───────────────────────────────────────────────────────────

interface SharedDriveListResponse {
  drives: { id: string; name: string }[]
  nextPageToken?: string
}

export async function listSharedDrives(): Promise<DriveFolder[]> {
  const params = new URLSearchParams({ pageSize: '100', fields: 'drives(id,name)' })
  const data = await request<SharedDriveListResponse>(`${API}/drives?${params}`)

  return data.drives.map(d => ({
    id: d.id,
    name: d.name,
    mimeType: 'application/vnd.google-apps.folder',
    isLoaded: false,
    isExpanded: false,
  }))
}

// ─── File content ─────────────────────────────────────────────────────────────

export async function readFile(fileId: string): Promise<string> {
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API}/files/${fileId}?alt=media&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) {
    clearAuth()
    throw new Error('Session expired')
  }

  if (!res.ok) throw new Error(`Failed to read file: ${res.status}`)
  return res.text()
}

// ─── File metadata ────────────────────────────────────────────────────────────

export async function getFileModifiedTime(fileId: string): Promise<string> {
  const data = await request<{ modifiedTime: string }>(
    `${API}/files/${fileId}?fields=modifiedTime&supportsAllDrives=true`
  )
  return data.modifiedTime
}

export async function readFileWithMeta(fileId: string): Promise<{ content: string; modifiedTime: string }> {
  const [content, modifiedTime] = await Promise.all([
    readFile(fileId),
    getFileModifiedTime(fileId),
  ])
  return { content, modifiedTime }
}

// ─── Save file ────────────────────────────────────────────────────────────────

export async function saveFile(fileId: string, content: string, mimeType = 'text/markdown'): Promise<void> {
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${UPLOAD_API}/files/${fileId}?uploadType=media&supportsAllDrives=true`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': mimeType,
    },
    body: content,
  })

  if (res.status === 401) {
    clearAuth()
    throw new Error('Session expired')
  }

  if (!res.ok) throw new Error(`Failed to save file: ${res.status}`)
}

// ─── Create file ──────────────────────────────────────────────────────────────

interface CreateFileOptions {
  name: string
  parentId: string
  content?: string
  mimeType?: string
}

export async function createFile({ name, parentId, content = '', mimeType = 'text/markdown' }: CreateFileOptions): Promise<DriveFile> {
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')

  const metadata = { name, mimeType, parents: [parentId] }
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const close = `\r\n--${boundary}--`

  const body =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    close

  const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,parents&supportsAllDrives=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body,
  })

  if (!res.ok) throw new Error(`Failed to create file: ${res.status}`)
  return res.json() as Promise<DriveFile>
}

// ─── Create folder ────────────────────────────────────────────────────────────

export async function createFolder(name: string, parentId: string): Promise<DriveFolder> {
  const file = await createFile({
    name,
    parentId,
    mimeType: 'application/vnd.google-apps.folder',
    content: '',
  })
  return { ...file, isLoaded: false, isExpanded: false }
}

// ─── Rename ──────────────────────────────────────────────────────────────────

export async function renameFile(fileId: string, name: string): Promise<void> {
  await request<DriveFile>(`${API}/files/${fileId}?supportsAllDrives=true`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
}

// ─── Trash ───────────────────────────────────────────────────────────────────

export async function trashFile(fileId: string): Promise<void> {
  const token = getAccessToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API}/files/${fileId}?supportsAllDrives=true`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) {
    clearAuth()
    throw new Error('Session expired')
  }

  if (!res.ok) throw new Error(`Failed to trash file: ${res.status}`)
}

// ─── Move ────────────────────────────────────────────────────────────────────

export async function moveFile(fileId: string, newParentId: string, oldParentId: string): Promise<void> {
  await request<DriveFile>(
    `${API}/files/${fileId}?addParents=${newParentId}&removeParents=${oldParentId}&supportsAllDrives=true`,
    { method: 'PATCH' }
  )
}

// ─── Path resolution ──────────────────────────────────────────────────────────

interface FileMeta {
  id: string
  name: string
  parents?: string[]
}

export async function resolveFilePath(fileId: string): Promise<string> {
  const parts: string[] = []
  let currentId = fileId

  for (let i = 0; i < 20; i++) {
    const data = await request<FileMeta>(`${API}/files/${currentId}?fields=id,name,parents&supportsAllDrives=true`)
    parts.unshift(data.name)
    if (!data.parents || data.parents.length === 0) break
    currentId = data.parents[0]
    if (currentId === 'root') break
  }

  return '/' + parts.join('/')
}

export function isMarkdownFile(file: DriveItem): boolean {
  if (isDriveFolder(file)) return false
  return (
    file.mimeType === 'text/markdown' ||
    file.mimeType === 'text/x-markdown' ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.markdown')
  )
}
