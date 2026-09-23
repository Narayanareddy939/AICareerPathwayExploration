"""
course_recommender.py
Maps missing skills to relevant courses from the Coursera dataset and static mappings.

Data Source: Datasets/raw/coursera_courses.csv
"""

import os, csv
from typing import List, Dict, Any, Optional
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COURSERA_CSV = os.path.join(BASE_DIR, "Datasets", "raw", "coursera_courses.csv")

# Cache
_coursera_cache = None

def _load_coursera():
    global _coursera_cache
    if _coursera_cache is not None:
        return _coursera_cache
    courses = []
    if not os.path.exists(COURSERA_CSV):
        _coursera_cache = []
        return []
    try:
        with open(COURSERA_CSV, encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                courses.append({
                    "title": row.get("name") or row.get("title") or row.get("Course Name", ""),
                    "provider": row.get("institution") or row.get("provider") or "Coursera",
                    "url": row.get("url") or row.get("link") or "https://www.coursera.org",
                    "rating": row.get("rating") or row.get("Course Rating", "4.5"),
                    "difficulty": row.get("difficulty") or row.get("Difficulty Level", "Beginner"),
                    "skills": row.get("skills") or row.get("Skills", ""),
                    "duration": row.get("duration") or row.get("Approximate Time to Complete", "Self-paced"),
                })
    except Exception as e:
        print(f"Warning: Could not load coursera data: {e}")
    _coursera_cache = courses
    return courses


# Curated static course recommendations (backup + supplement)
STATIC_RECOMMENDATIONS = {
    "Python": [
        {"title": "Python for Everybody", "provider": "Coursera / University of Michigan", "url": "https://www.coursera.org/specializations/python", "rating": "4.8", "difficulty": "Beginner", "duration": "5 months"},
        {"title": "Complete Python Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/complete-python-bootcamp", "rating": "4.7", "difficulty": "Beginner", "duration": "22 hours"},
    ],
    "Machine Learning": [
        {"title": "Machine Learning Specialization", "provider": "Coursera / DeepLearning.AI", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "rating": "4.9", "difficulty": "Intermediate", "duration": "3 months"},
    ],
    "Deep Learning": [
        {"title": "Deep Learning Specialization", "provider": "Coursera / DeepLearning.AI", "url": "https://www.coursera.org/specializations/deep-learning", "rating": "4.9", "difficulty": "Advanced", "duration": "5 months"},
    ],
    "React": [
        {"title": "React - The Complete Guide 2024", "provider": "Udemy", "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux", "rating": "4.8", "difficulty": "Intermediate", "duration": "48 hours"},
        {"title": "Full Stack Open", "provider": "University of Helsinki (Free)", "url": "https://fullstackopen.com", "rating": "4.9", "difficulty": "Intermediate", "duration": "4 months"},
    ],
    "SQL": [
        {"title": "SQL for Data Science", "provider": "Coursera / UC Davis", "url": "https://www.coursera.org/learn/sql-for-data-science", "rating": "4.7", "difficulty": "Beginner", "duration": "4 weeks"},
    ],
    "AWS": [
        {"title": "AWS Certified Solutions Architect Associate", "provider": "Udemy", "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03", "rating": "4.7", "difficulty": "Intermediate", "duration": "13 hours"},
    ],
    "Docker": [
        {"title": "Docker and Kubernetes Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide", "rating": "4.6", "difficulty": "Intermediate", "duration": "22 hours"},
    ],
    "Data Structures": [
        {"title": "Data Structures and Algorithms Specialization", "provider": "Coursera / UCSD", "url": "https://www.coursera.org/specializations/data-structures-algorithms", "rating": "4.6", "difficulty": "Intermediate", "duration": "6 months"},
    ],
    "JavaScript": [
        {"title": "The Complete JavaScript Course 2024", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-javascript-course", "rating": "4.7", "difficulty": "Beginner", "duration": "69 hours"},
    ],
    "Node.js": [
        {"title": "The Complete Node.js Developer Course", "provider": "Udemy", "url": "https://www.udemy.com/course/the-complete-nodejs-developer-course-2", "rating": "4.7", "difficulty": "Intermediate", "duration": "35 hours"},
    ],
    "System Design": [
        {"title": "System Design Interview", "provider": "ByteByteGo", "url": "https://bytebytego.com", "rating": "4.9", "difficulty": "Advanced", "duration": "Self-paced"},
        {"title": "Grokking System Design Interview", "provider": "Educative.io", "url": "https://www.educative.io/courses/grokking-the-system-design-interview", "rating": "4.7", "difficulty": "Advanced", "duration": "Self-paced"},
    ],
    "Cybersecurity": [
        {"title": "Google Cybersecurity Certificate", "provider": "Coursera / Google", "url": "https://www.coursera.org/professional-certificates/google-cybersecurity", "rating": "4.8", "difficulty": "Beginner", "duration": "6 months"},
    ],
    "Power BI": [
        {"title": "Microsoft Power BI Desktop for Business Intelligence", "provider": "Udemy", "url": "https://www.udemy.com/course/microsoft-power-bi-up-running-with-power-bi-desktop", "rating": "4.6", "difficulty": "Beginner", "duration": "18 hours"},
    ],
    "Kubernetes": [
        {"title": "Certified Kubernetes Application Developer (CKAD)", "provider": "Linux Foundation", "url": "https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad", "rating": "4.7", "difficulty": "Advanced", "duration": "3 months"},
    ],
    "TensorFlow": [
        {"title": "TensorFlow Developer Certificate", "provider": "Coursera / Google", "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice", "rating": "4.7", "difficulty": "Intermediate", "duration": "4 months"},
    ],
    "Flutter": [
        {"title": "The Complete Flutter Development Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/flutter-bootcamp-with-dart", "rating": "4.7", "difficulty": "Beginner", "duration": "28 hours"},
    ],
    "Git": [
        {"title": "Git & GitHub - The Practical Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/git-github-practical-guide", "rating": "4.6", "difficulty": "Beginner", "duration": "10 hours"},
    ],
}


def get_courses_for_skills(skills: List[str], max_per_skill: int = 2) -> Dict[str, List[Dict]]:
    """
    Get course recommendations for a list of missing skills.
    First checks static recommendations, then Coursera dataset.
    
    Returns:
        Dict mapping skill name to list of course dicts
    """
    coursera_data = _load_coursera()
    result = {}
    
    for skill in skills:
        skill_str = skill.get('skill', '') if isinstance(skill, dict) else str(skill)
        if not skill_str.strip():
            continue
        courses = []
        
        # Check static recommendations first
        for key, static_courses in STATIC_RECOMMENDATIONS.items():
            if skill_str.lower() in key.lower() or key.lower() in skill_str.lower():
                courses.extend(static_courses)
                break
        
        # Search Coursera dataset
        if len(courses) < max_per_skill:
            skill_lower = skill_str.lower()
            for c in coursera_data[:500]:  # Limit search for performance
                title_lower = (c.get("title") or "").lower()
                skills_text = (c.get("skills") or "").lower()
                if skill_lower in title_lower or skill_lower in skills_text:
                    if c not in courses:
                        courses.append(c)
                if len(courses) >= max_per_skill * 2:
                    break
        
        # Fallback
        if not courses:
            courses = [{
                "title": f"{skill_str} - Complete Course",
                "provider": "Coursera / Udemy",
                "url": f"https://www.coursera.org/search?query={skill_str.replace(' ', '+')}",
                "rating": "4.5",
                "difficulty": "Beginner",
                "duration": "Self-paced",
            }]
        
        result[skill_str] = courses[:max_per_skill]
    
    return result


def get_learning_path(career_name: str, missing_skills: List[str]) -> List[Dict]:
    """
    Get a curated list of top courses to learn all missing skills for a career.
    Returns deduplicated list sorted by relevance.
    """
    courses_by_skill = get_courses_for_skills(missing_skills, max_per_skill=1)
    
    learning_path = []
    for skill, courses in courses_by_skill.items():
        for course in courses:
            learning_path.append({
                **course,
                "targetSkill": skill,
                "career": career_name,
            })
    
    return learning_path


def recommend_courses_for_skills(missing_skills: List[str], top_n: int = 5) -> List[Dict[str, Any]]:
    """Return a flat deduplicated list of top recommended courses for given missing skills."""
    res = get_courses_for_skills(missing_skills, max_per_skill=2)
    flat = []
    seen = set()
    for skill, c_list in res.items():
        for c in c_list:
            title = c.get('title', '')
            if title and title not in seen:
                seen.add(title)
                c_copy = dict(c)
                c_copy['targetSkill'] = skill
                flat.append(c_copy)
    return flat[:top_n]


if __name__ == "__main__":
    missing = ["Machine Learning", "Docker", "SQL", "System Design"]
    courses = get_courses_for_skills(missing)
    for skill, course_list in courses.items():
        print(f"\n{skill}:")
        for c in course_list:
            print(f"  - {c['title']} ({c['provider']})")

