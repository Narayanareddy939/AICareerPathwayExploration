"""
resume_parser.py
Parses resume files (PDF, DOCX, or plain text) to extract:
  - Skills
  - Education
  - Work experience
  - Projects
  - Certifications
  - Contact info
  - ATS score

Dependencies (optional — gracefully handles missing):
  - PyMuPDF (fitz) for PDF parsing
  - python-docx for DOCX parsing
  - pdfplumber for alternate PDF parsing

Falls back to text-based parsing if PDF/DOCX libs unavailable.
"""

import re
import os
import sys
from typing import Dict, List, Any, Optional

# Try importing PDF/DOCX libraries
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recommendation.skill_matcher import normalize_skills_list, get_all_canonical_skills

# ─────────────────────────────────────────────────────────────────────────────
#  Section Header Patterns
# ─────────────────────────────────────────────────────────────────────────────
SECTION_PATTERNS = {
    "education": re.compile(r'\b(education|academic|qualification|degree|university|college|school)\b', re.IGNORECASE),
    "experience": re.compile(r'\b(experience|employment|work history|professional background|internship|intern)\b', re.IGNORECASE),
    "skills": re.compile(r'\b(skills|technical skills|core competencies|technologies|tools|expertise)\b', re.IGNORECASE),
    "projects": re.compile(r'\b(projects|personal projects|academic projects|portfolio|open source)\b', re.IGNORECASE),
    "certifications": re.compile(r'\b(certifications?|certificates?|courses|training|credentials)\b', re.IGNORECASE),
    "achievements": re.compile(r'\b(achievements?|awards?|honors?|accomplishments?)\b', re.IGNORECASE),
    "contact": re.compile(r'\b(contact|email|phone|linkedin|github|address)\b', re.IGNORECASE),
    "summary": re.compile(r'\b(summary|objective|profile|about|overview)\b', re.IGNORECASE),
}

# Action verbs that indicate strong resume language
ACTION_VERBS = [
    "developed","designed","built","implemented","optimized","led","created",
    "achieved","increased","reduced","improved","launched","managed","analyzed",
    "architected","engineered","deployed","automated","delivered","streamlined",
    "collaborated","mentored","researched","trained","configured","maintained",
    "integrated","migrated","refactored","tested","documented","coordinated",
]

# Common degree patterns
DEGREE_PATTERNS = re.compile(
    r'\b(B\.?Tech|B\.?E\.?|Bachelor of (Technology|Engineering|Science|Arts|Commerce)|M\.?Tech|M\.?E\.?|M\.?S\.?|MBA|Ph\.?D?|MCA|BCA|B\.Sc|M\.Sc)\b',
    re.IGNORECASE
)

# Common university patterns
UNIVERSITY_PATTERNS = re.compile(
    r'(University|Institute of Technology|College|IIT|NIT|BITS|VIT|SRM|Anna|Manipal|JNTU|Amrita)',
    re.IGNORECASE
)

# CGPA/GPA patterns
CGPA_PATTERN = re.compile(r'(?:CGPA|GPA|Score)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*\d+(?:\.\d+)?)?', re.IGNORECASE)

# Email pattern
EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')

# Phone pattern (Indian)
PHONE_PATTERN = re.compile(r'(?:\+91[\s-]?)?[6-9]\d{9}')

# LinkedIn pattern
LINKEDIN_PATTERN = re.compile(r'linkedin\.com/in/([a-zA-Z0-9-]+)', re.IGNORECASE)

# GitHub pattern
GITHUB_PATTERN = re.compile(r'github\.com/([a-zA-Z0-9-]+)', re.IGNORECASE)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    text = ""
    
    if HAS_PYMUPDF:
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            print(f"PyMuPDF failed: {e}")
    
    if HAS_PDFPLUMBER:
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
            return text
        except Exception as e:
            print(f"pdfplumber failed: {e}")
    
    raise RuntimeError("No PDF parser available. Install PyMuPDF or pdfplumber.")


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    if not HAS_DOCX:
        raise RuntimeError("python-docx not installed. Run: pip install python-docx")
    
    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def extract_text_from_file(file_path: str) -> str:
    """Extract text from a file (auto-detect format)."""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    elif ext in [".txt", ".text", ""]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def extract_skills_from_text(text: str) -> List[str]:
    """
    Extract skill mentions from resume text using canonical skill taxonomy.
    Looks for skills in the text using exact, alias, and partial matching.
    """
    text_lower = text.lower()
    
    all_canonical = get_all_canonical_skills()
    found_skills = []
    
    for canonical in all_canonical:
        if canonical.lower() in text_lower:
            found_skills.append(canonical)
    
    # Also check common abbreviations directly
    abbreviations = {
        r'\bjs\b': "JavaScript",
        r'\bts\b': "TypeScript",
        r'\bml\b': "Machine Learning",
        r'\bdl\b': "Deep Learning",
        r'\bdsa\b': "Data Structures",
        r'\boop\b': "OOP",
        r'\baws\b': "AWS",
        r'\bgcp\b': "GCP",
        r'\bci/cd\b': "CI/CD",
        r'\brest\b': "REST API",
        r'\bapi\b': "REST API",
        r'\bnlp\b': "NLP",
    }
    
    for pattern, skill in abbreviations.items():
        if re.search(pattern, text_lower) and skill not in found_skills:
            found_skills.append(skill)
    
    return list(set(found_skills))


def extract_sections(text: str) -> Dict[str, str]:
    """
    Split resume text into logical sections.
    Returns dict mapping section_name to section_text.
    """
    lines = text.split('\n')
    sections = {}
    current_section = "header"
    current_lines = []
    
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        # Check if this line is a section header
        found_section = None
        for section_name, pattern in SECTION_PATTERNS.items():
            if pattern.search(line_stripped) and len(line_stripped) < 60:
                found_section = section_name
                break
        
        if found_section:
            # Save previous section
            if current_lines:
                sections[current_section] = "\n".join(current_lines)
            current_section = found_section
            current_lines = []
        else:
            current_lines.append(line_stripped)
    
    # Save last section
    if current_lines:
        sections[current_section] = "\n".join(current_lines)
    
    return sections


def extract_education(text: str) -> List[Dict]:
    """Extract education information."""
    education = []
    
    degrees = DEGREE_PATTERNS.findall(text)
    universities = UNIVERSITY_PATTERNS.findall(text)
    cgpa_matches = CGPA_PATTERN.findall(text)
    
    if degrees:
        edu_entry = {
            "degree": degrees[0][0] if degrees else "",
            "institution": universities[0] if universities else "",
            "cgpa": cgpa_matches[0] if cgpa_matches else "",
        }
        education.append(edu_entry)
    
    return education


def extract_contact_info(text: str) -> Dict[str, str]:
    """Extract contact information."""
    emails = EMAIL_PATTERN.findall(text)
    phones = PHONE_PATTERN.findall(text)
    linkedin_matches = LINKEDIN_PATTERN.findall(text)
    github_matches = GITHUB_PATTERN.findall(text)
    
    return {
        "email": emails[0] if emails else "",
        "phone": phones[0] if phones else "",
        "linkedin": f"linkedin.com/in/{linkedin_matches[0]}" if linkedin_matches else "",
        "github": f"github.com/{github_matches[0]}" if github_matches else "",
    }


def calculate_ats_score(
    text: str,
    skills: List[str],
    sections: Dict[str, str],
    target_role: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculate ATS (Applicant Tracking System) compatibility score.
    
    Scoring breakdown:
    - Section presence (25 points): education, experience, projects, skills, certifications
    - Skill density (25 points): number and variety of skills detected
    - Action verbs (20 points): strong action verb usage
    - Contact info (10 points): complete contact information
    - Length appropriateness (10 points): appropriate length
    - Role-specific keywords (10 points): if target_role provided
    """
    text_lower = text.lower()
    score = 0
    breakdown = {}
    suggestions = []
    
    # 1. Section presence (25 points)
    required_sections = {"education", "experience", "skills", "projects", "certifications"}
    detected_sections = set(sections.keys()) & required_sections
    section_score = len(detected_sections) * 5
    score += section_score
    breakdown["sections"] = {"score": section_score, "detected": list(detected_sections)}
    
    missing_sections = required_sections - detected_sections
    if missing_sections:
        suggestions.append(f"Add clear section headers for: {', '.join(s.upper() for s in missing_sections)}")
    
    # 2. Skill density (25 points)
    skill_score = min(len(skills) * 2.5, 25)
    score += skill_score
    breakdown["skills"] = {"score": skill_score, "count": len(skills)}
    
    if len(skills) < 5:
        suggestions.append("Add more technical skills — aim for at least 8-10 relevant skills")
    
    # 3. Action verbs (20 points)
    verb_count = sum(1 for v in ACTION_VERBS if v in text_lower)
    verb_score = min(verb_count * 2, 20)
    score += verb_score
    breakdown["actionVerbs"] = {"score": verb_score, "count": verb_count}
    
    if verb_count < 5:
        suggestions.append("Use strong action verbs: Developed, Optimized, Architected, Implemented, Led, Achieved")
    
    # 4. Contact completeness (10 points)
    contact = extract_contact_info(text)
    contact_fields = sum(1 for v in contact.values() if v)
    contact_score = min(contact_fields * 2.5, 10)
    score += contact_score
    breakdown["contact"] = {"score": contact_score, "fields": contact}
    
    if not contact.get("linkedin"):
        suggestions.append("Add your LinkedIn profile URL")
    if not contact.get("github"):
        suggestions.append("Add your GitHub profile URL for technical roles")
    
    # 5. Length appropriateness (10 points)
    word_count = len(text.split())
    if 300 <= word_count <= 700:
        length_score = 10
    elif 200 <= word_count <= 900:
        length_score = 7
    else:
        length_score = 4
    score += length_score
    breakdown["length"] = {"score": length_score, "wordCount": word_count}
    
    if word_count < 200:
        suggestions.append("Resume appears too short — add more details about projects and experience")
    elif word_count > 900:
        suggestions.append("Resume may be too long — aim for 1 page (400-600 words)")
    
    # 6. Quantification check (10 points)
    quantification_patterns = re.findall(r'\d+%|\d+ months|\d+ years|\d+ users|\d+ projects', text_lower)
    quant_score = min(len(quantification_patterns) * 3, 10)
    score += quant_score
    breakdown["quantification"] = {"score": quant_score, "examples": quantification_patterns[:3]}
    
    if len(quantification_patterns) < 2:
        suggestions.append('Quantify achievements: "Improved performance by 35%", "Built app with 10K+ users"')
    
    # Clamp score to 0-98 range
    final_score = min(max(int(score), 10), 98)
    
    return {
        "atsScore": final_score,
        "scoreCategory": (
            "Excellent" if final_score >= 80 else
            "Good" if final_score >= 65 else
            "Average" if final_score >= 50 else
            "Needs Improvement"
        ),
        "breakdown": breakdown,
        "suggestions": suggestions,
        "strengths": [
            f"Detected {len(skills)} technical skills" if len(skills) >= 5 else None,
            f"Strong use of action verbs ({verb_count})" if verb_count >= 5 else None,
            f"All key sections present" if len(missing_sections) == 0 else None,
        ],
    }


def parse_resume(file_path: str, target_role: Optional[str] = None) -> Dict[str, Any]:
    """
    Full resume parsing pipeline.
    
    Args:
        file_path: Path to resume file (PDF, DOCX, or TXT)
        target_role: Target career role for context (optional)
    
    Returns:
        Comprehensive resume analysis dict
    """
    # Extract text
    raw_text = extract_text_from_file(file_path)
    
    # Extract sections
    sections = extract_sections(raw_text)
    
    # Extract components
    skills = extract_skills_from_text(raw_text)
    education = extract_education(raw_text)
    contact = extract_contact_info(raw_text)
    
    # ATS score
    ats_result = calculate_ats_score(raw_text, skills, sections, target_role)
    
    # Extract certifications (simple keyword search)
    cert_patterns = re.findall(
        r'(AWS Certified|Google Professional|Microsoft Certified|Cisco|CompTIA|PMP|Scrum|Meta|IBM|Oracle)\s+[A-Za-z\s]+',
        raw_text, re.IGNORECASE
    )
    
    return {
        "rawTextLength": len(raw_text),
        "wordCount": len(raw_text.split()),
        "sectionsDetected": list(sections.keys()),
        "skills": normalize_skills_list(skills),
        "skillCount": len(skills),
        "education": education,
        "contact": contact,
        "certifications": cert_patterns[:5],
        "atsScore": ats_result["atsScore"],
        "scoreCategory": ats_result["scoreCategory"],
        "breakdown": ats_result["breakdown"],
        "suggestions": ats_result["suggestions"],
        "strengths": [s for s in ats_result.get("strengths", []) if s],
        "targetRole": target_role,
        "availableParsers": {
            "PyMuPDF": HAS_PYMUPDF,
            "pdfplumber": HAS_PDFPLUMBER,
            "python-docx": HAS_DOCX,
        }
    }


def parse_resume_text(raw_text: str, target_role: Optional[str] = None) -> Dict[str, Any]:
    """
    Parse resume from raw text (already extracted).
    Used when file upload is processed server-side.
    """
    sections = extract_sections(raw_text)
    skills = extract_skills_from_text(raw_text)
    education = extract_education(raw_text)
    contact = extract_contact_info(raw_text)
    ats_result = calculate_ats_score(raw_text, skills, sections, target_role)
    
    cert_patterns = re.findall(
        r'(AWS Certified|Google Professional|Microsoft Certified|Cisco|CompTIA|PMP|Scrum|Meta|IBM|Oracle)\s+[A-Za-z\s]+',
        raw_text, re.IGNORECASE
    )
    
    return {
        "rawTextLength": len(raw_text),
        "wordCount": len(raw_text.split()),
        "sectionsDetected": list(sections.keys()),
        "skills": normalize_skills_list(skills),
        "skillCount": len(skills),
        "education": education,
        "contact": contact,
        "certifications": cert_patterns[:5],
        "atsScore": ats_result["atsScore"],
        "scoreCategory": ats_result["scoreCategory"],
        "breakdown": ats_result["breakdown"],
        "suggestions": ats_result["suggestions"],
        "strengths": [s for s in ats_result.get("strengths", []) if s],
        "targetRole": target_role,
    }


if __name__ == "__main__":
    sample_text = """
    Priya Sharma
    priya.sharma@email.com | +91 9876543210 | linkedin.com/in/priya-sharma | github.com/priyasharma
    
    EDUCATION
    B.Tech Computer Science Engineering, VIT Vellore - CGPA: 8.7/10 (2020-2024)
    
    SKILLS
    Python, Machine Learning, React, SQL, Docker, Git, Pandas, NumPy, TensorFlow
    
    EXPERIENCE
    Software Engineer Intern | TCS | June 2023 - August 2023
    - Developed REST API endpoints using Python Flask, improving response time by 35%
    - Implemented machine learning model for customer churn prediction achieving 87% accuracy
    - Collaborated with team of 5 engineers using Agile methodology
    
    PROJECTS
    Resume Analyzer - Built NLP-based ATS scoring system using Python and Scikit-Learn
    Student Performance Predictor - Deployed ML model with 92% accuracy using TensorFlow
    
    CERTIFICATIONS
    AWS Cloud Practitioner | Google Data Analytics Professional Certificate
    """
    
    result = parse_resume_text(sample_text, "Data Scientist")
    print(f"ATS Score: {result['atsScore']} ({result['scoreCategory']})")
    print(f"Skills: {result['skills']}")
    print(f"Suggestions: {result['suggestions']}")
