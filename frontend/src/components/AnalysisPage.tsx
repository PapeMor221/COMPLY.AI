import { useState } from "react";
import { Shield, Github, Rocket, Zap, Lock, Brain, Check, Loader2, Sparkles } from "lucide-react";
interface AnalysisOption {
  id: string;
  emoji: string;
  title: string;
  description: string;
  recommended: boolean;
  defaultChecked: boolean;
}
const ANALYSIS_OPTIONS: AnalysisOption[] = [{
  id: "rgpd",
  emoji: "🇪🇺",
  title: "RGPD Compliance",
  description: "Conformité RGPD complète",
  recommended: true,
  defaultChecked: true
}, {
  id: "aiact",
  emoji: "🤖",
  title: "AI Act Compliance",
  description: "Règlement européen IA",
  recommended: true,
  defaultChecked: true
}, {
  id: "pii",
  emoji: "🔍",
  title: "Détection PII",
  description: "Emails, IPs, données sensibles",
  recommended: true,
  defaultChecked: true
}, {
  id: "thirdparty",
  emoji: "🌐",
  title: "Flux données tiers",
  description: "OpenAI, Stripe, Firebase...",
  recommended: true,
  defaultChecked: true
}, {
  id: "legal",
  emoji: "📄",
  title: "Documentation légale",
  description: "Privacy Policy, CGU, DPA",
  recommended: true,
  defaultChecked: true
}, {
  id: "security",
  emoji: "🔐",
  title: "Audit sécurité",
  description: "Secrets hardcodés, vulnérabilités",
  recommended: false,
  defaultChecked: false
}];
const PROGRESS_MESSAGES = ["Clone du repository...", "Scan des fichiers source...", "Analyse IA en cours...", "Détection des données personnelles...", "Vérification conformité RGPD...", "Génération du rapport..."];
interface AnalysisPageProps {
  onAnalyze: (repoUrl: string, options: Record<string, boolean>) => void;
  isAnalyzing: boolean;
  analysisProgress: number;
  error?: string | null;
}
export function AnalysisPage({
  onAnalyze,
  isAnalyzing,
  analysisProgress,
  error
}: AnalysisPageProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ANALYSIS_OPTIONS.forEach(opt => {
      initial[opt.id] = opt.defaultChecked;
    });
    return initial;
  });
  const [urlTouched, setUrlTouched] = useState(false);
  const [shakeButton, setShakeButton] = useState(false);
  const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
  const isValidUrl = githubRegex.test(repoUrl.trim());
  const hasSelectedOption = Object.values(selectedOptions).some(Boolean);
  const canAnalyze = isValidUrl && hasSelectedOption && !isAnalyzing;
  const progressMessageIndex = Math.floor(analysisProgress / 100 * PROGRESS_MESSAGES.length);
  const currentProgressMessage = PROGRESS_MESSAGES[Math.min(progressMessageIndex, PROGRESS_MESSAGES.length - 1)];
  const toggleOption = (id: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const handleAnalyze = () => {
    if (!canAnalyze) {
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 500);
      return;
    }
    onAnalyze(repoUrl.trim(), selectedOptions);
  };
  const getInputClass = () => {
    if (!urlTouched) return "input-modern";
    if (isValidUrl) return "input-modern valid";
    return "input-modern invalid";
  };
  return <div className="min-h-screen gradient-hero-subtle dark:bg-background">
      {/* Header */}
      <header className="py-6 px-4 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-2xl gradient-primary gradient-glow">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-gradient">COMPLY.AI</span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">Compliance Copilot</span>
            </div>
          </div>
          <span className="badge-beta animate-pulse-slow">BETA</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-white/5 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight animate-fade-in leading-tight">
            Analysez la conformité de votre
            <span className="block mt-2 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              codebase en 30 secondes
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-12 animate-fade-in stagger-1 max-w-2xl mx-auto">
            RGPD, AI Act, sécurité des données — tout automatisé par IA
          </p>
          <div className="animate-float">
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-3xl bg-white/20 rounded-full scale-150" />
              <Github className="w-24 h-24 text-white/90 relative z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-4 -mt-16 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* URL Input Card */}
          <div className="glass-card-lg p-8 animate-slide-up">
            <label className="flex items-center gap-3 text-lg font-semibold text-foreground mb-5">
              <div className="p-2 rounded-xl bg-primary/10">
                <Github className="w-5 h-5 text-primary" />
              </div>
              URL de votre repository GitHub
            </label>
            <div className="relative">
              <input type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} onBlur={() => setUrlTouched(true)} placeholder="https://github.com/votre-org/votre-repo" className={getInputClass()} disabled={isAnalyzing} />
              {urlTouched && isValidUrl && <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <div className="p-1.5 rounded-full bg-success/10">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                </div>}
            </div>
            {urlTouched && !isValidUrl && repoUrl && <p className="text-destructive text-sm mt-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                Veuillez entrer une URL GitHub valide (ex: https://github.com/org/repo)
              </p>}
            <p className="text-muted-foreground text-sm mt-4">
              Nous analyserons votre code, vos configs et votre documentation
            </p>
            {error && <div className="mt-5 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>}
          </div>

          {/* Options Grid */}
          <div className="animate-slide-up stagger-2">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Que souhaitez-vous analyser ?
              </h2>
              <p className="text-muted-foreground">
                Sélectionnez au moins une option pour démarrer
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ANALYSIS_OPTIONS.map((option, index) => <button key={option.id} onClick={() => toggleOption(option.id)} disabled={isAnalyzing} className={`option-card text-left opacity-0 animate-scale-in ${selectedOptions[option.id] ? "selected" : ""}`} style={{
              animationDelay: `${index * 0.05}s`,
              animationFillMode: "forwards"
            }}>
                  {option.recommended && <span className="badge-recommended absolute -top-2.5 right-4">
                      RECOMMANDÉ
                    </span>}
                  <div className="flex items-start gap-4">
                    <div className={`checkbox-modern flex-shrink-0 ${selectedOptions[option.id] ? "checked" : ""}`}>
                      {selectedOptions[option.id] && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <div>
                      <span className="text-4xl block mb-3">{option.emoji}</span>
                      <h3 className="font-bold text-foreground mb-1.5">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>)}
            </div>
          </div>

          {/* Analyze Button */}
          <div className="animate-slide-up stagger-3">
            <button onClick={handleAnalyze} disabled={!canAnalyze} className={`btn-primary w-full py-6 text-xl gradient-glow ${shakeButton ? "animate-shake" : ""}`}>
              {isAnalyzing ? <>
                  <Loader2 className="w-6 h-6 animate-spin-slow" />
                  <span>Analyse en cours...</span>
                </> : <>
                  <Rocket className="w-6 h-6" />
                  <span>Lancer l'analyse complète</span>
                </>}
            </button>

            {/* Progress Bar */}
            {isAnalyzing && <div className="mt-8 space-y-4">
                <div className="progress-bar h-3">
                  <div className="progress-bar-fill primary animate-shimmer" style={{
                width: `${analysisProgress}%`
              }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground font-medium">
                    {currentProgressMessage}
                  </p>
                  <span className="text-primary font-bold">{analysisProgress}%</span>
                </div>
              </div>}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 animate-slide-up stagger-4">
            <div className="feature-card group">
              <div className="p-2 rounded-xl bg-warning/10 group-hover:bg-warning/15 transition-colors">
                <Zap className="w-6 h-6 text-warning" />
              </div>
              <span className="font-semibold text-foreground">Analyse en &lt; 1 min</span>
            </div>
            <div className="feature-card group">
              <div className="p-2 rounded-xl bg-success/10 group-hover:bg-success/15 transition-colors">
                <Lock className="w-6 h-6 text-success" />
              </div>
              <span className="font-semibold text-foreground">Code jamais stocké</span>
            </div>
            <div className="feature-card group">
              <div className="p-2 rounded-xl bg-secondary/10 group-hover:bg-secondary/15 transition-colors">
                <Brain className="w-6 h-6 text-secondary" />
              </div>
              <span className="font-semibold text-foreground">IA Claude Sonnet 4</span>
            </div>
          </div>
        </div>
      </main>
    </div>;
}