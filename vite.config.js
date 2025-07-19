import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 3000
  },
  base: './'
}) 