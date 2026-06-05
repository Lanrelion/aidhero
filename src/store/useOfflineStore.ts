import { create } from 'zustand';

interface OfflineStore {
  isOnline: boolean;
  isCached: boolean;
  hasUpdate: boolean;
  setOnline: (val: boolean) => void;
  setHasUpdate: (val: boolean) => void;
  setCached: (val: boolean) => void;
  initOfflineState: () => void;
}

export const useOfflineStore = create<OfflineStore>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isCached: false,
  hasUpdate: false,
  
  setOnline: (val) => set({ isOnline: val }),
  setHasUpdate: (val) => set({ hasUpdate: val }),
  setCached: (val) => set({ isCached: val }),

  initOfflineState: () => {
    if (typeof window === 'undefined') return;
    
    // Set initial network state
    set({ isOnline: navigator.onLine });

    // Listen for network changes
    window.addEventListener('online', () => set({ isOnline: true }));
    window.addEventListener('offline', () => set({ isOnline: false }));

    if (process.env.NODE_ENV === 'development') {
      // QA mock — simulates SW cache for visual testing only
      // NEVER ships to production (Next.js strips dev-only code at build time)
      setTimeout(() => {
        set({ isCached: true });
      }, 2000);
      return;
    }

    // Production: real SW cache detection
    // (full implementation in STEP 25)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // SW registered — check caches API for actual content
        caches.has('aidhero-scenarios').then(has => {
          set({ isCached: has });
        });
      });
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        set({ hasUpdate: true });
      });
    }
  }
}));
