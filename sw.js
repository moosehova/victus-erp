const CACHE_NAME = 'victus-erp-v1';

// Add all static assets needed to render the UI offline
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css?v=2',
    '/script.js?v=2',
    '/manifest.json',
    '/logo.png',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install Event - Cache the static assets
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate Event - Clean up old caches if CACHE_NAME changes
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate for APIs, Cache-First for static assets
self.addEventListener('fetch', event => {
    const req = event.request;

    // Handle API Requests (Network First, fallback to cache)
    if (req.url.includes('/api/')) {
        event.respondWith(
            fetch(req)
                .then(res => {
                    // Cache the successful API response for offline viewing
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
                    return res;
                })
                .catch(() => caches.match(req)) // If network fails, serve last known API data
        );
        return;
    }

    // Handle Static Assets (Cache First, fallback to network)
    event.respondWith(
        caches.match(req).then(cachedRes => {
            return cachedRes || fetch(req).then(fetchRes => {
                // Cache any dynamically requested static assets
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(req, fetchRes.clone());
                    return fetchRes;
                });
            });
        })
    );
});