import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { fileURLToPath, URL } from 'node:url';

/**
 * Constitution VIII (A7): the CSP carries no `'unsafe-inline'` in `script-src`.
 * These headers apply to `vite dev` and `vite preview` only — production headers are set at
 * the host, which is not yet chosen. See `public/_headers`.
 */
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()',
};

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { headers: securityHeaders },
  preview: { headers: securityHeaders },
  build: {
    // Constitution VIII: production source maps would publish the source of a bundle that
    // is meant to reveal nothing beyond the publishable key.
    sourcemap: false,
  },
});
