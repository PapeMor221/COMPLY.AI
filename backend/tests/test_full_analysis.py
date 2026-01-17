"""
Test the /analyze endpoint directly (without starting server).
"""

import sys
from pathlib import Path
import asyncio
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import the endpoint function directly
from main import analyze_compliance

TEST_REPO_URL = "https://github.com/LyCrash/FakeRepo4-COMPLY.AI"


async def test_full_analysis():
    """Test full analysis with all rules."""
    print("\n" + "=" * 60)
    print("TEST: Full Repository Analysis (All Rules)")
    print("=" * 60)

    print(f"\nRepository: {TEST_REPO_URL}")
    print(f"Analyzing...")

    # Call the endpoint function
    result = await analyze_compliance(repo_url=TEST_REPO_URL)

    # Display results
    print(f"\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)

    print(f"\nOverall Score: {result['overall_score']}/100")

    print(f"\n--- CONSENT ---")
    print(f"Score: {result['results']['consent']['score']}/100")
    print(f"Rules checked: {result['results']['consent']['rules_checked']}")
    print(f"Violations: {len(result['results']['consent']['violations'])}")

    print(f"\n--- SECURITY ---")
    print(f"Score: {result['results']['security']['score']}/100")
    print(f"Rules checked: {result['results']['security']['rules_checked']}")
    print(f"Violations: {len(result['results']['security']['violations'])}")

    print(f"\n--- LIFECYCLE ---")
    print(f"Score: {result['results']['lifecycle']['score']}/100")
    print(f"Rules checked: {result['results']['lifecycle']['rules_checked']}")
    print(f"Violations: {len(result['results']['lifecycle']['violations'])}")

    # Show some violations
    all_violations = (
        result["results"]["consent"]["violations"]
        + result["results"]["security"]["violations"]
        + result["results"]["lifecycle"]["violations"]
    )

    print(f"\n" + "=" * 60)
    print(f"TOTAL VIOLATIONS: {len(all_violations)}")
    print("=" * 60)

    if all_violations:
        print(f"\nShowing first 5 violations:")
        for i, v in enumerate(all_violations[:5], 1):
            print(f"\n{i}. [{v['severity'].upper()}] {v['issue']}")
            print(f"   File: {v['file']}")
            print(f"   Rule: {v.get('rule_id', 'N/A')}")
            print(f"   Fix: {v['recommendation'][:80]}...")

    print("\n" + "=" * 60)
    print("✓ ANALYSIS COMPLETE")
    print("=" * 60)

    return result


if __name__ == "__main__":
    asyncio.run(test_full_analysis())
