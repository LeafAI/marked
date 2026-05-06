import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Auto-detect base path from GitHub Actions environment variable.
// In production (GitHub Pages): GITHUB_REPOSITORY = "leafai/marked" → base = "/marked/"
// Locally: no env var → base = "/"
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['@monaco-editor/react'],
          mermaid: ['mermaid'],
          katex: ['katex'],
          'highlight.js': ['highlight.js'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['highlight.js', 'katex', 'mermaid'],
  },
})
