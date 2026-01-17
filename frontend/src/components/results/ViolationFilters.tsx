import { CategoryType, SeverityType, AnalysisResults } from "@/types/analysis";
import { Filter, AlertTriangle } from "lucide-react";

interface ViolationFiltersProps {
  categoryFilter: CategoryType | "all";
  severityFilter: SeverityType;
  onCategoryChange: (category: CategoryType | "all") => void;
  onSeverityChange: (severity: SeverityType) => void;
  results: AnalysisResults;
  totalViolations: number;
}

export function ViolationFilters({
  categoryFilter,
  severityFilter,
  onCategoryChange,
  onSeverityChange,
  results,
  totalViolations
}: ViolationFiltersProps) {
  const getSeverityCounts = () => {
    const allViolations = [
      ...results.results.consent.violations,
      ...results.results.security.violations,
      ...results.results.lifecycle.violations,
    ];

    return {
      critical: allViolations.filter(v => v.severity === "critical").length,
      high: allViolations.filter(v => v.severity === "high").length,
      medium: allViolations.filter(v => v.severity === "medium").length,
      low: allViolations.filter(v => v.severity === "low").length,
    };
  };

  const severityCounts = getSeverityCounts();

  return (
    <div className="space-y-5">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange("all")}
          className={`filter-btn ${categoryFilter === "all" ? "active" : ""}`}
        >
          Tous
        </button>
        <button
          onClick={() => onCategoryChange("consent")}
          className={`filter-btn ${categoryFilter === "consent" ? "active" : ""}`}
        >
          🔐 Consent 
          <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white/10 text-xs">
            {results.results.consent.violations.length}
          </span>
        </button>
        <button
          onClick={() => onCategoryChange("security")}
          className={`filter-btn ${categoryFilter === "security" ? "active" : ""}`}
        >
          🔒 Security
          <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white/10 text-xs">
            {results.results.security.violations.length}
          </span>
        </button>
        <button
          onClick={() => onCategoryChange("lifecycle")}
          className={`filter-btn ${categoryFilter === "lifecycle" ? "active" : ""}`}
        >
          📋 Lifecycle
          <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white/10 text-xs">
            {results.results.lifecycle.violations.length}
          </span>
        </button>
      </div>

      {/* Severity Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Sévérité:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSeverityChange("all")}
            className={`filter-btn ${severityFilter === "all" ? "active" : ""}`}
          >
            Tous
          </button>
          <button
            onClick={() => onSeverityChange("critical")}
            className={`filter-btn ${severityFilter === "critical" ? "active" : ""}`}
          >
            🔴 Critiques ({severityCounts.critical})
          </button>
          <button
            onClick={() => onSeverityChange("high")}
            className={`filter-btn ${severityFilter === "high" ? "active" : ""}`}
          >
            🟠 High ({severityCounts.high})
          </button>
          <button
            onClick={() => onSeverityChange("medium")}
            className={`filter-btn ${severityFilter === "medium" ? "active" : ""}`}
          >
            🟡 Moyens ({severityCounts.medium})
          </button>
          <button
            onClick={() => onSeverityChange("low")}
            className={`filter-btn ${severityFilter === "low" ? "active" : ""}`}
          >
            🟢 Faibles ({severityCounts.low})
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 backdrop-blur-sm">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm font-semibold text-foreground">
            {totalViolations} violation{totalViolations > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
