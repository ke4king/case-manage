import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api/v1': {
        // target: 'https://case-manage-api.941031.xyz', // 开发环境的worker地址
        target: 'http://localhost:8787', // 本地开发时的worker地址
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      }
    },
  },
})
