# Contributing to Marked

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/leafai/marked.git
cd marked
npm install
npm run dev
```

## Branch Conventions

| Branch | Purpose |
|--------|---------|
| `main` | Stable, deployed to GitHub Pages |
| `h5` | Active development branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

## Pull Request Process

1. Fork the repository and create a branch from `h5`.
2. Run `npm run lint` and `npm run type-check` — both must pass.
3. Test your changes locally (`npm run dev` for dev, `npm run preview` for production build).
4. Open a PR against the `h5` branch with a clear description.

## Code Style

- TypeScript strict mode throughout — no `any`
- Immutable patterns — never mutate objects/arrays; return new ones
- CSS Modules for component styles
- Small, focused files (target < 400 lines; hard limit 800)
- No comments explaining *what* — only *why* for non-obvious constraints

## Adding a Diagram Renderer

1. Add a new option to `DiagramRendererConfig` in `src/types/index.ts`.
2. Implement the render function in `src/services/markdown/diagrams.ts`.
3. Wire it up in the `renderDiagram` switch statement.
4. Add the option to `src/store/settingsStore.ts` defaults.
5. Expose it in the Settings panel (`src/components/SettingsPanel/`).

## Reporting Issues

Use the [issue tracker](https://github.com/leafai/marked/issues). Please include:
- Browser and OS
- Steps to reproduce
- Expected vs actual behaviour
- Console errors if any

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
