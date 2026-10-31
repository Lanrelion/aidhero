import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TrustSignalProps {
  reviewerName?: string;
  institution?: string;
  lastReviewedDate?: string;
}

export function TrustSignal({ reviewerName, institution, lastReviewedDate }: TrustSignalProps) {
  const t = useTranslations();
  const isPending = !reviewerName || reviewerName.toUpperCase().includes('PENDING');

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-warning/10 border border-warning/20 rounded-xl">
        <div className="flex items-center gap-2 text-warning">
          <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          <span className="text-body font-bold">{t('trust.pendingReview') || "Pending medical review"}</span>
        </div>
        <p className="text-xs text-text-secondary">
          {t('trust.pendingWarning') || "This information is awaiting verification by a certified medical professional. Use with caution."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-action/5 border border-action/20 rounded-xl">
      <div className="flex items-center gap-2 text-action">
        <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        <span className="text-body font-bold">{t('trust.reviewed') || "Medically Reviewed"}</span>
      </div>
      <div className="text-xs text-text-secondary leading-relaxed">
        <p>{t('trust.reviewedBy', { name: reviewerName }) || `Reviewed by ${reviewerName}`}</p>
        {institution && <p>{institution}</p>}
        {lastReviewedDate && (
          <p>{t('trust.lastReviewed', { date: new Date(lastReviewedDate).toLocaleDateString() }) || `Last reviewed: ${new Date(lastReviewedDate).toLocaleDateString()}`}</p>
        )}
      </div>
    </div>
  );
}
