import { writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const serverPath = resolve('dist/server/server.js')
if (!existsSync(serverPath)) {
  console.error('dist/server/server.js not found — run vite build first')
  process.exit(1)
}

const { default: server } = await import(serverPath)

const base = process.env.VITE_BASE_PATH ?? '/'
const url = `http://localhost${base}`

console.log(`Prerendering ${url} ...`)
const response = await server.fetch(new Request(url))

if (!response.ok) {
  console.error(`Server returned ${response.status} for ${url}`)
  process.exit(1)
}

const html = await response.text()
const outPath = resolve('dist/client/index.html')
writeFileSync(outPath, html)
console.log(`Written ${html.length} bytes to dist/client/index.html`)

// GitHub Pages SPA fallback — serves this for unknown paths so
// client-side routes (/metrics, /approach, /faq) load correctly
const fallbackPath = resolve('dist/client/404.html')
writeFileSync(fallbackPath, html)
console.log(`Written 404.html fallback for SPA routing`)
