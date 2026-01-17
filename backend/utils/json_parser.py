"""
JSON parsing utilities for COMPLY.AI.

Handles parsing LLM responses that may be wrapped in markdown or mixed with text.
"""

import json
import re
from typing import Dict, Any, Optional


def parse_json_response(response: str) -> Dict[str, Any]:
    """
    Parse LLM response to extract JSON.

    LLM might return:
    - Pure JSON: {"passed": false, ...}
    - With markdown: ```json\n{...}\n```
    - With text + JSON: "Here's the analysis:\n{...}"

    Args:
        response: Raw LLM response text

    Returns:
        Dictionary with parsed JSON structure

    Raises:
        ValueError: If no valid JSON found in response

    Expected structure:
        {
            "passed": bool,
            "violations": [
                {
                    "file": str,
                    "line": int,
                    "severity": str,
                    "issue": str,
                    "recommendation": str,
                    "article": str (optional)
                }
            ],
            "score": int (0-100)
        }
    """
    # Strip whitespace
    cleaned = response.strip()

    # Remove markdown code blocks
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0].strip()

    # Try direct JSON parse first
    try:
        result = json.loads(cleaned)
        return validate_and_sanitize_response(result)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON object with regex
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group())
            return validate_and_sanitize_response(result)
        except json.JSONDecodeError:
            pass

    # If all parsing fails, raise error
    raise ValueError(
        f"No valid JSON found in LLM response. First 200 chars: {response[:200]}"
    )


def validate_and_sanitize_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and sanitize parsed JSON to ensure expected structure.

    Args:
        data: Parsed JSON dictionary

    Returns:
        Validated and sanitized dictionary with all required fields
    """
    # Ensure required fields exist with defaults
    result = {
        "passed": data.get("passed", False),
        "violations": data.get("violations", []),
        "score": data.get("score", 0),
    }

    # Validate score is in range 0-100
    if not isinstance(result["score"], (int, float)):
        result["score"] = 0
    else:
        result["score"] = max(0, min(100, int(result["score"])))

    # Validate violations is a list
    if not isinstance(result["violations"], list):
        result["violations"] = []

    # Sanitize each violation
    sanitized_violations = []
    for violation in result["violations"]:
        if isinstance(violation, dict):
            sanitized_violations.append(
                {
                    "file": str(violation.get("file", "unknown")),
                    "line": (
                        int(violation.get("line", 0)) if violation.get("line") else None
                    ),
                    "severity": str(violation.get("severity", "medium")),
                    "issue": str(violation.get("issue", "No description")),
                    "recommendation": str(
                        violation.get("recommendation", "No recommendation")
                    ),
                    "article": (
                        str(violation.get("article", ""))
                        if violation.get("article")
                        else None
                    ),
                }
            )

    result["violations"] = sanitized_violations

    return result


def parse_llm_file_selection(response: str, available_files: list) -> list:
    """
    Parse LLM response for file selection.

    Args:
        response: LLM response (should be JSON array of filenames)
        available_files: List of valid filenames to validate against

    Returns:
        List of selected filenames
    """
    # Strip whitespace
    cleaned = response.strip()

    # Remove markdown code blocks
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0].strip()

    # Try direct JSON parse
    try:
        selected = json.loads(cleaned)
        if isinstance(selected, list):
            # Validate files are in available list
            return [f for f in selected if f in available_files]
    except json.JSONDecodeError:
        pass

    # Try to extract JSON array with regex
    match = re.search(r"\[.*?\]", cleaned, re.DOTALL)
    if match:
        try:
            selected = json.loads(match.group())
            if isinstance(selected, list):
                return [f for f in selected if f in available_files]
        except json.JSONDecodeError:
            pass

    # If all parsing fails, return empty list
    return []
