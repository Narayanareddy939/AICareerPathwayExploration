"""
ats_scorer.py
==============
ATS-Style Resume Compatibility Scorer — 100-point system.

IMPORTANT DISCLAIMER:
This is an ATS-Style Compatibility Score that simulates common factors
used in applicant tracking systems. It does NOT represent any specific
company's actual ATS algorithm. No public universal ATS formula exists.

Scoring Components (100 points total):
  A. Job Keyword / Skill Match    = 40 pts  (vs actual JD if provided)
  B. Resume Structure / Sections  = 15 pts
  C. Experience Relevance         = 15 pts
  D. Projects / Evidence          = 10 pts
  E. Contact / Professional Info  = 5  pts
  F. Achievements / Quantification= 5  pts
  G. Readability / Parsing Safety = 5  pts
  H. Education / Certifications   = 5  pts

No artificial base score. No fake minimum. Score reflects actual quality.
"""

import re
from typing import Dict, List, Optional, Any

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from skill_normalizer import (
    extract_skills_with_sections,
    normalize_term,
    display_name,
    CANONICAL_DISPLAY,
)
from job_description_parser import parse_job_description

# ─────────────────────────────────────────────────────────────────────────────
#  Central Configuration — Change weights here, nowhere else
# ─────────────────────────────────────────────────────────────────────────────
ATS_CONFIG = {
    "weights": {
        "keyword_match":          40,
        "sections":               15,
        "experience":             15,
        "projects":               10,
        "contact":                5,
        "achievements":           5,
        "readability":            5,
        "education_certifications": 5,
    },
    "keyword_weights": {
        "required":   0.60,   # Required skills drive 60% of keyword score
        "preferred":  0.30,   # Preferred skills 30%
        "general":    0.10,   # General/context keywords 10%
    },
    "section_points": {
        "education":       3,
        "experience":      3,
        "skills":          3,
        "projects":        3,
        "certifications":  2,
        "summary":         1,
    },
    "length_thresholds": {
        "too_short":   150,   # word count
        "ideal_min":   250,
        "ideal_max":   800,
        "too_long":    1100,
    },
    "score_categories": {
        90: "Very Strong Compatibility",
        75: "Strong Compatibility",
        60: "Moderate Compatibility",
        40: "Needs Improvement",
        0:  "Low Compatibility",
    },
    # Role knowledge base fallback when no JD provided
    "role_keywords": {
        "Data Scientist": {
            "required":  ["python", "machine learning", "statistics", "sql", "pandas", "numpy"],
            "preferred": ["scikit-learn", "tensorflow", "pytorch", "data visualization", "deep learning", "nlp", "feature engineering"],
            "general":   ["jupyter", "spark", "hadoop", "mlops", "airflow", "r"],
        },
        "Software Engineer": {
            "required":  ["data structures", "algorithms", "oop", "git", "sql"],
            "preferred": ["python", "java", "c++", "system design", "rest api", "testing"],
            "general":   ["docker", "ci/cd", "agile", "linux", "kubernetes", "microservices"],
        },
        "Full Stack Developer": {
            "required":  ["javascript", "html", "css", "git", "sql", "rest api"],
            "preferred": ["react", "node.js", "mongodb", "typescript", "docker"],
            "general":   ["aws", "ci/cd", "graphql", "redis", "microservices"],
        },
        "Frontend Developer": {
            "required":  ["javascript", "html", "css", "react", "git"],
            "preferred": ["typescript", "rest api", "testing", "tailwind css"],
            "general":   ["vue.js", "next.js", "webpack", "graphql", "aws"],
        },
        "Backend Developer": {
            "required":  ["python", "sql", "rest api", "git"],
            "preferred": ["node.js", "django", "flask", "mongodb", "postgresql", "docker"],
            "general":   ["redis", "microservices", "kubernetes", "kafka"],
        },
        "Machine Learning Engineer": {
            "required":  ["python", "machine learning", "deep learning", "git"],
            "preferred": ["tensorflow", "pytorch", "scikit-learn", "docker", "sql"],
            "general":   ["mlops", "kubernetes", "spark", "aws", "feature engineering"],
        },
        "DevOps Engineer": {
            "required":  ["linux", "docker", "ci/cd", "git"],
            "preferred": ["kubernetes", "aws", "terraform", "ansible"],
            "general":   ["prometheus", "grafana", "jenkins", "networking"],
        },
        "Data Analyst": {
            "required":  ["sql", "excel", "data visualization"],
            "preferred": ["python", "power bi", "tableau", "pandas", "statistics"],
            "general":   ["machine learning", "numpy", "etl", "r"],
        },
        "Data Engineer": {
            "required":  ["python", "sql", "etl", "git"],
            "preferred": ["spark", "airflow", "data warehousing", "kafka"],
            "general":   ["docker", "scala", "kubernetes", "data modeling"],
        },
        "Cloud Engineer": {
            "required":  ["aws", "linux", "networking", "docker"],
            "preferred": ["kubernetes", "terraform", "ci/cd", "python"],
            "general":   ["azure", "gcp", "prometheus", "grafana"],
        },
        "Cybersecurity Engineer": {
            "required":  ["cybersecurity", "networking", "linux"],
            "preferred": ["python", "ethical hacking", "encryption", "penetration testing"],
            "general":   ["siem", "aws", "oauth"],
        },
        "Mobile Developer": {
            "required":  ["react native", "javascript", "git"],
            "preferred": ["flutter", "android", "ios", "rest api", "firebase"],
            "general":   ["testing", "swift", "kotlin"],
        },
        "AI/ML Researcher": {
            "required":  ["python", "deep learning", "machine learning", "statistics"],
            "preferred": ["pytorch", "tensorflow", "nlp", "computer vision"],
            "general":   ["hugging face", "reinforcement learning", "spark"],
        },
        "Product Manager": {
            "required":  ["product management", "communication", "agile"],
            "preferred": ["data science", "user research", "problem solving", "figma"],
            "general":   ["sql", "a/b testing", "jira"],
        },
        "Business Analyst": {
            "required":  ["communication", "data science", "problem solving"],
            "preferred": ["sql", "excel", "power bi", "requirements gathering"],
            "general":   ["python", "agile", "tableau"],
        },
    },
}

# ─────────────────────────────────────────────────────────────────────────────
#  Action verbs list
# ─────────────────────────────────────────────────────────────────────────────
ACTION_VERBS = [
    "developed", "designed", "built", "implemented", "optimized", "led",
    "created", "achieved", "increased", "reduced", "improved", "launched",
    "managed", "analyzed", "architected", "engineered", "deployed",
    "automated", "delivered", "streamlined", "collaborated", "mentored",
    "researched", "trained", "configured", "maintained", "integrated",
    "migrated", "refactored", "tested", "documented", "coordinated",
    "established", "transformed", "enhanced", "negotiated", "facilitated",
    "produced", "published", "resolved", "scaled", "secured", "monitored",
]

# ─────────────────────────────────────────────────────────────────────────────
#  Quantified achievement patterns (must NOT count dates/years/phones)
# ─────────────────────────────────────────────────────────────────────────────
_QUANT_PATTERN = re.compile(
    r'\b\d+(?:\.\d+)?\s*%'                           # 35%, 99.9%
    r'|\b\d+[Kk]\+?\s*(?:users?|customers?|records?)' # 10K users
    r'|\b(?:reduced|improved|increased|decreased|cut|boosted|enhanced)\b[^.]{0,60}\d+'  # "reduced by 40"
    r'|\b\d+\s*x\s*(?:faster|improvement|speedup)'   # 3x faster
    r'|\b\d+(?:\.\d+)?\s*(?:ms|gb|tb|pb)\b'          # 50ms, 2GB
    r'|\b\d+\+?\s*(?:users?|customers?|clients?|team members?|engineers?|apps?|services?|projects?)\b',
    re.IGNORECASE
)

# Patterns that look like numbers but are NOT achievements (phone/year/date)
_NON_ACHIEVEMENT = re.compile(
    r'\b(?:19|20)\d{2}\b'     # years like 2020, 2024
    r'|\b[6-9]\d{9}\b'        # Indian phone numbers
    r'|\b\d{10,}\b',           # any 10+ digit number
)


def _count_quantified(text: str) -> int:
    """Count genuine quantified achievements, excluding dates and phone numbers."""
    matches = _QUANT_PATTERN.findall(text)
    # Filter out matches that are just years or phones
    genuine = [m for m in matches if not _NON_ACHIEVEMENT.search(m)]
    return min(len(genuine), 10)  # cap at 10


def _score_category(score: int) -> str:
    cats = ATS_CONFIG["score_categories"]
    for threshold in sorted(cats.keys(), reverse=True):
        if score >= threshold:
            return cats[threshold]
    return cats[0]


def _find_role_in_kb(target_role: Optional[str]) -> Optional[str]:
    """Find closest matching role in the knowledge base, supporting synonyms and aliases."""
    if not target_role:
        return "Software Engineer"
    kb = ATS_CONFIG["role_keywords"]
    tl = target_role.lower().strip()

    # 1. Exact match
    for key in kb:
        if key.lower() == tl:
            return key

    # 2. Substring match
    for key in kb:
        if tl in key.lower() or key.lower() in tl:
            return key

    # 3. Normalized alias mapping
    alias_map = {
        'full stack engineer': 'Full Stack Developer',
        'fullstack engineer': 'Full Stack Developer',
        'fullstack developer': 'Full Stack Developer',
        'full stack': 'Full Stack Developer',
        'fullstack': 'Full Stack Developer',
        'software developer': 'Software Engineer',
        'software development engineer': 'Software Engineer',
        'sde': 'Software Engineer',
        'swe': 'Software Engineer',
        'web developer': 'Frontend Developer',
        'frontend engineer': 'Frontend Developer',
        'front end developer': 'Frontend Developer',
        'front-end developer': 'Frontend Developer',
        'ui developer': 'Frontend Developer',
        'react developer': 'Frontend Developer',
        'backend engineer': 'Backend Developer',
        'back end developer': 'Backend Developer',
        'api developer': 'Backend Developer',
        'node developer': 'Backend Developer',
        'data science': 'Data Scientist',
        'data scientist': 'Data Scientist',
        'ai engineer': 'Machine Learning Engineer',
        'ml engineer': 'Machine Learning Engineer',
        'deep learning engineer': 'Machine Learning Engineer',
        'ai researcher': 'AI/ML Researcher',
        'machine learning researcher': 'AI/ML Researcher',
        'cloud architect': 'Cloud Engineer',
        'aws engineer': 'Cloud Engineer',
        'azure engineer': 'Cloud Engineer',
        'devops': 'DevOps Engineer',
        'site reliability engineer': 'DevOps Engineer',
        'sre': 'DevOps Engineer',
        'cyber security': 'Cybersecurity Engineer',
        'cybersecurity': 'Cybersecurity Engineer',
        'security engineer': 'Cybersecurity Engineer',
        'information security': 'Cybersecurity Engineer',
        'mobile engineer': 'Mobile Developer',
        'android developer': 'Mobile Developer',
        'ios developer': 'Mobile Developer',
        'flutter developer': 'Mobile Developer',
        'react native developer': 'Mobile Developer',
        'business analyst': 'Business Analyst',
        'product manager': 'Product Manager',
        'data engineer': 'Data Engineer',
        'data analyst': 'Data Analyst',
    }
    for alias, canonical in alias_map.items():
        if alias in tl or tl in alias:
            return canonical

    # 4. Word-token overlap matching
    tokens = set(re.findall(r'\b\w+\b', tl))
    tokens.discard('engineer')
    tokens.discard('developer')
    tokens.discard('specialist')
    tokens.discard('role')
    best_match = None
    best_overlap = 0
    for key in kb:
        key_tokens = set(re.findall(r'\b\w+\b', key.lower()))
        overlap = len(tokens & key_tokens)
        if overlap > best_overlap:
            best_overlap = overlap
            best_match = key
    if best_overlap > 0:
        return best_match

    # 5. Default fallback to Software Engineer
    return "Software Engineer"


# ─────────────────────────────────────────────────────────────────────────────
#  Section parser
# ─────────────────────────────────────────────────────────────────────────────
_SECTION_HEADERS = {
    "education": re.compile(
        r'^\s*(education|academic(?:\s+background)?|qualification|degree|'
        r'academic\s+qualifications?|educational\s+background)\s*:?\s*$',
        re.IGNORECASE
    ),
    "experience": re.compile(
        r'^\s*((?:work\s*)?experience|employment(?:\s+history)?|'
        r'professional\s+(?:experience|background)|internship(?:\s+experience)?|'
        r'work\s+history|career\s+history|relevant\s+experience)\s*:?\s*$',
        re.IGNORECASE
    ),
    "skills": re.compile(
        r'^\s*((?:technical\s*)?skills?(?:\s*(?:&|and)\s*technologies)?|'
        r'core\s+(?:competencies|skills?)|technologies|tools?\s*(?:&|and)?\s*technologies?|'
        r'expertise|key\s+skills?|programming\s+skills?)\s*:?\s*$',
        re.IGNORECASE
    ),
    "projects": re.compile(
        r'^\s*((?:personal|academic|key|relevant|notable)?\s*projects?|'
        r'portfolio|open\s+source(?:\s+contributions?)?)\s*:?\s*$',
        re.IGNORECASE
    ),
    "certifications": re.compile(
        r'^\s*(certifications?\s*(?:&|and)?\s*(?:courses?|awards?|training)?|'
        r'certificates?|courses?\s*(?:completed)?|credentials?|'
        r'professional\s+development|licenses?\s*(?:&|and)?\s*certifications?)\s*:?\s*$',
        re.IGNORECASE
    ),
    "summary": re.compile(
        r'^\s*(summary|objective|profile|about(?:\s+me)?|overview|'
        r'professional\s+summary|career\s+(?:summary|objective))\s*:?\s*$',
        re.IGNORECASE
    ),
    "achievements": re.compile(
        r'^\s*(achievements?|awards?|honors?|accomplishments?|recognition)\s*:?\s*$',
        re.IGNORECASE
    ),
    "publications": re.compile(
        r'^\s*(publications?|research(?:\s+papers?)?|conference\s+papers?)\s*:?\s*$',
        re.IGNORECASE
    ),
    "languages": re.compile(
        r'^\s*(languages?(?:\s+known)?|spoken\s+languages?)\s*:?\s*$',
        re.IGNORECASE
    ),
}


def parse_sections(text: str) -> Dict[str, str]:
    """
    Parse resume text into labeled sections.
    Returns dict: section_name → section_text
    """
    lines = text.split('\n')
    sections: Dict[str, List[str]] = {}
    current = "header"
    current_lines: List[str] = []

    for line in lines:
        stripped = line.strip()
        matched_section = None

        if stripped and len(stripped) < 70:
            for sec_name, pattern in _SECTION_HEADERS.items():
                if pattern.match(stripped):
                    matched_section = sec_name
                    break

        if matched_section:
            if current_lines:
                sections[current] = '\n'.join(current_lines)
            current = matched_section
            current_lines = []
        else:
            if stripped:
                current_lines.append(stripped)

    if current_lines:
        sections[current] = '\n'.join(current_lines)

    return sections


def extract_contact_safe(text: str) -> Dict[str, bool]:
    """Extract contact fields, return boolean status only (no personal data exposed)."""
    email_pat = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
    phone_pat = re.compile(r'(?:\+?\d[\d\s\-\(\)]{7,}\d)')
    linkedin_pat = re.compile(r'linkedin\.com/in/[a-zA-Z0-9\-]+', re.IGNORECASE)
    github_pat = re.compile(r'github\.com/[a-zA-Z0-9\-]+', re.IGNORECASE)
    portfolio_pat = re.compile(r'(?:portfolio|website|personal\s+site)\s*[:\-]?\s*(https?://[^\s]+)', re.IGNORECASE)

    return {
        "email":     bool(email_pat.search(text)),
        "phone":     bool(phone_pat.search(text)),
        "linkedin":  bool(linkedin_pat.search(text)),
        "github":    bool(github_pat.search(text)),
        "portfolio": bool(portfolio_pat.search(text)),
    }


def extract_education_info(text: str) -> Dict:
    degree_pat = re.compile(
        r'\b(b\.?tech|b\.?e\.?|bachelor(?:\s+of\s+\w+)?|m\.?tech|m\.?e\.?|'
        r'm\.?s\.?|mba|ph\.?d\.?|mca|bca|b\.?sc|m\.?sc|diploma)\b',
        re.IGNORECASE
    )
    cgpa_pat = re.compile(r'(?:cgpa|gpa|score)\s*[:\-]?\s*(\d+(?:\.\d+)?)', re.IGNORECASE)
    cert_pat = re.compile(
        r'(aws\s+certified|google\s+(?:professional|associate|data)|'
        r'microsoft\s+certified|cisco\s+\w+|comptia\s+\w+|pmp|'
        r'scrum\s+master|meta\s+\w+|ibm\s+\w+|oracle\s+\w+|'
        r'tensorflow\s+developer|coursera\s+\w+|udemy\s+\w+)',
        re.IGNORECASE
    )

    degrees = degree_pat.findall(text)
    cgpas = cgpa_pat.findall(text)
    certs = cert_pat.findall(text)

    return {
        "has_degree":      bool(degrees),
        "degree_type":     degrees[0] if degrees else None,
        "cgpa":            float(cgpas[0]) if cgpas else None,
        "certifications":  list(set(c.strip() for c in certs))[:5],
    }


def _check_experience_match(resume_sections: Dict[str, str], jd_parsed: Dict) -> Dict:
    """Compare resume experience text against JD experience requirements."""
    exp_text = resume_sections.get('experience', '')
    req_years = jd_parsed.get('experience_requirement')

    # Detect candidate's experience duration from resume
    duration_pat = re.compile(
        r'(?:(\d+)\+?\s*(?:to\s*\d+)?\s*years?\s*(?:of\s*)?(?:experience|exp)|'
        r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*[-–]\s*'
        r'(?:present|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}))',
        re.IGNORECASE
    )

    exp_mentions = duration_pat.findall(exp_text) if exp_text else []
    has_experience_section = bool(exp_text.strip())

    internship_pat = re.compile(r'\b(intern(?:ship)?|trainee|apprentice)\b', re.IGNORECASE)
    has_internship = bool(internship_pat.search(exp_text)) if exp_text else False

    return {
        "has_experience_section": has_experience_section,
        "required_years":         req_years,
        "experience_entries":     len(exp_mentions),
        "has_internship":         has_internship,
        "match_status": (
            "not_evaluated" if not req_years else
            "partial"       if has_internship and not exp_mentions else
            "present"       if has_experience_section else
            "missing"
        ),
    }


def _check_project_relevance(resume_sections: Dict[str, str], jd_kws: List[str]) -> Dict:
    """Check if project section exists and mentions JD-relevant skills."""
    proj_text = resume_sections.get('projects', '')
    if not proj_text.strip():
        return {
            "has_projects": False,
            "project_count": 0,
            "jd_keywords_in_projects": [],
            "relevance": "none",
        }

    # Count project entries heuristically
    project_indicators = re.findall(
        r'(?:^|\n)\s*(?:\d+[\.\)]\s+|[-•*]\s+|[A-Z][^a-z]{0,20}:)',
        proj_text
    )
    proj_count = max(1, len(project_indicators))

    # Find which JD keywords appear in projects
    proj_lower = proj_text.lower()
    from skill_normalizer import _PATTERN_LIST
    matched_jd = []
    for term, canonical_lower, pattern in _PATTERN_LIST:
        if canonical_lower in jd_kws and pattern.search(proj_lower):
            if canonical_lower not in matched_jd:
                matched_jd.append(canonical_lower)

    relevance = (
        "high"   if len(matched_jd) >= 3 else
        "medium" if len(matched_jd) >= 1 else
        "low"
    )

    return {
        "has_projects": True,
        "project_count": proj_count,
        "jd_keywords_in_projects": [display_name(k) for k in matched_jd],
        "relevance": relevance,
    }


def _check_readability(text: str, sections: Dict[str, str]) -> Dict:
    """
    Check for common ATS parsing problems in the extracted text.
    Note: visual layout issues (columns, tables, etc.) are not detectable
    from plain text alone.
    """
    issues = []
    warnings = []

    # Unusual characters
    unusual = re.findall(r'[^\x00-\x7F\u00C0-\u024F]', text)
    if len(unusual) > 20:
        issues.append("Unusual/non-ASCII characters detected — may cause parsing errors")

    # Extremely long lines (could indicate merged columns)
    long_lines = [l for l in text.split('\n') if len(l) > 200]
    if long_lines:
        issues.append(f"{len(long_lines)} very long lines found — may indicate merged columns")

    # Email format check
    malformed_email = re.search(r'@[^.\s]{0,3}\s|[a-z0-9]\s+@\s+[a-z]', text, re.IGNORECASE)
    if malformed_email:
        warnings.append("Possibly malformed email format detected")

    # Section header quality
    if not sections or len(sections) < 2:
        issues.append("Very few section headers detected — ATS may not categorize resume correctly")

    limitations = [
        "Visual layout issues (columns, tables, graphics) are not detectable from extracted text.",
        "Font embedding and encoding issues are not detectable without PDF metadata.",
    ]

    score = max(5 - len(issues) * 2 - len(warnings), 0)
    return {
        "score": score,
        "issues": issues,
        "warnings": warnings,
        "limitations": limitations,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN SCORING FUNCTION
# ─────────────────────────────────────────────────────────────────────────────
def calculate_ats_score(
    resume_text: str,
    sections: Dict[str, str],
    target_role: Optional[str] = None,
    job_description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calculate ATS-Style Compatibility Score.

    Priority:
    1. If job_description provided → use JD keywords
    2. Elif target_role provided → use knowledge-base role keywords
    3. Else → general quality analysis only (no job-specific score)

    Returns full explainable breakdown.
    """
    weights = ATS_CONFIG["weights"]
    kw_weights = ATS_CONFIG["keyword_weights"]
    text_lower = resume_text.lower()

    breakdown: Dict[str, Any] = {}
    recommendations: List[str] = []
    limitations: List[str] = []
    total_score = 0.0

    # ── Detect skills across the whole resume (with section context) ──────────
    all_skills = extract_skills_with_sections(resume_text, sections)
    skill_canonicals = {s["canonical"] for s in all_skills}

    # ── Determine keyword source ──────────────────────────────────────────────
    jd_parsed = None
    role_from_kb = None
    jd_provided = bool(job_description and job_description.strip())
    keyword_source = "none"

    if jd_provided:
        jd_parsed = parse_job_description(job_description)
        if jd_parsed.get("parsed") and jd_parsed.get("all_keywords"):
            keyword_source = "job_description"
        else:
            # JD given but no skills extracted — fall back to role KB
            jd_provided = False
            limitations.append(
                "Job description was provided but no recognizable skills were extracted. "
                "Falling back to role knowledge base."
            )

    if keyword_source == "none" and target_role:
        role_from_kb = _find_role_in_kb(target_role)
        if role_from_kb:
            keyword_source = "role_knowledge_base"

    if keyword_source == "none":
        limitations.append(
            "No target role or job description provided. "
            "Job-specific keyword compatibility could not be calculated. "
            "Showing general resume quality analysis only."
        )

    # ── A. Keyword / Skill Match (40 pts) ────────────────────────────────────
    if keyword_source == "job_description":
        required_kws = jd_parsed["required_keywords"]
        preferred_kws = jd_parsed["preferred_keywords"]
        general_kws = jd_parsed.get("general_keywords", [])
        all_jd_kws = jd_parsed["all_keywords"]
    elif keyword_source == "role_knowledge_base":
        kb_entry = ATS_CONFIG["role_keywords"][role_from_kb]
        required_kws = kb_entry["required"]
        preferred_kws = kb_entry["preferred"]
        general_kws = kb_entry.get("general", [])
        all_jd_kws = list(set(required_kws + preferred_kws + general_kws))
    else:
        required_kws = []
        preferred_kws = []
        general_kws = []
        all_jd_kws = []

    # Match keywords against skills found anywhere in resume
    def _match(kw_list):
        matched = []
        missing = []
        for kw in kw_list:
            if kw in skill_canonicals:
                matched.append(kw)
            else:
                missing.append(kw)
        return matched, missing

    req_matched, req_missing = _match(required_kws)
    pref_matched, pref_missing = _match(preferred_kws)
    gen_matched, gen_missing = _match(general_kws)

    req_pct  = round(len(req_matched)  / max(len(required_kws),  1) * 100)
    pref_pct = round(len(pref_matched) / max(len(preferred_kws), 1) * 100)
    gen_pct  = round(len(gen_matched)  / max(len(general_kws),   1) * 100)

    if keyword_source != "none":
        kw_score_raw = (
            req_pct  * kw_weights["required"] +
            pref_pct * kw_weights["preferred"] +
            gen_pct  * kw_weights["general"]
        )
        kw_score = round(kw_score_raw / 100 * weights["keyword_match"], 1)
    else:
        # General quality: reward skill breadth but not job-specific
        kw_score = min(len(skill_canonicals) * 1.5, weights["keyword_match"] * 0.6)
        kw_score = round(kw_score, 1)

    total_score += kw_score

    keyword_analysis = {
        "source":                   keyword_source,
        "jdProvided":               jd_provided,
        "requiredMatchPercentage":  req_pct if required_kws else None,
        "preferredMatchPercentage": pref_pct if preferred_kws else None,
        "overallMatchPercentage": round(
            (req_pct * kw_weights["required"] + pref_pct * kw_weights["preferred"] + gen_pct * kw_weights["general"])
        ) if keyword_source != "none" else None,
        "matchedRequired":    [display_name(k) for k in req_matched],
        "matchedPreferred":   [display_name(k) for k in pref_matched],
        "missingRequired":    [display_name(k) for k in req_missing],
        "missingPreferred":   [display_name(k) for k in pref_missing],
        "allMatched":         [display_name(k) for k in (req_matched + pref_matched + gen_matched)],
    }

    breakdown["keywordMatch"] = {
        "score": kw_score,
        "maxScore": weights["keyword_match"],
        "detail": keyword_analysis,
    }

    # Keyword recommendations (anti-fabrication: only suggest if plausibly relevant)
    for kw in req_missing[:5]:
        recommendations.append(
            f"Add '{display_name(kw)}' to your resume if you have genuine experience with it — "
            f"it's a required keyword in the target role."
        )
    for kw in pref_missing[:3]:
        recommendations.append(
            f"Consider adding '{display_name(kw)}' only if you have actually used it in a "
            f"project, internship, course, or work experience."
        )

    # ── B. Sections / Structure (15 pts) ─────────────────────────────────────
    sec_pts = ATS_CONFIG["section_points"]
    section_score = 0
    section_status: Dict[str, bool] = {}
    section_score_detail = {}

    for sec, pts in sec_pts.items():
        present = sec in sections and bool(sections[sec].strip())
        section_status[sec] = present
        earned = pts if present else 0
        section_score += earned
        section_score_detail[sec] = {"present": present, "points": pts, "earned": earned}

    section_score = min(section_score, weights["sections"])
    total_score += section_score

    breakdown["sections"] = {
        "score": section_score,
        "maxScore": weights["sections"],
        "status": section_status,
        "detail": section_score_detail,
    }

    missing_secs = [s for s, p in section_status.items() if not p]
    if "skills" not in section_status or not section_status["skills"]:
        recommendations.append(
            "Add a clearly labeled 'SKILLS' or 'TECHNICAL SKILLS' section. "
            "Note: skills found in Experience and Projects are still counted, "
            "but a dedicated section improves ATS parsing."
        )
    if missing_secs:
        recommendations.append(
            f"Add labeled section headers for: {', '.join(s.upper() for s in missing_secs)}. "
            "ATS systems rely on section headers to categorize your content."
        )

    # ── C. Experience Relevance (15 pts) ─────────────────────────────────────
    exp_analysis = _check_experience_match(sections, jd_parsed or {})
    exp_score = 0

    if exp_analysis["has_experience_section"]:
        exp_score += 7  # has section
        if exp_analysis["has_internship"]:
            exp_score += 3
        if exp_analysis["experience_entries"] >= 1:
            exp_score += 5
    else:
        recommendations.append(
            "Add an EXPERIENCE or INTERNSHIPS section even if experience is limited. "
            "Include coursework projects, internships, or part-time work."
        )

    exp_score = min(exp_score, weights["experience"])
    total_score += exp_score

    breakdown["experience"] = {
        "score": exp_score,
        "maxScore": weights["experience"],
        "analysis": exp_analysis,
    }

    # ── D. Projects / Evidence (10 pts) ──────────────────────────────────────
    proj_analysis = _check_project_relevance(sections, all_jd_kws)
    proj_score = 0

    if proj_analysis["has_projects"]:
        proj_score += 4
        if proj_analysis["relevance"] == "high":
            proj_score += 6
        elif proj_analysis["relevance"] == "medium":
            proj_score += 3
        elif proj_analysis["relevance"] == "low":
            proj_score += 1
    else:
        recommendations.append(
            "Add a PROJECTS section. For freshers and students, projects are critical evidence "
            "of technical skills. Include technology stack and outcomes."
        )

    proj_score = min(proj_score, weights["projects"])
    total_score += proj_score

    breakdown["projects"] = {
        "score": proj_score,
        "maxScore": weights["projects"],
        "analysis": proj_analysis,
    }

    # ── E. Contact / Professional Info (5 pts) ───────────────────────────────
    contact = extract_contact_safe(resume_text)
    contact_score = sum([
        2 if contact["email"]    else 0,
        1 if contact["phone"]    else 0,
        1 if contact["linkedin"] else 0,
        1 if contact["github"]   else 0,
    ])
    contact_score = min(contact_score, weights["contact"])
    total_score += contact_score

    breakdown["contact"] = {
        "score": contact_score,
        "maxScore": weights["contact"],
        "fields": contact,
    }

    if not contact["email"]:
        recommendations.append("Add your email address — required by all ATS systems.")
    if not contact["linkedin"]:
        recommendations.append("Add your LinkedIn profile URL if you have one.")
    if not contact["github"]:
        recommendations.append(
            "Add your GitHub profile URL if you have relevant public projects."
        )

    # ── F. Achievements / Quantification (5 pts) ─────────────────────────────
    verb_count = sum(1 for v in ACTION_VERBS if re.search(r'\b' + v + r'\b', text_lower))
    quant_count = _count_quantified(resume_text)

    # Verbs: up to 3 pts; Quants: up to 2 pts
    verb_score = min(round(verb_count * 0.5), 3)
    quant_score = min(round(quant_count * 0.5), 2)
    ach_score = min(verb_score + quant_score, weights["achievements"])
    total_score += ach_score

    breakdown["achievements"] = {
        "score": ach_score,
        "maxScore": weights["achievements"],
        "actionVerbCount": verb_count,
        "quantifiedAchievementCount": quant_count,
    }

    if verb_count < 4:
        recommendations.append(
            "Use strong action verbs to describe contributions: Developed, Built, Optimized, "
            "Implemented, Led, Engineered, Deployed, Reduced, Improved."
        )
    if quant_count == 0:
        recommendations.append(
            'Quantify your achievements with real metrics: "Improved API response time by 35%", '
            '"Processed 50,000 records daily", "Built for 500+ active users". '
            'Do not fabricate metrics you did not achieve.'
        )

    # ── G. Readability / Parsing Safety (5 pts) ──────────────────────────────
    readability = _check_readability(resume_text, sections)
    readability_score = min(readability["score"], weights["readability"])
    total_score += readability_score
    limitations.extend(readability["limitations"])

    breakdown["readability"] = {
        "score": readability_score,
        "maxScore": weights["readability"],
        "issues": readability["issues"],
        "warnings": readability["warnings"],
    }

    # ── H. Education / Certifications (5 pts) ────────────────────────────────
    edu_info = extract_education_info(resume_text)
    edu_score = 0
    if edu_info["has_degree"]:
        edu_score += 3
    if edu_info["certifications"]:
        edu_score += min(len(edu_info["certifications"]) * 1, 2)
    edu_score = min(edu_score, weights["education_certifications"])
    total_score += edu_score

    breakdown["educationCertifications"] = {
        "score": edu_score,
        "maxScore": weights["education_certifications"],
        "hasDegree": edu_info["has_degree"],
        "degreeType": edu_info["degree_type"],
        "cgpa": edu_info["cgpa"],
        "certifications": edu_info["certifications"],
    }

    if not edu_info["has_degree"]:
        recommendations.append(
            "Add your educational qualification with degree type, institution, and graduation year."
        )

    # ── Resume Length ─────────────────────────────────────────────────────────
    word_count = len(resume_text.split())
    thresholds = ATS_CONFIG["length_thresholds"]
    if word_count < thresholds["too_short"]:
        recommendations.append(
            f"Resume appears very short ({word_count} words). "
            "Elaborate on projects, responsibilities, and technical details."
        )
    elif word_count > thresholds["too_long"]:
        recommendations.append(
            f"Resume is very long ({word_count} words). "
            "For ATS compatibility, aim for concise 1–2 page resumes."
        )

    # ── Final Score ────────────────────────────────────────────────────────────
    final_score = max(0, min(100, int(round(total_score))))

    # Strengths
    strengths = []
    if kw_score >= weights["keyword_match"] * 0.7:
        strengths.append(f"Strong keyword match ({len(req_matched)} required skills found)")
    if section_status.get("skills") and section_status.get("experience"):
        strengths.append("Key resume sections present")
    if verb_count >= 6:
        strengths.append(f"{verb_count} action verbs demonstrate strong achievements")
    if quant_count >= 2:
        strengths.append(f"{quant_count} quantified achievements found")
    if contact["linkedin"] and contact["github"]:
        strengths.append("Professional profiles (LinkedIn + GitHub) included")
    if edu_info["certifications"]:
        strengths.append(f"{len(edu_info['certifications'])} certification(s) detected")

    # ── Actionable Improvements for Bad / Suboptimal Resumes ────────────────
    is_bad = final_score < 65
    critical_issues = []
    points_to_change = []

    # 1. Missing keywords
    if req_missing:
        critical_issues.append(f"Missing {len(req_missing)} required core skills for {target_role or 'your target role'}: {', '.join(display_name(k) for k in req_missing[:4])}.")
        points_to_change.append(f"Add critical missing skills to your SKILLS section and reference them in projects: {', '.join(display_name(k) for k in req_missing[:5])}.")

    # 2. Missing standard sections
    missing_critical_secs = [s for s in ['skills', 'experience', 'projects', 'education'] if not section_status.get(s)]
    if missing_critical_secs:
        critical_issues.append(f"Missing standard ATS section headers: {', '.join(s.upper() for s in missing_critical_secs)}.")
        points_to_change.append(f"Create dedicated sections with standard uppercase headers: {', '.join(s.upper() for s in missing_critical_secs)}. ATS systems parse sections by exact name matching.")

    # 3. Action verbs
    if verb_count < 4:
        critical_issues.append(f"Weak impact phrasing — only {verb_count} action verbs detected.")
        points_to_change.append("Begin every project and experience bullet point with impactful action verbs: e.g. 'Developed', 'Architected', 'Engineered', 'Optimized', 'Deployed'.")

    # 4. Quantifiable achievements
    if quant_count == 0:
        critical_issues.append("Zero quantified metrics found (percentages, user counts, performance gains).")
        points_to_change.append("Quantify your project outcomes using measurable results: e.g. 'Reduced page load time by 35%', 'Processed 10,000+ records', 'Achieved 94% model accuracy'.")

    # 5. Word count
    if word_count < thresholds["too_short"]:
        critical_issues.append(f"Resume is excessively brief ({word_count} words). Minimum recommended is 250+ words.")
        points_to_change.append(f"Expand resume length from {word_count} words to 350-500 words by adding detailed tech stacks and 2-3 descriptive bullet points per project.")

    # 6. Contact info
    if not contact["email"] or not contact["linkedin"] or not contact["github"]:
        missing_contacts = [k.capitalize() for k, v in [('Email', contact['email']), ('LinkedIn', contact['linkedin']), ('GitHub', contact['github'])] if not v]
        if missing_contacts:
            critical_issues.append(f"Incomplete professional profile: Missing {', '.join(missing_contacts)}.")
            points_to_change.append(f"Add direct links to your {', '.join(missing_contacts)} at the top of your resume.")

    actionable_improvements = {
        "isBadResume": is_bad,
        "criticalIssues": critical_issues,
        "pointsToChange": points_to_change,
        "exampleTemplate": {
            "before": "Worked on a web project for student career recommendations.",
            "after": "Architected an AI-powered Career Recommendation platform using React, Python, and SQL, processing 1,000+ student profiles with 95% placement fit."
        }
    }

    return {
        "atsScore":          final_score,
        "scoreCategory":     _score_category(final_score),
        "disclaimer":        "ATS-Style Compatibility Score — simulates common ATS factors. "
                             "Not a guarantee of interview success or a company's actual ATS.",
        "targetRole":        target_role,
        "jobDescriptionProvided": jd_provided,
        "keywordSource":     keyword_source,
        "breakdown": {
            "keywordMatch":          kw_score,
            "sections":              section_score,
            "experience":            exp_score,
            "projects":              proj_score,
            "contact":               contact_score,
            "achievements":          ach_score,
            "readability":           readability_score,
            "educationCertifications": edu_score,
        },
        "breakdownDetail":   breakdown,
        "keywordAnalysis":   keyword_analysis,
        "sections":          section_status,
        "contact":           contact,
        "experienceAnalysis": exp_analysis,
        "projectAnalysis":   proj_analysis,
        "achievements": {
            "actionVerbCount":            verb_count,
            "quantifiedAchievementCount": quant_count,
        },
        "detectedSkills": [
            {
                "name":     s["display"],
                "sections": s["sections"],
                "evidence": s["evidence_strength"],
            }
            for s in all_skills
        ],
        "wordCount":      word_count,
        "strengths":      strengths,
        "recommendations": recommendations[:10],
        "actionableImprovements": actionable_improvements,
        "limitations":    limitations,
    }
