import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { categories, scenarios } from '@/lib/data/scenarios';
import { CategoryClientView } from './category-client-view';

export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ locale: string; category: string }> 
}) {
  const resolvedParams = await params;
  const { locale, category: categoryId } = resolvedParams;

  const categoryDef = categories.find(c => c.id === categoryId);
  
  if (!categoryDef) {
    notFound();
  }

  // Filter scenarios for this category
  const categoryScenarios = scenarios.filter(s => s.category === categoryId);

  return (
    <CategoryClientView 
      locale={locale}
      categoryId={categoryId}
      scenarios={categoryScenarios}
    />
  );
}
