'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Phone, PhoneCall } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CallConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();
  
  const number = searchParams.get('number') || '';
  const service = searchParams.get('name') || '';
  
  const [countdown, setCountdown] = useState(3);
  const [isCalling, setIsCalling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const executeCall = () => {
    setIsCalling(true);
    if (timerRef.current) clearInterval(timerRef.current);
    // Auto-initiate call via tel: link
    window.location.href = `tel:${number}`;
  };

  const handleCancel = () => {
    setIsCancelled(true);
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  useEffect(() => {
    // Basic validation
    if (!number) {
      router.back();
      return;
    }

    // Auto-countdown logic
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          executeCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [number, router]);

  // Accessibility announcement on mount
  const srMessage = `Calling ${service} on ${number} in ${countdown} seconds. Tap Cancel to stop.`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-6 text-center">
      {/* Screen Reader Announcement */}
      <div aria-live="assertive" className="sr-only">
        {!isCancelled && !isCalling ? srMessage : ''}
        {isCalling ? `Calling ${service} now.` : ''}
        {isCancelled ? 'Call cancelled.' : ''}
      </div>

      <div className="w-24 h-24 bg-emergency/10 rounded-full flex items-center justify-center mb-8">
        {isCalling ? (
          <PhoneCall className="w-12 h-12 text-emergency animate-pulse" />
        ) : (
          <Phone className="w-12 h-12 text-emergency" />
        )}
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {isCalling ? 'Calling...' : `Calling ${service}`}
      </h1>
      
      <p className="text-[40px] font-extrabold text-slate-900 tracking-wider mb-12">
        {number}
      </p>

      <div className="w-full max-w-sm flex flex-col gap-4 mt-8">
        <button
          onClick={executeCall}
          disabled={isCalling || isCancelled}
          className="w-full h-[88px] bg-emergency text-white rounded-2xl font-bold text-2xl shadow-lg shadow-emergency/20 active:scale-95 transition-transform disabled:opacity-80 flex items-center justify-center"
        >
          {isCalling ? 'CALLING NOW' : `CALL IN ${countdown}`}
        </button>

        <button
          onClick={handleCancel}
          disabled={isCalling}
          className="w-full h-[64px] bg-transparent text-slate-500 font-bold text-lg rounded-2xl active:bg-slate-200 transition-colors disabled:opacity-50"
          aria-label={`Cancel call to ${service}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
