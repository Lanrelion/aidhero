import { setRequestLocale } from 'next-intl/server';
import { OfflineSettingsView } from './OfflineSettingsView';

export default async function OfflineSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OfflineSettingsView />;
}
