import { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  FileCode,
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Tag,
  Lightbulb,
} from "lucide-react";
import { Violation, RGPDRule, CategoryType } from "@/types/analysis";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ViolationDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  violation: Violation | null;
  category: CategoryType | null;
  rule: RGPDRule | null;
  isLoadingRule: boolean;
}

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case "critical":
      return { badge: "badge-critical", emoji: "🔴", label: "Critical" };
    case "high":
      return { badge: "badge-high", emoji: "🟠", label: "High" };
    case "medium":
      return { badge: "badge-medium", emoji: "🟡", label: "Medium" };
    case "low":
    default:
      return { badge: "badge-low", emoji: "🟢", label: "Low" };
  }
};

export function ViolationDetailDrawer({
  isOpen,
  onClose,
  violation,
  category,
  rule,
  isLoadingRule,
}: ViolationDetailDrawerProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!violation) return null;

  const severityConfig = getSeverityConfig(violation.severity);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const generateCodeSnippet = () => {
    if (category === "consent") {
      return `// Check user consent before tracking
if (userHasConsent('analytics')) {
  initializeTracking();
}`;
    }
    if (category === "security") {
      return `// Ensure data encryption
const encryptedData = await encrypt(userData);
await secureStorage.save(encryptedData);`;
    }
    return `// Implement data lifecycle management
const retentionPolicy = {
  personalData: '2 years',
  logs: '30 days'
};`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[90%] lg:max-w-[80%] overflow-y-auto p-0 bg-background/95 backdrop-blur-xl border-l border-border/50">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Column - Violation Details */}
          <div className="flex-1 lg:w-[60%] p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-border/50 overflow-y-auto">
            <SheetHeader className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={severityConfig.badge}>
                  {severityConfig.emoji} {severityConfig.label}
                </span>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {violation.article}
                </span>
                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  {violation.rule_id}
                </span>
              </div>
              <SheetTitle className="text-2xl lg:text-3xl font-extrabold text-foreground text-left leading-tight">
                {violation.issue}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-8">
              {/* Location */}
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <FileCode className="w-4 h-4 text-primary" />
                  Localisation
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Fichier</span>
                    <p className="font-mono text-sm text-foreground bg-muted/30 px-3 py-2 rounded-lg">{violation.file}</p>
                  </div>
                  {violation.line && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Ligne</span>
                      <p className="flex items-center gap-2 font-mono text-sm text-foreground bg-muted/30 px-3 py-2 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {violation.line}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Catégorie</span>
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground capitalize bg-muted/30 px-3 py-2 rounded-lg">
                      <Tag className="w-3.5 h-3.5 text-secondary" />
                      {category}
                    </p>
                  </div>
                </div>
              </div>

              {/* Problem */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Problème détecté
                </h3>
                <p className="text-muted-foreground leading-relaxed bg-warning/5 border border-warning/20 p-4 rounded-xl">
                  {violation.recommendation}
                </p>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  <Lightbulb className="w-4 h-4 text-warning" />
                  Actions recommandées
                </h3>
                <ul className="space-y-3">
                  {[
                    "Vérifier si l'utilisateur a consenti avant d'exécuter le tracking",
                    "Implémenter un cookie banner pour demander le consentement",
                    "Stocker la décision utilisateur dans localStorage/cookies"
                  ].map((action, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-success/5 border border-success/20">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code Snippet */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                  📋 Code snippet suggéré
                </h3>
                <div className="relative">
                  <div className="code-block">
                    <pre className="whitespace-pre-wrap text-sm">{generateCodeSnippet()}</pre>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generateCodeSnippet())}
                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Copier"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {rule?.article_url && (
                  <a
                    href={rule.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir la documentation officielle
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - RGPD Rule Details */}
          <div className="lg:w-[40%] p-6 lg:p-8 bg-muted/20 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl gradient-primary">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
                  Règle RGPD
                </h2>
              </div>

              {isLoadingRule ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Chargement...</p>
                </div>
              ) : rule ? (
                <div className="space-y-6">
                  {/* Rule Title */}
                  <div className="glass-card p-5 space-y-3">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      🇪🇺 {rule.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full text-sm">
                        {rule.article}
                      </span>
                      {rule.article_url && (
                        <a
                          href={rule.article_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Lire sur EUR-Lex"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Description</h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      {rule.description}
                    </p>
                  </div>

                  {/* Common Violations */}
                  {rule.common_violations && rule.common_violations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        Violations courantes ({rule.common_violations.length})
                      </h4>
                      <ul className="space-y-2">
                        {rule.common_violations.map((cv, index) => (
                          <li
                            key={index}
                            className="text-sm text-foreground flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20"
                          >
                            <span className="badge-critical text-[10px] mt-0.5 whitespace-nowrap">
                              {cv.severity}
                            </span>
                            <span>{cv.issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Best Practices */}
                  {rule.best_practices && rule.best_practices.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        Bonnes pratiques ({rule.best_practices.length})
                      </h4>
                      <ul className="space-y-2">
                        {rule.best_practices.slice(0, 5).map((practice, index) => (
                          <li
                            key={index}
                            className="text-sm text-foreground flex items-start gap-3 p-3 rounded-xl bg-success/5 border border-success/20"
                          >
                            <span className="text-success text-lg">✓</span>
                            <span>{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Phrases to Avoid */}
                  {rule.phrases_to_avoid && rule.phrases_to_avoid.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-destructive" />
                        À ne pas faire
                      </h4>
                      <ul className="space-y-2">
                        {rule.phrases_to_avoid.slice(0, 4).map((phrase, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10"
                          >
                            <span className="text-destructive">✕</span>
                            <span className="italic">"{phrase}"</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Must Not Contain */}
                  {rule.must_not_contain && rule.must_not_contain.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        🚫 Termes à éviter
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {rule.must_not_contain.slice(0, 6).map((term, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full border border-destructive/20"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Impossible de charger les détails</p>
                  <p className="text-sm mt-1">Veuillez réessayer ultérieurement</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
