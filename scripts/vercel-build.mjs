import { cp, mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const out = '.vercel/output'

if (existsSync(out)) await rm(out, { recursive: true })

await mkdir(`${out}/static`, { recursive: true })

// Copy prerendered client output (includes index.html from spa mode)
await cp('dist/client', `${out}/static`, { recursive: true })

// SPA routing: cache assets, serve index.html for all other paths
await writeFile(
  `${out}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      {
        src: '^/assets/(.*)$',
        headers: { 'cache-control': 's-maxage=31536000, immutable' },
        continue: true,
      },
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/index.html' },
    ],
  })
)

console.log('Vercel Build Output API created at .vercel/output')
