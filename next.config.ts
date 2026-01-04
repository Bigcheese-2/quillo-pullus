import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

let config: NextConfig = nextConfig;

if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60,
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.origin === self.location.origin,
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  });

  config = withPWA(config);
}

export default config;
