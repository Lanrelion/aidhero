"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  X, 
  Mic, 
  Phone, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { scenarios, getScenario } from '@/lib/data/scenarios';
import { CATEGORY_ICONS } from '@/lib/utils/icons';
import { getPrimaryEmergencyNumber } from '@/lib/data/emergencyNumbers';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useSearch } from '@/hooks/useSearch';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { WaveformVisualizer } from '@/components/rescue/WaveformVisualizer';
import type { Locale } from '@/types';
import type { Scenario } from '@/types/scenario';

// Filter chips specification as requested
const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'cardiac', label: 'Cardiac' },
  { id: 'respiratory', label: 'Respiratory' },
  { id: 'trauma', label: 'Trauma' },
  { id: 'burns', label: 'Burns' },
  { id: 'poisoning', label: 'Poisoning' },
  { id: 'neurological', label: 'Neurological' },
  { id: 'environmental', label: 'Environmental' },
  { id: 'allergic', label: 'Allergic' },
  { id: 'paediatric', label: 'Paediatric' },
  { id: 'obstetric', label: 'Obstetric' },
] as const;

const SEVERITY_ORDER: Record<string, number> = {
  critical: 1,
  urgent: 2,
  moderate: 3,
  stable: 4,
};

const SEVERITY_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-emergency/15 text-emergency border-emergency/30', text: 'text-emergency', label: 'CRITICAL' },
  urgent: { bg: 'bg-warning/15 text-warning border-warning/30', text: 'text-warning', label: 'URGENT' },
  moderate: { bg: 'bg-action/15 text-action border-action/30', text: 'text-action', label: 'MODERATE' },
  stable: { bg: 'bg-info/15 text-info border-info/30', text: 'text-info', label: 'STABLE' },
};

export default function UnifiedDiscoveryPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const searchParams = useSearchParams();

  const { detectedState } = useOfflineStore();
  const primaryNumber = getPrimaryEmergencyNumber(detectedState) || '199';

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, results: searchResults, isSearching, clearSearch } = useSearch('');

  // Voice Search integration
  const {
    isListening: isVoiceSearching,
    isAvailable: isVoiceSearchAvailable,
    interimText: voiceSearchTranscript,
    startListening: startVoiceSearch,
    stopListening: stopVoiceSearch,
  } = useVoiceSearch(
    (transcript) => {
      setQuery(transcript);
    },
    (finalTranscript) => {
      setQuery(finalTranscript);
      setVoiceSearchOpen(false);
    }
  );

  // Handle focus, query, and category search params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
    }
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategories([cat.toLowerCase()]);
    }
    if (searchParams.get('focus') === 'search') {
      searchInputRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchParams, setQuery]);

  // Toggle category filter chips
  const toggleCategory = (catId: string) => {
    if (catId === 'all') {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        return prev.filter(c => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Helper matching scenario to selected category chip(s)
  const matchesCategory = (scenario: Scenario, cats: string[]): boolean => {
    if (cats.length === 0) return true;
    
    return cats.some(cat => {
      if (scenario.category?.toLowerCase() === cat) return true;
      if (cat === 'paediatric' && (scenario.slug?.includes('child') || scenario.category === 'paediatric')) return true;
      if (cat === 'obstetric' && scenario.category === 'obstetric') return true;
      return false;
    });
  };

  // Filter and sort scenarios
  const displayedScenarios = useMemo(() => {
    let list: Scenario[] = [];

    if (query.trim()) {
      // Use search results
      list = searchResults
        .map(r => getScenario(r.scenarioId))
        .filter((s): s is Scenario => s !== undefined)
        .filter(s => matchesCategory(s, selectedCategories));
    } else {
      // Use all scenarios filtered by category chips
      list = scenarios.filter(s => matchesCategory(s, selectedCategories));
    }

    // Default sorting: Critical first, then Urgent, etc.
    return [...list].sort((a, b) => {
      const orderA = SEVERITY_ORDER[a.severity] || 99;
      const orderB = SEVERITY_ORDER[b.severity] || 99;
      return orderA - orderB;
    });
  }, [query, searchResults, selectedCategories]);

  const handleCardClick = (slug: string) => {
    router.push(`/${locale}/incidents/${slug}`);
  };

  const handleClearAll = () => {
    clearSearch();
    setSelectedCategories([]);
    searchInputRef.current?.focus();
  };

  const handleMicClick = () => {
    if (isVoiceSearchAvailable) {
      setVoiceSearchOpen(true);
      startVoiceSearch();
    } else {
      // Fallback: If offline or SpeechRecognition unavailable, focus search input to expand keyboard
      searchInputRef.current?.focus();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      
      {/* ──────────────────────────────────────────────────────────
          VOICE SEARCH FULLSCREEN OVERLAY
          ────────────────────────────────────────────────────────── */}
      {voiceSearchOpen && (
        <div
          id="voice-search-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Voice Search"
          className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 pb-12 animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.98)' }}
        >
          {/* Top Close Bar */}
          <div className="w-full flex justify-end items-center mt-2 z-20">
            <button
              onClick={() => {
                stopVoiceSearch();
                setVoiceSearchOpen(false);
              }}
              aria-label="Exit"
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Center Content Area */}
          <div className="flex flex-col items-center justify-center gap-6 max-w-sm w-full text-center flex-1 my-auto">
            <h2 className="text-white font-bold text-[20px] leading-snug font-body">
              Listening... say the emergency
            </h2>

            {/* Waveform Visualizer */}
            <div className="h-16 flex items-center justify-center">
              <WaveformVisualizer isActive={isVoiceSearching} />
            </div>

            {/* Interim / Final Transcript Box */}
            <div className="min-h-[60px] flex items-center justify-center px-4 w-full">
              {voiceSearchTranscript ? (
                <p className="text-white text-xl font-semibold italic bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl animate-in zoom-in-95 duration-150">
                  "{voiceSearchTranscript}"
                </p>
              ) : (
                <p className="text-white/40 text-sm">
                  e.g. "Heart Attack", "Burns", "Bleeding"
                </p>
              )}
            </div>
          </div>

          {/* Bottom Done Action */}
          <div className="w-full max-w-sm flex flex-col gap-3 z-20">
            <button
              onClick={() => {
                stopVoiceSearch();
                setVoiceSearchOpen(false);
              }}
              className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          SECTION 1: Sticky Top Search Bar
          ────────────────────────────────────────────────────────── */}
      <section className="sticky top-0 z-30 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85 border-b border-border shadow-sm px-4 py-3">
        <div className="max-w-lg mx-auto relative flex items-center">
          <div className="absolute left-3.5 z-10 text-text-secondary pointer-events-none">
            <Search className="w-5 h-5" aria-hidden="true" />
          </div>

          <input
            id="discovery-search-input"
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder') || "Search for symptoms or injuries..."}
            aria-label={t('home.searchPlaceholder') || "Search for symptoms or injuries"}
            className="w-full h-12 pl-11 pr-20 rounded-xl bg-card border border-border text-body text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all font-body shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 active:bg-slate-300 text-text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleMicClick}
              aria-label={t('accessibility.voiceSearch') || "Voice search"}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 active:bg-slate-300 text-text-secondary hover:text-action transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 2: Emergency Strip
          ────────────────────────────────────────────────────────── */}
      <section className="w-full bg-emergency text-white shadow-emergency">
        <a
          href={`tel:${primaryNumber}`}
          aria-label={`${t('home.emergencyCall') || 'Call Emergency'} ${primaryNumber}`}
          className="w-full min-h-[56px] py-3.5 px-4 flex items-center justify-center gap-3 active:brightness-90 transition-all text-center"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-white fill-white animate-pulse" aria-hidden="true" />
          </div>
          <span className="text-body-lg font-bold tracking-wide font-display">
            {t('home.emergencyCall') || 'Call Emergency'} — {primaryNumber}
          </span>
        </a>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 3: Category Filter Chips (Horizontal Scroll)
          ────────────────────────────────────────────────────────── */}
      <section className="w-full border-b border-border/70 bg-surface/50 py-3">
        <div 
          className="flex items-center gap-2 overflow-x-auto px-4 max-w-lg mx-auto hide-scrollbar snap-x"
          role="tablist"
          aria-label="Filter incidents by category"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FILTER_CHIPS.map((chip) => {
            const isAll = chip.id === 'all';
            const isSelected = isAll 
              ? selectedCategories.length === 0 
              : selectedCategories.includes(chip.id);

            const translatedLabel = isAll 
              ? 'All' 
              : (t(`incidents.${chip.id}`) || chip.label);

            return (
              <button
                key={chip.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => toggleCategory(chip.id)}
                className={`h-[44px] px-4 rounded-full text-base font-semibold whitespace-nowrap transition-all active:scale-95 shrink-0 flex items-center justify-center border ${
                  isSelected
                    ? 'bg-authority text-white border-authority shadow-sm'
                    : 'bg-card text-text-primary border-border hover:bg-slate-100'
                }`}
              >
                {translatedLabel}
              </button>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 4: 2-Column Responsive Incident Grid
          ────────────────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 max-w-lg mx-auto w-full px-4 pt-5">
        
        {/* Results Count & Active Filters Indicator */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {query.trim()
              ? `${displayedScenarios.length} ${displayedScenarios.length === 1 ? 'result' : 'results'} for "${query}"`
              : selectedCategories.length > 0
                ? `${displayedScenarios.length} in selected categories`
                : `${displayedScenarios.length} emergencies`
            }
          </span>

          {(query.trim() || selectedCategories.length > 0) && (
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-action hover:underline active:opacity-75"
            >
              {t('search.clearRecent') || "Clear all"}
            </button>
          )}
        </div>

        {/* Empty Search / Filter State */}
        {displayedScenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-2xl border border-dashed border-border mt-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-text-secondary">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-h3 font-bold text-text-primary mb-1">
              {t('search.noResults', { query: query || 'selected filter' }) || `No emergencies found matching criteria.`}
            </h3>
            <p className="text-sm text-text-secondary max-w-xs mb-5">
              Try a different search term or reset the category filters.
            </p>
            <button
              onClick={handleClearAll}
              className="h-11 px-6 rounded-xl bg-authority text-white font-bold text-sm active:scale-95 transition-transform"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div 
            className="grid grid-cols-2 gap-3.5"
            role="list"
            aria-label="Emergencies and Incidents"
          >
            {displayedScenarios.map((sc) => {
              const IconComponent = CATEGORY_ICONS[sc.category?.toLowerCase()] || Sparkles;
              const title = sc.title_translations?.[locale] || sc.title;
              
              const borderSeverityClass = 
                sc.severity === 'critical' ? 'border-l-4 border-l-emergency' :
                sc.severity === 'urgent' ? 'border-l-4 border-l-warning' :
                'border-l-4 border-l-slate-400';

              return (
                <button
                  key={sc.id}
                  role="listitem"
                  onClick={() => handleCardClick(sc.slug || sc.id)}
                  aria-label={`${title}, ${sc.severity} emergency`}
                  className={`min-h-[120px] p-3.5 bg-card hover:bg-card-active active:scale-[0.97] rounded-2xl border border-border ${borderSeverityClass} shadow-sm flex flex-col items-center justify-between text-center transition-all motion-safe:duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-action`}
                >
                  {/* Top Half: Centered 40px Category Icon */}
                  <div className="flex-1 flex items-center justify-center w-full pt-1">
                    <div className="w-10 h-10 flex items-center justify-center text-text-primary group-hover:text-emergency transition-colors">
                      <IconComponent className="w-8 h-8" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Bottom Half: Centered 16px Inter 600 Incident Name */}
                  <div className="w-full pt-2 pb-1">
                    <h2 className="text-base font-semibold text-text-primary text-center line-clamp-2 leading-tight group-hover:text-emergency transition-colors">
                      {title}
                    </h2>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
