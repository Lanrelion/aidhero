import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: "critical" | "urgent" | "moderate";
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const map = {
    critical: { label: "CRITICAL", bg: "bg-emergency", text: "text-text-inverse" },
    urgent: { label: "URGENT", bg: "bg-warning", text: "text-text-inverse" },
    moderate: { label: "MODERATE", bg: "bg-card-active", text: "text-emergency" } // fallback colors
  };

  const config = map[severity] || map.moderate;

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", config.bg, config.text, className)}>
      {config.label}
    </span>
  );
}
