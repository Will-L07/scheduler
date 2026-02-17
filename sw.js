// Service Worker for William's Scheduler PWA
const CACHE_NAME = 'ws-cache-v5';

// Files to cache for offline use
const PRECACHE_URLS = [
    './',
    './index.html',
    './css/themes.css',
    './css/styles.css',
    './js/data.js',
    './js/seed-data.js',
    './js/firebase-sync.js',
    './js/notifications.js',
    './js/pdf-parser.js',
    './js/app.js',
    './manifest.json'
];

// Install: cache core app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) return;

    // HTML pages: network first, fall back to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // CSS/JS assets: network first, fall back to cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
