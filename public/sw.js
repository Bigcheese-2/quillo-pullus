const CACHE_NAMES = {
  supabase: 'supabase-api-cache',
  static: 'static-assets',
  pages: 'app-pages',
};

self.addEventListener('install', (event) => {
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return !Object.values(CACHE_NAMES).includes(cacheName);
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      caches.open(CACHE_NAMES.supabase).then((cache) => {
        if (request.method === 'GET') {
          // For GET requests, try network first, then cache if offline
          // Use 'no-store' to prevent browser from serving stale cache
          return fetch(request, { cache: 'no-store' })
            .then((response) => {
              if (response.status === 200 || response.status === 0) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch((error) => {
              // Only serve from cache if we're actually offline
              // This prevents serving stale cache when online
              if (!navigator.onLine) {
                return cache.match(request).then((cachedResponse) => {
                  if (cachedResponse) {
                    return cachedResponse;
                  }
                  return new Response(
                    JSON.stringify({ error: 'Offline' }),
                    {
                      status: 503,
                      headers: { 'Content-Type': 'application/json' },
                    }
                  );
                });
              }
              // If we think we're online but fetch failed, return error
              // Don't serve stale cache when online
              return new Response(
                JSON.stringify({ error: 'Network error', message: 'Request failed' }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            });
        } else {
          // For non-GET requests (POST, PATCH, DELETE), don't use cache when offline
          // Return 503 immediately if offline to prevent stale operations
          if (!navigator.onLine) {
            return new Response(
              JSON.stringify({ error: 'Offline', message: 'Network request failed. Please check your connection.' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 5000);
          });
          
          return Promise.race([
            fetch(request),
            timeoutPromise
          ])
            .then((response) => {
              if (response instanceof Response) {
                return response;
              }
              throw new Error('Invalid response');
            })
            .catch((error) => {
              return new Response(
                JSON.stringify({ error: 'Offline', message: 'Network request failed' }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            });
        }
      })
    );
    return;
  }

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
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
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

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

