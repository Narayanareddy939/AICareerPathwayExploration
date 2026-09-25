"""
recommendation_engine.py
Hybrid career recommendation engine.

Scoring Formula (configurable weights):
  Final Score = 
    30% * skill_match
    20% * interest_match
    15% * academic_match
    15% * job_market_demand
    10% * alumni_similarity
    10% * location_match

Gemini is NOT used for numerical rankings.
Gemini is called AFTER scoring, only for natural-language explanations.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from skill_matcher import normalize_skills_list, skills_overlap
from skill_gap import analyze_skill_gap, CAREER_SKILL_REQUIREMENTS, get_career_requirements
from alumni_similarity import rank_alumni_by_similarity
from job_market import get_job_market_insights

from typing import Dict, List, Any, Optional

# ─────────────────────────────────────────────────────────────────────────────
#  Configurable Scoring Weights
# ─────────────────────────────────────────────────────────────────────────────
DEFAULT_RECOMMENDATION_WEIGHTS = {
    "skill_match":      0.30,
    "interest_match":   0.20,
    "academic_match":   0.15,
    "job_market":       0.15,
    "alumni_similarity":0.10,
    "location_match":   0.10,
}

# Career domain interest keywords
CAREER_INTERESTS = {
    "Software Engineer": ["coding","programming","software","development","algorithms","system design"],
    "Full Stack Developer": ["web development","frontend","backend","react","nodejs","full stack"],
    "Data Scientist": ["data science","machine learning","statistics","analytics","python","ai"],
    "Data Analyst": ["data","analytics","visualization","sql","business intelligence"],
    "Machine Learning Engineer": ["machine learning","ai","deep learning","neural networks","mlops"],
    "DevOps Engineer": ["devops","cloud","infrastructure","automation","ci/cd","reliability"],
    "Cloud Engineer": ["cloud","aws","azure","infrastructure","scalability","distributed"],
    "Frontend Developer": ["ui","ux","design","react","javascript","css","web"],
    "Backend Developer": ["backend","api","server","database","architecture","performance"],
    "Data Engineer": ["data engineering","pipeline","etl","big data","spark","kafka"],
    "Cybersecurity Engineer": ["security","cybersecurity","ethical hacking","network","privacy"],
    "Mobile Developer": ["mobile","android","ios","flutter","react native","app"],
    "Product Manager": ["product","strategy","roadmap","user research","agile"],
    "AI/ML Researcher": ["research","deep learning","nlp","computer vision","publications","ai"],
}

# Academic branch to career alignment
BRANCH_CAREER_AFFINITY = {
    "cse": ["Software Engineer", "Full Stack Developer", "Data Scientist", "Machine Learning Engineer", "DevOps Engineer"],
    "computer science": ["Software Engineer", "Full Stack Developer", "Data Scientist", "Machine Learning Engineer"],
    "data science": ["Data Scientist", "Data Analyst", "Machine Learning Engineer", "Data Engineer"],
    "information technology": ["Full Stack Developer", "Software Engineer", "DevOps Engineer", "Cloud Engineer"],
    "electronics": ["DevOps Engineer", "Cloud Engineer", "Cybersecurity Engineer", "Software Engineer"],
    "mechanical": ["DevOps Engineer", "Cloud Engineer", "Product Manager"],
    "civil": ["Data Analyst", "Product Manager"],
    "mba": ["Product Manager", "Data Analyst", "Business Analyst"],
}


def _skill_match_score(student_skills: List[str], career_name: str) -> float:
    """Calculate how well student skills match career requirements (0.0-1.0)."""
    gap = analyze_skill_gap(student_skills, career_name)
    return round(gap["skillMatchPercentage"] / 100, 4)


def _interest_match_score(student_interests: List[str], student_career_goal: str, career_name: str) -> float:
    """Calculate interest alignment with career (0.0-1.0)."""
    career_keywords = CAREER_INTERESTS.get(career_name, [])
    if not career_keywords:
        return 0.4
    
    # Combine interests and career goal
    student_text = " ".join(
        (student_interests or []) + [student_career_goal or ""]
    ).lower()
    
    if not student_text.strip():
        return 0.4
    
    matched = sum(1 for kw in career_keywords if kw in student_text)
    base_score = matched / len(career_keywords)
    
    # Bonus if career goal exactly matches
    career_lower = career_name.lower()
    goal_lower = (student_career_goal or "").lower()
    if career_lower in goal_lower or goal_lower in career_lower:
        base_score = min(base_score + 0.3, 1.0)
    
    return round(base_score, 4)


def _academic_match_score(student_branch: str, student_cgpa: float, career_name: str) -> float:
    """Calculate academic alignment (0.0-1.0)."""
    # CGPA component (50%)
    try:
        cgpa = float(student_cgpa or 7.0)
        if cgpa >= 9.0:
            gpa_score = 1.0
        elif cgpa >= 8.0:
            gpa_score = 0.85
        elif cgpa >= 7.0:
            gpa_score = 0.70
        elif cgpa >= 6.0:
            gpa_score = 0.50
        else:
            gpa_score = 0.30
    except:
        gpa_score = 0.6
    
    # Branch affinity (50%)
    branch_lower = (student_branch or "").lower()
    preferred_careers = []
    for branch_key, careers in BRANCH_CAREER_AFFINITY.items():
        if branch_key in branch_lower:
            preferred_careers.extend(careers)
    
    if career_name in preferred_careers:
        branch_score = 1.0
    elif any(c.split()[0] == career_name.split()[0] for c in preferred_careers):
        branch_score = 0.7
    elif preferred_careers:
        branch_score = 0.4
    else:
        branch_score = 0.5  # Unknown branch
    
    return round(0.5 * gpa_score + 0.5 * branch_score, 4)


def _job_market_score(career_name: str, job_insights: Optional[Dict] = None) -> float:
    """Calculate job market demand score (0.0-1.0)."""
    if job_insights is None:
        job_insights = get_job_market_insights(career_name)
    
    demand_level = job_insights.get("demandLevel", "Unknown")
    job_count = job_insights.get("jobCount", 0)
    
    demand_map = {
        "Very High": 1.0,
        "High": 0.85,
        "Medium": 0.65,
        "Growing": 0.50,
        "Unknown": 0.40,
    }
    
    base = demand_map.get(demand_level, 0.40)
    
    # Bonus for higher absolute count
    if job_count >= 50:
        base = min(base + 0.1, 1.0)
    elif job_count >= 20:
        base = min(base + 0.05, 1.0)
    
    return round(base, 4)


def _location_match_score(student_location, job_insights: Dict) -> float:
    """Calculate location relevance score (0.0-1.0)."""
    if not student_location:
        return 0.5
    
    top_locations = job_insights.get("topLocations", [])
    if not top_locations:
        return 0.5
    
    if isinstance(student_location, list):
        if not student_location:
            return 0.5
        scores = [_location_match_score(loc, job_insights) for loc in student_location if loc]
        return max(scores) if scores else 0.5

    student_loc_lower = str(student_location).lower().strip()
    
    for loc_entry in top_locations[:5]:
        loc = (loc_entry.get("location") or "").lower()
        if student_loc_lower in loc or loc in student_loc_lower:
            # Weight by rank (1st = full score, diminishing)
            rank = top_locations.index(loc_entry)
            return round(max(1.0 - rank * 0.1, 0.5), 4)
    
    # Check for remote
    all_locs = " ".join(l.get("location", "") for l in top_locations).lower()
    if "remote" in all_locs:
        return 0.7
    
    return 0.35


def _alumni_similarity_score(similar_alumni: List[Dict]) -> float:
    """Calculate alumni support score (0.0-1.0)."""
    if not similar_alumni:
        return 0.3
    
    top_similarity = similar_alumni[0]["similarity"] / 100 if similar_alumni else 0
    count_bonus = min(len(similar_alumni) / 10, 0.3)
    
    return round(min(top_similarity * 0.7 + count_bonus, 1.0), 4)


def generate_recommendations(
    student: Dict[str, Any],
    alumni_data: List[Dict],
    top_n: int = 5,
    weights: Optional[Dict] = None
) -> List[Dict[str, Any]]:
    """
    Generate ranked career recommendations for a student.
    
    Args:
        student: Student profile dict
        alumni_data: List of alumni records
        top_n: Number of recommendations to return
        weights: Optional custom scoring weights
    
    Returns:
        Ranked list of career recommendations with scores and evidence
    """
    w = weights or DEFAULT_RECOMMENDATION_WEIGHTS
    student_skills = normalize_skills_list(student.get("skills") or [])
    student_interests = student.get("interests") or student.get("domains") or []
    career_goal = student.get("careerGoal") or student.get("preferred_role") or "Software Engineer"
    student_branch = student.get("branch") or ""
    student_cgpa = student.get("cgpa") or 7.0
    student_location = student.get("preferredLocation") or student.get("location") or ""
    
    # Get all target careers to evaluate
    all_careers = list(CAREER_SKILL_REQUIREMENTS.keys())
    
    results = []
    
    for career_name in all_careers:
        # 1. Skill Match (30%)
        gap_analysis = analyze_skill_gap(student_skills, career_name)
        skill_score = gap_analysis["skillMatchPercentage"] / 100
        
        # 2. Interest Match (20%)
        interest_score = _interest_match_score(student_interests, career_goal, career_name)
        
        # 3. Academic Match (15%)
        academic_score = _academic_match_score(student_branch, student_cgpa, career_name)
        
        # 4. Job Market (15%)
        job_insights = get_job_market_insights(career_name)
        market_score = _job_market_score(career_name, job_insights)
        
        # 5. Alumni Similarity (10%)
        # Filter alumni who ended up in this career domain
        career_lower = career_name.lower()
        relevant_alumni = [
            a for a in alumni_data
            if career_lower in (a.get("currentRole") or a.get("Job_Title") or "").lower()
            or career_lower in (a.get("domain") or "").lower()
        ]
        student_for_sim = {**student, "careerGoal": career_name}
        similar_alumni = rank_alumni_by_similarity(student_for_sim, relevant_alumni or alumni_data[:50], top_n=5)
        alumni_score = _alumni_similarity_score(similar_alumni)
        
        # 6. Location Match (10%)
        location_score = _location_match_score(student_location, job_insights)
        
        # Final weighted score
        final_score = (
            w["skill_match"]       * skill_score +
            w["interest_match"]    * interest_score +
            w["academic_match"]    * academic_score +
            w["job_market"]        * market_score +
            w["alumni_similarity"] * alumni_score +
            w["location_match"]    * location_score
        )
        
        match_score_pct = round(min(final_score * 100, 99), 1)
        
        skill_pct = round(skill_score * 100, 1)
        # Confidence dynamically evaluated from candidate's skills, role alignment, and match score
        if match_score_pct >= 68.0 and skill_pct >= 35.0:
            confidence = "high"
        elif match_score_pct >= 48.0 and skill_pct >= 20.0:
            confidence = "medium"
        else:
            confidence = "low"
        
        score_dict = {
            "skillMatch": round(skill_score * 100, 1),
            "interestMatch": round(interest_score * 100, 1),
            "academicMatch": round(academic_score * 100, 1),
            "jobMarket": round(market_score * 100, 1),
            "alumniSimilarity": round(alumni_score * 100, 1),
            "locationMatch": round(location_score * 100, 1),
        }
        
        sal_str = "₹7.5 - ₹16.0 LPA"
        if job_insights.get("salaryRange") and isinstance(job_insights["salaryRange"], dict):
            s = job_insights["salaryRange"]
            min_lpa = round((s.get('min_usd', 60000) * 83) / 100000, 1)
            max_lpa = round((s.get('max_usd', 120000) * 83) / 100000, 1)
            sal_str = f"₹{min_lpa} - ₹{max_lpa} LPA"

        results.append({
            "career": career_name,
            "matchScore": match_score_pct,
            "overallScore": match_score_pct,
            "confidence": confidence,
            "scores": score_dict,
            "scoreBreakdown": score_dict,
            "salaryRange": sal_str,
            "demandLevel": job_insights.get("demandLevel", "High"),
            "matchedSkills": gap_analysis["matchedSkills"],
            "missingSkills": gap_analysis["criticalMissing"] + gap_analysis["highMissing"],
            "skillGapPercentage": gap_analysis["skillGapPercentage"],
            "similarAlumni": similar_alumni[:3],
            "alumniCount": len(similar_alumni),
            "jobMarketInsights": {
                "jobCount": job_insights["jobCount"],
                "demandLevel": job_insights["demandLevel"],
                "topSkills": [s["skill"] for s in job_insights["topSkills"][:5]],
                "topCompanies": [c["company"] for c in job_insights["topCompanies"][:3]],
                "salaryRange": job_insights.get("salaryRange"),
            },
            "reasons": _build_reasons(match_score_pct, skill_score, interest_score, 
                                       similar_alumni, job_insights, career_name),
            "dataSource": "Alumni dataset + job_data.csv + linkedin_job_postings_dataset.csv",
        })
    
    # Sort by match score
    results.sort(key=lambda x: x["matchScore"], reverse=True)
    return results[:top_n]


def _build_reasons(score, skill_score, interest_score, alumni, job_insights, career_name):
    """Build human-readable recommendation reasons from calculated data."""
    reasons = []
    
    if skill_score >= 0.7:
        reasons.append(f"{round(skill_score*100)}% of required skills already matched")
    elif skill_score >= 0.4:
        reasons.append(f"Good skill foundation with {round(skill_score*100)}% skill match")
    else:
        reasons.append(f"Career aligns with learning trajectory ({round(skill_score*100)}% current skill match)")
    
    if interest_score >= 0.6:
        reasons.append("Strong alignment with stated interests and career goals")
    
    if len(alumni) >= 3:
        top_alum = alumni[0]
        reasons.append(f"{len(alumni)} alumni with similar profiles found (top: {top_alum['name']} at {top_alum.get('currentCompany','—')})")
    elif len(alumni) >= 1:
        reasons.append(f"{len(alumni)} alumni with similar profile found")
    
    if job_insights["jobCount"] > 0:
        reasons.append(f"{job_insights['jobCount']} relevant job postings in dataset ({job_insights['demandLevel']} demand)")
    
    return reasons


def compute_placement_readiness(student: Dict, recommendation: Dict) -> int:
    """
    Calculate placement readiness score (0-100) from student profile + top recommendation.
    
    Components:
    - Career match score: 50%
    - CGPA score: 20%
    - Skills breadth: 20%
    - Resume uploaded: 10%
    """
    match = recommendation.get("matchScore", 60) if recommendation else 60
    
    try:
        cgpa = float(student.get("cgpa") or 7.0)
        gpa_score = min((cgpa / 10.0) * 100, 100)
    except:
        gpa_score = 70
    
    skills = student.get("skills") or []
    skill_score = min(len(skills) * 5, 100)  # Up to 20 skills = 100
    
    resume_score = 100 if student.get("resumePath") else 0
    
    readiness = int(
        match * 0.5 +
        gpa_score * 0.2 +
        skill_score * 0.2 +
        resume_score * 0.1
    )
    
    return min(readiness, 99)


if __name__ == "__main__":
    student_profile = {
        "branch": "CSE",
        "cgpa": 8.5,
        "skills": ["Python", "Machine Learning", "SQL", "React", "Git"],
        "interests": ["data science", "machine learning"],
        "careerGoal": "Data Scientist",
        "preferredLocation": "Bangalore",
    }
    
    # Mock small alumni list for test
    mock_alumni = [
        {"name": "Priya S", "branch": "CSE", "cgpa": 8.3, "skills": ["Python", "ML", "SQL"],
         "currentRole": "Data Scientist", "currentCompany": "Google", "location": "Bangalore"},
    ]
    
    recs = generate_recommendations(student_profile, mock_alumni, top_n=3)
    for r in recs:
        print(f"\n{r['career']}: {r['matchScore']}% match | confidence: {r['confidence']}")
        print(f"  Scores: {r['scores']}")
        print(f"  Reasons: {r['reasons']}")
