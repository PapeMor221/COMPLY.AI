// API Response Types

export interface Violation {
  file: string;
  line: number | null;
  severity: "critical" | "high" | "medium" | "low";
  issue: string;
  recommendation: string;
  article: string;
  rule_id: string;
  category?: "consent" | "security" | "lifecycle";
}

export interface CategoryResult {
  score: number;
  violations: Violation[];
  rules_checked: number;
}

export interface AnalysisResults {
  status: string;
  repo_url: string;
  overall_score: number;
  results: {
    consent: CategoryResult;
    security: CategoryResult;
    lifecycle: CategoryResult;
  };
}

export interface CommonViolation {
  issue: string;
  severity: string;
  explanation: string;
  recommendation: string;
}

export interface RGPDRule {
  id: string;
  title: string;
  article: string;
  article_url: string;
  priority: string;
  description: string;
  common_violations: CommonViolation[];
  best_practices: string[];
  required_sections: string[];
  must_contain_keywords: string[];
  must_not_contain: string[];
  phrases_to_avoid: string[];
  scoring: {
    base_score: number;
    critical_violation: number;
    [key: string]: number;
  };
}

export interface RuleResponse {
  status: string;
  rule: RGPDRule;
}

export type CategoryType = "consent" | "security" | "lifecycle";
export type SeverityType = "all" | "critical" | "high" | "medium" | "low";
