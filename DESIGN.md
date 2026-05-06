# DESIGN.md — Architecture & Design Decisions

## Overview

Marked is a pure static Single Page Application (SPA) that provides a VSCode-like markdown editing experience connected to Google Drive. It is hosted on GitHub Pages with no server-side processing. Local development uses Vite's dev server; production builds are previewed with `vite preview`.

## Architecture

```
Browser
├── React SPA (Vite build → static files on GitHub Pages)
│   ├── Monaco Editor (loaded from CDN)
│   ├── Zustand state stores
│   ├── Google Drive API (client-side OAuth2 PKCE)
│   └── Markdown pipeline
│       ├── marked (renderer)
│       ├── highlight.js (code blocks)
│       ├── KaTeX (math)
│       └── Diagram renderers (see below)
│
└── External services (called directly from browser)
    ├── accounts.google.com — OAuth2 PKCE token exchange
    ├── www.googleapis.com — Drive API v3
    ├── mermaid.ink — optional Mermaid server rendering
    ├── kroki.io — DOT/Graphviz/Ditaa/PlantUML/Mermaid
    └── www.plantuml.com — PlantUML native server
```

## Layout System

The app uses a CSS Grid layout with dynamic `grid-template-columns`:

```
[ 48px activity ] [ var(--sidebar-width) side panel ] [ 1fr editor ] [ var(--preview-width) preview ]
[ 22px status bar (spans all columns) ]
```

Panel widths are CSS custom properties on the root element, updated imperatively via `ResizeHandle` drag events. Panels are hidden by setting their column width to `0` and `overflow: hidden`.

## State Management

Four Zustand stores, each with a single responsibility:

| Store | Contents |
|-------|----------|
| `editorStore` | Open tabs, active tab, file content, dirty flags |
| `driveStore` | Auth token, folder tree, current folder ID |
| `uiStore` | Panel visibility, sidebar/preview widths, active side panel view |
| `settingsStore` | Google Client ID, diagram renderer config, editor preferences |

Stores do not import from each other. Cross-store coordination happens in component event handlers.

## Google Drive Integration

**Authentication**: OAuth2 Authorization Code flow with PKCE (RFC 7636). No client secret required — the code verifier stays in the browser. The access token is stored in `sessionStorage` and cleared on tab close. Refresh tokens are not persisted (the user re-authenticates per session).

**File operations** (Drive API v3):
- `files.list` with `q` filter and `fields` projection for the folder tree
- `files.get?alt=media` to read file content
- `files.create` (multipart) for new files
- `files.update` (multipart) for saving existing files
- Folder path is reconstructed by walking `parents[]` up to the Drive root

## Markdown Rendering Pipeline

```
raw markdown text
  → marked tokenizer
  → custom Renderer
      → code blocks → renderDiagram() or highlight.js
      → math inline/block → KaTeX
      → standard tokens → HTML
  → HTML string injected into preview div
  → mermaid.run() post-process for local mermaid blocks
```

Code blocks with unrecognised language tags fall through to highlight.js for syntax colouring.

## Diagram Rendering Strategy

Each diagram type has a configurable renderer stored in `localStorage` via `settingsStore`:

| Type | Default | Options |
|------|---------|---------|
| `mermaid` | `mermaid.js` (local) | `mermaid.ink` (img src GET), Kroki (img src GET) |
| `dot` / `graphviz` | Kroki | — |
| `plantuml` / `c4plantuml` | plantuml.com | Kroki |
| `ditaa` | Kroki | — |

**Local mermaid.js**: diagram source is embedded in a `<div class="mermaid">` placeholder; after HTML injection `mermaid.run()` is called to render SVG in-place. This avoids async issues with the `marked` synchronous renderer.

**Remote renderers** (mermaid.ink, Kroki, plantuml.com): diagram source is encoded into the URL (base64 for Kroki/mermaid.ink, hex for plantuml.com). An `<img>` tag is emitted — the browser fetches the SVG as a cross-origin image. No CORS issues because `<img>` tags are not subject to CORS restrictions for image display.

**PlantUML hex encoding**: plantuml.com accepts `~h<hexstring>` in place of its native deflate+base64 encoding. This avoids implementing the custom compression algorithm in the browser.

## Monaco Editor Configuration

Monaco is loaded from CDN (`cdn.jsdelivr.net`) using `@monaco-editor/react`'s `loader.config()`. This avoids complex Vite worker configuration and keeps the bundle lean.

A custom `marked-dark` theme is defined to match VSCode Dark+ colours. The editor is configured for `markdown` language mode with word wrap enabled and minimap disabled by default.

## Build & Deploy

**Development**: `npm run dev` starts Vite's dev server with HMR.

**Production preview**: `npm run build && npm run preview` builds and serves the exact output locally — identical to what GitHub Pages delivers.

**Base path auto-detection**: `vite.config.ts` reads `process.env.GITHUB_REPOSITORY` (set by GitHub Actions) to derive the correct base path (`/marked/`). Locally the base is `/`.

**Deploy**: GitHub Actions runs `npm run build` and pushes `dist/` to the `gh-pages` branch automatically on every push to `main`.

## Security Considerations

- The Google OAuth2 Client ID is entered by the user and stored in `localStorage`. It is not a secret (it is sent in plaintext to Google's auth endpoint). The PKCE code verifier is the security mechanism.
- No secrets are hardcoded or stored in the repository.
- All external API calls (Drive, diagram renderers) are made directly from the browser — there is no proxy that could be a single point of compromise.
- Markdown preview HTML is injected via `innerHTML`. User-controlled content should be sanitised if untrusted documents are opened — currently the app trusts Drive content owned by the authenticated user.

## Future Considerations

- **DOMPurify**: Add HTML sanitisation in the preview pipeline for untrusted content sharing.
- **Offline support**: Service Worker + Cache API to cache Drive files for offline editing.
- **Monaco workers bundled**: Replace CDN Monaco with bundled workers for offline use.
- **Collaborative editing**: Google Drive real-time API or CRDTs.
- **Multi-file search**: Drive API `fullText` search integration.
