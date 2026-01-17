import { CategoryResult } from "@/types/analysis";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CategoryScoreCardProps {
  title: string;
  emoji: string;
  result: CategoryResult;
}

const getScoreBarColor = (score: number) => {
  if (score < 50) return "critical";
  if (score < 70) return "warning";
  if (score < 85) return "warning";
  return "success";
};

const getScoreStatus = (score: number, rulesChecked: number) => {
  if (rulesChecked === 0) return { 
    emoji: "⚪", 
    text: "NON ANALYSÉ", 
    color: "text-muted-foreground",
    bg: "bg-muted/50" 
  };
  if (score < 50) return { 
    emoji: "🔴", 
    text: "CRITIQUE", 
    color: "text-destructive",
    bg: "bg-destructive/10" 
  };
  if (score < 70) return { 
    emoji: "🟠", 
    text: "ATTENTION", 
    color: "text-orange",
    bg: "bg-orange/10" 
  };
  if (score < 85) return { 
    emoji: "🟡", 
    text: "ACCEPTABLE", 
    color: "text-warning",
    bg: "bg-warning/10" 
  };
  return { 
    emoji: "🟢", 
    text: "BON", 
    color: "text-success",
    bg: "bg-success/10" 
  };
};

const getTrendIcon = (score: number) => {
  if (score < 50) return <TrendingDown className="w-4 h-4" />;
  if (score >= 85) return <TrendingUp className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
};

export function CategoryScoreCard({ title, emoji, result }: CategoryScoreCardProps) {
  const status = getScoreStatus(result.score, result.rules_checked);

  return (
    <div className="category-card group">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${status.bg}`}>
          <span className={`text-xs font-bold ${status.color}`}>
            {status.emoji} {status.text}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-foreground tabular-nums">
              {result.score}
            </span>
            <span className="text-xl text-muted-foreground font-medium">/100</span>
          </div>
          <div className={`flex items-center gap-1 ${status.color}`}>
            {getTrendIcon(result.score)}
          </div>
        </div>

        <div className="progress-bar h-2.5 rounded-full">
          <div
            className={`progress-bar-fill ${getScoreBarColor(result.score)}`}
            style={{ width: `${result.score}%` }}
          />
        </div>

        <div className="flex justify-between text-sm pt-2 border-t border-border/50">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Violations</span>
            <span className="font-bold text-foreground text-lg">{result.violations.length}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Règles vérifiées</span>
            <span className="font-bold text-foreground text-lg">{result.rules_checked}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
