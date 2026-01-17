from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os
from dotenv import load_dotenv
import shutil
from git import Repo
from pathlib import Path
import json

load_dotenv()

# Directory to store cloned repositories
REPOS_DIR = Path("./cloned_repos")
REPOS_DIR.mkdir(exist_ok=True)

# Load RGPD rules
RGPD_RULES_PATH = Path(__file__).parent / "data" / "rgpd_rules.json"
with open(RGPD_RULES_PATH, "r", encoding="utf-8") as f:
    RGPD_RULES = json.load(f)

app = FastAPI(title="COMPLY.AI - RGPD Compliance Scanner")

# CORS configuration - allow all origins for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clone_github_repo(repo_url: str) -> str:
    """
    Clone a GitHub repository and return the local path.
    
    Args:
        repo_url: Full GitHub repository URL
        
    Returns:
        Local path where repository is cloned
        
    Raises:
        HTTPException: If cloning fails
    """
    try:
        # Extract repo name from URL
        repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        repo_path = REPOS_DIR / repo_name
        
        # Remove existing directory if present
        if repo_path.exists():
            shutil.rmtree(repo_path)
        
        # Clone the repository
        Repo.clone_from(repo_url, repo_path)
        return str(repo_path)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")


def extract_rule_info(rule: dict) -> dict:
    """
    Extract relevant information from a RGPD rule for frontend display.
    
    Args:
        rule: Complete rule object from rgpd_rules.json
        
    Returns:
        Filtered rule with only frontend-relevant information
    """
    return {
        "id": rule.get("id"),
        "title": rule.get("title"),
        "article": rule.get("article"),
        "article_url": rule.get("article_url"),
        "priority": rule.get("priority"),
        "description": rule.get("description", ""),
        "code_checks": {
            "enabled": rule.get("code_checks", {}).get("enabled", False),
            "red_patterns": [
                {
                    "pattern": p.get("pattern"),
                    "severity": p.get("severity"),
                    "explanation": p.get("explanation"),
                    "recommendation": p.get("recommendation")
                }
                for p in rule.get("code_checks", {}).get("red_patterns", [])
            ],
            "green_patterns": [
                {
                    "pattern": p.get("pattern"),
                    "explanation": p.get("explanation")
                }
                for p in rule.get("code_checks", {}).get("green_patterns", [])
            ]
        },
        "document_checks": {
            "enabled": rule.get("document_checks", {}).get("enabled", False),
            "required_sections": rule.get("document_checks", {}).get("required_sections", []),
            "must_contain_keywords": rule.get("document_checks", {}).get("must_contain_keywords", []),
            "must_not_contain": rule.get("document_checks", {}).get("must_not_contain", []),
            "red_flags_text": [
                {
                    "text": f.get("text"),
                    "severity": f.get("severity"),
                    "explanation": f.get("explanation")
                }
                for f in rule.get("document_checks", {}).get("red_flags_text", [])
            ],
            "green_flags_text": rule.get("document_checks", {}).get("green_flags_text", [])
        },
        "scoring": rule.get("scoring", {})
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "COMPLY.AI Backend"}


@app.get("/rgpd-rules")
async def get_all_rgpd_rules():
    """
    Get all RGPD compliance rules for frontend display.
    
    Returns all rules organized by category (consent, security, lifecycle, etc.)
    """
    try:
        all_rules = {}
        for category, rules_list in RGPD_RULES.items():
            all_rules[category] = [extract_rule_info(rule) for rule in rules_list]
        
        return {
            "status": "success",
            "total_categories": len(all_rules),
            "rules": all_rules
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load RGPD rules: {str(e)}")


@app.get("/rgpd-rules/{category}")
async def get_rgpd_rules_by_category(category: str):
    """
    Get RGPD rules for a specific category (consent, security, lifecycle, etc.).
    
    Args:
        category: Rule category (e.g., 'consent_rules', 'security_rules', 'lifecycle_rules')
        
    Returns:
        Rules for the specified category
    """
    try:
        if category not in RGPD_RULES:
            raise HTTPException(
                status_code=404,
                detail=f"Category '{category}' not found. Available categories: {list(RGPD_RULES.keys())}"
            )
        
        rules = RGPD_RULES[category]
        extracted_rules = [extract_rule_info(rule) for rule in rules]
        
        return {
            "status": "success",
            "category": category,
            "total_rules": len(extracted_rules),
            "rules": extracted_rules
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load rules: {str(e)}")


@app.get("/rgpd-rules/{category}/{rule_id}")
async def get_specific_rgpd_rule(category: str, rule_id: str):
    """
    Get a specific RGPD rule by category and ID.
    
    Args:
        category: Rule category (e.g., 'consent_rules')
        rule_id: Rule ID (e.g., 'consent_001')
        
    Returns:
        Specific rule details
    """
    try:
        if category not in RGPD_RULES:
            raise HTTPException(
                status_code=404,
                detail=f"Category '{category}' not found"
            )
        
        rules = RGPD_RULES[category]
        rule = next((r for r in rules if r.get("id") == rule_id), None)
        
        if not rule:
            raise HTTPException(
                status_code=404,
                detail=f"Rule '{rule_id}' not found in category '{category}'"
            )
        
        return {
            "status": "success",
            "rule": extract_rule_info(rule)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load rule: {str(e)}")


@app.post("/clone-repo")
async def clone_repo(repo_url: str):
    """
    Clone a GitHub repository.
    
    Args:
        repo_url: Full GitHub repository URL (e.g., https://github.com/user/repo.git)
        
    Returns:
        Local path where repository is cloned
    """
    repo_path = clone_github_repo(repo_url)
    return {
        "status": "success",
        "repo_url": repo_url,
        "local_path": repo_path,
        "message": "Repository cloned successfully"
    }




@app.post("/analyze")
async def analyze_compliance(
    privacy_policy: UploadFile = File(...), repo_url: Optional[str] = Form(None)
):
    """
    Analyze RGPD compliance from privacy policy and optional repository URL

    Returns compliance scores for:
    - Consent management
    - Security practices
    - Data lifecycle
    """

    # TODO: Implement analysis logic using agents
    # For now, return mock response structure

    return {
        "status": "success",
        "filename": privacy_policy.filename,
        "repo_url": repo_url,
        "results": {
            "consent": {"score": 0, "issues": [], "recommendations": []},
            "security": {"score": 0, "issues": [], "recommendations": []},
            "lifecycle": {"score": 0, "issues": [], "recommendations": []},
        },
        "overall_score": 0,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
