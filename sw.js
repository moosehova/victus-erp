self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // This simple pass-through allows the install prompt to trigger
    e.respondWith(fetch(e.request).catch(() => console.log("Offline mode not fully configured yet.")));
});