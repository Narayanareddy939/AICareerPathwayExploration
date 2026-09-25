"""
resume_parser.py
=================
Resume parsing pipeline — extracts text from PDF/DOCX/TXT,
parses sections, and runs the ATS scorer.

Public API:
  parse_resume(file_path, target_role, job_description) → dict
  parse_resume_text(text, target_role, job_description)  → dict

The ATS score is calculated by ats_scorer.py (single source of truth).
This module handles text extraction and section parsing only.
"""

import re
import os
import sys
from typing import Dict, List, Any, Optional

import importlib

# ── Optional PDF / DOCX parsers ──────────────────────────────────────────────
fitz = None
try:
    fitz = importlib.import_module("fitz")
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

pypdf = None
try:
    pypdf = importlib.import_module("pypdf")
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

pdfplumber = None
try:
    pdfplumber = importlib.import_module("pdfplumber")
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

Document = None
try:
    _docx = importlib.import_module("docx")
    Document = getattr(_docx, "Document", None)
    HAS_DOCX = Document is not None
except ImportError:
    HAS_DOCX = False

# ── Local imports ─────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ats_scorer import calculate_ats_score, parse_sections, extract_contact_safe, extract_education_info
from skill_normalizer import extract_skills_with_sections


# ─────────────────────────────────────────────────────────────────────────────
#  Text Extraction
# ─────────────────────────────────────────────────────────────────────────────
def extract_text_from_pdf(file_path: str) -> str:
    if HAS_PYPDF:
        try:
            reader = pypdf.PdfReader(file_path)
            parts = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(parts)
            if text.strip():
                return text
        except Exception as e:
            print(f"[resume_parser] pypdf failed: {e}")

    if HAS_PYMUPDF:
        try:
            doc = fitz.open(file_path)
            text = "".join(page.get_text() for page in doc)
            doc.close()
            if text.strip():
                return text
        except Exception as e:
            print(f"[resume_parser] PyMuPDF failed: {e}")

    if HAS_PDFPLUMBER:
        try:
            with pdfplumber.open(file_path) as pdf:
                parts = []
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        parts.append(t)
                text = "\n".join(parts)
                if text.strip():
                    return text
        except Exception as e:
            print(f"[resume_parser] pdfplumber failed: {e}")

    raise RuntimeError("No PDF parser available or failed to extract text from PDF.")


def extract_text_from_docx(file_path: str) -> str:
    if not HAS_DOCX:
        raise RuntimeError("python-docx not installed. Run: pip install python-docx")
    doc = Document(file_path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text_from_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    elif ext in (".txt", ".text", ".md", ""):
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file format: {ext}")


# ─────────────────────────────────────────────────────────────────────────────
#  Pipeline helpers
# ─────────────────────────────────────────────────────────────────────────────
def _build_result(raw_text: str, target_role: Optional[str], job_description: Optional[str]) -> Dict[str, Any]:
    sections = parse_sections(raw_text)
    skills = extract_skills_with_sections(raw_text, sections)
    education = extract_education_info(raw_text)
    contact = extract_contact_safe(raw_text)

    ats_result = calculate_ats_score(
        resume_text=raw_text,
        sections=sections,
        target_role=target_role,
        job_description=job_description,
    )

    return {
        # Raw
        "rawTextLength":    len(raw_text),
        "wordCount":        ats_result["wordCount"],
        # Parsed sections
        "sectionsDetected": list(sections.keys()),
        # Skills (enriched with section + evidence)
        "skills":           [s["display"] for s in skills],
        "skillDetails":     skills,
        "skillCount":       len(skills),
        # Education
        "education":        education,
        # Contact (boolean only — no PII in response)
        "contact":          contact,
        # ATS result fields (flattened for frontend)
        "atsScore":         ats_result["atsScore"],
        "scoreCategory":    ats_result["scoreCategory"],
        "disclaimer":       ats_result["disclaimer"],
        "targetRole":       target_role,
        "jobDescriptionProvided": ats_result["jobDescriptionProvided"],
        "keywordSource":    ats_result["keywordSource"],
        "breakdown":        ats_result["breakdown"],
        "breakdownDetail":  ats_result["breakdownDetail"],
        "keywordAnalysis":  ats_result["keywordAnalysis"],
        "sections":         ats_result["sections"],
        "experienceAnalysis": ats_result["experienceAnalysis"],
        "projectAnalysis":  ats_result["projectAnalysis"],
        "achievements":     ats_result["achievements"],
        "detectedSkills":   ats_result["detectedSkills"],
        "strengths":        ats_result["strengths"],
        "recommendations":  ats_result["recommendations"],
        "actionableImprovements": ats_result.get("actionableImprovements"),
        "isBadResume":      ats_result.get("actionableImprovements", {}).get("isBadResume", False),
        "limitations":      ats_result["limitations"],
        # Parser availability metadata
        "availableParsers": {
            "PyMuPDF":    HAS_PYMUPDF,
            "pdfplumber": HAS_PDFPLUMBER,
            "python-docx": HAS_DOCX,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Public API
# ─────────────────────────────────────────────────────────────────────────────
def parse_resume(
    file_path: str,
    target_role: Optional[str] = None,
    job_description: Optional[str] = None,
) -> Dict[str, Any]:
    """Parse a resume file and return full ATS analysis."""
    raw_text = extract_text_from_file(file_path)
    return _build_result(raw_text, target_role, job_description)


def parse_resume_text(
    raw_text: str,
    target_role: Optional[str] = None,
    job_description: Optional[str] = None,
) -> Dict[str, Any]:
    """Parse resume from already-extracted text and return full ATS analysis."""
    if not raw_text or not raw_text.strip():
        return {
            "error": "Empty resume text",
            "atsScore": 0,
            "scoreCategory": "Low Compatibility",
        }
    return _build_result(raw_text.strip(), target_role, job_description)


# ─────────────────────────────────────────────────────────────────────────────
#  Quick smoke test
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = """
Priya Sharma
priya.sharma@email.com | +91 9876543210
linkedin.com/in/priya-sharma | github.com/priyasharma

EDUCATION
B.Tech Computer Science, VIT Vellore — CGPA: 8.7/10 (2024)

SKILLS
Python, Machine Learning, Pandas, NumPy, SQL, TensorFlow, Scikit-Learn, Git

EXPERIENCE & INTERNSHIPS
Data Science Intern | TCS | June 2023 – Aug 2023
- Developed ML model for customer churn, achieving 87% accuracy
- Processed 50,000+ records using Python and Pandas
- Reduced data preprocessing time by 35%

PROJECTS
1. Resume ATS Analyzer — NLP-based scorer using Python, Scikit-Learn, Flask
2. Student Performance Predictor — TensorFlow model with 92% accuracy on 5000 students

CERTIFICATIONS
Google Data Analytics Professional Certificate | AWS Cloud Practitioner
"""

    jd = """
We are looking for a Data Scientist.

Required:
Python, SQL, Machine Learning, Pandas, NumPy, Statistics

Preferred:
TensorFlow, PyTorch, Data Visualization, Power BI, AWS
"""

    result = parse_resume_text(sample, "Data Scientist", jd)
    print(f"ATS Score: {result['atsScore']} ({result['scoreCategory']})")
    print(f"Keyword source: {result['keywordSource']}")
    print(f"Required matched: {result['keywordAnalysis']['matchedRequired']}")
    print(f"Required missing: {result['keywordAnalysis']['missingRequired']}")
    print(f"Breakdown: {result['breakdown']}")
    print(f"Recommendations: {result['recommendations'][:3]}")
