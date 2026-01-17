import { ChevronRight, FileCode, MapPin } from "lucide-react";
import { Violation, CategoryType } from "@/types/analysis";

interface ViolationCardProps {
  violation: Violation;
  category: CategoryType;
  onViewDetails: (violation: Violation, category: CategoryType) => void;
}

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case "critical":
      return {
        cardClass: "severity-critical",
        badge: "badge-critical",
        emoji: "🔴",
        label: "Critical"
      };
    case "high":
      return {
        cardClass: "severity-high",
        badge: "badge-high",
        emoji: "🟠",
        label: "High"
      };
    case "medium":
      return {
        cardClass: "severity-medium",
        badge: "badge-medium",
        emoji: "🟡",
        label: "Medium"
      };
    case "low":
    default:
      return {
        cardClass: "severity-low",
        badge: "badge-low",
        emoji: "🟢",
        label: "Low"
      };
  }
};

export function ViolationCard({ violation, category, onViewDetails }: ViolationCardProps) {
  const config = getSeverityConfig(violation.severity);

  return (
    <div
      className={`violation-card ${config.cardClass} group`}
      onClick={() => onViewDetails(violation, category)}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={config.badge}>
            {config.emoji} {config.label}
          </span>
          <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
            {violation.article}
          </span>
        </div>
        <span className="text-xs text-muted-foreground/70 font-mono">
          {violation.rule_id}
        </span>
      </div>

      <h3 className="font-bold text-foreground text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors">
        {violation.issue}
      </h3>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-2.5 rounded-lg bg-muted/30">
        <FileCode className="w-4 h-4 text-primary/70 flex-shrink-0" />
        <span className="font-mono text-xs truncate">{violation.file}</span>
        {violation.line && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground/70 ml-auto flex-shrink-0">
            <MapPin className="w-3 h-3" />
            L{violation.line}
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-5">
        {violation.recommendation}
      </p>

      <div className="flex justify-end pt-3 border-t border-border/30">
        <span className="text-sm font-semibold text-primary flex items-center gap-1.5 group-hover:gap-3 transition-all duration-300">
          Voir les détails
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  );
}
