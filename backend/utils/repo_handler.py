"""
Repository handling utilities for COMPLY.AI.

Handles cloning GitHub repositories, listing files, and reading file contents.
"""

import shutil
from pathlib import Path
from typing import Dict, List
from git import Repo
from fastapi import HTTPException


# Directory to store cloned repositories
REPOS_DIR = Path("./cloned_repos")
REPOS_DIR.mkdir(exist_ok=True)

# File extensions to consider as code files
CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".tsx",
    ".ts",
    ".html",
    ".css",
    ".java",
    ".cpp",
    ".c",
    ".go",
    ".rb",
    ".php",
}

# File extensions for documentation
DOC_EXTENSIONS = {".md", ".txt", ".pdf", ".rst", ".adoc"}

# Directories to exclude from analysis
EXCLUDED_DIRS = {
    "node_modules",
    "dist",
    "build",
    ".git",
    "__pycache__",
    "venv",
    "env",
    ".venv",
    "vendor",
    "target",
    "bin",
    "obj",
    ".next",
    ".nuxt",
    "coverage",
    ".pytest_cache",
    ".mypy_cache",
}


def clone_repo(repo_url: str, max_size_mb: int = 100) -> str:
    """
    Clone a GitHub repository with shallow clone for efficiency.

    Args:
        repo_url: Full GitHub repository URL
        max_size_mb: Maximum repository size in MB (default: 100MB)

    Returns:
        Local path where repository is cloned

    Raises:
        HTTPException: If cloning fails or repo is too large
    """
    try:
        # Extract repo name from URL
        repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        repo_path = REPOS_DIR / repo_name

        # Remove existing directory if present
        if repo_path.exists():
            shutil.rmtree(repo_path)

        # Clone the repository (shallow clone for speed)
        Repo.clone_from(repo_url, repo_path, depth=1)

        # Check repository size
        repo_size_mb = sum(
            f.stat().st_size for f in repo_path.rglob("*") if f.is_file()
        ) / (1024 * 1024)
        if repo_size_mb > max_size_mb:
            shutil.rmtree(repo_path)
            raise HTTPException(
                status_code=413,
                detail=f"Repository too large: {repo_size_mb:.1f}MB (max: {max_size_mb}MB)",
            )

        return str(repo_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to clone repository: {str(e)}"
        )


def get_all_files(repo_path: str) -> Dict[str, List[str]]:
    """
    Get all relevant files from a repository, separated by type.

    Args:
        repo_path: Local path to the cloned repository

    Returns:
        Dictionary with two keys:
        - "code_files": List of paths to code files (relative to repo_path)
        - "doc_files": List of paths to documentation files (relative to repo_path)

    Example:
        {
            "code_files": ["src/app.js", "components/Banner.jsx"],
            "doc_files": ["docs/privacy.md", "README.md"]
        }
    """
    repo_path_obj = Path(repo_path)
    code_files = []
    doc_files = []

    # Traverse repository
    for file_path in repo_path_obj.rglob("*"):
        # Skip if it's not a file
        if not file_path.is_file():
            continue

        # Skip if it's in an excluded directory
        if any(excluded in file_path.parts for excluded in EXCLUDED_DIRS):
            continue

        # Get relative path from repo root
        relative_path = str(file_path.relative_to(repo_path_obj))

        # Categorize by extension
        extension = file_path.suffix.lower()
        if extension in CODE_EXTENSIONS:
            code_files.append(relative_path)
        elif extension in DOC_EXTENSIONS:
            doc_files.append(relative_path)

    return {"code_files": sorted(code_files), "doc_files": sorted(doc_files)}


def read_file(filepath: str, repo_path: str = None) -> str:
    """
    Read the contents of a file.

    Args:
        filepath: Path to the file (relative or absolute)
        repo_path: Optional repository root path (if filepath is relative)

    Returns:
        File contents as string

    Raises:
        FileNotFoundError: If file doesn't exist
        UnicodeDecodeError: If file cannot be decoded as text

    Note:
        Currently supports text files (.txt, .md) and code files.
        PDF support can be added later using pdf_parser.py
    """
    # Resolve full path
    if repo_path:
        full_path = Path(repo_path) / filepath
    else:
        full_path = Path(filepath)

    # Check if file exists
    if not full_path.exists():
        raise FileNotFoundError(f"File not found: {full_path}")

    # Check if it's a file
    if not full_path.is_file():
        raise ValueError(f"Not a file: {full_path}")

    # Read file contents
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        # Try with different encoding or treat as binary
        try:
            with open(full_path, "r", encoding="latin-1") as f:
                return f.read()
        except Exception as e:
            raise UnicodeDecodeError(
                "utf-8", b"", 0, 1, f"Cannot decode file {full_path} as text: {str(e)}"
            )
