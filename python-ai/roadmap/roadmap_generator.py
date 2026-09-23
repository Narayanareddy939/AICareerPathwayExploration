"""
roadmap_generator.py
Generates personalized career learning roadmaps based on:
  - Student's current skills
  - Target career
  - Skill gaps
  - Prerequisite dependencies
  - Available study hours per week
  
Each student gets a unique roadmap — NOT a fixed template.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from recommendation.skill_matcher import normalize_skills_list
from recommendation.skill_gap import analyze_skill_gap, get_courses_for_skill

from typing import Dict, List, Any, Optional
from math import ceil


# ─────────────────────────────────────────────────────────────────────────────
#  Skill Prerequisite Graph
#  Format: skill → [prerequisites that should be learned first]
# ─────────────────────────────────────────────────────────────────────────────
SKILL_PREREQUISITES = {
    "Machine Learning":    ["Python", "Statistics", "NumPy", "Pandas"],
    "Deep Learning":       ["Machine Learning", "Python", "Linear Algebra"],
    "TensorFlow":          ["Python", "Machine Learning", "NumPy"],
    "PyTorch":             ["Python", "Machine Learning", "NumPy"],
    "Scikit-Learn":        ["Python", "Statistics"],
    "React":               ["JavaScript", "HTML", "CSS"],
    "Next.js":             ["React", "JavaScript"],
    "Node.js":             ["JavaScript"],
    "Express.js":          ["Node.js", "JavaScript"],
    "Django":              ["Python", "SQL"],
    "Flask":               ["Python"],
    "FastAPI":             ["Python"],
    "TypeScript":          ["JavaScript"],
    "Kubernetes":          ["Docker", "Linux"],
    "Docker":              ["Linux"],
    "Terraform":           ["Cloud", "Linux"],
    "Spark":               ["Python", "SQL"],
    "Airflow":             ["Python", "SQL"],
    "Kafka":               ["Linux"],
    "Redux":               ["React", "JavaScript"],
    "GraphQL":             ["REST API", "JavaScript"],
    "CI/CD":               ["Git", "Linux"],
    "MLOps":               ["Machine Learning", "Docker", "Python"],
    "Algorithms":          ["Data Structures"],
    "System Design":       ["Data Structures", "SQL", "Git"],
    "Data Visualization":  ["Python", "Pandas"],
    "Power BI":            ["SQL", "Excel"],
    "ETL":                 ["SQL", "Python"],
    "NLP":                 ["Python", "Machine Learning"],
    "Computer Vision":     ["Python", "Deep Learning"],
    "AWS":                 ["Linux", "Networking"],
    "GCP":                 ["Linux", "Python"],
    "Azure":               ["Linux"],
    "PostgreSQL":          ["SQL"],
    "MongoDB":             ["JavaScript"],
    "Redis":               ["Linux"],
}

# Estimated learning hours for each skill (for duration calculation)
SKILL_HOURS = {
    "Python": 40, "JavaScript": 60, "TypeScript": 25, "Java": 50,
    "C++": 45, "HTML": 15, "CSS": 15, "React": 50, "Node.js": 40,
    "SQL": 30, "MongoDB": 20, "Git": 10, "Docker": 25, "Kubernetes": 40,
    "AWS": 50, "Machine Learning": 60, "Deep Learning": 60, "TensorFlow": 30,
    "PyTorch": 30, "Scikit-Learn": 25, "Pandas": 20, "NumPy": 15,
    "Data Structures": 45, "Algorithms": 40, "System Design": 35,
    "CI/CD": 20, "Linux": 25, "Django": 35, "Flask": 20, "FastAPI": 20,
    "NLP": 40, "Computer Vision": 40, "Spark": 35, "Power BI": 25,
    "Tableau": 20, "Redux": 20, "Next.js": 25, "ETL": 25,
    "Terraform": 30, "MLOps": 35, "Airflow": 25,
}
DEFAULT_SKILL_HOURS = 25

# Project ideas per career/skill combination
CAREER_PROJECTS = {
    "Data Scientist": [
        {"title": "Customer Churn Predictor", "skills": ["Python", "Scikit-Learn", "Pandas"], "difficulty": "Beginner"},
        {"title": "Stock Price Forecaster", "skills": ["Python", "TensorFlow", "NumPy"], "difficulty": "Intermediate"},
        {"title": "NLP Sentiment Analyzer", "skills": ["Python", "NLP", "Scikit-Learn"], "difficulty": "Intermediate"},
        {"title": "Image Classification App", "skills": ["Deep Learning", "TensorFlow", "Computer Vision"], "difficulty": "Advanced"},
    ],
    "Software Engineer": [
        {"title": "Personal Portfolio Website", "skills": ["HTML", "CSS", "JavaScript"], "difficulty": "Beginner"},
        {"title": "CRUD REST API", "skills": ["Node.js", "Express.js", "MongoDB"], "difficulty": "Beginner"},
        {"title": "Full Stack Task Manager", "skills": ["React", "Node.js", "MongoDB"], "difficulty": "Intermediate"},
        {"title": "Microservices E-Commerce", "skills": ["Docker", "Kubernetes", "Microservices"], "difficulty": "Advanced"},
    ],
    "Full Stack Developer": [
        {"title": "Blog Platform", "skills": ["React", "Node.js", "MongoDB"], "difficulty": "Beginner"},
        {"title": "Real-time Chat App", "skills": ["React", "Node.js", "WebSocket"], "difficulty": "Intermediate"},
        {"title": "E-Commerce Platform", "skills": ["React", "Node.js", "Payment API"], "difficulty": "Advanced"},
    ],
    "Machine Learning Engineer": [
        {"title": "Resume Parser", "skills": ["Python", "NLP", "Machine Learning"], "difficulty": "Beginner"},
        {"title": "Recommendation System", "skills": ["Python", "Scikit-Learn", "Collaborative Filtering"], "difficulty": "Intermediate"},
        {"title": "MLOps Pipeline", "skills": ["MLOps", "Docker", "Airflow"], "difficulty": "Advanced"},
    ],
    "DevOps Engineer": [
        {"title": "CI/CD Pipeline Setup", "skills": ["CI/CD", "Git", "Jenkins"], "difficulty": "Beginner"},
        {"title": "Dockerized Microservice", "skills": ["Docker", "Linux", "Networking"], "difficulty": "Intermediate"},
        {"title": "Kubernetes Cluster Deployment", "skills": ["Kubernetes", "Terraform", "AWS"], "difficulty": "Advanced"},
    ],
}


def _topological_sort(skills_to_learn: List[str]) -> List[str]:
    """
    Sort skills by prerequisite dependencies using Kahn's algorithm.
    Skills without prerequisites come first.
    """
    # Build dependency counts and adjacency list for the subset we care about
    skills_set = set(s.lower() for s in skills_to_learn)
    
    in_degree = {s: 0 for s in skills_to_learn}
    adj = {s: [] for s in skills_to_learn}
    
    for skill in skills_to_learn:
        prereqs = SKILL_PREREQUISITES.get(skill, [])
        for prereq in prereqs:
            # Only count prereqs that are also in our skill list
            if prereq in skills_to_learn:
                in_degree[skill] += 1
                adj[prereq].append(skill)
    
    # Kahn's BFS
    queue = [s for s in skills_to_learn if in_degree[s] == 0]
    result = []
    
    while queue:
        # Sort by hours (shorter skills first within same level)
        queue.sort(key=lambda s: SKILL_HOURS.get(s, DEFAULT_SKILL_HOURS))
        skill = queue.pop(0)
        result.append(skill)
        
        for dependent in adj.get(skill, []):
            in_degree[dependent] -= 1
            if in_degree[dependent] == 0:
                queue.append(dependent)
    
    # Add any remaining (cycles or missing prereqs)
    for s in skills_to_learn:
        if s not in result:
            result.append(s)
    
    return result


def _assign_phases(sorted_skills: List[str], weekly_hours: int = 15) -> List[Dict]:
    """
    Group sorted skills into phases based on study hours.
    Each phase is roughly 4-6 weeks of study.
    
    Args:
        sorted_skills: Skills in prerequisite order
        weekly_hours: Available study hours per week
    
    Returns:
        List of phase dicts with skills, duration, courses, milestones
    """
    phase_target_hours = weekly_hours * 4  # 4 weeks per phase target
    phases = []
    current_phase_skills = []
    current_hours = 0
    phase_num = 1
    
    for skill in sorted_skills:
        skill_hours = SKILL_HOURS.get(skill, DEFAULT_SKILL_HOURS)
        
        if current_hours + skill_hours > phase_target_hours * 1.5 and current_phase_skills:
            # Finalize current phase
            total_weeks = ceil(current_hours / weekly_hours)
            phases.append({
                "phaseNumber": phase_num,
                "phase": f"Phase {phase_num}",
                "duration": f"{total_weeks} weeks",
                "totalHours": current_hours,
                "skills": current_phase_skills.copy(),
                "courses": [],
                "projects": [],
                "milestones": [],
            })
            phase_num += 1
            current_phase_skills = []
            current_hours = 0
        
        current_phase_skills.append(skill)
        current_hours += skill_hours
    
    # Add remaining skills as last phase
    if current_phase_skills:
        total_weeks = max(ceil(current_hours / weekly_hours), 2)
        phases.append({
            "phaseNumber": phase_num,
            "phase": f"Phase {phase_num}",
            "duration": f"{total_weeks} weeks",
            "totalHours": current_hours,
            "skills": current_phase_skills.copy(),
            "courses": [],
            "projects": [],
            "milestones": [],
        })
    
    return phases


def generate_roadmap(
    student_skills: Any,
    career_name: Any = "Software Engineer",
    weekly_hours: int = 15,
    include_projects: bool = True,
) -> Dict[str, Any]:
    """
    Generate a personalized learning roadmap.
    Supports either (student_skills, career_name) or (career_name, student_skills).
    """
    # Robust argument order check
    if isinstance(student_skills, str) and isinstance(career_name, (list, tuple, set)):
        student_skills, career_name = list(career_name), student_skills
    elif isinstance(student_skills, str) and not isinstance(career_name, (list, tuple, set)):
        # only career passed as first arg
        student_skills, career_name = [], student_skills
    elif not isinstance(student_skills, list):
        student_skills = list(student_skills) if hasattr(student_skills, '__iter__') else []

    # Get skill gap analysis
    gap = analyze_skill_gap(student_skills, str(career_name))
    
    # Collect all missing skills in priority order
    missing_critical = gap["criticalMissing"]
    missing_high = gap["highMissing"]
    missing_medium = gap["mediumMissing"]
    
    # Priority skills: critical + high (these MUST be in roadmap)
    priority_skills = missing_critical + missing_high
    optional_skills = missing_medium  # Include if roadmap has room
    
    # Filter out skills student already has
    normalized_existing = set(s.lower() for s in normalize_skills_list(student_skills))
    priority_skills = [s for s in priority_skills if s.lower() not in normalized_existing]
    optional_skills = [s for s in optional_skills if s.lower() not in normalized_existing]
    
    # Remove duplicates while preserving order
    seen = set()
    all_to_learn = []
    for skill in priority_skills + optional_skills:
        if skill.lower() not in seen:
            seen.add(skill.lower())
            all_to_learn.append(skill)
    
    if not all_to_learn:
        # Student already has most skills!
        return {
            "career": career_name,
            "studentSkills": student_skills,
            "status": "ready",
            "message": f"You have most required skills for {career_name}! Focus on building projects and interview prep.",
            "phases": [
                {
                    "phaseNumber": 1,
                    "phase": "Phase 1",
                    "title": "Portfolio Building",
                    "duration": "4-6 weeks",
                    "skills": list(gap["matchedSkills"])[:3],
                    "courses": [],
                    "projects": CAREER_PROJECTS.get(career_name, [])[:2],
                    "milestones": ["Complete 2 portfolio projects", "Push to GitHub"],
                },
                {
                    "phaseNumber": 2,
                    "phase": "Phase 2",
                    "title": "Interview Preparation",
                    "duration": "4 weeks",
                    "skills": ["Data Structures", "System Design", "Algorithms"],
                    "courses": get_courses_for_skill("Data Structures"),
                    "projects": [],
                    "milestones": ["Solve 100 LeetCode problems", "Complete 5 mock interviews"],
                }
            ],
            "totalWeeks": 10,
            "skillGapPercentage": gap["skillGapPercentage"],
            "matchedSkills": gap["matchedSkills"],
        }
    
    # Sort by prerequisites
    sorted_skills = _topological_sort(all_to_learn)
    
    # Assign to phases
    phases = _assign_phases(sorted_skills, weekly_hours)
    
    # Enrich each phase with courses, projects, milestones
    for i, phase in enumerate(phases):
        # Add courses for each skill in phase
        courses_added = []
        for skill in phase["skills"][:3]:  # Top 3 skills per phase
            skill_courses = get_courses_for_skill(skill)
            for c in skill_courses[:1]:  # 1 course per skill
                if c not in courses_added:
                    courses_added.append({**c, "skill": skill})
        phase["courses"] = courses_added
        
        # Add projects (for middle/late phases)
        if i >= 1 and include_projects:
            career_projects = CAREER_PROJECTS.get(career_name, [])
            difficulty = "Beginner" if i < 2 else "Intermediate" if i < 3 else "Advanced"
            matching_projects = [p for p in career_projects if p["difficulty"] == difficulty]
            if matching_projects:
                phase["projects"] = matching_projects[:1]
        
        # Add milestones
        phase_skills_str = " & ".join(phase["skills"][:2])
        phase["milestones"] = [
            f"Complete {phase_skills_str} fundamentals",
            f"Build a mini-project using {phase['skills'][0] if phase['skills'] else 'learned skills'}",
        ]
        
        # Phase title
        if i == 0:
            phase["title"] = f"Foundation: {phase['skills'][0] if phase['skills'] else 'Core Skills'}"
        elif i == len(phases) - 1:
            phase["title"] = "Advanced Skills & Interview Prep"
        else:
            phase["title"] = f"Building: {' & '.join(phase['skills'][:2])}"
    
    # Calculate total duration
    total_hours = sum(p["totalHours"] for p in phases)
    total_weeks = ceil(total_hours / weekly_hours)
    
    # Add final capstone/interview prep phase
    phases.append({
        "phaseNumber": len(phases) + 1,
        "phase": f"Phase {len(phases) + 1}",
        "title": "Capstone & Placement Prep",
        "duration": "4-8 weeks",
        "totalHours": 80,
        "skills": ["System Design", "DSA", "Interview Prep"],
        "courses": [{"title": "System Design Interview", "provider": "ByteByteGo", "url": "https://bytebytego.com", "duration": "Self-paced", "skill": "System Design"}],
        "projects": CAREER_PROJECTS.get(career_name, [{"title": f"Full {career_name} Portfolio Project", "skills": sorted_skills[:3], "difficulty": "Advanced"}])[-1:],
        "milestones": [
            "Complete 2+ portfolio projects",
            "Solve 150+ LeetCode problems",
            "Get 5 mock interviews done",
            "Apply to 20+ companies",
        ],
    })
    
    return {
        "career": career_name,
        "studentSkills": list(normalize_skills_list(student_skills)),
        "skillGapPercentage": gap["skillGapPercentage"],
        "matchedSkills": gap["matchedSkills"],
        "skillsToLearn": all_to_learn,
        "phases": phases,
        "totalPhases": len(phases),
        "totalWeeks": total_weeks + 8,
        "weeklyHours": weekly_hours,
        "status": "in_progress",
    }


if __name__ == "__main__":
    student_skills = ["Python", "React", "JavaScript", "SQL", "Git"]
    roadmap = generate_roadmap(student_skills, "Data Scientist", weekly_hours=20)
    
    print(f"Career: {roadmap['career']}")
    print(f"Total Duration: {roadmap['totalWeeks']} weeks")
    print(f"Phases: {roadmap['totalPhases']}")
    print(f"Skills to Learn: {roadmap['skillsToLearn']}")
    
    for phase in roadmap["phases"]:
        print(f"\n{phase['phase']}: {phase.get('title','')} ({phase['duration']})")
        print(f"  Skills: {phase['skills']}")
        if phase.get("courses"):
            print(f"  Course: {phase['courses'][0]['title']}")
