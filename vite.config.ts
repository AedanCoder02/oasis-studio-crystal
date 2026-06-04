import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    ...tanstackStart({
      server: { entry: 'server' },
      spa: { enabled: true },
    }),
    react(),
  ],
})
