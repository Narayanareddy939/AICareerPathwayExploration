"""
course_recommender.py
Maps missing skills to relevant courses from the Coursera dataset and static mappings.

Data Source: Datasets/raw/coursera_courses.csv
"""

import os, csv, re, math
from typing import List, Dict, Any, Optional
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COURSERA_CSV = os.path.join(BASE_DIR, "Datasets", "raw", "coursera_courses.csv")

# Cache for full course dataset, inverted index, and computed ranks
_coursera_cache = None
_inverted_index = None

DIFFICULTY_WEIGHTS = {
    "beginner": 1.0,
    "intermediate": 1.1,
    "advanced": 1.2
}

def _load_coursera_and_index():
    global _coursera_cache, _inverted_index
    if _coursera_cache is not None and _inverted_index is not None:
        return _coursera_cache, _inverted_index

    courses = []
    inverted_index = defaultdict(list)

    if not os.path.exists(COURSERA_CSV):
        _coursera_cache = []
        _inverted_index = inverted_index
        return courses, inverted_index

    try:
        import math
        with open(COURSERA_CSV, encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                title = row.get("course_title") or row.get("name") or row.get("title") or ""
                provider = row.get("course_organization") or row.get("institution") or row.get("provider") or "Coursera"
                url = row.get("course_url") or row.get("url") or "https://www.coursera.org"
                difficulty = (row.get("course_difficulty") or row.get("difficulty") or "Beginner").strip()
                skills_raw = row.get("course_skills") or row.get("skills") or ""
                summary = row.get("course_summary") or ""
                
                # Parse numeric rating
                try:
                    rating = float(row.get("course_rating") or 4.5)
                except (ValueError, TypeError):
                    rating = 4.5
                
                # Parse numeric reviews
                reviews_str = str(row.get("course_reviews_num") or "0").replace(",", "").strip()
                try:
                    reviews = float(reviews_str) if reviews_str else 0.0
                except (ValueError, TypeError):
                    reviews = 0.0

                # Difficulty weight
                diff_weight = DIFFICULTY_WEIGHTS.get(difficulty.lower(), 1.0)

                # CourseRank formula: rating * log(1 + reviews) * DifficultyWeight
                course_rank = round(rating * math.log1p(reviews) * diff_weight, 4)

                course_obj = {
                    "index": idx,
                    "title": title,
                    "provider": provider,
                    "url": url,
                    "rating": str(rating),
                    "difficulty": difficulty,
                    "reviews": reviews,
                    "course_rank": course_rank,
                    "skills": skills_raw,
                    "duration": row.get("course_time") or "Self-paced",
                }
                courses.append(course_obj)

                # Build inverted index mapping tokens and normalized skill keywords to course indices
                text_to_index = f"{title} {skills_raw} {summary}".lower()
                tokens = set(re.findall(r'[a-zA-Z0-9\+#\.]+', text_to_index))
                for token in tokens:
                    if len(token) > 1:
                        inverted_index[token].append(idx)

    except Exception as e:
        print(f"Warning: Could not load full coursera dataset: {e}")

    _coursera_cache = courses
    _inverted_index = inverted_index
    return _coursera_cache, _inverted_index


def get_courses_for_skills(skills: List[str], max_per_skill: int = 2) -> Dict[str, List[Dict]]:
    r"""
    Get course recommendations for missing skills using:
      1. Inverted Index lookup across ALL 8,229 Coursera records
      2. Regex word-boundary verification r'(?<!\w)' + re.escape(skill) + r'(?!\w)'
      3. CourseRank = rating * log(1 + reviews) * DifficultyWeight
    """
    courses_data, inverted_index = _load_coursera_and_index()
    result = {}

    for skill in skills:
        skill_str = skill.get('skill', '') if isinstance(skill, dict) else str(skill)
        skill_clean = skill_str.strip().lower()
        if not skill_clean:
            continue

        matched_indices = set()
        pattern = re.compile(r"(?<!\w)" + re.escape(skill_clean) + r"(?!\w)", re.IGNORECASE)

        # Get candidates from inverted index for skill tokens
        candidate_indices = set()
        skill_tokens = skill_clean.split()
        if skill_tokens and skill_tokens[0] in inverted_index:
            candidate_indices.update(inverted_index[skill_tokens[0]])
        for t in skill_tokens[1:]:
            if t in inverted_index:
                candidate_indices.intersection_update(inverted_index[t])

        # If inverted index candidate set is empty, search candidate tokens
        if not candidate_indices and skill_clean in inverted_index:
            candidate_indices.update(inverted_index[skill_clean])

        # Verify with boundary regex
        for idx in candidate_indices:
            if idx < len(courses_data):
                c = courses_data[idx]
                combined_text = f"{c['title']} {c['skills']}"
                if pattern.search(combined_text):
                    matched_indices.add(idx)

        # If still empty, scan courses with regex boundary (handles multi-word skills)
        if not matched_indices:
            for idx, c in enumerate(courses_data):
                if pattern.search(f"{c['title']} {c['skills']}"):
                    matched_indices.add(idx)
                    if len(matched_indices) >= 25:
                        break

        # Rank matched courses by CourseRank descending
        matched_courses = [courses_data[i] for i in matched_indices]
        matched_courses.sort(key=lambda x: x.get("course_rank", 0.0), reverse=True)

        # Fallback if no direct dataset match
        if not matched_courses:
            for key, static_courses in STATIC_RECOMMENDATIONS.items():
                if skill_clean in key.lower() or key.lower() in skill_clean:
                    matched_courses = static_courses
                    break

        if not matched_courses:
            matched_courses = [{
                "title": f"{skill_str} Specialization & Certification",
                "provider": "Coursera",
                "url": f"https://www.coursera.org/search?query={skill_str.replace(' ', '+')}",
                "rating": "4.6",
                "difficulty": "Intermediate",
                "duration": "Self-paced",
                "course_rank": 25.0
            }]

        result[skill_str] = matched_courses[:max_per_skill]

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

