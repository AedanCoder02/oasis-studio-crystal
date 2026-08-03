import { cp, mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

// Use esbuild bundled inside Vite (always present)
const require = createRequire(import.meta.url)
const esbuild = require('../node_modules/vite/node_modules/esbuild')

const out = '.vercel/output'

if (existsSync(out)) await rm(out, { recursive: true })
await mkdir(`${out}/static`, { recursive: true })

// Bundle TanStack Start server as a Vercel Node.js serverless function.
// This handles /_server/* requests (createServerFn calls from the client).
const fnDir = `${out}/functions/_server.func`
await mkdir(fnDir, { recursive: true })

await esbuild.build({
  stdin: {
    // Wrap the server's fetch handler in the format Vercel Node.js runtime expects
    contents: `
import server from './dist/server/server.js'
export default async function handler(request) {
  return server.fetch(request, {}, {})
}
`,
    resolveDir: process.cwd(),
    loader: 'js',
  },
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: `${fnDir}/index.js`,
  external: ['node:*'],   // Node.js built-ins — always available in the runtime
  allowOverwrite: true,
})

await writeFile(
  `${fnDir}/.vc-config.json`,
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.js', launchAt: 'request' })
)

// Copy prerendered client assets (shell is _shell.html in TanStack Start SPA mode)
await cp('dist/client', `${out}/static`, { recursive: true })

await writeFile(
  `${out}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      // Long-lived cache for fingerprinted assets
      { src: '^/assets/(.*)$', headers: { 'cache-control': 's-maxage=31536000, immutable' }, continue: true },
      // Serve actual static files (images, favicon, etc.)
      { handle: 'filesystem' },
      // Server function calls → Node.js serverless function
      { src: '/_server(.*)', dest: '/_server' },
      // Everything else → SPA shell
      { src: '/(.*)', dest: '/_shell.html' },
    ],
  })
)

console.log('Vercel Build Output API created at .vercel/output')
