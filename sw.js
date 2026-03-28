// Service Worker for Map Selector PWA
// Cache-first for static assets; network-first for GeoJSON data

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `map-selector-static-${CACHE_VERSION}`;
const GEOJSON_CACHE = `map-selector-geojson-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// GeoJSON hosts — always try network first, fall back to cache
const GEOJSON_HOSTS = [
  'raw.githubusercontent.com',
];

// ── Install: pre-cache static assets ─────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Activate immediately without waiting for existing clients to close
      return self.skipWaiting();
    })
  );
});

// ── Activate: purge old caches ────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete any cache that isn't our current version
            return (
              name.startsWith('map-selector-') &&
              name !== STATIC_CACHE &&
              name !== GEOJSON_CACHE
            );
          })
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

// ── Fetch: route requests ─────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for GeoJSON data
  if (GEOJSON_HOSTS.includes(url.hostname)) {
    event.respondWith(networkFirst(event.request, GEOJSON_CACHE));
    return;
  }

  // Cache-first for static assets (same-origin + Leaflet CDN)
  if (
    url.origin === self.location.origin ||
    url.hostname === 'unpkg.com' ||
    url.hostname.endsWith('.tile.openstreetmap.org')
  ) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // Default: just fetch from network
  event.respondWith(fetch(event.request));
});

// ── Strategy: Cache-first ─────────────────────────────────────────────────────
// Serve from cache if available; fall back to network and cache the response.

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // If network fails and nothing is cached, return a simple offline response
    return new Response('Offline — resource not cached.', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// ── Strategy: Network-first ───────────────────────────────────────────────────
// Always try the network first; fall back to cache if offline.

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({ error: 'Offline — boundary data not available.' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
