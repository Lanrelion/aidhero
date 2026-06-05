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

    // Listen for service worker updates (handled by workbox typically)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        set({ isCached: true }); // optimistic cache assumed when SW is ready
      });
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // If a new SW takes over, we might want to flag update
        set({ hasUpdate: true });
      });
    }
  }
}));
