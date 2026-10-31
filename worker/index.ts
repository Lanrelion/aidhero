/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// --- Custom Workbox Routes per PRD Section 10 ---

// 1. content-manifest.json: NetworkFirst (no cache — always fresh)
registerRoute(
  ({ url }) => url.pathname.endsWith('/data/content-manifest.json'),
  new NetworkFirst({
    cacheName: 'manifest-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 1 }) // Bare minimum, but forces network first
    ]
  })
);

// 2. Scenario JSON: StaleWhileRevalidate, 24h
registerRoute(
  ({ url }) => url.pathname.startsWith('/data/scenarios/'),
  new StaleWhileRevalidate({
    cacheName: 'scenario-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// 3. Emergency numbers: CacheFirst, 7 days
registerRoute(
  ({ url }) => url.pathname.includes('emergencyNumbers') || url.pathname.endsWith('/data/emergency-numbers.json'),
  new CacheFirst({
    cacheName: 'emergency-numbers-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// 4. Audio files (/audio/**/*.mp3): CacheFirst, 30 days
registerRoute(
  ({ url }) => url.pathname.startsWith('/audio/') && url.pathname.endsWith('.mp3'),
  new CacheFirst({
    cacheName: 'audio-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 500,
      }),
    ],
  })
);

// 5. Google Fonts: CacheFirst, 1 year
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// 6. API (/api/**): NetworkOnly
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly()
);

// 7. RSC payloads (?_rsc=...) — Next.js client-side navigation data fetches
// These MUST be cached for offline client-side navigation to work.
registerRoute(
  ({ url }) => url.searchParams.has('_rsc'),
  new NetworkFirst({
    cacheName: 'rsc-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 128,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
    // @ts-ignore — networkTimeoutSeconds is valid but not in all type defs
    networkTimeoutSeconds: 3,
  })
);

// 8. Full page navigations for all locales — NetworkFirst with offline fallback
registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' &&
    /^\/(en|ha|ig|yo|pcm)(\/.*)?$/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
    // @ts-ignore
    networkTimeoutSeconds: 3,
  })
);

// App shell is handled by next-pwa's aggressiveFrontEndNavCaching and generated precache manifest

// --- Custom Message Handlers ---

self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_AUDIO_LANGUAGE') {
    const lang = event.data.lang;
    console.log(`[ServiceWorker] Pre-fetching audio for language: ${lang}`);
    try {
      const cache = await caches.open('audio-cache');
      
      // Known scenario slugs
      const slugs = ['heart-attack', 'choking-adult', 'stroke', 'severe-bleeding', 'seizure'];
      const urlsToCache: string[] = [];

      for (const slug of slugs) {
        // We assume up to 5 steps per scenario for pre-caching.
        for (let i = 1; i <= 5; i++) {
          urlsToCache.push(`/audio/${slug}/${lang}/step-${i}.mp3`);
        }
      }

      // Add all to cache sequentially to track progress
      let completed = 0;
      const total = urlsToCache.length;

      for (const url of urlsToCache) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (e) {
          // ignore individual fetch errors
        }
        completed++;
        
        // Broadcast progress
        const progress = Math.round((completed / total) * 100);
        const allClients = await self.clients.matchAll({ type: 'window' });
        for (const client of allClients) {
          client.postMessage({ type: 'DOWNLOAD_PROGRESS', lang, progress });
        }
      }
      
      console.log(`[ServiceWorker] Audio cached for ${lang}`);
      
      // Broadcast completion
      const allClients = await self.clients.matchAll({ type: 'window' });
      for (const client of allClients) {
        client.postMessage({ type: 'DOWNLOAD_COMPLETE', lang });
      }
    } catch (err) {
      console.error('[ServiceWorker] Failed to cache audio', err);
    }
  }
});
