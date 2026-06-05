"use client";

import { SeverityBadge } from "./severity-badge";
import { cn } from "@/lib/utils";

interface IncidentCardProps {
  title: string;
  category: string;
  severity: "critical" | "urgent" | "moderate";
  icon: React.ElementType;
  onClick: () => void;
  className?: string;
}

export function IncidentCard({ title, category, severity, icon: Icon, onClick, className }: IncidentCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-4 bg-surface border border-border rounded-xl shadow-card active:bg-card-active transition-colors text-left",
        className
      )}
    >
      <div className="flex items-center justify-between w-full mb-3">
        <div className="w-10 h-10 flex items-center justify-center bg-card rounded-full text-emergency">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <SeverityBadge severity={severity} />
      </div>
      
      <h3 className="text-body-lg font-bold text-text-primary mb-1 line-clamp-2 leading-tight">
        {title}
      </h3>
      <p className="text-xs text-text-secondary capitalize">
        {category}
      </p>
    </button>
  );
}
