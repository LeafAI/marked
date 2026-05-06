import type { IconTheme } from '../types'

interface IconProps {
  className?: string
}

// ─── Theme color palettes ────────────────────────────────────────────────────

interface ThemeColors {
  folder: string
  folderOpen: string
  folderStroke: string
  markdown: string
  markdownAccent: string
  text: string
  textAccent: string
  config: string
  configAccent: string
  code: string
  codeAccent: string
  chevron: string
  toolbar: string
}

const themes: Record<IconTheme, ThemeColors> = {
  material: {
    folder: '#dcb67a',
    folderOpen: '#e8d4a2',
    folderStroke: '#c9a45c',
    markdown: '#4a8eda',
    markdownAccent: '#ffffff',
    text: '#6d8086',
    textAccent: '#b0bec5',
    config: '#6d7b85',
    configAccent: '#b0bec5',
    code: '#556068',
    codeAccent: '#b0bec5',
    chevron: '#8a8a8a',
    toolbar: '#4fc3f7',
  },
  seti: {
    folder: '#e8a859',
    folderOpen: '#f0c080',
    folderStroke: '#d09040',
    markdown: '#519aba',
    markdownAccent: '#ffffff',
    text: '#6d8086',
    textAccent: '#b0bec5',
    config: '#9876aa',
    configAccent: '#c4a6d8',
    code: '#e3786d',
    codeAccent: '#f0a090',
    chevron: '#666666',
    toolbar: '#e8a859',
  },
  minimal: {
    folder: '#8a8a8a',
    folderOpen: '#a0a0a0',
    folderStroke: '#666666',
    markdown: '#6a6a6a',
    markdownAccent: '#ffffff',
    text: '#6a6a6a',
    textAccent: '#999999',
    config: '#6a6a6a',
    configAccent: '#999999',
    code: '#6a6a6a',
    codeAccent: '#999999',
    chevron: '#555555',
    toolbar: '#80cbc4',
  },
}

export function getThemeColors(theme: IconTheme): ThemeColors {
  return themes[theme] || themes.material
}

// ─── Icon components ─────────────────────────────────────────────────────────

export function FolderIcon({ className }: IconProps, theme: IconTheme = 'material') {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1.5 3A1.5 1.5 0 013 1.5h2.764a1.5 1.5 0 011.06.44L7.883 3H13A1.5 1.5 0 0114.5 4.5v7A1.5 1.5 0 0113 13H3A1.5 1.5 0 011.5 11.5v-8.5z"
        fill={c.folder}
      />
    </svg>
  )
}

export function FolderIconThemed({ className, theme }: IconProps & { theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1.5 3A1.5 1.5 0 013 1.5h2.764a1.5 1.5 0 011.06.44L7.883 3H13A1.5 1.5 0 0114.5 4.5v7A1.5 1.5 0 0113 13H3A1.5 1.5 0 011.5 11.5v-8.5z"
        fill={c.folder}
      />
    </svg>
  )
}

export function MarkdownIconThemed({ className, theme }: IconProps & { theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="12" rx="1.5" fill={c.markdown} />
      <path d="M4 10V6l2 2.5L8 6v4M10 8.5L12 6v4M9 6h2" stroke={c.markdownAccent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function TextFileIconThemed({ className, theme }: IconProps & { theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 1.5h5.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V13.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z" fill={c.text} />
      <path d="M9.5 1.5v3h3" fill="none" stroke={c.textAccent} strokeWidth="0.75" />
      <line x1="5" y1="7" x2="11" y2="7" stroke={c.textAccent} strokeWidth="0.75" />
      <line x1="5" y1="9" x2="11" y2="9" stroke={c.textAccent} strokeWidth="0.75" />
      <line x1="5" y1="11" x2="9" y2="11" stroke={c.textAccent} strokeWidth="0.75" />
    </svg>
  )
}

export function ConfigFileIconThemed({ className, theme }: IconProps & { theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 1.5h5.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V13.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z" fill={c.config} />
      <path d="M9.5 1.5v3h3" fill="none" stroke={c.configAccent} strokeWidth="0.75" />
      <circle cx="8" cy="9" r="2" fill="none" stroke={c.configAccent} strokeWidth="0.75" />
      <line x1="8" y1="7" x2="8" y2="7.5" stroke={c.configAccent} strokeWidth="0.75" />
      <line x1="8" y1="10.5" x2="8" y2="11" stroke={c.configAccent} strokeWidth="0.75" />
    </svg>
  )
}

export function CodeFileIconThemed({ className, theme }: IconProps & { theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 1.5h5.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V13.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z" fill={c.code} />
      <path d="M9.5 1.5v3h3" fill="none" stroke={c.codeAccent} strokeWidth="0.75" />
      <path d="M6 9l-1.5 1.5L6 12M10 9l1.5 1.5L10 12" stroke={c.codeAccent} strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function ChevronIconThemed({ className, expanded, theme }: IconProps & { expanded: boolean; theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill={c.chevron}>
      <path
        d={expanded ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4'}
        fill="none"
        stroke={c.chevron}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Toolbar icons ───────────────────────────────────────────────────────────

export function NewFileIconThemed({ className, theme }: IconProps & { theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z" fill={c.toolbar} />
      <path d="M9 1.5L12.5 6H9V1.5z" fill={c.toolbar} opacity="0.7" />
      <path d="M8 8.5a.5.5 0 011 0V10h1.5a.5.5 0 010 1H9v1.5a.5.5 0 01-1 0V11H6.5a.5.5 0 010-1H8V8.5z" fill={c.toolbar} />
    </svg>
  )
}

export function NewFolderIconThemed({ className, theme }: IconProps & { theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M1 3.5A1.5 1.5 0 012.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0115 5.5v1H1v-3zm0 4.5h14v5.5A1.5 1.5 0 0113.5 15h-11A1.5 1.5 0 011 13.5V8z" fill={c.toolbar} />
      <path d="M8 9a.5.5 0 01.5.5V11H10a.5.5 0 010 1H8.5v1.5a.5.5 0 01-1 0V12H6a.5.5 0 010-1h1.5V9.5A.5.5 0 018 9z" fill={c.toolbar} />
    </svg>
  )
}

export function RefreshIconThemed({ className, theme }: IconProps & { theme: IconTheme }) {
  const c = getThemeColors(theme)
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" stroke={c.toolbar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3v5h-5" stroke={c.toolbar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" stroke={c.toolbar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 21v-5h5" stroke={c.toolbar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Default (non-themed) exports for backward compat ────────────────────────

export function FolderIconDefault({ className }: IconProps) {
  return <FolderIconThemed className={className} theme="material" />
}

export function MarkdownIconDefault({ className }: IconProps) {
  return <MarkdownIconThemed className={className} theme="material" />
}

export function TextFileIconDefault({ className }: IconProps) {
  return <TextFileIconThemed className={className} theme="material" />
}

export function ConfigFileIconDefault({ className }: IconProps) {
  return <ConfigFileIconThemed className={className} theme="material" />
}

export function CodeFileIconDefault({ className }: IconProps) {
  return <CodeFileIconThemed className={className} theme="material" />
}

export function ChevronIconDefault({ className, expanded }: IconProps & { expanded: boolean }) {
  return <ChevronIconThemed className={className} expanded={expanded} theme="material" />
}
