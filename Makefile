.PHONY: dev build preview clean install lint type-check

# Start Vite dev server (hot reload)
dev:
	npm run dev

# Build for production → dist/
build:
	npm run build

# Serve the production build locally (same as GitHub Pages output)
preview:
	npm run preview

# Install frontend dependencies
install:
	npm install

# Lint TypeScript/React source
lint:
	npm run lint

# Type-check without emitting
type-check:
	npm run type-check

# Remove build artifacts
clean:
	rm -rf dist node_modules
