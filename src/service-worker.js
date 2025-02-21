const CACHE_NAME = 'outlands-atlas-cache-v1';

// Log when the service worker is installed
self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    // Skip waiting to activate immediately
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => {
                console.log('Cache opened');
            }),
            self.skipWaiting()
        ])
    );
});

// Claim all clients when activated
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Take control of all pages immediately
            clients.claim(),
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Check if the request is for an image
    if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
        console.log('Fetching image:', event.request.url);
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        console.log('Updating cache:', event.request.url);
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(error => {
                        console.log('Fetch failed, falling back to cache');
                        // Return cached response if network fails
                        return response;
                    });

                    // Return cached response immediately if available
                    return response || fetchPromise;
                });
            })
        );
    }
});

// Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
