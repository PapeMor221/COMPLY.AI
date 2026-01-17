"""
File selection utilities for COMPLY.AI.

Filters and selects most relevant files for RGPD rule analysis.
"""

import json
from typing import List, Dict
from utils.llm_client import FeatherlessClient


def filter_by_keywords(files: List[str], keywords: List[str]) -> List[str]:
    """
    Filter files containing keywords in filename.

    Args:
        files: List of file paths (relative to repo root)
        keywords: List of keywords to search for in filenames

    Returns:
        List of files whose names contain at least one keyword (case-insensitive)

    Example:
        files = ["src/cookie.js", "src/api.js", "src/auth.js"]
        keywords = ["cookie", "consent", "banner"]
        Returns: ["src/cookie.js"]
    """
    if not keywords:
        return files

    filtered = []
    keywords_lower = [k.lower() for k in keywords]

    for filepath in files:
        filename_lower = filepath.lower()
        # Check if any keyword is in the filepath
        if any(keyword in filename_lower for keyword in keywords_lower):
            filtered.append(filepath)

    return filtered


async def select_best_files(
    filtered_files: List[str],
    rule: Dict,
    max_files: int = 5,
    llm_client: FeatherlessClient = None,
) -> List[str]:
    """
    Use LLM to pick most relevant files from a filtered list.

    Args:
        filtered_files: Pre-filtered list of file paths
        rule: RGPD rule dict with context about what to check
        max_files: Maximum number of files to select (default: 5)
        llm_client: Optional LLM client (creates new one if not provided)

    Returns:
        List of selected file paths (up to max_files)

    Strategy:
        - If filtered_files <= max_files: return all
        - If filtered_files > max_files: use LLM to select best ones

    Note:
        LLM receives:
        - List of filenames
        - Rule description
        - What patterns to look for
        - Must return JSON array of filenames
    """
    # If we have few enough files, return them all
    if len(filtered_files) <= max_files:
        return filtered_files

    # If no files, return empty list
    if not filtered_files:
        return []

    # Use LLM to select best files
    if llm_client is None:
        llm_client = FeatherlessClient()

    # Build prompt for LLM
    system_prompt = """You are a file selection assistant for GDPR compliance analysis.
Given a list of files and what to check, select the most relevant files.
Return ONLY a JSON array of filenames, nothing else."""

    # Extract key info from rule
    rule_title = rule.get("title", "")
    rule_description = rule.get("description", "")
    must_find = rule.get("code_checks", {}).get("must_find", [])
    red_patterns = rule.get("code_checks", {}).get("red_patterns", [])

    # Get just pattern descriptions for context
    pattern_descriptions = [p.get("pattern", "") for p in red_patterns[:3]]

    user_prompt = f"""FILES:
{json.dumps(filtered_files, indent=2)}

RULE: {rule_title}
{rule_description}

MUST FIND: {json.dumps(must_find)}

PATTERNS TO DETECT: {json.dumps(pattern_descriptions)}

Select the {max_files} most relevant files for this analysis.
Return ONLY a JSON array like: ["file1.js", "file2.py", "file3.js"]
"""

    try:
        # Call LLM
        response = await llm_client.generate_completion(
            prompt=f"{system_prompt}\n\n{user_prompt}",
            max_tokens=500,
            temperature=0.3,  # Low temperature for consistent selection
        )

        # Parse response
        selected = parse_file_selection_response(response, filtered_files)

        # Ensure we don't exceed max_files
        return selected[:max_files]

    except Exception as e:
        # Fallback: return first max_files if LLM fails
        print(f"LLM selection failed: {e}. Using first {max_files} files.")
        return filtered_files[:max_files]


def parse_file_selection_response(
    response: str, filtered_files: List[str]
) -> List[str]:
    """
    Parse LLM response to extract selected filenames.

    Args:
        response: LLM response text (should be JSON array)
        filtered_files: Original list of files to validate against

    Returns:
        List of selected filenames

    Handles:
        - Pure JSON: ["file1.js", "file2.py"]
        - Markdown wrapped: ```json\n[...]\n```
        - Text + JSON: "Here are the files:\n[...]"
    """
    import re

    # Strip whitespace
    cleaned = response.strip()

    # Remove markdown code blocks
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0].strip()

    # Try to extract JSON array
    try:
        # Try direct JSON parse
        selected = json.loads(cleaned)

        if isinstance(selected, list):
            # Validate that files are in original list
            valid_files = [f for f in selected if f in filtered_files]
            return valid_files

    except json.JSONDecodeError:
        # Try to find JSON array with regex
        match = re.search(r"\[.*?\]", cleaned, re.DOTALL)
        if match:
            try:
                selected = json.loads(match.group())
                if isinstance(selected, list):
                    valid_files = [f for f in selected if f in filtered_files]
                    return valid_files
            except json.JSONDecodeError:
                pass

    # If all parsing fails, return empty list
    print(f"Failed to parse LLM file selection: {response[:100]}")
    return []


def select_files_for_rule(
    all_files: Dict[str, List[str]],
    rule: Dict,
    max_code_files: int = 5,
    llm_client: FeatherlessClient = None,
) -> Dict[str, List[str]]:
    """
    High-level function to select files based on rule type.

    Args:
        all_files: Dict with "code_files" and "doc_files" keys
        rule: RGPD rule specification
        max_code_files: Max code files to select (default: 5)
        llm_client: Optional LLM client

    Returns:
        Dict with "code_files" and "doc_files" to analyze

    Strategy:
        - check_type="document": Return all doc files, no code files
        - check_type="code": Filter + select code files, no doc files
        - check_type="both": Return all docs + filtered/selected code files
    """
    check_type = rule.get("check_type", "both")
    result = {"code_files": [], "doc_files": []}

    # Handle document files
    if check_type in ["document", "both"]:
        # Use ALL documentation files
        result["doc_files"] = all_files.get("doc_files", [])

    # Handle code files
    if check_type in ["code", "both"]:
        code_files = all_files.get("code_files", [])
        code_checks = rule.get("code_checks", {})

        if code_checks.get("enabled", False):
            # Step 1: Filter by keywords
            keywords = code_checks.get("file_keywords", [])
            filtered = filter_by_keywords(code_files, keywords)

            # Step 2: Select best files (uses LLM if needed)
            # Note: This will be async, so we return a coroutine
            result["code_files"] = (
                filtered  # Placeholder - caller should use select_best_files
            )

    return result
