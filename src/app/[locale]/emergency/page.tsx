'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { useOfflineStore } from '@/store/useOfflineStore';
import { getStateFromCoords } from '@/lib/location/emergencyNumbers';
import { getNationalNumbers, getStateNumbers } from '@/lib/data/emergencyNumbers';
import { EmergencyContactCard } from '@/components/emergency/EmergencyContactCard';
import { StateSelector } from '@/components/emergency/StateSelector';

export default function EmergencyPage() {
  const t = useTranslations();
  const { detectedState, setDetectedState } = useOfflineStore();
  const [geoStatus, setGeoStatus] = useState<'pending' | 'success' | 'denied'>('pending');

  useEffect(() => {
    // If state is already manually selected or detected, don't overwrite it immediately
    if (detectedState) {
      setGeoStatus('success');
      return;
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const state = getStateFromCoords(position.coords.latitude, position.coords.longitude);
          if (state) {
            setDetectedState(state);
          }
          setGeoStatus('success');
        },
        () => {
          // Silently fall back to national numbers on denial or error
          setGeoStatus('denied');
        },
        { timeout: 5000 }
      );
    } else {
      setGeoStatus('denied');
    }
  }, [detectedState, setDetectedState]);

  const nationalNumbers = getNationalNumbers();
  const stateNumbers = detectedState ? getStateNumbers(detectedState) : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      {/* Auto-detected state banner */}
      <div className="bg-white px-4 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <MapPin className="w-5 h-5 text-emergency" />
          <span>
            {detectedState 
              ? `${t('emergency.showingNumbersFor') || 'Showing numbers for'}: ${detectedState}`
              : `${t('emergency.showingNationalNumbers') || 'Showing national numbers'}`}
          </span>
        </div>
        <StateSelector />
      </div>

      <div className="p-4 flex flex-col gap-8">
        {/* State Numbers Section (Only if detected/selected) */}
        {detectedState && stateNumbers.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 ml-1">
              {detectedState} {t('emergency.services') || 'Services'}
            </h2>
            <div className="flex flex-col gap-3">
              {stateNumbers.map((contact) => (
                <EmergencyContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </section>
        )}

        {/* National Numbers Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 ml-1">
            {t('emergency.nationalServices') || 'National Services'}
          </h2>
          <div className="flex flex-col gap-3">
            {nationalNumbers.map((contact) => (
              <EmergencyContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
