"""
Core analyzer for RGPD compliance checking.

Main analysis engine that processes rules against repository code and documentation.
"""

import json
from typing import Dict, List, Any
from pathlib import Path

from utils.repo_handler import get_all_files, read_file
from utils.file_selector import filter_by_keywords, select_best_files
from utils.llm_client import FeatherlessClient
from utils.json_parser import parse_json_response


async def analyze_rule(
    rule: Dict[str, Any], repo_path: str, llm_client: FeatherlessClient = None
) -> Dict[str, Any]:
    """
    Main analysis function for a single RGPD rule.

    Works for ANY rule type (consent/security/lifecycle).

    Steps:
    1. Get all files from repo
    2. Filter by keywords (code + docs separately)
    3. Select best 5 files total (LLM-based selection)
    4. Read those files
    5. Call LLM with rule prompt
    6. Parse JSON response
    7. Return result

    Args:
        rule: RGPD rule dictionary from rgpd_rules.json
        repo_path: Local path to cloned repository
        llm_client: Optional LLM client (creates new one if not provided)

    Returns:
        Analysis result dictionary:
        {
            "rule_id": str,
            "passed": bool,
            "violations": [...],
            "score": int,
            "files_analyzed": [...]
        }
    """
    if llm_client is None:
        llm_client = FeatherlessClient()

    # Get all files from repo
    all_files = get_all_files(repo_path)

    # Determine which files to analyze based on check_type
    check_type = rule.get("check_type", "both")
    code_files = []
    doc_files = []

    # Handle code files
    if check_type in ["code", "both"]:
        code_checks = rule.get("code_checks", {})
        if code_checks.get("enabled", False):
            # Filter by keywords
            keywords = code_checks.get("file_keywords", [])
            filtered_code = filter_by_keywords(all_files["code_files"], keywords)

            # Select best files (uses LLM if list is large)
            if filtered_code:
                code_files = await select_best_files(
                    filtered_code, rule, max_files=3, llm_client=llm_client
                )

    # Handle doc files
    if check_type in ["document", "both"]:
        # Analyze ALL documentation files
        doc_files = all_files["doc_files"]

    # Combine selected files
    selected_files = code_files + doc_files

    # If no files to analyze, return empty result
    if not selected_files:
        return {
            "rule_id": rule.get("id"),
            "passed": True,
            "violations": [],
            "score": 100,
            "files_analyzed": [],
            "note": "No relevant files found to analyze",
        }

    # Read file contents
    file_contents = {}
    for filepath in selected_files:
        try:
            content = read_file(filepath, repo_path)
            file_contents[filepath] = content
        except Exception as e:
            print(f"Warning: Could not read file {filepath}: {e}")

    # Call LLM for analysis
    try:
        result = await call_llm_for_rule(rule, file_contents, llm_client)

        # Add metadata
        result["rule_id"] = rule.get("id")
        result["files_analyzed"] = list(file_contents.keys())

        return result

    except Exception as e:
        print(f"Error analyzing rule {rule.get('id')}: {e}")
        return {
            "rule_id": rule.get("id"),
            "passed": None,
            "violations": [],
            "score": 0,
            "files_analyzed": list(file_contents.keys()),
            "error": str(e),
        }


async def call_llm_for_rule(
    rule: Dict[str, Any], file_contents: Dict[str, str], llm_client: FeatherlessClient
) -> Dict[str, Any]:
    """
    Build prompt from rule + file contents, call LLM, and parse response.

    Args:
        rule: RGPD rule dictionary
        file_contents: Dict mapping filepath -> file content
        llm_client: Featherless LLM client

    Returns:
        Parsed analysis result with violations and score
    """
    # Build system prompt from rule
    system_prompt = rule.get(
        "agent_prompt", rule.get("description", "Analyze for GDPR compliance.")
    )

    # Format file contents
    files_text = format_files(file_contents)

    # Extract red patterns and document checks
    code_checks = rule.get("code_checks", {})
    red_patterns = code_checks.get("red_patterns", [])
    document_checks = rule.get("document_checks", {})

    # Build user message
    user_message = f"""TASK: Analyze the following files for GDPR compliance violations.

RULE: {rule.get('title', 'Unknown')}
ARTICLE: {rule.get('article', 'N/A')}

FILES TO ANALYZE:
{files_text}

RED PATTERNS TO DETECT:
{json.dumps([{"pattern": p.get("pattern"), "severity": p.get("severity"), "explanation": p.get("explanation")} for p in red_patterns[:5]], indent=2)}

DOCUMENT REQUIREMENTS:
{json.dumps(document_checks, indent=2) if document_checks else "N/A"}

INSTRUCTIONS:
1. Check each file for violations of the patterns above
2. For each violation found, provide:
   - Exact file path
   - Line number (if possible, otherwise null)
   - Severity (critical/high/medium)
   - Clear issue description
   - Actionable recommendation
3. Calculate an overall compliance score (0-100)
   - 100 = fully compliant, no violations
   - 0 = severe violations

Return ONLY valid JSON in this exact format:
{{
  "passed": false,
  "violations": [
    {{
      "file": "src/cookie.js",
      "line": 42,
      "severity": "critical",
      "issue": "Pre-checked consent checkbox",
      "recommendation": "Remove checked attribute",
      "article": "{rule.get('article', '')}"
    }}
  ],
  "score": 45
}}
"""

    # Call LLM
    full_prompt = f"{system_prompt}\n\n{user_message}"

    response = await llm_client.generate_completion(
        prompt=full_prompt,
        max_tokens=2000,
        temperature=0.3,  # Low temperature for consistent analysis
    )

    # Parse response
    result = parse_json_response(response)

    return result


def format_files(file_contents: Dict[str, str]) -> str:
    """
    Format file contents for LLM prompt.

    Args:
        file_contents: Dict mapping filepath -> content

    Returns:
        Formatted string with file contents
    """
    formatted = []

    for filepath, content in file_contents.items():
        # Limit content length to avoid token overflow
        max_lines = 200
        lines = content.splitlines()

        if len(lines) > max_lines:
            content_preview = "\n".join(lines[:max_lines])
            content_preview += f"\n... [truncated, {len(lines) - max_lines} more lines]"
        else:
            content_preview = content

        formatted.append(
            f"""
===== FILE: {filepath} =====
{content_preview}
===== END OF {filepath} =====
"""
        )

    return "\n".join(formatted)


def aggregate_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate multiple rule results into category scores.

    Args:
        results: List of rule analysis results

    Returns:
        Aggregated results with average score and all violations
    """
    if not results:
        return {"score": 0, "violations": [], "rules_checked": 0}

    # Calculate average score (ignore None/error results)
    valid_scores = [
        r["score"]
        for r in results
        if r.get("score") is not None and isinstance(r.get("score"), (int, float))
    ]
    avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0

    # Collect all violations
    all_violations = []
    for result in results:
        violations = result.get("violations", [])
        for v in violations:
            # Add rule_id to violation for traceability
            v["rule_id"] = result.get("rule_id")
            all_violations.append(v)

    return {
        "score": round(avg_score),
        "violations": all_violations,
        "rules_checked": len(results),
    }
