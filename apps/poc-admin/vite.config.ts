// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    base: '/',
    resolve: {
        resolve: { dedupe: ['react', 'react-dom'] },
        alias: {
            '@/template': path.resolve(__dirname, 'src/domains/template'),
            '@/common': path.resolve(__dirname, 'src/domains/common'),
            '@/shared': path.resolve(__dirname, 'src/domains/shared'),
            '@/domains': path.resolve(__dirname, 'src/domains'),
            '@/types': path.resolve(__dirname, 'src/domains/shared/types'),
            '@/constants': path.resolve(__dirname, 'src/domains/shared/constants'),
            '@/locales': path.resolve(__dirname, 'src/domains/shared/locales'),
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        cors:true,
        hmr: {
            protocol: 'wss',
            host: 'app.teszt.uk', // a tunnel domain
            clientPort: 443
        },
        allowedHosts: ['app.teszt.uk', 'localhost'],
        watch: {
            usePolling: true,
            interval: 1000,
        },
        proxy: {
            '/api':   { target: process.env.VITE_BACKEND_URL || 'http://api:3001', changeOrigin: true, secure: false },
            '/auth':  { target: process.env.VITE_BACKEND_URL || 'http://api:3001', changeOrigin: true, secure: false },
            '/health':{ target: process.env.VITE_BACKEND_URL || 'http://api:3001', changeOrigin: true, secure: false },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react/jsx-runtime', '@shopify/polaris'],
    },
})
