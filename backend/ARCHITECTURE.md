# COMPLY.AI - Architecture

## Input/Output

**INPUT:** GitHub repo URL
```
repo/
├── docs/               # User puts privacy policy, etc.
│   ├── privacy.pdf
│   └── terms.txt
└── src/               # Code to analyze
    ├── components/
    └── utils/
```

**OUTPUT:** JSON with scores + violations per category

```json
{
  "consent": {"score": 75, "violations": [...]},
  "security": {"score": 60, "violations": [...]},
  "lifecycle": {"score": 80, "violations": [...]}
}
```

## Unified Workflow (All Rules)

**For each rule in rgpd_rules_v2.json:**

1. **Get all files** from repo
2. **Split into 2 paths:**
   - Code files: `*.py, *.js, *.jsx, *.tsx, *.html`
   - Doc files: `docs/*.pdf, docs/*.txt, docs/*.md`
3. **Filter relevant files** using `rule["code_checks"]["file_keywords"]`
4. **Select 3-5 best files** (LLM picks from filtered list)
5. **Read those files**
6. **Call LLM** with rule prompt + file contents
7. **Parse JSON response:**
   ```json
   {
     "passed": false,
     "violations": [
       {
         "file": "src/cookie.js",
         "line": 42,
         "severity": "critical",
         "issue": "...",
         "recommendation": "..."
       }
     ],
     "score": 45
   }
   ```

## Core Functions to Implement

### 1. Repo Handler (`utils/repo_handler.py`)

```python
def clone_repo(repo_url: str) -> str:
    """Clone repo, return local path. Shallow clone, max 100MB."""

def get_all_files(repo_path: str) -> dict:
    """
    Returns: {
        "code_files": ["src/app.js", "components/Banner.jsx"],
        "doc_files": ["docs/privacy.pdf", "docs/terms.txt"]
    }
    Exclude: node_modules, dist, build, .git
    """

def read_file(filepath: str) -> str:
    """Read text file. For PDFs, extract text."""
```

### 2. File Selector (`utils/file_selector.py`)

```python
def filter_by_keywords(files: list, keywords: list) -> list:
    """
    Filter files containing keywords in filename.

    Example:
    files = ["src/cookie.js", "src/api.js", "src/auth.js"]
    keywords = ["cookie", "consent", "banner"]
    Returns: ["src/cookie.js"]
    """

async def select_best_files(filtered_files: list, rule: dict, max_files: int = 5) -> list:
    """
    Use LLM to pick most relevant files.

    Prompt: "Given these files: {filtered_files}
             We need to check: {rule['code_checks']['must_find']}
             Select 3-5 most relevant. Return JSON array of filenames."
    """
```

### 3. Single Analyzer (`analyzer.py`)

```python
async def analyze_rule(rule: dict, repo_path: str) -> dict:
    """
    Main analysis function. Works for ANY rule type.

    Steps:
    1. Get all files from repo
    2. Filter by keywords (code + docs separately)
    3. Select best 5 files total
    4. Read those files
    5. Call LLM with rule prompt
    6. Parse JSON response
    7. Return result
    """

    # Get files
    all_files = get_all_files(repo_path)

    # Code path
    code_files = []
    if rule["check_type"] in ["code", "both"]:
        code_keywords = rule["code_checks"]["file_keywords"]
        filtered_code = filter_by_keywords(all_files["code_files"], code_keywords)
        code_files = await select_best_files(filtered_code, rule, max_files=3)

    # Docs path
    doc_files = []
    if rule["check_type"] in ["document", "both"]:
        doc_files = all_files["doc_files"]  # Analyze all docs

    # Read files
    selected_files = code_files + doc_files
    file_contents = {f: read_file(f) for f in selected_files}

    # Call LLM
    result = await call_llm_for_rule(rule, file_contents)

    return result

async def call_llm_for_rule(rule: dict, file_contents: dict) -> dict:
    """
    Build prompt from rule + file contents.
    Call Featherless API.
    Parse JSON response.
    """

    system_prompt = rule["agent_prompt"]

    user_message = f"""
    FILES TO ANALYZE:
    {format_files(file_contents)}

    RED PATTERNS TO CHECK:
    {json.dumps(rule["code_checks"]["red_patterns"], indent=2)}

    DOCUMENT REQUIREMENTS:
    {json.dumps(rule["document_checks"], indent=2)}

    RETURN JSON:
    {{
      "passed": true/false,
      "violations": [
        {{
          "file": "path/to/file",
          "line": 42,
          "severity": "critical|high|medium",
          "issue": "Description of violation",
          "recommendation": "How to fix",
          "article": "Article 6.1.a"
        }}
      ],
      "score": 0-100
    }}
    """

    response = await call_featherless_llm(system_prompt, user_message)
    return parse_json_response(response)
```

### 4. Main Endpoint (`main.py`)

```python
@app.post("/analyze")
async def analyze_repo(repo_url: str):
    """
    1. Clone repo
    2. Load all rules
    3. For each rule: analyze_rule()
    4. Aggregate by category
    5. Return results
    """

    # Clone
    repo_path = clone_repo(repo_url)

    # Load rules
    with open("data/rgpd_rules_v2.json") as f:
        rules = json.load(f)

    # Analyze all rules
    results = {
        "consent": [],
        "security": [],
        "lifecycle": []
    }

    # Process consent rules
    for rule in rules["consent_rules"]:
        result = await analyze_rule(rule, repo_path)
        results["consent"].append(result)

    # Process security rules
    for rule in rules["security_rules"]:
        result = await analyze_rule(rule, repo_path)
        results["security"].append(result)

    # Process lifecycle rules
    for rule in rules["lifecycle_rules"]:
        result = await analyze_rule(rule, repo_path)
        results["lifecycle"].append(result)

    # Aggregate scores
    final = {
        "consent": {
            "score": avg([r["score"] for r in results["consent"]]),
            "violations": flatten([r["violations"] for r in results["consent"]])
        },
        "security": {
            "score": avg([r["score"] for r in results["security"]]),
            "violations": flatten([r["violations"] for r in results["security"]])
        },
        "lifecycle": {
            "score": avg([r["score"] for r in results["lifecycle"]]),
            "violations": flatten([r["violations"] for r in results["lifecycle"]])
        }
    }

    return final
```

## File Structure

```
backend/
├── main.py                      # FastAPI app with /analyze endpoint
├── analyzer.py                  # analyze_rule() + call_llm_for_rule()
├── utils/
│   ├── repo_handler.py         # clone_repo, get_all_files, read_file
│   ├── file_selector.py        # filter_by_keywords, select_best_files
│   ├── llm_client.py           # call_featherless_llm
│   └── json_parser.py          # parse_json_response (handle markdown)
├── data/
│   └── rgpd_rules_v2.json      # All rules
└── requirements.txt
```

## Implementation Order

**Priority 1: Core Flow (3 hours)**
1. ✅ `repo_handler.py` - clone + list files
2. ✅ `file_selector.py` - filter + select
3. ✅ `analyzer.py` - analyze_rule()
4. ✅ `llm_client.py` - Featherless API call
5. ✅ `main.py` - /analyze endpoint

**Priority 2: Testing (1 hour)**
1. Create test repo with `/docs` folder
2. Add bad examples in code + docs
3. Test with 1 rule (consent_001)
4. Verify JSON output

**Priority 3: All Rules (1 hour)**
1. Run with all consent rules
2. Run with all security rules
3. Run with all lifecycle rules
4. Fix any errors

**Priority 4: Demo Prep (1 hour)**
1. Create perfect demo repo
2. Record demo video
3. Write Devpost page

## Critical Implementation Notes

### LLM Response Parsing

```python
def parse_json_response(response: str) -> dict:
    """
    LLM might return:
    - Pure JSON: {"passed": false, ...}
    - With markdown: ```json\n{...}\n```
    - With text + JSON: "Here's the analysis:\n{...}"

    Handle all cases.
    """
    # Strip markdown
    cleaned = response.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0]

    # Extract JSON object
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        return json.loads(match.group())

    raise ValueError("No JSON found in LLM response")
```

### Error Handling

```python
# ALWAYS try/except LLM calls
try:
    result = await call_llm_for_rule(rule, files)
except Exception as e:
    logger.error(f"LLM failed for {rule['id']}: {e}")
    return {
        "passed": None,
        "violations": [],
        "score": 0,
        "error": str(e)
    }
```

### File Size Limits

```python
# Skip files > 1000 lines
# Skip repos > 100MB
# Timeout LLM calls after 30s
```

## Demo Repo Structure

Create this for testing:

```
test-repo/
├── docs/
│   └── privacy.txt          # Bad privacy policy with violations
├── src/
│   ├── cookie.js           # Pre-checked boxes
│   ├── auth.py             # Password in plaintext
│   └── user.js             # console.log(user.email)
└── README.md
```

**privacy.txt content:**
```
En continuant sur ce site, vous acceptez les cookies.
[Violation: consentement implicite]

Nous conservons vos données indéfiniment.
[Violation: pas de rétention policy]
```

**cookie.js content:**
```javascript
// Violation: pre-checked box
<input type="checkbox" checked="checked" name="consent">

// Violation: analytics before consent
gtag('config', 'GA-XXXXX');
```

**auth.py content:**
```python
# Violation: plaintext password
user_password = "admin123"

# Violation: weak hashing
import hashlib
hashed = hashlib.md5(password.encode()).hexdigest()
```

## Success Metrics

- ✅ Analysis completes in < 2 minutes
- ✅ Finds 5+ violations in demo repo
- ✅ Zero crashes on valid input
- ✅ JSON output is valid and complete
- ✅ Scores are sensible (0-100, not negative)

## TODO List

- [x] `utils/repo_handler.py` - 3 functions (clone_repo, get_all_files, read_file) ✅
- [x] Test repo_handler with demo repo (https://github.com/LyCrash/FakeRepo4-COMPLY.AI) ✅
- [x] `utils/file_selector.py` - 2 functions (filter_by_keywords, select_best_files) ✅
- [x] Test file_selector with keyword filtering and LLM selection ✅
- [x] `utils/llm_client.py` - Fixed Featherless API endpoint (chat/completions) ✅
- [x] `utils/json_parser.py` - parse_json_response with validation ✅
- [x] `analyzer.py` - analyze_rule, call_llm_for_rule, aggregate_results ✅
- [x] `main.py` - implement /analyze endpoint (real analysis, not mock) ✅
- [x] Test with 1 rule end-to-end (consent: 45/100, security: 55/100, 9 violations found) ✅
- [x] Test with all rules (Overall: 39/100, 19 violations across consent & security) ✅
- [ ] Handle errors gracefully
- [ ] Frontend integration
- [ ] Record demo video
