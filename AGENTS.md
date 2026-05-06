# AGENTS.md — AI Agent Guide for Marked

This file helps AI coding agents (Claude Code, Copilot, Cursor, etc.) understand the project structure and conventions quickly.

## Project Overview

**Marked** is a pure static SPA (React + TypeScript + Vite) deployed on GitHub Pages. It provides a VSCode-like markdown editor that connects to Google Drive.

- **No backend** — everything runs in the browser. The Go server in `server/` is a development convenience that embeds and serves `dist/`.
- **Active branch**: `h5` — all development happens here; `main` is production.
- **Deployed at**: https://leafai.github.io/marked/

## Repository Layout

```
src/
  components/        # React UI components (CSS Modules)
    ActivityBar/     # Left icon strip (48px wide)
    SidePanel/       # Collapsible left panel
      FileExplorer/  # Google Drive folder tree
      OutlinePanel/  # Markdown heading navigation
    EditorArea/      # Monaco editor + tab bar
      TabBar/        # Open file tabs
      MonacoEditor/  # Monaco wrapper
    PreviewPanel/    # Rendered markdown output
    StatusBar/       # Bottom bar (22px)
    ResizeHandle/    # Drag-to-resize panels
    WelcomeScreen/   # Shown when no file is open
  services/
    drive/           # Google Drive API (auth.ts, files.ts)
    markdown/        # Rendering pipeline (renderer.ts, diagrams.ts, outline.ts)
  store/             # Zustand stores (editor, drive, ui, settings)
  types/             # Shared TypeScript types (index.ts)

.github/
  workflows/
    deploy.yml       # Build → gh-pages on push to main
    ci.yml           # Lint + type-check on PRs
```

## Key Conventions

### Immutability
Never mutate state directly. Return new objects:
```typescript
// WRONG
state.files.push(newFile)

// CORRECT
return { ...state, files: [...state.files, newFile] }
```

### State Management
All global state lives in Zustand stores under `src/store/`. Component-local state uses `useState`/`useReducer`. Do not reach into other stores from a store action.

### CSS
Each component has a paired `.module.css` file. Global design tokens (colors, spacing) are CSS custom properties in `src/index.css`. Never hardcode color hex values inside component CSS — use `var(--color-*)` tokens.

### Diagram Rendering
`src/services/markdown/diagrams.ts` is the single source of truth for diagram rendering logic. The `renderDiagram(code, language, config)` function dispatches to the correct backend. Adding a new renderer = add option to `DiagramRendererConfig` in `src/types/index.ts`, implement here, wire up in `settingsStore.ts`.

### Google Drive
`src/services/drive/auth.ts` handles OAuth2 PKCE. The access token is stored in `sessionStorage` (auto-clears on tab close). `src/services/drive/files.ts` wraps Drive API v3 calls.

### Monaco Editor
`src/components/EditorArea/MonacoEditor/index.tsx` configures Monaco with the `marked-dark` custom theme and markdown language defaults. Monaco is loaded from CDN via `loader.config()` — do not attempt to bundle it locally without careful Vite worker configuration.

## Common Tasks

### Add a diagram renderer option
1. Edit `src/types/index.ts` — extend the union type
2. Edit `src/services/markdown/diagrams.ts` — add render function + case
3. Edit `src/store/settingsStore.ts` — update default if needed
4. Edit `src/components/SettingsPanel/` — add UI option

### Add a file operation
Edit `src/services/drive/files.ts`. All Drive API calls must include the bearer token from `getAccessToken()` in `auth.ts`. Handle 401 by calling `clearAuth()` and triggering re-authentication.

### Update the preview renderer
Edit `src/services/markdown/renderer.ts`. The renderer uses `marked` with a custom `Renderer` instance. Code blocks are intercepted — check `src/services/markdown/diagrams.ts` to see which language tags are treated as diagrams.

## Build & Run

```bash
npm run dev          # Vite dev server (hot reload)
npm run build        # Production build → dist/
npm run preview      # Serve dist/ locally (identical to GitHub Pages)
npm run lint         # ESLint
npm run type-check   # TypeScript strict check
```

## What NOT to do

- Don't add a backend server — this is a pure static app
- Don't hardcode any Google Client ID — it's user-configured
- Don't import `monaco-editor` directly — use `@monaco-editor/react`
- Don't use `any` in TypeScript — use proper types or `unknown`
- Don't add `console.log` — remove before committing
