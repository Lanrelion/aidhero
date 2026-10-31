import { redirect } from 'next/navigation';
import { Locale } from '@/types';

export default async function IncidentsPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params;
  redirect(`/${locale}`);
}
