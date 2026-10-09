import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
export default defineConfig({
  envPrefix: ['VITE_', 'DASHY_'],
  plugins: [vue(), svgLoader(), VitePWA({
    registerType: 'prompt', injectRegister: false, useCredentials: true,
    manifest: { name: 'Home Lab', short_name: 'Home Lab', start_url: '/', display: 'standalone', theme_color: '#2e3440', background_color: '#2e3440', icons: [{ src: '/web-icons/dashy-logo.png', sizes: '512x512', type: 'image/png' }] },
    workbox: {
      cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: false,
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      globIgnores: ['**/*.yml', '**/*.yaml'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/(?:api|status-check|ping-check|system-info|cors-proxy|get-user|config-manager|schema)\b/, /\.ya?ml$/i],
      runtimeCaching: [{ urlPattern: ({ url }) => /\.ya?ml$/i.test(url.pathname) || /^\/(?:api|status-check|ping-check|system-info|cors-proxy|get-user|config-manager|schema)\b/.test(url.pathname), handler: 'NetworkOnly' }],
    },
  })],

  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },

  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import', 'legacy-js-api'],
      },
    },
  },

  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 7000,
  },

  server: {
    port: 8080,
  },
});
