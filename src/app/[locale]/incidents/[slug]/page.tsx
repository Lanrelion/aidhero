import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { AlertTriangle, ChevronLeft, AlertCircle, Info, FileText } from 'lucide-react';
import { getScenario } from '@/lib/data/scenarios';
import { TrustSignal } from '@/components/emergency/TrustSignal';
import { EmergencyCallButton } from '@/components/emergency/EmergencyCallButton';
import { cn } from '@/lib/utils';
import { locales } from '@/i18n/config';
import { scenarios } from '@/lib/data/scenarios';

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  locales.forEach(locale => {
    scenarios.forEach(scenario => {
      params.push({ locale, slug: scenario.slug });
    });
  });
  return params;
}

export default async function IncidentDetailPage({ 
  params 
}: { 
  params: Promise<{ locale: string; slug: string }> 
}) {
  const resolvedParams = await params;
  const { locale, slug } = resolvedParams;

  const scenario = getScenario(slug);
  
  if (!scenario) {
    notFound();
  }

  const t = await getTranslations();

  // Translations
  const title = scenario.title_translations[locale as keyof typeof scenario.title_translations] || scenario.title;
  const description = scenario.description_translations[locale as keyof typeof scenario.description_translations] || scenario.description;
  const immediateWarning = scenario.immediate_warning_translations?.[locale as keyof typeof scenario.immediate_warning_translations] || scenario.immediate_warning;
  const hospitalThreshold = scenario.hospital_threshold_translations?.[locale as keyof typeof scenario.hospital_threshold_translations] || scenario.hospital_threshold;

  // Severity config
  const severityConfig = {
    critical: { bg: "bg-emergency", text: "text-white" },
    urgent: { bg: "bg-warning", text: "text-white" },
    moderate: { bg: "bg-card-active", text: "text-emergency" }
  };
  const severityStyle = severityConfig[scenario.severity] || severityConfig.moderate;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link 
            href={`/${locale}?category=${scenario.category}`}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-card active:bg-card-active transition-colors text-text-primary"
            aria-label={t('rescue.back') || "Back"}
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="text-body font-bold text-text-primary capitalize opacity-80">
            {t(`incidents.${scenario.category}`) || scenario.category}
          </span>
        </div>
      </header>

      {/* Severity Banner */}
      <div className={cn("w-full py-2 px-4 text-center font-bold tracking-wider text-xs uppercase", severityStyle.bg, severityStyle.text)}>
        {t(`rescue.severity.${scenario.severity}`) || scenario.severity}
      </div>

      <div className="flex-1 p-4 pb-24 max-w-2xl mx-auto w-full flex flex-col gap-6">
        
        {/* Title */}
        <h1 className="text-h1 font-display font-bold text-text-primary leading-tight">
          {title}
        </h1>

        {/* Immediate Warning (Must be first content read after title) */}
        {immediateWarning && (
          <div className="flex gap-3 p-4 bg-emergency/10 border-2 border-emergency rounded-xl" role="alert" aria-live="assertive">
            <AlertTriangle className="w-6 h-6 text-emergency shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-body-lg font-bold text-emergency">
              {immediateWarning}
            </p>
          </div>
        )}

        {/* What it is */}
        <section>
          <p className="text-body-lg text-text-secondary leading-relaxed">
            {description}
          </p>
        </section>

        {/* Signs to recognise */}
        {scenario.signs && Object.keys(scenario.signs_translations || {}).length > 0 && (
          <section className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-h3 font-bold text-text-primary mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-action" />
              {t('rescue.signsToLookFor') || "Signs to recognise"}
            </h2>
            <ul className="space-y-3">
              {Object.entries(scenario.signs_translations).map(([index, translations]) => {
                const signText = (translations as any)[locale] || scenario.signs[parseInt(index)];
                return (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary mt-2.5 shrink-0" />
                    <span className="text-body-lg text-text-primary">{signText}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Action Buttons */}
        <section className="flex flex-col gap-3 mt-2">
          <Link 
            href={`/${locale}/incidents/${slug}/rescue`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-action hover:bg-action-active text-white rounded-xl font-bold text-body-lg shadow-md active:scale-[0.98] transition-all"
          >
            {t('rescue.startGuided') || "START GUIDED RESCUE"}
          </Link>
          <Link 
            href={`/${locale}/incidents/${slug}/steps`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-transparent border-2 border-action text-action hover:bg-action/5 rounded-xl font-bold text-body-lg active:scale-[0.98] transition-all"
          >
            <FileText className="w-5 h-5" />
            {t('rescue.quickSteps') || "QUICK STEPS"}
          </Link>
        </section>

        {/* What NOT to do */}
        {scenario.do_not && Object.keys(scenario.do_not_translations || {}).length > 0 && (
          <section className="bg-emergency/5 border border-emergency/30 rounded-xl p-5 mt-2">
            <h2 className="text-h3 font-bold text-emergency mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {t('rescue.doNot') || "What NOT to do"}
            </h2>
            <ul className="space-y-3">
              {Object.entries(scenario.do_not_translations).map(([index, translations]) => {
                const doNotText = (translations as any)[locale] || scenario.do_not[parseInt(index)];
                return (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emergency/20 text-emergency flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold">X</span>
                    </div>
                    <span className="text-body-lg text-text-primary">{doNotText}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* When to go to hospital */}
        {hospitalThreshold && (
          <section className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-h3 font-bold text-text-primary mb-2">
              {t('rescue.hospitalThreshold') || "When to go to hospital"}
            </h2>
            <p className="text-body text-text-secondary leading-relaxed">
              {hospitalThreshold}
            </p>
          </section>
        )}

        {/* Trust Signal */}
        {scenario.trust_signals && (
          <section className="mt-4">
            <TrustSignal 
              reviewerName={scenario.trust_signals.medical_reviewer}
              institution={scenario.trust_signals.reviewer_institution}
              lastReviewedDate={scenario.trust_signals.last_medically_reviewed}
            />
          </section>
        )}
      </div>

      {/* Persistent Sticky Emergency Button */}
      <EmergencyCallButton />
    </div>
  );
}
