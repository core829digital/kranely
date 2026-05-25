import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Security headers applied in the dev server and as a reference for production hosting.
// For Vercel: see vercel.json  |  For Netlify: see public/_headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    // CSP: permissive enough for Clerk + Convex + Framer Motion inline styles,
  // while blocking the most dangerous attack vectors (object-src none, base-uri self).
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.kranely.com https://challenges.cloudflare.com https://browser.sentry-cdn.com https://js.sentry-cdn.com https://us-assets.i.posthog.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src * data: blob:",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.accounts.dev https://api.clerk.com https://*.clerk.com https://clerk.kranely.com https://api.resend.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.posthog.com https://us.posthog.com https://clerk-telemetry.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://*.clerk.accounts.dev https://accounts.clerk.dev https://challenges.cloudflare.com https://maps.google.com https://www.google.com",
    "worker-src blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    fs: {
      // Allow serving files from the workspace root (kranely.app)
      allow: ['..', '../..', '../../..'],
    },
    headers: SECURITY_HEADERS,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "convex": path.resolve(__dirname, "./node_modules/convex"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Clerk auth
          'vendor-clerk': ['@clerk/clerk-react'],
          // Convex realtime DB
          'vendor-convex': ['convex', 'convex/react', 'convex/react-clerk'],
          // UI components (Radix)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-scroll-area',
          ],
          // Animation
          'vendor-motion': ['framer-motion'],
          // Charts
          'vendor-charts': ['recharts'],
          // Analytics & monitoring
          'vendor-analytics': ['@sentry/react', 'posthog-js', '@posthog/react'],
        },
      },
    },
  },
});