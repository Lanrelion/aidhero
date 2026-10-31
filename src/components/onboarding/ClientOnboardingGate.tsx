'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSetting } from '@/lib/storage/settings';

export function ClientOnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      // If we are already on the onboarding page, no need to redirect.
      if (pathname.includes('/onboarding')) {
        setIsChecking(false);
        return;
      }

      try {
        const isComplete = await getSetting('onboarding-complete', false);
        if (!isComplete) {
          // Redirect to onboarding
          const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?|pcm)/);
          const locale = localeMatch ? localeMatch[1] : 'en';
          router.replace(`/${locale}/onboarding`);
        }
      } catch (err) {
        console.warn('Failed to check onboarding status', err);
      } finally {
        setIsChecking(false);
      }
    }

    checkOnboarding();
  }, [pathname, router]);

  // If you want to block rendering of the app entirely while checking,
  // this component could render a full-screen loading spinner.
  // For PWA performance, we let it mount and redirect if necessary.
  return null;
}
