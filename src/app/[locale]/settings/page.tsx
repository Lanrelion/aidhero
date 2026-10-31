import { getTranslations } from 'next-intl/server';
import { SettingsView } from './SettingsView';
import { Locale } from '@/types';

export default async function SettingsPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
        <div className="flex items-center h-14 px-4">
          <h1 className="text-h3 font-bold text-text-primary capitalize">
            {t('nav.settings') || 'Settings'}
          </h1>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <SettingsView locale={locale} />
      </div>
    </div>
  );
}
