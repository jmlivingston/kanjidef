import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const basePath = repositoryName?.endsWith('.github.io')
  ? '/'
  : repositoryName
    ? `/${repositoryName}/`
    : '/'

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
})
