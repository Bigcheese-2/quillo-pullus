import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

let config: NextConfig = nextConfig;

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: false,
    fallbacks: {
      document: "/offline", 
    },
    runtimeCaching: [
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
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, 
          },
        },
      },
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.origin === self.location.origin,
        handler: "NetworkFirst",
        options: {
          cacheName: "app-pages",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, 
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
    
    buildExcludes: [/middleware-manifest\.json$/],
  });

  config = withPWA(config);
}

export default config;
