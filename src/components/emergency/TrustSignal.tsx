import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface TrustSignalProps {
  reviewerName?: string;
  institution?: string;
  lastReviewedDate?: string;
}

export function TrustSignal({ reviewerName, institution, lastReviewedDate }: TrustSignalProps) {
  const isPending = !reviewerName || reviewerName.toUpperCase().includes('PENDING');

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-warning/10 border border-warning/20 rounded-xl">
        <div className="flex items-center gap-2 text-warning">
          <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          <span className="text-body font-bold">Pending medical review</span>
        </div>
        <p className="text-xs text-text-secondary">
          This information is awaiting verification by a certified medical professional. Use with caution.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-action/5 border border-action/20 rounded-xl">
      <div className="flex items-center gap-2 text-action">
        <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        <span className="text-body font-bold">Medically Reviewed</span>
      </div>
      <div className="text-xs text-text-secondary leading-relaxed">
        <p>Reviewed by <span className="font-medium text-text-primary">{reviewerName}</span></p>
        {institution && <p>{institution}</p>}
        {lastReviewedDate && (
          <p>Last reviewed: {new Date(lastReviewedDate).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}
