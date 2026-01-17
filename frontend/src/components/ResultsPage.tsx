import { useState, useCallback } from "react";
import { Github, ArrowLeft, Download, AlertTriangle, Shield, Sparkles, Loader2 } from "lucide-react";
import {
  AnalysisResults,
  Violation,
  CategoryType,
  SeverityType,
  RGPDRule,
} from "@/types/analysis";
import { ScoreCircle } from "./results/ScoreCircle";
import { CategoryScoreCard } from "./results/CategoryScoreCard";
import { ViolationCard } from "./results/ViolationCard";
import { ViolationFilters } from "./results/ViolationFilters";
import { ViolationDetailDrawer } from "./results/ViolationDetailDrawer";
import { generateComplianceReport } from "@/lib/generatePDF";

interface ResultsPageProps {
  results: AnalysisResults;
  onNewAnalysis: () => void;
}

const API_BASE_URL = "https://comply-ai.onrender.com";

const CATEGORY_API_MAP: Record<CategoryType, string> = {
  consent: "consent_rules",
  security: "security_rules",
  lifecycle: "data_lifecycle_rules",
};

export function ResultsPage({ results, onNewAnalysis }: ResultsPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityType>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedRule, setSelectedRule] = useState<RGPDRule | null>(null);
  const [isLoadingRule, setIsLoadingRule] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const repoName = results.repo_url.replace("https://github.com/", "");

  const fetchRuleDetails = useCallback(async (category: CategoryType, ruleId: string) => {
    setIsLoadingRule(true);
    setSelectedRule(null);

    try {
      const apiCategory = CATEGORY_API_MAP[category];
      const response = await fetch(
        `${API_BASE_URL}/rgpd-rules/${apiCategory}/${ruleId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rule: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success" && data.rule) {
        setSelectedRule(data.rule);
      }
    } catch (error) {
      console.error("Error fetching rule details:", error);
    } finally {
      setIsLoadingRule(false);
    }
  }, []);

  const handleViewDetails = useCallback((violation: Violation, category: CategoryType) => {
    setSelectedViolation(violation);
    setSelectedCategory(category);
    setIsDrawerOpen(true);
    
    if (violation.rule_id) {
      fetchRuleDetails(category, violation.rule_id);
    }
  }, [fetchRuleDetails]);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      generateComplianceReport(results);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedViolation(null);
    setSelectedCategory(null);
    setSelectedRule(null);
  };

  const getFilteredViolations = useCallback(() => {
    let allViolations: (Violation & { category: CategoryType })[] = [];

    if (categoryFilter === "all" || categoryFilter === "consent") {
      allViolations = [
        ...allViolations,
        ...results.results.consent.violations.map((v) => ({ ...v, category: "consent" as CategoryType })),
      ];
    }
    if (categoryFilter === "all" || categoryFilter === "security") {
      allViolations = [
        ...allViolations,
        ...results.results.security.violations.map((v) => ({ ...v, category: "security" as CategoryType })),
      ];
    }
    if (categoryFilter === "all" || categoryFilter === "lifecycle") {
      allViolations = [
        ...allViolations,
        ...results.results.lifecycle.violations.map((v) => ({ ...v, category: "lifecycle" as CategoryType })),
      ];
    }

    if (severityFilter !== "all") {
      allViolations = allViolations.filter((v) => v.severity === severityFilter);
    }

    return allViolations;
  }, [categoryFilter, severityFilter, results]);

  const filteredViolations = getFilteredViolations();

  return (
    <div className="min-h-screen gradient-hero-subtle dark:bg-background pb-24">
      {/* Header */}
      <header className="py-5 px-4 bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={onNewAnalysis} className="btn-ghost group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Nouvelle analyse</span>
          </button>

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/50 backdrop-blur-sm">
            <Github className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground text-sm sm:text-base">{repoName}</span>
          </div>

          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="btn-outline"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isGeneratingPDF ? "Génération..." : "Télécharger PDF"}
            </span>
          </button>
        </div>
      </header>

      <main className="px-4 py-10 max-w-7xl mx-auto space-y-10">
        {/* Score Hero */}
        <div className="relative p-10 animate-fade-in overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-full blur-3xl animate-float" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-8 animate-scale-in">
              <Sparkles className="w-4 h-4 text-primary animate-pulse-slow" />
              <span className="text-sm font-semibold text-primary">Score de conformité global</span>
            </div>
            <ScoreCircle score={results.overall_score} />
          </div>
        </div>

        {/* Category Scores */}
        <div className="grid md:grid-cols-3 gap-5 animate-slide-up">
          <CategoryScoreCard
            title="CONSENT"
            emoji="🔐"
            result={results.results.consent}
          />
          <CategoryScoreCard
            title="SECURITY"
            emoji="🔒"
            result={results.results.security}
          />
          <CategoryScoreCard
            title="LIFECYCLE"
            emoji="📋"
            result={results.results.lifecycle}
          />
        </div>

        {/* Violations Section */}
        <div className="glass-card p-6 md:p-8 animate-slide-up stagger-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-destructive/10">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Violations détectées
              </h2>
              <p className="text-sm text-muted-foreground">
                Cliquez sur une violation pour voir les détails
              </p>
            </div>
          </div>

          {/* Filters */}
          <ViolationFilters
            categoryFilter={categoryFilter}
            severityFilter={severityFilter}
            onCategoryChange={setCategoryFilter}
            onSeverityChange={setSeverityFilter}
            results={results}
            totalViolations={filteredViolations.length}
          />

          {/* Violations Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {filteredViolations.map((violation, index) => (
              <div 
                key={`${violation.category}-${violation.rule_id}-${index}`}
                className="opacity-0 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: "forwards" }}
              >
                <ViolationCard
                  violation={violation}
                  category={violation.category}
                  onViewDetails={handleViewDetails}
                />
              </div>
            ))}
          </div>

          {filteredViolations.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <Shield className="w-10 h-10 opacity-50" />
              </div>
              <p className="font-semibold text-lg">Aucune violation trouvée</p>
              <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
            </div>
          )}
        </div>
      </main>

      {/* Violation Detail Drawer */}
      <ViolationDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        violation={selectedViolation}
        category={selectedCategory}
        rule={selectedRule}
        isLoadingRule={isLoadingRule}
      />
    </div>
  );
}
