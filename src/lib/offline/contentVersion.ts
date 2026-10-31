import { idb } from './idb';
import { useOfflineStore } from '@/store/useOfflineStore';

interface ContentManifest {
  generated_at: string;
  scenarios: Record<string, { version: number }>;
}

export async function checkForUpdates(): Promise<void> {
  // Only check if we are online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  try {
    // 1. Fetch the remote manifest (bypassing browser cache)
    const response = await fetch('/data/content-manifest.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status}`);
    }
    const manifest: ContentManifest = await response.json();

    // 2. Read locally stored versions from IndexedDB
    // We use a generic 'content-versions' key mapping slug -> version
    const localVersions: Record<string, number> = await idb.get('content-versions') || {};

    let updateCount = 0;
    const newVersions: Record<string, number> = { ...localVersions };

    // 3. Compare remote vs local
    for (const [slug, meta] of Object.entries(manifest.scenarios)) {
      const localVersion = localVersions[slug] || 0;
      if (meta.version > localVersion) {
        updateCount++;
        newVersions[slug] = meta.version;
      }
    }

    // 4. If updates found, apply them and notify
    if (updateCount > 0) {
      console.log(`[ContentVersion] Found updates for ${updateCount} scenarios.`);
      
      // Save the new versions to IDB
      await idb.set('content-versions', newVersions);

      // Trigger the global update banner via Zustand
      useOfflineStore.getState().setHasUpdate(true);

      // Dispatch a CustomEvent for decoupled components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('content-updated', { detail: { count: updateCount } })
        );
      }
    } else {
      console.log('[ContentVersion] Content is up to date.');
    }
  } catch (error) {
    // Catch errors silently (never crash the app on a version check failure)
    console.warn('[ContentVersion] Update check failed silently:', error);
  }
}
