"""
End-to-end test for RGPD analyzer.

Tests the complete analysis pipeline with a single rule on the demo repository.
"""

import sys
from pathlib import Path
import asyncio
import json
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.repo_handler import clone_repo
from analyzer import analyze_rule
from utils.llm_client import FeatherlessClient


# Test repository
TEST_REPO_URL = "https://github.com/LyCrash/FakeRepo4-COMPLY.AI"


async def test_single_consent_rule():
    """Test analysis with a single consent rule."""
    print("\n" + "=" * 60)
    print("TEST: Single Rule Analysis (Consent)")
    print("=" * 60)

    # Load consent rule
    rules_path = Path(__file__).parent.parent / "data" / "rgpd_rules.json"
    with open(rules_path, "r", encoding="utf-8") as f:
        all_rules = json.load(f)

    consent_rule = all_rules["consent_rules"][0]  # consent_001

    print(f"\nRule: {consent_rule['id']} - {consent_rule['title']}")
    print(f"Article: {consent_rule['article']}")
    print(f"Check type: {consent_rule['check_type']}")

    # Clone repo
    print(f"\n1. Cloning repository...")
    repo_path = clone_repo(TEST_REPO_URL)
    print(f"   ✓ Cloned to: {repo_path}")

    # Analyze
    print(f"\n2. Analyzing with LLM...")
    llm_client = FeatherlessClient()

    result = await analyze_rule(consent_rule, repo_path, llm_client)

    # Display results
    print(f"\n3. Results:")
    print(f"   Rule ID: {result['rule_id']}")
    print(f"   Passed: {result['passed']}")
    print(f"   Score: {result['score']}/100")
    print(f"   Files analyzed: {len(result['files_analyzed'])}")

    if result["files_analyzed"]:
        print(f"\n   Files:")
        for f in result["files_analyzed"]:
            print(f"     - {f}")

    print(f"\n   Violations found: {len(result['violations'])}")

    if result["violations"]:
        print(f"\n   Details:")
        for i, v in enumerate(result["violations"], 1):
            print(f"\n   Violation {i}:")
            print(f"     File: {v.get('file')}")
            print(f"     Line: {v.get('line') or 'N/A'}")
            print(f"     Severity: {v.get('severity')}")
            print(f"     Issue: {v.get('issue')}")
            print(f"     Recommendation: {v.get('recommendation')}")

    # Assertions
    assert result["rule_id"] == consent_rule["id"]
    assert "score" in result
    assert 0 <= result["score"] <= 100
    assert isinstance(result["violations"], list)

    print("\n" + "=" * 60)
    print("✓ TEST PASSED")
    print("=" * 60)

    return result


async def test_single_security_rule():
    """Test analysis with a single security rule."""
    print("\n" + "=" * 60)
    print("TEST: Single Rule Analysis (Security)")
    print("=" * 60)

    # Load security rule
    rules_path = Path(__file__).parent.parent / "data" / "rgpd_rules.json"
    with open(rules_path, "r", encoding="utf-8") as f:
        all_rules = json.load(f)

    security_rule = all_rules["security_rules"][0]  # security_001

    print(f"\nRule: {security_rule['id']} - {security_rule['title']}")
    print(f"Article: {security_rule['article']}")

    # Clone repo
    print(f"\n1. Cloning repository...")
    repo_path = clone_repo(TEST_REPO_URL)
    print(f"   ✓ Cloned to: {repo_path}")

    # Analyze
    print(f"\n2. Analyzing with LLM...")
    llm_client = FeatherlessClient()

    result = await analyze_rule(security_rule, repo_path, llm_client)

    # Display results
    print(f"\n3. Results:")
    print(f"   Score: {result['score']}/100")
    print(f"   Violations: {len(result['violations'])}")

    if result["violations"]:
        for i, v in enumerate(result["violations"][:3], 1):  # Show first 3
            print(f"\n   Violation {i}: {v.get('issue')}")
            print(f"     File: {v.get('file')}")

    print("\n" + "=" * 60)
    print("✓ TEST PASSED")
    print("=" * 60)

    return result


def main():
    """Run end-to-end tests."""
    print("\n" + "=" * 60)
    print("COMPLY.AI - End-to-End Analysis Tests")
    print("=" * 60)

    try:
        # Test consent rule
        consent_result = asyncio.run(test_single_consent_rule())

        # Test security rule
        security_result = asyncio.run(test_single_security_rule())

        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  Consent score: {consent_result['score']}/100")
        print(f"  Security score: {security_result['score']}/100")
        print(
            f"  Total violations: {len(consent_result['violations']) + len(security_result['violations'])}"
        )

    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
