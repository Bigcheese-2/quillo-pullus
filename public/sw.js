/**
 * Service Worker for Quillo 
 * Handles offline caching and background sync
 */

const CACHE_VERSION = 'quillo-v1';
const CACHE_NAMES = {
  supabase: 'supabase-api-cache',
  static: 'static-assets',
  pages: 'app-pages',
};

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches that don't match current version
            return !Object.values(CACHE_NAMES).includes(cacheName);
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim(); // Take control of all pages immediately
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      caches.open(CACHE_NAMES.supabase).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200 || response.status === 0) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Network failed, try cache
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline fallback if available
              return new Response(
                JSON.stringify({ error: 'Offline' }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            });
          });
      })
    );
    return;
  }

  // CacheFirst strategy for static assets
  if (
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/.test(
      url.pathname
    )
  ) {
    event.respondWith(
      caches.open(CACHE_NAMES.static).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // NetworkFirst strategy for app pages
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAMES.pages).then((cache) => {
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Network failed, try cache
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                return caches.match('/offline');
              }
              return new Response('Offline', { status: 503 });
            });
          });
      })
    );
    return;
  }
});

// Background Sync event - handle sync operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(
      // Send message to client to trigger sync
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_NOTES',
          });
        });
      })
    );
  }
});

// Message event - handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

