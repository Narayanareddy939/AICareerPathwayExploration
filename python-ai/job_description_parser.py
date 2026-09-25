"""
job_description_parser.py
===========================
Extracts required/preferred/general keywords from a job description text.

Priority logic:
  1. Looks for explicit REQUIRED / PREFERRED / NICE TO HAVE sections
  2. Falls back to heuristic importance signals (e.g. "must have", "should have")
  3. Falls back to all detected keywords with equal weight
"""

import re
from typing import Dict, List, Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from skill_normalizer import (
    extract_skills_with_sections,
    normalize_keyword_list,
    normalize_term,
    display_name,
    CANONICAL_DISPLAY,
    ALIAS_MAP,
    _PATTERN_LIST,
)

# ─────────────────────────────────────────────────────────────────────────────
#  Section patterns for JD
# ─────────────────────────────────────────────────────────────────────────────

# Patterns that indicate "required" skills
_REQUIRED_SIGNALS = re.compile(
    r'\b(required|must.have|mandatory|essential|you.must|we.require|'
    r'minimum.requirement|needs? to have|looking for)\b',
    re.IGNORECASE
)

# Patterns that indicate "preferred/nice-to-have" skills
_PREFERRED_SIGNALS = re.compile(
    r'\b(preferred|nice.to.have|bonus|plus|desirable|advantageous|'
    r'good.to.have|would be great|if you have|optionally|ideally)\b',
    re.IGNORECASE
)

# Experience requirement patterns
_EXP_PATTERN = re.compile(
    r'(\d+)\+?\s*(?:to\s*\d+)?\s*years?\s*(?:of\s*)?(?:experience|exp)',
    re.IGNORECASE
)

# Education requirement patterns
_EDU_PATTERN = re.compile(
    r"\b(bachelor'?s?|master'?s?|phd|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|"
    r"b\.?sc|m\.?sc|mba|mca|undergraduate|postgraduate|degree)\b",
    re.IGNORECASE
)

# JD section headers
_JD_SECTION_PATTERN = re.compile(
    r'^\s*(required(?:\s+skills?|\s+qualifications?)?|'
    r'preferred(?:\s+skills?|\s+qualifications?)?|'
    r'must.have|nice.to.have|bonus.skills?|'
    r'responsibilities|what.you.will.do|'
    r'qualifications?|requirements?|'
    r'about.the.role|job.description|'
    r'we.are.looking.for|skills?\s*(?:required|needed)?)\s*:?\s*$',
    re.IGNORECASE
)


def _split_jd_sections(jd_text: str) -> Dict[str, str]:
    """
    Split JD into labeled sections: required, preferred, responsibilities, other.
    """
    lines = jd_text.split('\n')
    sections: Dict[str, List[str]] = {
        'required': [],
        'preferred': [],
        'responsibilities': [],
        'general': [],
    }
    current = 'general'

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if _JD_SECTION_PATTERN.match(stripped):
            lower = stripped.lower()
            if any(w in lower for w in ['required', 'must have', 'qualification', 'requirement']):
                current = 'required'
            elif any(w in lower for w in ['preferred', 'nice to have', 'bonus', 'good to have']):
                current = 'preferred'
            elif any(w in lower for w in ['responsibilit', 'what you will do', 'role']):
                current = 'responsibilities'
            else:
                current = 'general'
        else:
            sections[current].append(stripped)

    return {k: '\n'.join(v) for k, v in sections.items()}


def _extract_skills_from_block(text: str) -> List[str]:
    """Extract canonical_lower skill keys from a text block."""
    if not text:
        return []
    results = extract_skills_with_sections(text)
    return [r["canonical"] for r in results]


def parse_job_description(jd_text: str) -> Dict:
    """
    Parse a job description and extract:
    - required_keywords      (list of canonical_lower)
    - preferred_keywords     (list of canonical_lower)
    - general_keywords       (all other detected skills)
    - experience_requirement (string or None)
    - education_requirement  (string or None)
    - all_keywords           (union of all)
    - job_title              (extracted if possible)
    - raw_jd_text            (length, not text, for privacy)

    If JD is empty/None → returns empty structure with note.
    """
    if not jd_text or len(jd_text.strip()) < 10:
        return {
            "parsed": False,
            "note": "No job description provided.",
            "required_keywords": [],
            "preferred_keywords": [],
            "general_keywords": [],
            "all_keywords": [],
            "experience_requirement": None,
            "education_requirement": None,
            "job_title": None,
        }

    jd_text = jd_text.strip()
    sections = _split_jd_sections(jd_text)

    required_kws = _extract_skills_from_block(sections.get('required', ''))
    preferred_kws = _extract_skills_from_block(sections.get('preferred', ''))
    responsibilities_kws = _extract_skills_from_block(sections.get('responsibilities', ''))
    general_kws = _extract_skills_from_block(sections.get('general', ''))

    # If no explicit sections found, use inline heuristics
    if not required_kws and not preferred_kws:
        # Scan line-by-line for inline markers
        for line in jd_text.split('\n'):
            line_lower = line.lower()
            line_skills = _extract_skills_from_block(line)
            if _REQUIRED_SIGNALS.search(line_lower):
                required_kws.extend(line_skills)
            elif _PREFERRED_SIGNALS.search(line_lower):
                preferred_kws.extend(line_skills)
            else:
                general_kws.extend(line_skills)

    # If still nothing separated, everything is "general"
    if not required_kws and not preferred_kws:
        general_kws = _extract_skills_from_block(jd_text)

    # Merge responsibilities into required (jobs expect you to do them)
    required_kws = _dedup(required_kws + responsibilities_kws)

    # Remove overlaps: preferred should not be in required
    preferred_set = set(preferred_kws)
    required_set = set(required_kws)
    preferred_kws = list(preferred_set - required_set)
    general_kws = list(set(general_kws) - required_set - preferred_set)

    all_kws = _dedup(list(required_set) + preferred_kws + general_kws)

    # Experience requirement
    exp_match = _EXP_PATTERN.search(jd_text)
    experience_requirement = exp_match.group(0).strip() if exp_match else None

    # Education requirement
    edu_match = _EDU_PATTERN.search(jd_text)
    education_requirement = edu_match.group(0).strip() if edu_match else None

    # Job title (heuristic: first line or "Role: X" pattern)
    job_title = _extract_job_title(jd_text)

    return {
        "parsed": True,
        "required_keywords":   required_kws,
        "preferred_keywords":  preferred_kws,
        "general_keywords":    general_kws,
        "all_keywords":        all_kws,
        "experience_requirement": experience_requirement,
        "education_requirement":  education_requirement,
        "job_title":           job_title,
        "jd_length_chars":     len(jd_text),
    }


def _dedup(lst: List[str]) -> List[str]:
    seen = set()
    out = []
    for x in lst:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def _extract_job_title(jd_text: str) -> Optional[str]:
    """Heuristic extraction of job title from JD."""
    title_pat = re.compile(
        r'(?:job\s*title|role|position|opening|hiring\s*for)\s*[:\-]?\s*([^\n]+)',
        re.IGNORECASE
    )
    m = title_pat.search(jd_text)
    if m:
        return m.group(1).strip()[:80]
    # Try first non-empty line
    for line in jd_text.split('\n'):
        line = line.strip()
        if line and len(line) < 100 and not line.startswith(('•', '-', '*', '·')):
            return line
    return None
