'use client';

import React from 'react';
import { Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { EmergencyContact } from '@/lib/data/emergencyNumbers';

interface EmergencyContactCardProps {
  contact: EmergencyContact;
}

export function EmergencyContactCard({ contact }: EmergencyContactCardProps) {
  const router = useRouter();
  const locale = useLocale();

  const handleCall = () => {
    // Navigate to Call Confirmation screen (STEP 21)
    const serviceName = contact.name_translations?.[locale] || contact.name;
    const params = new URLSearchParams({
      number: contact.number,
      name: serviceName,
    });
    router.push(`/${locale}/emergency/call?${params.toString()}`);
  };

  const serviceName = contact.name_translations?.[locale] || contact.name;

  return (
    <div className="w-full min-h-[80px] bg-white rounded-xl shadow-sm border border-slate-100 flex items-center p-3 justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center shrink-0">
          <Phone className="w-5 h-5 text-slate-600" aria-hidden="true" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-slate-900 truncate">{serviceName}</span>
          <span className="text-slate-500 font-medium tracking-wide">{contact.number}</span>
        </div>
      </div>
      
      <button
        onClick={handleCall}
        className="shrink-0 bg-emergency text-white rounded-xl font-bold flex items-center justify-center active:scale-95 transition-transform"
        style={{ width: '72px', height: '56px' }}
        aria-label={`Call ${serviceName} on ${contact.number}`}
      >
        CALL
      </button>
    </div>
  );
}
