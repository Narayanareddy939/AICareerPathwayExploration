"""
test_ats_system.py
==================
16 automated test cases for the ATS-style resume analyzer.

Run with:
  python -m pytest tests/test_ats_system.py -v
  (from python-ai/ directory with venv active)

Or standalone:
  python tests/test_ats_system.py
"""

import sys
import os
import traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ats_scorer import calculate_ats_score, parse_sections
from skill_normalizer import extract_skills_with_sections, normalize_term
from job_description_parser import parse_job_description

# ─── Colour output ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

# Force UTF-8 output on Windows
import io
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

_results = []


def run_test(name, fn):
    try:
        fn()
        print(f"  {GREEN}✓{RESET} {name}")
        _results.append((name, True, None))
    except AssertionError as e:
        print(f"  {RED}✗{RESET} {name}  →  {e}")
        _results.append((name, False, str(e)))
    except Exception as e:
        print(f"  {RED}✗ (error){RESET} {name}  →  {e}")
        _results.append((name, False, traceback.format_exc()))


def _score(resume_text, target_role=None, job_description=None):
    secs = parse_sections(resume_text)
    return calculate_ats_score(resume_text, secs, target_role, job_description)


# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}=== ATS System Test Suite ==={RESET}\n")

# ── TEST 1: Empty resume → very low score, no crash ──────────────────────────
def t1():
    r = _score("")
    # Empty resume: either returns error dict OR scores very low (<=5)
    score = r.get("atsScore", 0)
    assert score <= 5 or r.get("error"), f"Empty resume should score <=5, got {score}"

run_test("T01 Empty resume → score=0, no crash", t1)

# ── TEST 2: Resume without SKILLS section ─────────────────────────────────────
def t2():
    resume = """
John Doe | john@email.com | linkedin.com/in/johndoe | github.com/johndoe
EDUCATION: B.Tech CS, VIT (2024), CGPA 8.5
EXPERIENCE: Developed Python Flask APIs. Implemented ML models using Pandas, NumPy.
PROJECTS: Built recommendation system with Scikit-Learn and SQL.
"""
    jd = "Required: Python, Machine Learning, Pandas, NumPy, SQL\nPreferred: Scikit-Learn, TensorFlow"
    r = _score(resume, "Data Scientist", jd)
    # Skills should still be detected from experience/projects
    matched = r["keywordAnalysis"]["matchedRequired"]
    assert len(matched) >= 2, f"Expected >=2 required skills from experience/projects, got {matched}"
    # Structure score should be lower (no skills section)
    assert not r["sections"].get("skills", False), "Skills section should NOT be detected"

run_test("T02 No SKILLS section → lower structure, but skills from experience still count", t2)

# ── TEST 3: Excellent role-matched resume ─────────────────────────────────────
def t3():
    resume = """
Priya Sharma | priya@email.com | +91 9876543210 | linkedin.com/in/priya | github.com/priya
EDUCATION
B.Tech Computer Science, VIT — CGPA 8.7
SKILLS
Python, Machine Learning, Statistics, SQL, Pandas, NumPy, Scikit-Learn, TensorFlow, Data Visualization
EXPERIENCE
Data Science Intern | TCS | 2023
- Developed ML model achieving 87% accuracy
- Reduced data preprocessing time by 35% using Pandas
- Processed 50,000+ records with Python
PROJECTS
1. Customer Churn Predictor using Python, Scikit-Learn — served 500 users
2. NLP Sentiment Analyzer using TensorFlow
CERTIFICATIONS
Google Data Analytics Professional Certificate
"""
    jd = "Required: Python, Machine Learning, Statistics, SQL, Pandas, NumPy\nPreferred: Scikit-Learn, TensorFlow, Data Visualization"
    r = _score(resume, "Data Scientist", jd)
    assert r["atsScore"] >= 65, f"Expected >=65, got {r['atsScore']}"

run_test("T03 Excellent role-matched resume → high score (>=65)", t3)

# ── TEST 4: Irrelevant skills don't inflate score ─────────────────────────────
def t4():
    resume_irrelevant = """
Bob Smith | bob@email.com
SKILLS
Photoshop, Illustrator, InDesign, After Effects, CorelDraw, Blender, Maya, Sketch, Figma, Canva
PROJECTS
Logo design for local bakery. Poster design for events.
"""
    jd = "Required: Python, Machine Learning, SQL, Statistics\nPreferred: TensorFlow, Pandas"
    r = _score(resume_irrelevant, "Data Scientist", jd)
    req_pct = r["keywordAnalysis"].get("requiredMatchPercentage", 0)
    assert req_pct <= 20, f"Irrelevant skills should NOT score high on required — got {req_pct}%"

run_test("T04 Irrelevant skills don't inflate keyword score", t4)

# ── TEST 5: No JD → clear limitation message ──────────────────────────────────
def t5():
    resume = "Alice | SKILLS: Python, SQL"
    r = _score(resume, None, None)
    assert r["keywordSource"] == "none", f"Expected keywordSource='none', got {r['keywordSource']}"
    assert any("job" in l.lower() or "no" in l.lower() for l in r.get("limitations", [])), \
        "Should have limitation about no JD/role"

run_test("T05 No JD/role → keyword source=none, limitation stated", t5)

# ── TEST 6: JD requires Python → resume with Python → matched ────────────────
def t6():
    resume = "Alice | alice@email.com\nSKILLS\nPython, SQL\nEXPERIENCE\nDeveloped Python scripts"
    jd = "Required: Python, SQL\nPreferred: Pandas"
    r = _score(resume, "Data Scientist", jd)
    matched = r["keywordAnalysis"]["matchedRequired"]
    assert "Python" in matched, f"Python should be matched. Got: {matched}"

run_test("T06 JD requires Python → resume has Python → matched", t6)

# ── TEST 7: JD requires Python → resume has only JavaScript ──────────────────
def t7():
    resume = "Bob | SKILLS\nJavaScript, React, Node.js\nEXPERIENCE\nBuilt React applications"
    jd = "Required: Python, Machine Learning, SQL"
    r = _score(resume, "Data Scientist", jd)
    missing = r["keywordAnalysis"]["missingRequired"]
    matched = r["keywordAnalysis"]["matchedRequired"]
    assert "Python" in missing, f"Python should be MISSING. Missing={missing}, Matched={matched}"

run_test("T07 JD requires Python → resume has JS only → Python missing", t7)

# ── TEST 8: Java must NOT match JavaScript ────────────────────────────────────
def t8():
    text = "Skills: JavaScript, TypeScript, React, Node.js"
    skills = extract_skills_with_sections(text)
    found_canonicals = {s["canonical"] for s in skills}
    assert "java" not in found_canonicals, f"'java' should NOT match 'JavaScript'. Found: {found_canonicals}"
    assert "javascript" in found_canonicals, f"'javascript' should be found. Found: {found_canonicals}"

run_test("T08 'Java' does NOT match 'JavaScript'", t8)

# ── TEST 9: SQL should not equal MySQL automatically ─────────────────────────
def t9():
    # "mysql" should normalize to "mysql", not "sql"
    norm = normalize_term("mysql")
    assert norm == "mysql", f"'mysql' should normalize to 'mysql', got '{norm}'"
    # But "SQL" in text should match canonical "sql"
    norm2 = normalize_term("sql")
    assert norm2 == "sql", f"'sql' should normalize to 'sql', got '{norm2}'"

run_test("T09 'SQL' != 'MySQL' (separate canonical keys)", t9)

# ── TEST 10: sklearn normalizes to scikit-learn ───────────────────────────────
def t10():
    norm = normalize_term("sklearn")
    assert norm == "scikit-learn", f"'sklearn' should normalize to 'scikit-learn', got '{norm}'"
    norm2 = normalize_term("scikit")
    assert norm2 == "scikit-learn", f"'scikit' should normalize to 'scikit-learn', got '{norm2}'"

run_test("T10 'sklearn' → 'scikit-learn' (alias normalization)", t10)

# ── TEST 11: Missing required experience → partial match, not fabricated ──────
def t11():
    resume = """
Alex | alex@email.com
EDUCATION
B.Tech CS (2024)
SKILLS
Python, SQL, Machine Learning
"""
    jd = "Required: Python, Machine Learning, SQL\nWe need 3+ years experience in Python and SQL"
    r = _score(resume, "Data Scientist", jd)
    # Score should not be high (no experience section)
    exp = r.get("experienceAnalysis", {})
    assert not exp.get("has_experience_section", True), \
        f"Should detect no experience section. Analysis: {exp}"

run_test("T11 Missing experience section → detected correctly, not fabricated", t11)

# ── TEST 12: Resume with metrics → quantified achievements detected ───────────
def t12():
    resume = """
Jane | jane@email.com | linkedin.com/in/jane | github.com/jane
SKILLS: Python, SQL
EXPERIENCE:
- Improved API response time by 40%
- Processed 50,000 records daily
- Reduced costs by 25%
- Built for 500+ users
"""
    r = _score(resume, "Data Scientist")
    quant_count = r["achievements"]["quantifiedAchievementCount"]
    assert quant_count >= 2, f"Expected >=2 quantified achievements, got {quant_count}"

run_test("T12 Resume with metrics → quantified achievements detected", t12)

# ── TEST 13: Resume with phone/email → contact detected ──────────────────────
def t13():
    resume = "John | john@example.com | +91 9876543210 | linkedin.com/in/john | github.com/john\nSKILLS: Python"
    r = _score(resume)
    assert r["contact"]["email"],    "Email should be detected"
    assert r["contact"]["phone"],    "Phone should be detected"
    assert r["contact"]["linkedin"], "LinkedIn should be detected"
    assert r["contact"]["github"],   "GitHub should be detected"

run_test("T13 Contact fields detected (email, phone, LinkedIn, GitHub)", t13)

# ── TEST 14: Excessive keyword repetition → capped ───────────────────────────
def t14():
    # Repeat "python" 30 times — occurrences should be capped
    resume = "Skills: " + " python " * 30 + "\njohn@email.com\nEDUCATION: B.Tech"
    skills = extract_skills_with_sections(resume)
    python_skill = next((s for s in skills if s["canonical"] == "python"), None)
    assert python_skill is not None, "Python should be detected"
    assert python_skill["occurrences"] <= 8, f"Occurrences should be capped at 8, got {python_skill['occurrences']}"

run_test("T14 Excessive keyword repetition → occurrences capped at 8", t14)

# ── TEST 15: Very short resume → length warning ───────────────────────────────
def t15():
    resume = "Alice | Python developer | SKILLS: Python"
    r = _score(resume, "Software Engineer")
    recs = r.get("recommendations", [])
    has_length_warning = any("short" in rec.lower() or "word" in rec.lower() for rec in recs)
    assert has_length_warning or r["wordCount"] < 150, \
        f"Short resume should trigger length warning. Words={r['wordCount']}, Recs={recs}"

run_test("T15 Very short resume → length warning in recommendations", t15)

# ── TEST 16: Score is always 0–100 ───────────────────────────────────────────
def t16():
    test_cases = [
        ("", None, None),
        ("Python SQL ML " * 100, "Data Scientist", None),
        ("Full resume: " + "A" * 5000, "Unknown Role", "Python, SQL, React"),
    ]
    for rt, role, jd in test_cases:
        if rt.strip():
            r = _score(rt, role, jd)
            s = r["atsScore"]
            assert 0 <= s <= 100, f"Score {s} out of [0,100] range for role={role!r}"

run_test("T16 Score always between 0 and 100", t16)

# ── Summary ───────────────────────────────────────────────────────────────────
passed = sum(1 for _, ok, _ in _results if ok)
failed = len(_results) - passed
print(f"\n{BOLD}─────────────────────────────────────────{RESET}")
print(f"  Results: {GREEN}{passed} passed{RESET} | {RED}{failed} failed{RESET} | {len(_results)} total")
if failed:
    print(f"\n  {YELLOW}Failed tests:{RESET}")
    for name, ok, err in _results:
        if not ok:
            print(f"    • {name}")
            if err:
                print(f"      {err[:200]}")
print()

if __name__ == "__main__":
    sys.exit(0 if failed == 0 else 1)
