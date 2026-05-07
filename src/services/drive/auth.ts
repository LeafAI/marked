// Google Identity Services (GIS) token client — the correct approach for SPAs.
//
// Why not PKCE redirect flow: Google's token endpoint requires client_secret for
// "Web application" OAuth clients even when using PKCE. GIS token client is
// Google's own solution for browser-only apps — it uses a popup and requires no
// client_secret and no redirect URI.
//
// NOTE: The popup flow may produce a "Cross-Origin-Opener-Policy policy would
// block the window.closed call" warning in the browser console. This is a known
// browser-level warning caused by Google's popup having a COOP header. It does
// NOT affect functionality — the OAuth flow completes successfully. There is no
// way to suppress this warning from our code since the window.closed check
// happens inside the GIS library.
//
// Docs: https://developers.google.com/identity/oauth2/web/guides/use-token-model

const SCOPE = 'https://www.googleapis.com/auth/drive.file email profile'
const TOKEN_KEY = 'marked:access_token'
const TOKEN_EXPIRY_KEY = 'marked:token_expiry'

// ─── GIS type declarations ────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken(overrideConfig?: { prompt?: string }): void
}

interface GIS {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
        error_callback?: (error: { type: string; message?: string }) => void
      }): TokenClient
    }
  }
}

// ─── Picker type declarations ────────────────────────────────────────────────

interface PickerDocument {
  id: string
  name: string
  mimeType: string
  parentId?: string
}

interface PickerResponse {
  action: string
  docs: PickerDocument[]
}

interface PickerBuilder {
  addView(view: unknown): PickerBuilder
  setOAuthToken(token: string): PickerBuilder
  setDeveloperKey(key: string): PickerBuilder
  setCallback(cb: (data: PickerResponse) => void): PickerBuilder
  build(): { setVisible(visible: boolean): void }
}

declare global {
  interface Window {
    google?: GIS
    gapi?: {
      load(libraries: string, cb: () => void): void
      picker?: {
        Action: { PICKED: string }
        ViewId: { DOCS: string; FOLDERS: string }
        DocsView: new () => { setSelectFolderMode(b: boolean): unknown; setIncludeFolders(b: boolean): unknown }
        PickerBuilder: new () => PickerBuilder
      }
    }
  }
}

// ─── GIS script loader ────────────────────────────────────────────────────────

function loadGIS(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()

  return new Promise((resolve, reject) => {
    // Reuse an in-progress load if the script tag is already in the DOM
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > parseInt(expiry, 10)) {
    clearAuth()
    return null
  }
  return token
}

export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
}

export async function startAuth(clientId: string): Promise<void> {
  await loadGIS()

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response: TokenResponse) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error))
          return
        }
        sessionStorage.setItem(TOKEN_KEY, response.access_token)
        sessionStorage.setItem(
          TOKEN_EXPIRY_KEY,
          String(Date.now() + response.expires_in * 1000)
        )
        resolve()
      },
      error_callback: err => {
        // User closed the popup or access was denied
        reject(new Error(err.message ?? err.type))
      },
    })

    client.requestAccessToken({ prompt: '' })
  })
}

export async function getUserEmail(token: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user info')
  const data = (await res.json()) as { email: string }
  return data.email
}

// ─── Google Picker API ───────────────────────────────────────────────────────

function loadPickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.gapi?.picker) {
      resolve()
      return
    }

    const script = document.querySelector<HTMLScriptElement>(
      'script[src="https://apis.google.com/js/api.js"]'
    )
    if (script) {
      script.addEventListener('load', () => {
        window.gapi!.load('picker', () => resolve())
      })
      script.addEventListener('error', () => reject(new Error('Failed to load Google API')))
      return
    }

    const s = document.createElement('script')
    s.src = 'https://apis.google.com/js/api.js'
    s.async = true
    s.onload = () => window.gapi!.load('picker', () => resolve())
    s.onerror = () => reject(new Error('Failed to load Google API'))
    document.head.appendChild(s)
  })
}

export interface PickedFile {
  id: string
  name: string
  mimeType: string
}

export async function openPicker(
  clientId: string,
  token: string,
  selectFolder: boolean,
): Promise<PickedFile[]> {
  await loadPickerApi()
  const picker = window.gapi!.picker!

  return new Promise(resolve => {
    const view = selectFolder
      ? new picker.DocsView().setSelectFolderMode(true)
      : new picker.DocsView()

    const builder = new picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(clientId)
      .setCallback((data: PickerResponse) => {
        if (data.action === picker.Action.PICKED) {
          resolve(data.docs.map(d => ({ id: d.id, name: d.name, mimeType: d.mimeType })))
        } else {
          resolve([])
        }
      })
      .build()

    builder.setVisible(true)
  })
}
