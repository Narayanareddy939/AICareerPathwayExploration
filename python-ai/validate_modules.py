"""Quick module validation script."""
import sys
sys.path.insert(0, r'c:\Users\hi\OneDrive\MINI project\Ai_Carrier\python-ai')

def check(label, condition, detail=""):
    if condition:
        print(f"  OK  {label}")
    else:
        print(f"  FAIL {label}: {detail}")

print("=== Module Validation ===\n")

# skill_normalizer
from skill_normalizer import normalize_term, extract_skills_with_sections
check("sklearn -> scikit-learn", normalize_term("sklearn") == "scikit-learn", normalize_term("sklearn"))
check("mysql stays mysql (not sql)", normalize_term("mysql") == "mysql", normalize_term("mysql"))
check("sql stays sql", normalize_term("sql") == "sql", normalize_term("sql"))

text = "Skills: JavaScript, TypeScript, React"
skills = extract_skills_with_sections(text)
canonicals = {s["canonical"] for s in skills}
check("Java NOT in 'JavaScript'", "java" not in canonicals, str(canonicals))
check("javascript IS found", "javascript" in canonicals, str(canonicals))
print()

# job_description_parser
from job_description_parser import parse_job_description
jd = "Required: Python, SQL, Machine Learning\nPreferred: TensorFlow, AWS"
result = parse_job_description(jd)
check("python in required", "python" in result["required_keywords"], str(result["required_keywords"]))
check("tensorflow in preferred", "tensorflow" in result["preferred_keywords"], str(result["preferred_keywords"]))
print()

# ats_scorer
from ats_scorer import calculate_ats_score, parse_sections

resume = """
Jane Doe | jane@email.com | linkedin.com/in/jane | github.com/jane
EDUCATION
B.Tech CS, VIT (2024), CGPA 8.7

SKILLS
Python, Machine Learning, Pandas, NumPy, SQL, Statistics, Scikit-Learn

EXPERIENCE
Data Science Intern | TCS
- Developed ML model achieving 87% accuracy
- Processed 50,000+ records, reduced time by 35%

PROJECTS
1. Recommendation Engine using Python and Scikit-Learn (500 users)

CERTIFICATIONS
Google Data Analytics Professional Certificate
"""

jd2 = "Required: Python, Machine Learning, SQL, Pandas\nPreferred: TensorFlow, Statistics, Data Visualization"
secs = parse_sections(resume)
r = calculate_ats_score(resume, secs, "Data Scientist", jd2)

print(f"Score: {r['atsScore']} ({r['scoreCategory']})")
print(f"Keyword source: {r['keywordSource']}")
print(f"Required matched: {r['keywordAnalysis']['matchedRequired']}")
print(f"Required missing: {r['keywordAnalysis']['missingRequired']}")
print(f"Preferred matched: {r['keywordAnalysis']['matchedPreferred']}")
print()

check("Score >= 50", r["atsScore"] >= 50, r["atsScore"])
check("Score <= 100", r["atsScore"] <= 100, r["atsScore"])
check("Source = job_description", r["keywordSource"] == "job_description", r["keywordSource"])
check("Python in required matched", "Python" in r["keywordAnalysis"]["matchedRequired"])

# No JD test
r2 = calculate_ats_score("Alice | SKILLS: Python", {}, None, None)
check("No JD -> keywordSource=none", r2["keywordSource"] == "none", r2["keywordSource"])

# resume_parser integration
from resume_parser import parse_resume_text
r3 = parse_resume_text(resume, "Data Scientist", jd2)
check("parse_resume_text score in range", 0 <= r3["atsScore"] <= 100, r3["atsScore"])
check("parse_resume_text has keywordAnalysis", "keywordAnalysis" in r3)

print("\nDone.")
