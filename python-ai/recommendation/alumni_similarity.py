"""
alumni_similarity.py
Computes similarity between a student profile and alumni records.

Algorithm: Weighted feature vector similarity
Weights (configurable):
  - skill_weight:       0.35  (Jaccard overlap of normalized skills)
  - career_goal_weight: 0.20  (career goal vs current alumni role)
  - interest_weight:    0.15  (academic/domain interest alignment)
  - academic_weight:    0.15  (CGPA + branch match)
  - location_weight:    0.10  (preferred location)
  - experience_weight:  0.05  (internship/project experience)
"""

from typing import List, Dict, Any, Optional
import sys, os

# Make skill_matcher importable when run directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from skill_matcher import normalize_skills_list, skills_overlap

# ─────────────────────────────────────────────────────────────────────────────
#  Default configurable weights (must sum to 1.0)
# ─────────────────────────────────────────────────────────────────────────────
DEFAULT_WEIGHTS = {
    "skill":       0.35,
    "career_goal": 0.20,
    "interest":    0.15,
    "academic":    0.15,
    "location":    0.10,
    "experience":  0.05,
}


def _branch_match_score(student_branch: str, alumni_branch: str) -> float:
    """Returns 0.0–1.0 based on branch similarity."""
    if not student_branch or not alumni_branch:
        return 0.5  # Unknown, give neutral score
    sb = student_branch.lower().strip()
    ab = alumni_branch.lower().strip()
    
    # Exact match
    if sb == ab:
        return 1.0
    
    # CSE / CS variants
    cse_variants = {"cse","cs","computer science","computer science engineering",
                    "computer science and engineering","b.tech cse","btech cse"}
    it_variants = {"it","information technology","information science"}
    ds_variants = {"data science","cse data science","data science engineering","ai","artificial intelligence","ml"}
    ece_variants = {"ece","electronics","electronics and communication"}
    
    def get_group(b):
        if any(v in b for v in ["computer science","cse","cs "]):
            return "cse"
        if any(v in b for v in ["information tech","it "]):
            return "it"
        if any(v in b for v in ["data science","artificial intel","machine learn"]):
            return "ds"
        if any(v in b for v in ["electronics","ece","electrical"]):
            return "ece"
        return "other"
    
    sg, ag = get_group(sb), get_group(ab)
    if sg == ag and sg != "other":
        return 0.85
    # Related groups
    if (sg in {"cse","it","ds"}) and (ag in {"cse","it","ds"}):
        return 0.65
    return 0.20


def _career_goal_match(student_goal: str, alumni_role: str, alumni_domain: str) -> float:
    """Returns 0.0–1.0 based on career goal vs alumni role/domain."""
    if not student_goal:
        return 0.4  # neutral
    
    goal = student_goal.lower().strip()
    role = (alumni_role or "").lower().strip()
    domain = (alumni_domain or "").lower().strip()
    
    # Keyword matching
    goal_words = set(goal.replace("-", " ").split())
    role_words = set(role.replace("-", " ").split())
    
    # Remove stop words
    stop = {"engineer","developer","specialist","analyst","scientist","manager","lead","senior","junior","associate"}
    goal_kw = goal_words - stop
    role_kw = role_words - stop
    
    if goal_kw & role_kw:  # Meaningful word overlap
        return 0.9
    
    # Domain keyword families
    domain_families = {
        "software": ["software","full stack","backend","frontend","web","application","sde","swe"],
        "data": ["data","analytics","scientist","ml","machine learning","ai","artificial"],
        "devops": ["devops","sre","cloud","infrastructure","platform","reliability"],
        "mobile": ["mobile","android","ios","flutter","react native"],
        "security": ["security","cybersecurity","infosec","ethical"],
        "product": ["product","pm","manager","scrum"],
        "qa": ["qa","quality","test","automation","sdet"],
        "research": ["research","phd","academic","scientist"],
    }
    
    def get_family(text):
        for fam, keywords in domain_families.items():
            if any(kw in text for kw in keywords):
                return fam
        return None
    
    gf = get_family(goal)
    rf = get_family(role)
    df = get_family(domain)
    
    if gf and (gf == rf or gf == df):
        return 0.75
    if gf and rf and (gf != rf):
        return 0.25
    
    return 0.40  # Unknown


def _interest_match(student_interests: list, alumni_domain: str, alumni_role: str) -> float:
    """Returns 0.0–1.0 based on interest alignment."""
    if not student_interests:
        return 0.4
    
    interests_text = " ".join(student_interests).lower()
    role_text = (alumni_role or "").lower() + " " + (alumni_domain or "").lower()
    
    interest_words = set(interests_text.split())
    role_words = set(role_text.split())
    
    overlap = interest_words & role_words
    if len(overlap) >= 2:
        return 0.85
    if len(overlap) == 1:
        return 0.60
    return 0.30


def _academic_match(student_cgpa: float, alumni_cgpa: float, student_branch: str, alumni_branch: str) -> float:
    """Returns 0.0–1.0 based on academic similarity."""
    # CGPA component (60% of academic score)
    try:
        s_gpa = float(student_cgpa or 7.0)
        a_gpa = float(alumni_cgpa or 7.0)
        diff = abs(s_gpa - a_gpa)
        if diff <= 0.2:
            gpa_score = 1.0
        elif diff <= 0.5:
            gpa_score = 0.8
        elif diff <= 1.0:
            gpa_score = 0.6
        elif diff <= 1.5:
            gpa_score = 0.4
        else:
            gpa_score = 0.2
    except:
        gpa_score = 0.5
    
    # Branch component (40% of academic score)
    branch_score = _branch_match_score(student_branch, alumni_branch)
    
    return round(0.6 * gpa_score + 0.4 * branch_score, 4)


def _location_match(student_location, alumni_location) -> float:
    """Returns 0.0–1.0 based on location preference."""
    if not student_location or not alumni_location:
        return 0.4
    
    if isinstance(student_location, list):
        if not student_location:
            return 0.4
        scores = [_location_match(loc, alumni_location) for loc in student_location if loc]
        return max(scores) if scores else 0.4

    if isinstance(alumni_location, list):
        if not alumni_location:
            return 0.4
        scores = [_location_match(student_location, loc) for loc in alumni_location if loc]
        return max(scores) if scores else 0.4

    sl = str(student_location).lower().strip()
    al = str(alumni_location).lower().strip()
    
    if sl == al:
        return 1.0
    
    # City/state matching
    if sl in al or al in sl:
        return 0.8
    
    # Remote/flexible
    if "remote" in sl or "anywhere" in sl or "remote" in al:
        return 0.6
    
    # Metro proximity mapping
    metros = {
        "bangalore": ["bengaluru","blr","karnataka"],
        "mumbai": ["bombay","maharashtra","pune"],
        "delhi": ["new delhi","ncr","gurgaon","noida","haryana"],
        "hyderabad": ["cyberabad","telangana"],
        "chennai": ["madras","tamil nadu"],
    }
    for metro, variations in metros.items():
        s_match = metro in sl or any(v in sl for v in variations)
        a_match = metro in al or any(v in al for v in variations)
        if s_match and a_match:
            return 0.85
    
    return 0.20


def _experience_match(student_experience: int, alumni_experience_level: str) -> float:
    """Returns 0.0–1.0 based on experience alignment."""
    # Student is fresh/final year, so we look at entry-level alumni
    try:
        s_exp = int(student_experience or 0)
    except:
        s_exp = 0
    
    a_level = (alumni_experience_level or "").lower()
    
    # We prefer alumni who started at entry level (most relevant trajectories)
    if s_exp <= 1:
        if any(x in a_level for x in ["entry","junior","fresher","0-2","1-2"]):
            return 0.9
        if any(x in a_level for x in ["mid","2-4","2-5"]):
            return 0.6
        return 0.3
    elif s_exp <= 3:
        if any(x in a_level for x in ["mid","2-5","3-5"]):
            return 0.9
        return 0.5
    return 0.5


def compute_alumni_similarity(student: Dict[str, Any], alumnus: Dict[str, Any],
                               weights: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """
    Compute similarity between student and one alumnus.
    
    Args:
        student: Student profile dict
        alumnus: Alumni record dict
        weights: Optional custom weights (default: DEFAULT_WEIGHTS)
    
    Returns:
        Dict with similarity score and breakdown
    """
    w = weights or DEFAULT_WEIGHTS
    
    # Normalize skills
    student_skills = normalize_skills_list(student.get("skills") or [])
    alumni_skills = normalize_skills_list(
        alumnus.get("skills") or alumnus.get("Skills", "").split(",") if isinstance(alumnus.get("Skills"), str) else []
    )
    
    skill_result = skills_overlap(student_skills, alumni_skills)
    skill_score = skill_result["jaccard"]
    
    # Career goal match
    career_score = _career_goal_match(
        student.get("careerGoal") or student.get("preferred_role") or student.get("targetRole", ""),
        alumnus.get("currentRole") or alumnus.get("Job_Title") or alumnus.get("role", ""),
        alumnus.get("domain") or alumnus.get("Major_Academic_Program", "")
    )
    
    # Interest match
    interests = student.get("interests") or student.get("domains") or []
    interest_score = _interest_match(
        interests,
        alumnus.get("domain") or alumnus.get("Major_Academic_Program", ""),
        alumnus.get("currentRole") or alumnus.get("Job_Title", "")
    )
    
    # Academic match
    student_branch = student.get("branch") or student.get("degree") or ""
    alumni_branch = alumnus.get("branch") or alumnus.get("Major_Academic_Program") or alumnus.get("Degree_Earned", "")
    student_cgpa = student.get("cgpa") or student.get("cgpa_score") or 7.0
    alumni_cgpa = alumnus.get("cgpa") or alumnus.get("cgpaAtGraduation") or 7.0
    
    academic_score = _academic_match(student_cgpa, alumni_cgpa, student_branch, alumni_branch)
    
    # Location match
    student_location = student.get("preferredLocation") or student.get("location") or ""
    alumni_location = alumnus.get("location") or alumnus.get("Location", "")
    location_score = _location_match(student_location, alumni_location)
    
    # Experience match
    student_exp = student.get("internshipCount") or student.get("experience") or 0
    experience_score = _experience_match(student_exp, alumnus.get("experienceLevel", "entry"))
    
    # Weighted final score
    raw_score = (
        w["skill"]       * skill_score +
        w["career_goal"] * career_score +
        w["interest"]    * interest_score +
        w["academic"]    * academic_score +
        w["location"]    * location_score +
        w["experience"]  * experience_score
    )
    
    # Scale to 0-99 range
    final_score = min(int(raw_score * 100), 99)
    
    return {
        "alumniId": alumnus.get("alumniId") or alumnus.get("Alumni_ID", ""),
        "name": alumnus.get("name") or f"{alumnus.get('First_Name','')} {alumnus.get('Last_Name','')}".strip(),
        "currentRole": alumnus.get("currentRole") or alumnus.get("Job_Title", ""),
        "currentCompany": alumnus.get("currentCompany") or alumnus.get("Current_Company", ""),
        "domain": alumnus.get("domain") or alumnus.get("Major_Academic_Program", ""),
        "location": alumnus.get("location") or alumnus.get("Location", ""),
        "similarity": final_score,
        "matchedSkills": skill_result["matched"],
        "skillJaccard": skill_result["jaccard"],
        "breakdown": {
            "skill": round(skill_score, 3),
            "careerGoal": round(career_score, 3),
            "interest": round(interest_score, 3),
            "academic": round(academic_score, 3),
            "location": round(location_score, 3),
            "experience": round(experience_score, 3),
        }
    }


def rank_alumni_by_similarity(student: Dict[str, Any], alumni_list: List[Dict[str, Any]],
                               top_n: int = 10, weights: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
    """
    Rank all alumni by similarity to the student.
    
    Returns top_n alumni sorted by descending similarity score.
    """
    if not alumni_list:
        return []
    
    results = [compute_alumni_similarity(student, alumnus, weights) for alumnus in alumni_list]
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_n]


if __name__ == "__main__":
    # Quick test
    student = {
        "branch": "Computer Science Engineering",
        "cgpa": 8.5,
        "skills": ["Python", "React", "JS", "SQL", "Machine Learning"],
        "careerGoal": "Data Scientist",
        "preferredLocation": "Bangalore",
        "interests": ["data science", "machine learning"],
    }
    
    alumni = [
        {"name": "Priya Sharma", "branch": "CSE", "cgpa": 8.3, "skills": ["Python", "Machine Learning", "SQL", "Pandas"],
         "currentRole": "Data Scientist", "currentCompany": "Google", "location": "Bangalore", "domain": "Data Science"},
        {"name": "Raj Kumar", "branch": "CSE", "cgpa": 7.8, "skills": ["React", "JavaScript", "Node.js", "MongoDB"],
         "currentRole": "Full Stack Developer", "currentCompany": "Infosys", "location": "Hyderabad", "domain": "Software Engineering"},
    ]
    
    ranked = rank_alumni_by_similarity(student, alumni, top_n=5)
    for r in ranked:
        print(f"{r['name']}: {r['similarity']}% match | breakdown: {r['breakdown']}")
