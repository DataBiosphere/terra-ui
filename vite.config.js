import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import svgr from 'vite-plugin-svgr'


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    build: {
      outDir: 'build'
    },
    define: {
      // Expose env as process.env instead of import.meta for jest
      ...Object.entries(env).reduce(
        (prev, [key, val]) => {
          return {
            ...prev,
            [`process.env.${key}`]: `"${val}"`
          }
        },
        {}
      )
    },
    plugins: [react(), svgr()],
    resolve: {
      alias: {
        src: path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 3000
    }
  }
})


