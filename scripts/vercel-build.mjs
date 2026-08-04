import { cp, mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import * as esbuild from 'esbuild'

const out = '.vercel/output'

if (existsSync(out)) await rm(out, { recursive: true })
await mkdir(`${out}/static`, { recursive: true })

// ── API function ─────────────────────────────────────────────────────────────
// Bundle to CommonJS so Vercel's Node.js runtime loads it without ESM issues.
const fnDir = `${out}/functions/api/leads.func`
await mkdir(fnDir, { recursive: true })

await esbuild.build({
  entryPoints: ['api/leads.mjs'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',               // CommonJS — no package.json type:module needed
  outfile: `${fnDir}/index.js`,
  external: ['node:*'],
  allowOverwrite: true,
})

await writeFile(`${fnDir}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
}))

// ── Static SPA ───────────────────────────────────────────────────────────────
await cp('dist/client', `${out}/static`, { recursive: true })


await writeFile(`${out}/config.json`, JSON.stringify({
  version: 3,
  routes: [
    { src: '^/assets/(.*)$', headers: { 'cache-control': 's-maxage=31536000, immutable' }, continue: true },
    { src: '^/api/leads$', dest: '/api/leads', methods: ['GET', 'POST', 'OPTIONS'] },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/_shell.html' },
  ],
}))

console.log('Vercel Build Output API created at .vercel/output')
