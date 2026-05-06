// ─── Google Drive ─────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  modifiedTime?: string
  size?: string
}

export interface DriveFolder extends DriveFile {
  children?: DriveItem[]
  isLoaded: boolean
  isExpanded: boolean
}

export type DriveItem = DriveFile | DriveFolder

export function isDriveFolder(item: DriveItem): item is DriveFolder {
  return item.mimeType === 'application/vnd.google-apps.folder'
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export interface OpenFile {
  id: string
  name: string
  driveFileId: string
  content: string
  originalContent: string
  mimeType: string
  path: string
}

export type TabId = string

// ─── Outline ──────────────────────────────────────────────────────────────────

export interface OutlineItem {
  id: string
  level: number
  text: string
  line: number
}

// ─── Diagram renderers ────────────────────────────────────────────────────────

export type MermaidRenderer = 'local' | 'mermaid.ink' | 'kroki'
export type PlantUMLRenderer = 'plantuml.com' | 'kroki'

export interface DiagramRendererConfig {
  mermaid: MermaidRenderer
  plantuml: PlantUMLRenderer
  graphviz: 'kroki'
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface EditorSettings {
  fontSize: number
  fontFamily: string
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
}

export type IconTheme = 'material' | 'seti' | 'minimal'

export interface AppSettings {
  googleClientId: string
  diagrams: DiagramRendererConfig
  editor: EditorSettings
  iconTheme: IconTheme
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type SidePanelView = 'explorer' | 'outline'
