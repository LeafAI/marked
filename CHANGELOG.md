# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project scaffold (React + TypeScript + Vite)
- VSCode-like layout: activity bar, resizable side panel, editor area, preview panel, status bar
- Monaco Editor integration with markdown language support
- Live markdown preview with `marked` renderer
- KaTeX math rendering (inline and block)
- Mermaid diagram rendering (local via mermaid.js, mermaid.ink, or Kroki)
- GraphViz/DOT diagram rendering via Kroki
- PlantUML and C4 PlantUML rendering via plantuml.com or Kroki
- Ditaa diagram rendering via Kroki
- Configurable diagram renderers stored in localStorage
- Document outline panel with click-to-scroll
- Google Drive OAuth2 PKCE authentication (client-side, no backend)
- Google Drive file explorer with folder navigation
- Open and save files from/to Google Drive
- Auto-save with dirty indicator
- GitHub Actions CI and GitHub Pages deployment
- Go embed server for local production-like testing
