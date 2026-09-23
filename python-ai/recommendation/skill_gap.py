"""
skill_gap.py
Calculates skill gaps between student profile and career requirements.

Priority Levels:
  CRITICAL  — Core skills without which job is impossible to get
  HIGH      — Important skills most employers require
  MEDIUM    — Useful skills that differentiate candidates
  LOW       — Nice-to-have skills

Output includes courses mapped to each missing skill.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from skill_matcher import normalize_skills_list, skills_overlap

from typing import List, Dict, Any, Optional


# ─────────────────────────────────────────────────────────────────────────────
#  Career Skill Requirements Database
#  Format: "career_name": {"critical": [], "high": [], "medium": [], "low": []}
# ─────────────────────────────────────────────────────────────────────────────
CAREER_SKILL_REQUIREMENTS = {
    "Software Engineer": {
        "critical": ["Data Structures", "Algorithms", "OOP", "Git"],
        "high": ["Python", "Java", "C++", "System Design", "SQL", "REST API"],
        "medium": ["Docker", "CI/CD", "Agile", "Linux", "Testing"],
        "low": ["Kubernetes", "Microservices", "GraphQL"],
    },
    "Full Stack Developer": {
        "critical": ["JavaScript", "HTML", "CSS", "Git", "SQL"],
        "high": ["React", "Node.js", "REST API", "MongoDB"],
        "medium": ["TypeScript", "Docker", "AWS", "Testing", "CI/CD"],
        "low": ["GraphQL", "Redis", "Microservices"],
    },
    "Frontend Developer": {
        "critical": ["JavaScript", "HTML", "CSS", "React"],
        "high": ["TypeScript", "Git", "REST API"],
        "medium": ["Vue.js", "Testing", "Tailwind CSS", "Performance Optimization"],
        "low": ["Next.js", "GraphQL", "AWS"],
    },
    "Backend Developer": {
        "critical": ["Python", "SQL", "REST API", "Git"],
        "high": ["Node.js", "Django", "Flask", "MongoDB", "PostgreSQL"],
        "medium": ["Docker", "Redis", "Microservices", "Testing"],
        "low": ["Kubernetes", "Kafka", "Elasticsearch"],
    },
    "Data Scientist": {
        "critical": ["Python", "Machine Learning", "Statistics", "SQL"],
        "high": ["Pandas", "NumPy", "Scikit-Learn", "Data Visualization"],
        "medium": ["Deep Learning", "TensorFlow", "PyTorch", "NLP", "Feature Engineering"],
        "low": ["Spark", "Airflow", "MLOps"],
    },
    "Data Analyst": {
        "critical": ["SQL", "Python", "Excel", "Data Visualization"],
        "high": ["Power BI", "Tableau", "Pandas", "Statistics"],
        "medium": ["Machine Learning", "NumPy", "ETL"],
        "low": ["R", "Spark", "Data Warehousing"],
    },
    "Machine Learning Engineer": {
        "critical": ["Python", "Machine Learning", "Deep Learning", "Git"],
        "high": ["TensorFlow", "PyTorch", "Scikit-Learn", "Docker", "SQL"],
        "medium": ["MLOps", "Kubernetes", "Spark", "AWS"],
        "low": ["C++", "CUDA", "Distributed Computing"],
    },
    "DevOps Engineer": {
        "critical": ["Linux", "Docker", "CI/CD", "Git"],
        "high": ["Kubernetes", "AWS", "Terraform", "Shell Scripting"],
        "medium": ["Monitoring", "Networking", "Python"],
        "low": ["Ansible", "Helm", "Service Mesh"],
    },
    "Cloud Engineer": {
        "critical": ["AWS", "Linux", "Networking", "Docker"],
        "high": ["Kubernetes", "Terraform", "Python", "CI/CD"],
        "medium": ["Azure", "GCP", "Security", "Monitoring"],
        "low": ["Cost Optimization", "Multi-cloud"],
    },
    "Data Engineer": {
        "critical": ["Python", "SQL", "ETL", "Git"],
        "high": ["Spark", "Airflow", "Data Warehousing", "Cloud"],
        "medium": ["Kafka", "Docker", "Scala"],
        "low": ["Kubernetes", "Data Modeling"],
    },
    "Product Manager": {
        "critical": ["Product Management", "Communication", "Agile"],
        "high": ["Data Analysis", "User Research", "Problem Solving"],
        "medium": ["SQL", "Figma", "Project Management"],
        "low": ["Python", "A/B Testing"],
    },
    "Cybersecurity Engineer": {
        "critical": ["Cybersecurity", "Networking", "Linux"],
        "high": ["Python", "Ethical Hacking", "Encryption"],
        "medium": ["SIEM", "Incident Response", "Cloud Security"],
        "low": ["Malware Analysis", "Reverse Engineering"],
    },
    "Mobile Developer": {
        "critical": ["React Native", "JavaScript", "Git"],
        "high": ["Flutter", "Android", "iOS", "REST API"],
        "medium": ["Testing", "App Store Deployment", "Firebase"],
        "low": ["Swift", "Kotlin"],
    },
    "AI/ML Researcher": {
        "critical": ["Python", "Deep Learning", "Machine Learning", "Statistics"],
        "high": ["PyTorch", "TensorFlow", "NLP", "Computer Vision", "Research"],
        "medium": ["CUDA", "Distributed Training", "Paper Reading"],
        "low": ["C++", "Quantum Computing"],
    },
    "Business Analyst": {
        "critical": ["Communication", "Data Analysis", "Problem Solving"],
        "high": ["SQL", "Excel", "Power BI", "Requirements Gathering"],
        "medium": ["Python", "Process Modeling", "Agile"],
        "low": ["Machine Learning", "Tableau"],
    },
}

# Priority weights for skill gap scoring
PRIORITY_WEIGHTS = {"critical": 1.0, "high": 0.7, "medium": 0.4, "low": 0.2}

# Skill to course mapping (representative courses)
SKILL_COURSE_MAP = {
    "Python": [
        {"title": "Python for Everybody", "provider": "Coursera / University of Michigan", "url": "https://www.coursera.org/specializations/python", "duration": "5 months"},
        {"title": "Complete Python Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/complete-python-bootcamp", "duration": "22 hours"},
    ],
    "Machine Learning": [
        {"title": "Machine Learning Specialization", "provider": "Coursera / Andrew Ng", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "duration": "3 months"},
        {"title": "Hands-On Machine Learning", "provider": "O'Reilly Book", "url": "https://www.oreilly.com/library/view/hands-on-machine-learning/", "duration": "Self-paced"},
    ],
    "Data Structures": [
        {"title": "Data Structures & Algorithms", "provider": "Coursera / UCSD", "url": "https://www.coursera.org/specializations/data-structures-algorithms", "duration": "6 months"},
        {"title": "LeetCode DSA Track", "provider": "LeetCode", "url": "https://leetcode.com/study-plan/data-structure", "duration": "3 months"},
    ],
    "React": [
        {"title": "React - The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux", "duration": "48 hours"},
        {"title": "Full Stack Open", "provider": "University of Helsinki (Free)", "url": "https://fullstackopen.com", "duration": "4 months"},
    ],
    "SQL": [
        {"title": "SQL for Data Science", "provider": "Coursera / UC Davis", "url": "https://www.coursera.org/learn/sql-for-data-science", "duration": "4 weeks"},
        {"title": "Complete SQL Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-sql-bootcamp", "duration": "9 hours"},
    ],
    "AWS": [
        {"title": "AWS Certified Solutions Architect", "provider": "AWS/Udemy", "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03", "duration": "13 hours"},
        {"title": "AWS Certified Cloud Practitioner", "provider": "AWS", "url": "https://aws.amazon.com/certification/certified-cloud-practitioner", "duration": "6 hours"},
    ],
    "Docker": [
        {"title": "Docker and Kubernetes: The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide", "duration": "22 hours"},
    ],
    "Deep Learning": [
        {"title": "Deep Learning Specialization", "provider": "Coursera / Andrew Ng", "url": "https://www.coursera.org/specializations/deep-learning", "duration": "5 months"},
    ],
    "TensorFlow": [
        {"title": "TensorFlow Developer Certificate", "provider": "Coursera / Google", "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice", "duration": "4 months"},
    ],
    "System Design": [
        {"title": "System Design Interview", "provider": "ByteByteGo (Alex Xu)", "url": "https://bytebytego.com", "duration": "Self-paced"},
        {"title": "Grokking the System Design Interview", "provider": "Educative.io", "url": "https://www.educative.io/courses/grokking-the-system-design-interview", "duration": "Self-paced"},
    ],
    "Node.js": [
        {"title": "The Complete Node.js Developer Course", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-nodejs-developer-course-2", "duration": "35 hours"},
    ],
    "JavaScript": [
        {"title": "The Complete JavaScript Course 2024", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-javascript-course", "duration": "69 hours"},
        {"title": "JavaScript.info", "provider": "Free Online", "url": "https://javascript.info", "duration": "Self-paced"},
    ],
    "Git": [
        {"title": "Git & GitHub Crash Course", "provider": "Udemy (Free)", "url": "https://www.udemy.com/course/git-and-github-crash-course-creating-a-repository-from-scratch", "duration": "5 hours"},
    ],
    "Power BI": [
        {"title": "Microsoft Power BI Desktop for Business Intelligence", "provider": "Udemy", "url": "https://www.udemy.com/course/microsoft-power-bi-up-running-with-power-bi-desktop", "duration": "18 hours"},
    ],
    "Cybersecurity": [
        {"title": "Google Cybersecurity Certificate", "provider": "Coursera / Google", "url": "https://www.coursera.org/professional-certificates/google-cybersecurity", "duration": "6 months"},
    ],
    "Kubernetes": [
        {"title": "Kubernetes Certified Application Developer (CKAD)", "provider": "Linux Foundation", "url": "https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad", "duration": "3 months"},
    ],
}

DEFAULT_COURSES = [
    {"title": "Professional Skills Development", "provider": "LinkedIn Learning", "url": "https://www.linkedin.com/learning", "duration": "Self-paced"},
]


def get_courses_for_skill(skill_name: str) -> list:
    """Return course recommendations for a given skill."""
    courses = SKILL_COURSE_MAP.get(skill_name)
    if courses:
        return courses
    # Try fuzzy match
    skill_lower = skill_name.lower()
    for key, courses_list in SKILL_COURSE_MAP.items():
        if skill_lower in key.lower() or key.lower() in skill_lower:
            return courses_list
    return DEFAULT_COURSES


def get_career_requirements(career_name: str) -> Dict[str, List[str]]:
    """Get skill requirements for a career, with fuzzy matching."""
    if career_name in CAREER_SKILL_REQUIREMENTS:
        return CAREER_SKILL_REQUIREMENTS[career_name]
    
    # Fuzzy match
    career_lower = career_name.lower()
    for career, reqs in CAREER_SKILL_REQUIREMENTS.items():
        if career_lower in career.lower() or career.lower() in career_lower:
            return reqs
    
    # Default generic requirements
    return {
        "critical": ["Python", "Communication", "Problem Solving"],
        "high": ["Git", "SQL", "System Design"],
        "medium": ["Cloud", "Agile"],
        "low": ["Leadership"],
    }


def analyze_skill_gap(student_skills: List[str], career_name: str,
                       courses_data: Optional[List[Dict]] = None) -> Dict[str, Any]:
    """
    Analyze skill gap between student skills and career requirements.
    
    Args:
        student_skills: List of student's current skills (raw strings)
        career_name: Target career name
        courses_data: Optional external course data to supplement
    
    Returns:
        Comprehensive skill gap analysis
    """
    # Normalize student skills
    normalized_student = normalize_skills_list(student_skills)
    student_set = set(s.lower() for s in normalized_student)
    
    # Get career requirements
    requirements = get_career_requirements(career_name)
    
    all_required = []
    matched_skills = []
    missing_by_priority = {"critical": [], "high": [], "medium": [], "low": []}
    
    for priority, skills in requirements.items():
        normalized_career_skills = normalize_skills_list(skills)
        for skill in normalized_career_skills:
            all_required.append({"skill": skill, "priority": priority})
            if skill.lower() in student_set:
                matched_skills.append({"skill": skill, "priority": priority, "status": "matched"})
            else:
                missing_by_priority[priority].append(skill)
    
    # Calculate gap metrics
    total_required = sum(len(normalize_skills_list(s)) for s in requirements.values())
    total_missing = sum(len(v) for v in missing_by_priority.values())
    total_matched = len(matched_skills)
    
    # Weighted gap score
    weighted_missing = 0
    weighted_total = 0
    for priority, skills in missing_by_priority.items():
        weighted_missing += len(skills) * PRIORITY_WEIGHTS[priority]
    for priority, req_skills in requirements.items():
        weighted_total += len(req_skills) * PRIORITY_WEIGHTS[priority]
    
    skill_gap_pct = round((weighted_missing / weighted_total * 100) if weighted_total > 0 else 0, 1)
    match_pct = round(100 - skill_gap_pct, 1)
    
    # Build missing skills with course recommendations
    missing_with_courses = []
    for priority in ["critical", "high", "medium", "low"]:
        for skill in missing_by_priority[priority]:
            missing_with_courses.append({
                "skill": skill,
                "priority": priority,
                "courses": get_courses_for_skill(skill),
                "importance": PRIORITY_WEIGHTS[priority],
            })
    
    # Top skills to learn first (critical + high priority)
    top_skills_to_learn = (
        missing_by_priority["critical"] + missing_by_priority["high"]
    )[:6]
    
    return {
        "career": career_name,
        "matchedSkills": [m["skill"] for m in matched_skills],
        "matchedCount": total_matched,
        "missingSkills": missing_with_courses,
        "missingCount": total_missing,
        "criticalMissing": missing_by_priority["critical"],
        "highMissing": missing_by_priority["high"],
        "mediumMissing": missing_by_priority["medium"],
        "lowMissing": missing_by_priority["low"],
        "topSkillsToLearn": top_skills_to_learn,
        "skillGapPercentage": skill_gap_pct,
        "skillMatchPercentage": match_pct,
        "totalRequired": total_required,
        "requirements": requirements,
        "gapLevel": (
            "critical" if skill_gap_pct > 70 else
            "high" if skill_gap_pct > 50 else
            "medium" if skill_gap_pct > 30 else
            "low"
        ),
    }


if __name__ == "__main__":
    student_skills = ["Python", "React", "JS", "SQL", "Git"]
    result = analyze_skill_gap(student_skills, "Data Scientist")
    print(f"Career: {result['career']}")
    print(f"Match: {result['skillMatchPercentage']}% | Gap: {result['skillGapPercentage']}%")
    print(f"Matched: {result['matchedSkills']}")
    print(f"Critical Missing: {result['criticalMissing']}")
    print(f"High Missing: {result['highMissing']}")
