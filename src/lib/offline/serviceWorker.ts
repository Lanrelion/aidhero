let registrationStarted = false;
let hadController = false;

function reloadForControllerChange() {
  const isUpdate = hadController;
  hadController = Boolean(navigator.serviceWorker.controller);
  // A first install uses the assets already loaded by the current page.
  if (isUpdate) window.location.reload();
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // SW is intentionally disabled in development to avoid caching issues during coding.
  if (process.env.NODE_ENV === 'development') return;
  if (registrationStarted) return;
  registrationStarted = true;

  const register = () => {
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
        registrationStarted = false;
        // Silently fail — never crash the app over a SW registration error
        console.warn('[SW] Registration failed:', err);
      });

    // Reload for updates after the page already has a controller.
    hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', reloadForControllerChange);
  };

  // Hydration can finish after load, so register immediately in that case.
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
