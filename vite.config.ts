import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React 19 호환성 설정
      jsxImportSource: 'react',
    }),
  ],
  server: {
    port: 5174,
    host: true,
    hmr: {
      port: 5174
    }
  },
  optimizeDeps: {
    // React 19와 Ant Design 최적화
    include: [
      'react',
      'react-dom',
      'antd',
      '@ant-design/icons',
    ],
  },
  build: {
    // React 19 빌드 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },
  },
})
