"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronLeft, Phone, ArrowRight } from 'lucide-react';

import { useRescueStore } from '@/store/useRescueStore';
import { getDecisionTree } from '@/lib/data/decisionTrees';
import { ProgressIndicator } from '@/components/rescue/ProgressIndicator';
import { DecisionQuestion } from '@/components/rescue/DecisionQuestion';
import { getPrimaryEmergencyNumber } from '@/lib/data/emergencyNumbers';
import { Locale } from '@/types';

interface RescuePageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export default function RescuePage({ params }: RescuePageProps) {
  const { locale, slug } = use(params);
  const router = useRouter();
  const t = useTranslations();
  
  const tree = getDecisionTree(`${slug}-flow`);
  const { startRescue, currentNodeId, history, answerQuestion, goBack } = useRescueStore();
  
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);

  // Initialize rescue flow
  useEffect(() => {
    if (tree) {
      startRescue(slug, tree.root_node_id);
    }
  }, [slug, tree, startRescue]);

  if (!tree || !currentNodeId) {
    return null; // or a loading spinner
  }

  const currentNode = tree.nodes[currentNodeId];

  // If node is an instruction node, handle redirect
  if (currentNode?.type === 'instruction') {
    if (!isLoadingSteps) {
      setIsLoadingSteps(true);
      // Wait a tiny bit so the user sees the transition, then redirect
      setTimeout(() => {
        router.push(`/${locale}/incidents/${slug}/steps?variant=${currentNode.variant}`);
      }, 200);
    }
  }

  const handleAnswer = (nextId: string) => {
    setDirection('forward');
    answerQuestion(nextId);
  };

  const handleBack = () => {
    setDirection('back');
    if (history.length <= 1) {
      // At root node, go back to incident detail
      router.push(`/${locale}/incidents/${slug}`);
    } else {
      goBack();
    }
  };

  const animationClass = direction === 'forward' ? 'motion-safe:animate-in motion-safe:slide-in-from-right' : 'motion-safe:animate-in motion-safe:slide-in-from-left';

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center justify-between h-14 px-4">
          <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-card active:bg-card-active transition-colors text-text-primary"
            aria-label={t('rescue.back') || "Back"}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-md mx-auto w-full relative">
        {isLoadingSteps ? (
          <div className="text-center animate-pulse text-text-secondary font-bold text-lg">
            Loading your steps...
          </div>
        ) : (
          <div key={currentNodeId} className={`w-full flex flex-col gap-10 duration-200 ease-out fill-mode-both ${animationClass}`}>
            
            {currentNode?.type === 'question' && (
              <>
                <ProgressIndicator current={history.length} max={3} />
                <DecisionQuestion 
                  node={currentNode} 
                  locale={locale} 
                  onAnswer={handleAnswer} 
                />
              </>
            )}

            <div className="w-full flex justify-center mt-2">
              <Link 
                href={`/${locale}/incidents/${slug}/steps`}
                className="flex items-center gap-2 text-action font-bold hover:underline py-4"
              >
                Skip to quick steps
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        <a 
          href={`tel:${getPrimaryEmergencyNumber(null)}`} // Store context could be wired later
          className="flex items-center justify-center w-16 h-16 bg-emergency text-white rounded-full shadow-emergency active:scale-95 transition-transform"
          aria-label={t('emergency.callButton') || "Call Emergency"}
        >
          <Phone className="w-7 h-7" />
        </a>
      </div>
    </div>
  );
}
