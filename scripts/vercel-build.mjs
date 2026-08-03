import { cp, mkdir, writeFile, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import * as esbuild from 'esbuild'

const out = '.vercel/output'

if (existsSync(out)) await rm(out, { recursive: true })
await mkdir(`${out}/static`, { recursive: true })

// ── Leads API function (/api/leads/*) ───────────────────────────────────────
// Plain Vercel Node.js function — no TanStack Start, just fetch + neon.
// This is the same pattern CAIDE-OS uses with Next.js API routes.
const apiDir = `${out}/functions/api/leads.func`
await mkdir(apiDir, { recursive: true })

await esbuild.build({
  entryPoints: ['api/leads-handler.mjs'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: `${apiDir}/index.js`,
  external: ['node:*'],
  allowOverwrite: true,
})
await writeFile(`${apiDir}/.vc-config.json`, JSON.stringify({ runtime: 'nodejs20.x', handler: 'index.js' }))

// ── Static SPA ───────────────────────────────────────────────────────────────
await cp('dist/client', `${out}/static`, { recursive: true })

await writeFile(
  `${out}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      { src: '^/assets/(.*)$', headers: { 'cache-control': 's-maxage=31536000, immutable' }, continue: true },
      { handle: 'filesystem' },
      { src: '/api/leads(.*)', dest: '/api/leads' },
      { src: '/(.*)', dest: '/_shell.html' },
    ],
  })
)

console.log('Vercel Build Output API created at .vercel/output')
