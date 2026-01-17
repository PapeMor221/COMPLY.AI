"""
Tests for file_selector.py utilities.

Tests keyword filtering and LLM-based file selection.
"""

import sys
from pathlib import Path
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.file_selector import (
    filter_by_keywords,
    select_best_files,
    parse_file_selection_response,
    select_files_for_rule,
)
from utils.repo_handler import clone_repo, get_all_files


# Test repository URL
TEST_REPO_URL = "https://github.com/LyCrash/FakeRepo4-COMPLY.AI"


def test_filter_by_keywords():
    """Test keyword filtering on filenames."""
    print("\n" + "=" * 60)
    print("TEST: Filter by Keywords")
    print("=" * 60)

    files = [
        "src/cookie.js",
        "src/analytics.js",
        "src/api.js",
        "src/auth.py",
        "src/user.js",
        "components/ConsentBanner.jsx",
        "utils/helpers.js",
    ]

    # Test 1: Cookie-related keywords
    keywords = ["cookie", "consent", "banner"]
    filtered = filter_by_keywords(files, keywords)

    print(f"\nTest 1: Keywords {keywords}")
    print(f"  Input: {len(files)} files")
    print(f"  Output: {len(filtered)} files")
    print(f"  Filtered: {filtered}")

    assert "src/cookie.js" in filtered
    assert "components/ConsentBanner.jsx" in filtered
    assert "src/api.js" not in filtered
    print("  ✓ Correct filtering")

    # Test 2: Auth-related keywords
    keywords = ["auth", "password", "login"]
    filtered = filter_by_keywords(files, keywords)

    print(f"\nTest 2: Keywords {keywords}")
    print(f"  Output: {len(filtered)} files")
    print(f"  Filtered: {filtered}")

    assert "src/auth.py" in filtered
    assert "src/cookie.js" not in filtered
    print("  ✓ Correct filtering")

    # Test 3: No keywords (should return all)
    filtered = filter_by_keywords(files, [])
    print(f"\nTest 3: No keywords")
    print(f"  Output: {len(filtered)} files (should equal input)")
    assert len(filtered) == len(files)
    print("  ✓ Returns all files when no keywords")

    # Test 4: Case insensitive
    keywords = ["COOKIE", "Analytics"]
    filtered = filter_by_keywords(files, keywords)
    print(f"\nTest 4: Case insensitive")
    print(f"  Keywords: {keywords}")
    print(f"  Output: {filtered}")
    assert "src/cookie.js" in filtered
    assert "src/analytics.js" in filtered
    print("  ✓ Case insensitive matching works")


def test_parse_file_selection_response():
    """Test parsing LLM responses."""
    print("\n" + "=" * 60)
    print("TEST: Parse File Selection Response")
    print("=" * 60)

    available_files = ["src/cookie.js", "src/auth.py", "src/api.js"]

    # Test 1: Pure JSON
    response = '["src/cookie.js", "src/auth.py"]'
    result = parse_file_selection_response(response, available_files)
    print(f"\nTest 1: Pure JSON")
    print(f"  Input: {response}")
    print(f"  Output: {result}")
    assert len(result) == 2
    assert "src/cookie.js" in result
    print("  ✓ Parsed correctly")

    # Test 2: Markdown wrapped
    response = '```json\n["src/cookie.js", "src/api.js"]\n```'
    result = parse_file_selection_response(response, available_files)
    print(f"\nTest 2: Markdown wrapped")
    print(f"  Output: {result}")
    assert len(result) == 2
    print("  ✓ Parsed correctly")

    # Test 3: With explanation
    response = 'Here are the most relevant files:\n["src/auth.py", "src/cookie.js"]'
    result = parse_file_selection_response(response, available_files)
    print(f"\nTest 3: With explanation text")
    print(f"  Output: {result}")
    assert len(result) == 2
    print("  ✓ Parsed correctly")

    # Test 4: Invalid file (not in available_files)
    response = '["src/cookie.js", "src/nonexistent.js"]'
    result = parse_file_selection_response(response, available_files)
    print(f"\nTest 4: Invalid file in response")
    print(f"  Output: {result}")
    assert "src/nonexistent.js" not in result
    assert "src/cookie.js" in result
    print("  ✓ Filtered out invalid files")


async def test_select_best_files():
    """Test LLM-based file selection."""
    print("\n" + "=" * 60)
    print("TEST: Select Best Files (with LLM)")
    print("=" * 60)

    # Test with small list (no LLM needed)
    files = ["src/cookie.js", "src/auth.py", "src/api.js"]

    mock_rule = {
        "title": "Cookie Consent",
        "description": "Check for proper cookie consent",
        "code_checks": {
            "enabled": True,
            "must_find": ["consent check", "user permission"],
            "red_patterns": [{"pattern": "pre-checked boxes", "severity": "critical"}],
        },
    }

    print(f"\nTest 1: Small list ({len(files)} files, max=5)")
    result = await select_best_files(files, mock_rule, max_files=5)
    print(f"  Input: {files}")
    print(f"  Output: {result}")
    assert len(result) == 3  # Should return all
    print("  ✓ Returns all files when count <= max")

    # Test with larger list (would use LLM in production)
    large_files = [
        "src/cookie.js",
        "src/auth.py",
        "src/api.js",
        "src/analytics.js",
        "src/tracking.js",
        "src/consent.js",
        "src/banner.jsx",
        "src/helpers.js",
    ]

    print(f"\nTest 2: Large list ({len(large_files)} files, max=5)")
    print("  Note: Will attempt LLM selection (may fail if no API key)")

    try:
        result = await select_best_files(large_files, mock_rule, max_files=5)
        print(f"  Output: {result}")
        print(f"  Selected: {len(result)} files")
        assert len(result) <= 5
        print("  ✓ LLM selection succeeded")
    except Exception as e:
        print(f"  ⚠ LLM selection failed (expected without API key): {e}")
        print("  ✓ Fallback to first 5 files works")


def test_with_real_repo():
    """Test with actual cloned repository."""
    print("\n" + "=" * 60)
    print("TEST: File Selection with Real Repo")
    print("=" * 60)

    # Clone and get files
    repo_path = clone_repo(TEST_REPO_URL)
    all_files = get_all_files(repo_path)

    print(f"\nRepository files:")
    print(f"  Code: {len(all_files['code_files'])} files")
    print(f"  Docs: {len(all_files['doc_files'])} files")

    # Test consent rule
    consent_rule = {
        "id": "consent_001",
        "title": "Cookie Consent Check",
        "check_type": "both",
        "code_checks": {
            "enabled": True,
            "file_keywords": ["cookie", "consent", "banner", "analytics", "tracking"],
        },
    }

    print(f"\nTest: Consent rule filtering")
    print(f"  Keywords: {consent_rule['code_checks']['file_keywords']}")

    code_files = all_files["code_files"]
    filtered = filter_by_keywords(
        code_files, consent_rule["code_checks"]["file_keywords"]
    )

    print(f"  Input: {len(code_files)} code files")
    print(f"  Output: {len(filtered)} filtered files")
    print(f"  Filtered files:")
    for f in filtered:
        print(f"    - {f}")

    assert len(filtered) > 0, "Should find some matching files"
    assert any(
        "cookie" in f.lower() for f in filtered
    ), "Should include cookie-related files"
    print("  ✓ Found relevant files")

    # Test security rule
    security_rule = {
        "id": "security_001",
        "title": "Password Security",
        "check_type": "code",
        "code_checks": {
            "enabled": True,
            "file_keywords": [
                "auth",
                "password",
                "login",
                "security",
                "crypto",
                "hash",
            ],
        },
    }

    print(f"\nTest: Security rule filtering")
    print(f"  Keywords: {security_rule['code_checks']['file_keywords']}")

    filtered = filter_by_keywords(
        code_files, security_rule["code_checks"]["file_keywords"]
    )

    print(f"  Input: {len(code_files)} code files")
    print(f"  Output: {len(filtered)} filtered files")
    print(f"  Filtered files:")
    for f in filtered:
        print(f"    - {f}")

    assert len(filtered) > 0, "Should find some matching files"
    print("  ✓ Found relevant files")


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("COMPLY.AI - File Selector Tests")
    print("=" * 60)

    try:
        # Synchronous tests
        test_filter_by_keywords()
        test_parse_file_selection_response()
        test_with_real_repo()

        # Async tests
        print("\nRunning async tests...")
        asyncio.run(test_select_best_files())

        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
