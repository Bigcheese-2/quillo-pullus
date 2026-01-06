import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add empty turbopack config to silence the warning
  // next-pwa uses webpack, so we need to allow webpack config
  turbopack: {},
};

let config: NextConfig = nextConfig;

// Enable PWA only in production
// Disable in development to avoid Turbopack/webpack conflicts
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: false,
    fallbacks: {
      document: "/offline", // Offline fallback page
    },
    runtimeCaching: [
      // Cache Supabase API calls with NetworkFirst strategy
      // This allows offline access to recently fetched data
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache static assets (CSS, JS, images) with CacheFirst
      // These rarely change and can be cached aggressively
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // Cache app pages with NetworkFirst strategy
      // Try network first, fall back to cache if offline
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.origin === self.location.origin,
        handler: "NetworkFirst",
        options: {
          cacheName: "app-pages",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
    // Background sync support (for Phase 3.4)
    // This will be used by sync-manager.ts
    buildExcludes: [/middleware-manifest\.json$/],
  });

  config = withPWA(config);
}

export default config;
