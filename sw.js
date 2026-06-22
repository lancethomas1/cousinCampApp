/* Cousin Camp service worker — makes both apps load and work offline.
 *
 * Strategy:
 *   • Precache the app shell (HTML, CSS, JS, icons, manifests) on install so
 *     the apps open even with no connection the first time after installing.
 *   • Same-origin GETs use stale-while-revalidate: serve the cached copy fast,
 *     refresh it in the background. This also transparently handles our
 *     cache-busting query strings (e.g. core.js?v=20260622).
 *   • Cross-origin GETs (Google Fonts, the Firebase compat SDK on gstatic) use
 *     cache-first so the apps still boot offline after one online visit.
 *   • Live camp data still flows through the Firebase SDK when online; offline,
 *     the app shell loads and shows whatever was last synced to the device.
 *
 * Bump CACHE when shipping new assets to retire the old cache on activate.
 */
const CACHE = 'cousin-camp-v2';

// Unversioned shell paths (the query-string versions get cached on first load
// by the stale-while-revalidate handler below).
const PRECACHE = [
  './',
  './index.html',
  './parent.html',
  './styles.css',
  './data.js',
  './firebase-config.js',
  './core.js',
  './app.js',
  './parent.js',
  './site.webmanifest',
  './parent.webmanifest',
  './icons/camp.svg',
  './icons/camp-32.png',
  './icons/camp-180.png',
  './icons/camp-192.png',
  './icons/camp-512.png',
  './icons/parent.svg',
  './icons/parent-32.png',
  './icons/parent-180.png',
  './icons/delorean.svg',
  './icons/calendar.svg',
  './icons/schedule.svg',
  './icons/cheers.svg',
  './icons/trophy.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // addAll is all-or-nothing; cache each one so a single 404 can't abort it.
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Stale-while-revalidate.
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => null);
          // Cached first; otherwise wait on network; for navigations that fail,
          // fall back to a cached entry point so the app still opens offline.
          return (
            cached ||
            network.then(
              (res) =>
                res ||
                (request.mode === 'navigate'
                  ? cache.match('./index.html').then((page) => page || cache.match('./'))
                  : undefined)
            )
          );
        })
      )
    );
    return;
  }

  // Cross-origin (fonts, Firebase SDK): cache-first, then network.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((response) => {
              // Opaque responses (no CORS) are still usable for <script>/<link>.
              if (response && (response.ok || response.type === 'opaque')) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached)
      )
    )
  );
});
