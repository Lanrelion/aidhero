'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Check } from 'lucide-react';
import { useOfflineStore } from '@/store/useOfflineStore';
import { getAllStates } from '@/lib/data/emergencyNumbers';

const SEARCH_INPUT_ID = 'state-search-input';

interface StateSelectorProps {
  children?: React.ReactElement;
}

export function StateSelector({ children }: StateSelectorProps) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const { detectedState, setDetectedState } = useOfflineStore();
  const states = getAllStates();

  const filteredStates = states.filter((state) =>
    state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet>
      <SheetTrigger render={
        children || (
          <button
            className="flex items-center gap-1.5 text-sm font-medium text-emergency active:scale-95 transition-transform"
            aria-label={t('emergency.changeState') || 'Change state'}
          >
            <span>{t('emergency.changeState') || 'Change state'}</span>
            <span className="text-[10px]" aria-hidden="true">▼</span>
          </button>
        )
      } />
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="text-center font-bold text-lg">{t('emergency.selectState') || 'Select State'}</SheetTitle>
          <div className="relative mt-2">
            <label htmlFor={SEARCH_INPUT_ID} className="sr-only">{t('emergency.searchStates') || 'Search states'}</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id={SEARCH_INPUT_ID}
              type="text"
              placeholder={t('emergency.searchStates') || 'Search states...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-transparent focus-visible:ring-emergency"
            />
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filteredStates.map((state) => (
            <SheetClose key={state} render={
              <button
                onClick={() => setDetectedState(state)}
                aria-current={detectedState === state ? 'true' : undefined}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-colors ${
                  detectedState === state ? 'bg-emergency/10 text-emergency font-semibold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-5 h-5 ${detectedState === state ? 'text-emergency' : 'text-slate-400'}`} aria-hidden="true" />
                  <span className="text-base">{state}</span>
                </div>
                {detectedState === state && <Check className="w-5 h-5 text-emergency" aria-hidden="true" />}
              </button>
            } />
          ))}
          {filteredStates.length === 0 && (
            <div className="p-8 text-center text-slate-500" role="status">
              {t('emergency.noStatesFound', { search }) || `No states found matching "${search}"`}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
