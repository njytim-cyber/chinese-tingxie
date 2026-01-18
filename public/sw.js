const CACHE_NAME = 'tingxie-v2.1.0';
const STATIC_ASSETS = [
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing new version:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately to replace old service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating new version:', CACHE_NAME);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] Activated successfully');
            // Notify all clients about the update
            return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: CACHE_NAME
                    });
                });
            });
        })
    );
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - network-first for critical files, cache-first for static assets
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests (Google Fonts, etc.)
    if (!event.request.url.startsWith(self.location.origin)) return;

    const url = new URL(event.request.url);

    // Network-first for HTML, JSON, JS, and CSS to ensure fresh content
    const isNetworkFirst =
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.json') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname === '/';

    if (isNetworkFirst) {
        // Network-first strategy - try network, fallback to cache
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Update cache with fresh version
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache-first strategy for images and other static assets
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                });
            })
        );
    }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
