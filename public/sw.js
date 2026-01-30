// Service Worker for DSA Grinders PWA
// v3: Minimal caching - only leaderboard scores for 5 minutes
const CACHE_NAME = 'dsa-grinders-v3';
const LEADERBOARD_CACHE = 'dsa-grinders-leaderboard-v3';

// Cache duration: 5 minutes (300000 ms)
const LEADERBOARD_CACHE_DURATION = 5 * 60 * 1000;

// Only cache essential PWA assets (logo and manifest for offline icon)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/logo.png',
];

// Install event - cache only essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that doesn't match current version
          if (cacheName !== CACHE_NAME && cacheName !== LEADERBOARD_CACHE) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - minimal caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Only GET requests can be cached
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Skip caching Next.js build chunks
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request));
    return;
  }

  // ONLY cache leaderboard endpoint with 5-minute TTL
  if (url.pathname === '/api/leaderboard') {
    event.respondWith(
      caches.open(LEADERBOARD_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        // Check if cache exists and is fresh (< 5 minutes old)
        if (cachedResponse) {
          const cachedTime = cachedResponse.headers.get('sw-cache-time');
          if (cachedTime) {
            const age = Date.now() - parseInt(cachedTime, 10);
            if (age < LEADERBOARD_CACHE_DURATION) {
              console.log('SW: Serving leaderboard from cache (age: ' + Math.floor(age / 1000) + 's)');
              return cachedResponse;
            }
          }
        }

        // Fetch fresh data
        try {
          const response = await fetch(request);
          if (response.status === 200) {
            // Clone response and add cache timestamp
            const responseToCache = response.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());

            const blob = await responseToCache.blob();
            const cachedResponseWithTime = new Response(blob, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers
            });

            await cache.put(request, cachedResponseWithTime);
            console.log('SW: Cached fresh leaderboard data');
          }
          return response;
        } catch (error) {
          console.log('SW: Network failed, serving stale leaderboard cache');
          // If network fails, serve stale cache (better than nothing)
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })
    );
    return;
  }

  // For all other API routes - NO CACHING, always fetch fresh
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets - cache precached assets only, no runtime caching
  if (PRECACHE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request);
      })
    );
    return;
  }

  // Everything else - fetch from network without caching
  event.respondWith(fetch(request));
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Clear leaderboard cache on demand (for manual sync)
  if (event.data && event.data.type === 'CLEAR_LEADERBOARD_CACHE') {
    caches.open(LEADERBOARD_CACHE).then(async (cache) => {
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
    console.log('SW: Leaderboard cache cleared');
  });
  }
});
