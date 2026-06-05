"use client";

import { useTranslations } from 'next-intl';
import { Phone } from 'lucide-react';

export function EmergencyCallButton() {
  const t = useTranslations();

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40">
      <div className="max-w-2xl mx-auto w-full">
        <a 
          href="tel:112"
          className="flex items-center justify-center gap-3 w-full h-14 bg-emergency hover:bg-emergency-active text-white rounded-xl font-bold text-body-lg shadow-lg active:scale-[0.98] transition-all"
        >
          <Phone className="w-6 h-6" aria-hidden="true" />
          {t('emergency.callButton') || "Call Emergency"}
        </a>
      </div>
    </div>
  );
}
