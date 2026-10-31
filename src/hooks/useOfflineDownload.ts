import { useState, useEffect, useCallback } from 'react';
import type { Locale } from '../../i18n/config';
import { idb } from '@/lib/offline/idb';

type DownloadStatus = 'idle' | 'downloading' | 'completed';

export function useOfflineDownload(lang: Locale) {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);

  // Check if already downloaded on mount
  useEffect(() => {
    async function checkStatus() {
      const isDownloaded = await idb.get(`audio-downloaded-${lang}`);
      if (isDownloaded) {
        setStatus('completed');
        setProgress(100);
      }
    }
    checkStatus();
  }, [lang]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = async (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'DOWNLOAD_PROGRESS' && data.lang === lang) {
        setStatus('downloading');
        setProgress(data.progress);
      }

      if (data.type === 'DOWNLOAD_COMPLETE' && data.lang === lang) {
        setStatus('completed');
        setProgress(100);
        await idb.set(`audio-downloaded-${lang}`, true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [lang]);

  const startDownload = useCallback(async () => {
    if (status === 'completed' || status === 'downloading') return;
    
    setStatus('downloading');
    setProgress(0);

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const sw = await navigator.serviceWorker.ready;
        sw.active?.postMessage({ type: 'CACHE_AUDIO_LANGUAGE', lang });
      } catch (e) {
        console.error('Failed to start download via SW', e);
        setStatus('idle');
      }
    } else {
      setStatus('idle');
    }
  }, [lang, status]);

  return {
    status,
    progress,
    startDownload,
    isDownloaded: status === 'completed',
  };
}
