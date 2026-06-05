import { useTranslations } from 'next-intl';

export default function Home() {
  const tHome = useTranslations('home');
  const tNav = useTranslations('nav');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">{tHome('title')}</h1>
      <p className="text-xl mb-8">{tHome('subtitle')}</p>
      
      <div className="flex gap-4">
        <span className="px-4 py-2 bg-[--color-surface] rounded border">{tNav('home')}</span>
        <span className="px-4 py-2 bg-[--color-surface] rounded border">{tNav('search')}</span>
        <span className="px-4 py-2 bg-[--color-surface] rounded border">{tNav('emergency')}</span>
      </div>
    </main>
  );
}
