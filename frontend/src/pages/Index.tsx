import { useState } from "react";
import { AnalysisPage } from "@/components/AnalysisPage";
import { ResultsPage } from "@/components/ResultsPage";
import { AnalysisResults } from "@/types/analysis";

const API_BASE_URL = "https://comply-ai.onrender.com";

const Index = () => {
  const [currentPage, setCurrentPage] = useState<"analysis" | "results">("analysis");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeCompliance = async (repoUrl: string, _options: Record<string, boolean>) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 400);

    try {
      // Call real API
      const formData = new FormData();
      formData.append("repo_url", repoUrl);

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data: AnalysisResults = await response.json();

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setTimeout(() => {
        setResults(data);
        setIsAnalyzing(false);
        setCurrentPage("results");
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      console.error("Analysis error:", err);
    }
  };

  const handleNewAnalysis = () => {
    setResults(null);
    setAnalysisProgress(0);
    setError(null);
    setCurrentPage("analysis");
  };

  if (currentPage === "results" && results) {
    return <ResultsPage results={results} onNewAnalysis={handleNewAnalysis} />;
  }

  return (
    <AnalysisPage
      onAnalyze={analyzeCompliance}
      isAnalyzing={isAnalyzing}
      analysisProgress={analysisProgress}
      error={error}
    />
  );
};

export default Index;
