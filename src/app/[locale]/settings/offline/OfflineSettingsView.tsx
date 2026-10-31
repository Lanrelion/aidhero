'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Download, HardDrive } from 'lucide-react';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';
import { useState, useEffect } from 'react';
import type { Locale } from '../../../../../i18n/config';
import { checkForUpdates } from '@/lib/offline/contentVersion';

// Child component for each language row to isolate hook updates
function LanguageDownloadRow({ lang, label }: { lang: Locale; label: string }) {
  const t = useTranslations('settings.offlineScreen');
  const { status, progress, startDownload, isDownloaded } = useOfflineDownload(lang);

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        {isDownloaded ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 border-2 border-border rounded flex-shrink-0" />
        )}
        <span className="text-text-primary font-medium">{label}</span>
      </div>
      
      {isDownloaded ? (
        <span className="text-sm text-text-secondary">{t('downloaded')}</span>
      ) : status === 'downloading' ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">
            {t('downloading', { progress })}
          </span>
        </div>
      ) : (
        <button
          onClick={startDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('download')}
        </button>
      )}
    </div>
  );
}

export function OfflineSettingsView() {
  const t = useTranslations('settings.offlineScreen');
  const router = useRouter();
  
  const [storageEstimate, setStorageEstimate] = useState<{ used: number; total: number } | null>(null);

  const getEstimate = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
      const totalMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
      setStorageEstimate({ used: Number(usedMB), total: Number(totalMB) });
    }
  };

  useEffect(() => {
    getEstimate();

    // Listen for download completion to refresh storage estimate
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DOWNLOAD_COMPLETE') {
        getEstimate();
      }
    };
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    return () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const handleCheckUpdates = async () => {
    await checkForUpdates();
    alert('Update check completed.');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-surface text-text-secondary"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>
      </header>

      <div className="p-4 space-y-6">
        
        {/* Core Content */}
        <section className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-surface-hover/50 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Core Content</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-text-primary font-medium">{t('appContent')}</span>
              </div>
              <span className="text-sm text-text-secondary text-right">{t('appContentStatus')}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-text-primary font-medium">{t('englishAudio')}</span>
              </div>
              <span className="text-sm text-text-secondary text-right">{t('englishAudioStatus')}</span>
            </div>
          </div>
        </section>

        {/* Audio Downloads */}
        <section className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-surface-hover/50 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Language Audio</h2>
            <p className="text-sm text-text-secondary mt-1">Download native audio for offline playback.</p>
          </div>
          <div className="px-4">
            <LanguageDownloadRow lang="ha" label="Hausa Audio" />
            <LanguageDownloadRow lang="ig" label="Igbo Audio" />
            <LanguageDownloadRow lang="yo" label="Yoruba Audio" />
            <LanguageDownloadRow lang="pcm" label="Pidgin Audio" />
          </div>
        </section>

        {/* Storage Stats */}
        {storageEstimate && (
          <section className="flex flex-col items-center justify-center p-6 bg-surface rounded-2xl border border-border text-center">
            <HardDrive className="w-8 h-8 text-primary mb-3" />
            <p className="text-sm font-medium text-text-primary">
              {t('storageUsed', { used: storageEstimate.used, total: storageEstimate.total })}
            </p>
          </section>
        )}

        {/* Updates */}
        <section className="flex flex-col items-center pt-4">
          <button
            onClick={handleCheckUpdates}
            className="px-6 py-3 bg-surface border border-border text-text-primary rounded-full font-medium active:scale-95 transition-transform"
          >
            {t('checkUpdates')}
          </button>
        </section>
      </div>
    </div>
  );
}
