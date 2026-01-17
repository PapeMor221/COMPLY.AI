"""
Tests for repo_handler.py utilities.

Tests cloning repositories, listing files, and reading file contents.
"""

import sys
from pathlib import Path
import shutil

# Add parent directory to path to import utils
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.repo_handler import clone_repo, get_all_files, read_file


# Test repository URL
TEST_REPO_URL = "https://github.com/LyCrash/FakeRepo4-COMPLY.AI"


def test_clone_repo():
    """Test cloning a GitHub repository."""
    print("\n" + "=" * 60)
    print("TEST: Clone Repository")
    print("=" * 60)

    # Clone the test repository
    repo_path = clone_repo(TEST_REPO_URL)

    print(f"✓ Repository cloned to: {repo_path}")

    # Verify the path exists
    assert Path(repo_path).exists(), "Repository path should exist"
    assert Path(repo_path).is_dir(), "Repository path should be a directory"

    print(f"✓ Path exists and is a directory")

    # Check for common files/folders
    repo_path_obj = Path(repo_path)
    files = list(repo_path_obj.iterdir())

    print(f"✓ Found {len(files)} files/directories in repo")
    print(f"  Contents: {[f.name for f in files[:10]]}")

    return repo_path


def test_get_all_files():
    """Test getting all files from a repository."""
    print("\n" + "=" * 60)
    print("TEST: Get All Files")
    print("=" * 60)

    # Clone repo first
    repo_path = clone_repo(TEST_REPO_URL)

    # Get all files
    files = get_all_files(repo_path)

    print(f"✓ Retrieved file lists")
    print(f"  Code files: {len(files['code_files'])}")
    print(f"  Doc files: {len(files['doc_files'])}")

    # Verify structure
    assert isinstance(files, dict), "Should return a dictionary"
    assert "code_files" in files, "Should have code_files key"
    assert "doc_files" in files, "Should have doc_files key"
    assert isinstance(files["code_files"], list), "code_files should be a list"
    assert isinstance(files["doc_files"], list), "doc_files should be a list"

    print(f"✓ Structure is correct")

    # Display some files
    if files["code_files"]:
        print(f"\n  Sample code files:")
        for f in files["code_files"][:5]:
            print(f"    - {f}")

    if files["doc_files"]:
        print(f"\n  Sample doc files:")
        for f in files["doc_files"][:5]:
            print(f"    - {f}")

    return repo_path, files


def test_read_file():
    """Test reading file contents."""
    print("\n" + "=" * 60)
    print("TEST: Read Files")
    print("=" * 60)

    # Clone repo and get files
    repo_path = clone_repo(TEST_REPO_URL)
    files = get_all_files(repo_path)

    # Test reading a doc file if available
    if files["doc_files"]:
        doc_file = files["doc_files"][0]
        print(f"\nReading doc file: {doc_file}")

        content = read_file(doc_file, repo_path)

        print(f"✓ Successfully read file")
        print(f"  Length: {len(content)} characters")
        print(f"  Lines: {len(content.splitlines())} lines")
        print(f"\n  First 200 characters:")
        print(f"  {'-'*50}")
        print(f"  {content[:200]}")
        print(f"  {'-'*50}")

        assert isinstance(content, str), "Should return a string"
        assert len(content) > 0, "File should have content"

    # Test reading a code file if available
    if files["code_files"]:
        code_file = files["code_files"][0]
        print(f"\nReading code file: {code_file}")

        content = read_file(code_file, repo_path)

        print(f"✓ Successfully read file")
        print(f"  Length: {len(content)} characters")
        print(f"  Lines: {len(content.splitlines())} lines")
        print(f"\n  First 200 characters:")
        print(f"  {'-'*50}")
        print(f"  {content[:200]}")
        print(f"  {'-'*50}")

        assert isinstance(content, str), "Should return a string"
        assert len(content) > 0, "File should have content"

    # Test reading with absolute path
    if files["doc_files"]:
        doc_file_abs = Path(repo_path) / files["doc_files"][0]
        print(f"\nReading with absolute path: {doc_file_abs}")

        content = read_file(str(doc_file_abs))

        print(f"✓ Successfully read file with absolute path")
        print(f"  Length: {len(content)} characters")

        assert isinstance(content, str), "Should return a string"
        assert len(content) > 0, "File should have content"


def test_read_nonexistent_file():
    """Test reading a file that doesn't exist."""
    print("\n" + "=" * 60)
    print("TEST: Read Nonexistent File (Error Handling)")
    print("=" * 60)

    repo_path = clone_repo(TEST_REPO_URL)

    # Try to read a file that doesn't exist
    try:
        read_file("nonexistent_file.txt", repo_path)
        print("✗ Should have raised FileNotFoundError")
        assert False, "Should have raised FileNotFoundError"
    except FileNotFoundError:
        print("✓ Correctly raised FileNotFoundError for nonexistent file")


def test_full_workflow():
    """Test the complete workflow: clone -> list -> read multiple files."""
    print("\n" + "=" * 60)
    print("TEST: Full Workflow")
    print("=" * 60)

    # Step 1: Clone
    print("\n1. Cloning repository...")
    repo_path = clone_repo(TEST_REPO_URL)
    print(f"   ✓ Cloned to: {repo_path}")

    # Step 2: Get all files
    print("\n2. Getting all files...")
    files = get_all_files(repo_path)
    print(f"   ✓ Found {len(files['code_files'])} code files")
    print(f"   ✓ Found {len(files['doc_files'])} doc files")

    # Step 3: Read multiple files
    print("\n3. Reading files...")
    files_read = 0
    total_chars = 0

    # Read up to 3 doc files
    for doc_file in files["doc_files"][:3]:
        content = read_file(doc_file, repo_path)
        files_read += 1
        total_chars += len(content)
        print(f"   ✓ Read {doc_file} ({len(content)} chars)")

    # Read up to 3 code files
    for code_file in files["code_files"][:3]:
        content = read_file(code_file, repo_path)
        files_read += 1
        total_chars += len(content)
        print(f"   ✓ Read {code_file} ({len(content)} chars)")

    print(f"\n4. Summary:")
    print(f"   ✓ Successfully read {files_read} files")
    print(f"   ✓ Total content: {total_chars} characters")

    assert files_read > 0, "Should have read at least one file"
    assert total_chars > 0, "Should have read some content"


if __name__ == "__main__":
    """Run tests manually without pytest."""
    print("\n" + "=" * 60)
    print("COMPLY.AI - Repo Handler Tests")
    print("=" * 60)

    try:
        test_clone_repo()
        test_get_all_files()
        test_read_file()
        test_read_nonexistent_file()
        test_full_workflow()

        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback

        traceback.print_exc()
