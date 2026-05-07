import { useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import type { MermaidRenderer, PlantUMLRenderer, IconTheme } from '../../types'
import styles from './SettingsPanel.module.css'

const clientIdPreconfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID
const CLIENT_ID_RE = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/

export default function SettingsPanel() {
  const { settingsOpen, setSettingsOpen } = useUIStore()
  const { googleClientId, diagrams, editor, iconTheme, setGoogleClientId, updateDiagramRenderer, updateEditorSettings, setIconTheme } =
    useSettingsStore()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (settingsOpen) el.showModal()
    else el.close()
  }, [settingsOpen])

  // Close on Escape (dialog native behaviour) and backdrop click
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const onClose = () => setSettingsOpen(false)
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [setSettingsOpen])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) setSettingsOpen(false)
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleBackdropClick}
      aria-label="Settings"
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>Settings</span>
          <button className={styles.closeBtn} onClick={() => setSettingsOpen(false)} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className={styles.body}>
          {/* ── Google Drive ─────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Google Drive</h2>

            {clientIdPreconfigured ? (
              <span className={styles.hint}>
                Client ID is pre-configured via deployment. No manual setup required.
              </span>
            ) : null}
            {googleClientId && (
              <label className={styles.field}>
                <span className={styles.label}>Active Client ID</span>
                <code className={styles.hint} style={{ wordBreak: 'break-all', userSelect: 'all' }}>
                  {googleClientId}
                </code>
              </label>
            )}
            {!clientIdPreconfigured && (
              <label className={styles.field}>
                <span className={styles.label}>OAuth2 Client ID</span>
                <input
                  type="text"
                  className={styles.input}
                  value={googleClientId}
                  onChange={e => setGoogleClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  spellCheck={false}
                  pattern="[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com"
                />
                {googleClientId && !CLIENT_ID_RE.test(googleClientId) && (
                  <span className={styles.hint} style={{ color: '#f87171' }}>
                    Expected format: 123456789-abc.apps.googleusercontent.com
                  </span>
                )}
                <span className={styles.hint}>
                  <strong>1.</strong> Enable the{' '}
                  <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noreferrer">
                    Google Drive API
                  </a>{' '}
                  in your project.{' '}
                  <strong>2.</strong> Create a <strong>Web application</strong> OAuth 2.0 client at{' '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
                    Google Cloud Console
                  </a>
                  .{' '}
                  <strong>3.</strong> Add these as <strong>Authorised JavaScript origins</strong> (not redirect URIs):{' '}
                  <code>https://leafai.github.io</code> and <code>http://localhost:5173</code>.{' '}
                  <strong>4.</strong> If the app is not published, add test users in{' '}
                  <a href="https://console.cloud.google.com/auth/audience" target="_blank" rel="noreferrer">
                    OAuth consent screen
                  </a>
                  .
                </span>
              </label>
            )}
          </section>

          {/* ── Diagram renderers ─────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Diagram Renderers</h2>

            <label className={styles.field}>
              <span className={styles.label}>Mermaid</span>
              <select
                className={styles.select}
                value={diagrams.mermaid}
                onChange={e => {
                  const value = e.target.value as MermaidRenderer
                  if (value !== 'local' && !window.confirm(
                    `Switching to "${value}" will send your diagram code to a third-party server for rendering. Do not use this for sensitive diagrams. Continue?`
                  )) return
                  updateDiagramRenderer({ mermaid: value })
                }}
              >
                <option value="local">mermaid.js (local, no network)</option>
                <option value="mermaid.ink">mermaid.ink (remote image)</option>
                <option value="kroki">Kroki (remote image)</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>PlantUML / C4</span>
              <select
                className={styles.select}
                value={diagrams.plantuml}
                onChange={e => {
                  const value = e.target.value as PlantUMLRenderer
                  if (!window.confirm(
                    `Switching to "${value}" will send your diagram code to a third-party server for rendering. Do not use this for sensitive diagrams. Continue?`
                  )) return
                  updateDiagramRenderer({ plantuml: value })
                }}
              >
                <option value="plantuml.com">plantuml.com (official server)</option>
                <option value="kroki">Kroki</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>GraphViz / DOT</span>
              <select className={styles.select} value="kroki" disabled>
                <option value="kroki">Kroki</option>
              </select>
            </label>
          </section>

          {/* ── Appearance ──────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Appearance</h2>

            <label className={styles.field}>
              <span className={styles.label}>File icon theme</span>
              <select
                className={styles.select}
                value={iconTheme}
                onChange={e => setIconTheme(e.target.value as IconTheme)}
              >
                <option value="material">Material</option>
                <option value="seti">Seti</option>
                <option value="minimal">Minimal</option>
              </select>
            </label>
          </section>

          {/* ── Editor ────────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Editor</h2>

            <label className={styles.field}>
              <span className={styles.label}>Font size</span>
              <div className={styles.row}>
                <input
                  type="number"
                  className={`${styles.input} ${styles.narrow}`}
                  value={editor.fontSize}
                  min={10}
                  max={28}
                  onChange={e => updateEditorSettings({ fontSize: Number(e.target.value) })}
                />
                <span className={styles.unit}>px</span>
              </div>
            </label>

            <label className={`${styles.field} ${styles.checkField}`}>
              <input
                type="checkbox"
                checked={editor.wordWrap}
                onChange={e => updateEditorSettings({ wordWrap: e.target.checked })}
              />
              <span className={styles.label}>Word wrap</span>
            </label>

            <label className={`${styles.field} ${styles.checkField}`}>
              <input
                type="checkbox"
                checked={editor.minimap}
                onChange={e => updateEditorSettings({ minimap: e.target.checked })}
              />
              <span className={styles.label}>Show minimap</span>
            </label>

            <label className={`${styles.field} ${styles.checkField}`}>
              <input
                type="checkbox"
                checked={editor.lineNumbers}
                onChange={e => updateEditorSettings({ lineNumbers: e.target.checked })}
              />
              <span className={styles.label}>Line numbers</span>
            </label>
          </section>
        </div>
      </div>
    </dialog>
  )
}
