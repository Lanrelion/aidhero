import { create } from 'zustand';

interface OfflineStore {
  isOnline: boolean;
  isCached: boolean;
  hasUpdate: boolean;
  detectedState: string | null;
  isSpeechRecognitionAvailable: boolean;
  setOnline: (val: boolean) => void;
  setHasUpdate: (val: boolean) => void;
  setCached: (val: boolean) => void;
  setDetectedState: (val: string) => void;
  initOfflineState: () => void;
}

export const useOfflineStore = create<OfflineStore>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isCached: false,
  hasUpdate: false,
  detectedState: null,
  isSpeechRecognitionAvailable: false,
  
  setOnline: (val) => set((state) => {
    const hasSpeechAPI = typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    return { 
      isOnline: val,
      isSpeechRecognitionAvailable: val && hasSpeechAPI
    };
  }),
  setHasUpdate: (val) => set({ hasUpdate: val }),
  setCached: (val) => set({ isCached: val }),
  setDetectedState: (val) => set({ detectedState: val }),

  initOfflineState: () => {
    if (typeof window === 'undefined') return;
    
    // Set initial network state
    const hasSpeechAPI = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    set({ 
      isOnline: navigator.onLine,
      isSpeechRecognitionAvailable: navigator.onLine && hasSpeechAPI
    });

    // Listen for network changes
    window.addEventListener('online', () => set({ isOnline: true, isSpeechRecognitionAvailable: hasSpeechAPI }));
    window.addEventListener('offline', () => set({ isOnline: false, isSpeechRecognitionAvailable: false }));

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
