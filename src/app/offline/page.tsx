'use client';

import Link from 'next/link';
import { WifiOff, Heart } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-emergency/10 flex items-center justify-center">
        <WifiOff className="w-10 h-10 text-emergency" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary font-display">You&apos;re offline</h1>
        <p className="text-text-secondary max-w-xs leading-relaxed">
          No internet connection. If you previously visited AidHero, your content may still be available.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/en"
          className="flex items-center justify-center gap-2 w-full py-4 bg-emergency text-white rounded-xl font-bold shadow-md active:scale-[0.98] transition-all"
        >
          <Heart className="w-5 h-5" />
          Try Opening AidHero
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 border border-border text-text-secondary rounded-xl font-medium active:scale-[0.98] transition-all"
        >
          Retry
        </button>
      </div>

      <p className="text-xs text-text-tertiary mt-4">
        Tip: Visit AidHero while online to download content for offline use.
      </p>
    </div>
  );
}
