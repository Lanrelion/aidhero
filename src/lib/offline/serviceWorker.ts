export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // SW is intentionally disabled in development to avoid caching issues during coding.
  if (process.env.NODE_ENV === 'development') return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Registered, scope:', registration.scope);

        // When a new SW version is found, prompt the user
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW waiting — notify via Zustand (handled in ContentUpdateBanner)
              console.log('[SW] Update available');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => {
        // Silently fail — never crash the app over a SW registration error
        console.warn('[SW] Registration failed:', err);
      });

    // When a new SW takes control, reload the page to use fresh assets
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}
