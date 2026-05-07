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
        manualChunks(id: string) {
          if (id.includes('monaco-editor')) return 'monaco-editor'
          if (id.includes('mermaid')) return 'mermaid'
          if (id.includes('katex')) return 'katex'
          if (id.includes('highlight.js')) return 'highlight.js'
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
