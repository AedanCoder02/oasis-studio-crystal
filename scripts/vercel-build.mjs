import { cp, mkdir, writeFile, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import * as esbuild from 'esbuild'

const out = '.vercel/output'

if (existsSync(out)) await rm(out, { recursive: true })
await mkdir(`${out}/static`, { recursive: true })

const fnDir = `${out}/functions/_server.func`
await mkdir(`${fnDir}/assets`, { recursive: true })

// TanStack Start uses a manifest to dispatch server function calls via dynamic
// imports like `import('./assets/leads.functions-xxx.js')`. Bundling everything
// into one file breaks those dynamic imports (the referenced files no longer exist).
//
// Instead: re-bundle each asset chunk individually — this inlines external npm
// packages (h3-v2, @neondatabase/serverless, zod, etc.) into each chunk while
// keeping relative cross-chunk imports as-is so the manifest still resolves them.

const markLocalImportsExternal = {
  name: 'mark-local-external',
  setup(build) {
    // Leave relative imports (./xxx, ../xxx) as external — they resolve at runtime
    // against sibling files. Only npm packages get bundled.
    build.onResolve({ filter: /^\.\.?[/\\]/ }, args => {
      if (args.kind === 'entry-point') return  // never mark entry points external
      return { path: args.path, external: true }
    })
  },
}

const assetFiles = (await readdir('dist/server/assets')).filter(f => f.endsWith('.js'))
await Promise.all(assetFiles.map(file =>
  esbuild.build({
    entryPoints: [`dist/server/assets/${file}`],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    outfile: `${fnDir}/assets/${file}`,
    external: ['node:*'],           // Node built-ins — always available in runtime
    plugins: [markLocalImportsExternal],
    allowOverwrite: true,
  })
))

// Copy server entry and manifest as-is (they only reference local files)
await cp('dist/server/server.js', `${fnDir}/server.js`)
const serverFiles = await readdir('dist/server')
for (const f of serverFiles) {
  if (f !== 'server.js' && f !== 'assets' && f.endsWith('.js')) {
    await cp(`dist/server/${f}`, `${fnDir}/${f}`)
  }
}

// Thin Vercel handler wrapper: adapts TanStack Start's Cloudflare-style
// `export default { fetch }` export to Vercel's Node.js runtime format
await writeFile(`${fnDir}/index.js`, [
  `import server from './server.js'`,
  `export default async function handler(request) {`,
  `  return server.fetch(request, {}, {})`,
  `}`,
].join('\n'))

await writeFile(
  `${fnDir}/.vc-config.json`,
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.js', launchAt: 'request' })
)

// Static SPA — shell is _shell.html in TanStack Start SPA mode
await cp('dist/client', `${out}/static`, { recursive: true })

await writeFile(
  `${out}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      { src: '^/assets/(.*)$', headers: { 'cache-control': 's-maxage=31536000, immutable' }, continue: true },
      { handle: 'filesystem' },
      { src: '/_server(.*)', dest: '/_server' },
      { src: '/(.*)', dest: '/_shell.html' },
    ],
  })
)

console.log('Vercel Build Output API created at .vercel/output')
