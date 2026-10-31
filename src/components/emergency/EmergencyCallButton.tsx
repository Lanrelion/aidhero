"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Phone } from 'lucide-react';
import { useOfflineStore } from '@/store/useOfflineStore';
import { getPrimaryEmergencyNumber } from '@/lib/data/emergencyNumbers';

interface EmergencyCallButtonProps {
  pulseRing?: boolean;
}

export function EmergencyCallButton({ pulseRing = true }: EmergencyCallButtonProps) {
  const t = useTranslations();
  const { detectedState } = useOfflineStore();
  const primaryNumber = getPrimaryEmergencyNumber(detectedState) || '112';

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-40">
      <div className="max-w-2xl mx-auto w-full">
        <a 
          href={`tel:${primaryNumber}`}
          className={`flex items-center justify-center gap-3 w-full h-14 bg-emergency hover:bg-emergency-active text-white rounded-xl font-bold text-body-lg shadow-lg active:scale-[0.98] transition-all ${
            pulseRing ? 'motion-safe:animate-pulse-ring' : ''
          }`}
          aria-label={`${t('emergency.callButton') || "Call Emergency"} ${primaryNumber}`}
        >
          <Phone className="w-6 h-6" aria-hidden="true" />
          <span>{t('emergency.callButton') || "Call Emergency"} — {primaryNumber}</span>
        </a>
      </div>
    </div>
  );
}
