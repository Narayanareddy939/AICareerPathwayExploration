"""
job_market.py
Analyzes job market data from CSV datasets to produce career-specific insights.

Data Sources:
  - Datasets/raw/job_data.csv (200 records)
  - Datasets/raw/linkedin_job_postings_dataset.csv (500 records)

Returns real statistics — never fabricated values.
"""

import os, json, csv, re
from typing import Dict, List, Any, Optional
from collections import Counter, defaultdict


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, "Datasets", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "Datasets", "processed")


def _load_csv(filename: str) -> List[Dict]:
    """Load a CSV file and return list of dicts."""
    path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(path):
        return []
    rows = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(dict(row))
    except Exception as e:
        print(f"Warning: Could not load {filename}: {e}")
    return rows


def _parse_skills_field(field_value: str) -> List[str]:
    """Parse skills from various formats (JSON array, comma-separated, etc.)."""
    if not field_value:
        return []
    
    # Try JSON-like format
    cleaned = field_value.strip()
    if cleaned.startswith("["):
        # Remove brackets and parse
        cleaned = re.sub(r'[\[\]"\'\\]', '', cleaned)
        skills = [s.strip() for s in cleaned.split(",") if s.strip()]
    else:
        skills = [s.strip() for s in cleaned.split(",") if s.strip()]
    
    return [s for s in skills if len(s) > 1]


def _normalize_salary_usd(min_val, max_val) -> Optional[Dict]:
    """Convert USD salary to LPA (Indian context) and return range."""
    try:
        mn = float(min_val or 0)
        mx = float(max_val or 0)
        if mn <= 0 and mx <= 0:
            return None
        # Convert USD/year to LPA (1 USD ≈ 83 INR, divided by 100000)
        # For international data, show USD range
        return {
            "min_usd": round(mn, 0),
            "max_usd": round(mx, 0),
            "avg_usd": round((mn + mx) / 2, 0),
        }
    except:
        return None


# ─────────────────────────────────────────────────────────────────────────────
#  Load and cache all job data at module import time
# ─────────────────────────────────────────────────────────────────────────────
_job_data_cache = None

def _get_all_jobs() -> List[Dict]:
    """Load all job records from available datasets."""
    global _job_data_cache
    if _job_data_cache is not None:
        return _job_data_cache
    
    all_jobs = []
    
    # Load job_data.csv
    job_rows = _load_csv("job_data.csv")
    for row in job_rows:
        skills = _parse_skills_field(row.get("Hard Skills", ""))
        soft_skills = _parse_skills_field(row.get("Soft Skills", ""))
        all_jobs.append({
            "title": row.get("Job Title", ""),
            "industry": row.get("Industry", ""),
            "education": row.get("Required Education", ""),
            "experience_years": row.get("Years of Experience", ""),
            "hard_skills": skills,
            "soft_skills": soft_skills,
            "all_skills": skills + soft_skills,
            "source": "job_data",
            "company": "",
            "location": "",
            "salary_usd": None,
            "employment_type": "Full-time",
        })
    
    # Load linkedin_job_postings_dataset.csv
    linkedin_rows = _load_csv("linkedin_job_postings_dataset.csv")
    for row in linkedin_rows:
        skills = _parse_skills_field(row.get("skills_required", ""))
        salary = _normalize_salary_usd(row.get("salary_min_usd"), row.get("salary_max_usd"))
        all_jobs.append({
            "title": row.get("job_title", ""),
            "industry": row.get("industry", ""),
            "company": row.get("company", ""),
            "location": row.get("location", ""),
            "employment_type": row.get("employment_type", "Full-time"),
            "experience_level": row.get("experience_level", ""),
            "hard_skills": skills,
            "soft_skills": [],
            "all_skills": skills,
            "source": "linkedin",
            "salary_usd": salary,
            "education": "",
            "experience_years": "",
        })
    
    _job_data_cache = all_jobs
    return all_jobs


def _match_jobs_to_career(career_name: str, all_jobs: List[Dict]) -> List[Dict]:
    """Filter jobs relevant to a career using title/industry keyword matching."""
    career_lower = career_name.lower()
    
    # Build keyword families
    career_keyword_map = {
        "software engineer": ["software engineer", "swe", "sde", "software developer", "backend engineer", "backend developer"],
        "full stack developer": ["full stack", "fullstack", "full-stack"],
        "frontend developer": ["frontend", "front-end", "front end", "ui developer", "react developer"],
        "backend developer": ["backend", "back-end", "back end"],
        "data scientist": ["data scientist", "data science", "ml scientist"],
        "data analyst": ["data analyst", "analytics"],
        "business analyst": ["business analyst", "bi analyst", "business intelligence"],
        "marketing analyst": ["marketing analyst", "market research", "marketing"],
        "ai researcher": ["ai researcher", "ai research", "artificial intelligence"],
        "machine learning engineer": ["machine learning", "ml engineer", "ai engineer", "deep learning"],
        "devops engineer": ["devops", "dev ops", "sre", "site reliability", "platform engineer"],
        "cloud engineer": ["cloud engineer", "cloud architect", "aws", "azure engineer"],
        "data engineer": ["data engineer", "data engineering", "etl"],
        "ui/ux designer": ["ux designer", "ui designer", "product designer", "ux", "ui"],
        "product manager": ["product manager", "product management", "pm"],
        "cybersecurity engineer": ["security", "cybersecurity", "infosec", "cyber security"],
        "mobile developer": ["mobile developer", "android developer", "ios developer", "flutter"],
        "blockchain developer": ["blockchain", "web3", "smart contract"],
        "game developer": ["game developer", "game design", "unity", "unreal"],
        # Domains / Industries
        "technology": ["technology", "tech", "software", "it services"],
        "healthcare": ["healthcare", "health", "medical", "hospital", "clinical"],
        "finance": ["finance", "fintech", "banking", "investment", "financial"],
        "e-commerce": ["e-commerce", "ecommerce", "retail", "online shopping"],
        "education": ["education", "edtech", "university", "academic", "teaching"],
        "business": ["business", "management", "consulting", "corporate"],
        "science and research": ["science", "research", "scientific", "laboratory"],
        "arts and media": ["arts", "media", "design", "content", "creative", "journalism"],
        "human resources and operations": ["human resources", "hr", "recruiting", "talent", "operations"],
        "retail and sales": ["retail", "sales", "merchandising"],
        "construction and engineering": ["construction", "civil engineering", "infrastructure"],
        "travel, hospitality and tourism": ["travel", "hospitality", "tourism", "hotel"],
        "environmental and sustainability": ["environmental", "sustainability", "green energy", "ecology"],
        "transportation and logistics": ["transportation", "logistics", "supply chain", "freight"],
        "law and government": ["law", "government", "legal", "public policy"],
    }
    
    keywords = []
    for career_key, kws in career_keyword_map.items():
        if career_lower == career_key or career_lower in career_key or any(kw in career_lower for kw in career_key.split()):
            keywords = kws
            break
    
    if not keywords:
        # Generic fallback: use career name words
        keywords = [w for w in re.split(r'[\s,/-]+', career_lower) if len(w) > 2]
    
    matched = []
    for job in all_jobs:
        title_lower = (job.get("title") or "").lower()
        industry_lower = (job.get("industry") or "").lower()
        if any(kw in title_lower or kw in industry_lower for kw in keywords):
            matched.append(job)
    
    return matched


def get_job_market_insights(career_name: str) -> Dict[str, Any]:
    """
    Get comprehensive job market insights for a career.
    
    Returns real statistics calculated from datasets.
    """
    all_jobs = _get_all_jobs()
    matched_jobs = _match_jobs_to_career(career_name, all_jobs)
    
    total_matched = len(matched_jobs)
    total_jobs_in_db = len(all_jobs)
    
    if total_matched == 0:
        return {
            "career": career_name,
            "jobCount": 0,
            "totalJobsInDB": total_jobs_in_db,
            "topCompanies": [],
            "topLocations": [],
            "topSkills": [],
            "experienceLevels": {},
            "employmentTypes": {},
            "salaryRange": None,
            "demandLevel": "Unknown",
            "dataSource": "job_data.csv + linkedin_job_postings_dataset.csv",
            "note": f"No direct matches found for '{career_name}' in current dataset",
        }
    
    # Top companies
    companies = Counter(j["company"] for j in matched_jobs if j.get("company") and j["company"] != "")
    top_companies = [{"company": c, "count": n} for c, n in companies.most_common(8)]
    
    # Top locations
    locations = Counter(j["location"] for j in matched_jobs if j.get("location") and j["location"] != "")
    top_locations = [{"location": l, "count": n} for l, n in locations.most_common(8)]
    
    # Top skills
    all_skills = []
    for job in matched_jobs:
        all_skills.extend(job.get("all_skills") or [])
    skill_counter = Counter(all_skills)
    top_skills = [{"skill": s, "count": n} for s, n in skill_counter.most_common(15) if len(s) > 1]
    
    # Experience levels
    exp_levels = Counter(j.get("experience_level") or j.get("experience_years") or "Not specified"
                         for j in matched_jobs)
    
    # Employment types
    emp_types = Counter(j.get("employment_type") or "Full-time" for j in matched_jobs)
    
    # Salary range (only from LinkedIn data with salary info)
    salaries_usd = [j["salary_usd"] for j in matched_jobs if j.get("salary_usd")]
    salary_range = None
    if salaries_usd:
        min_vals = [s["min_usd"] for s in salaries_usd if s.get("min_usd", 0) > 0]
        max_vals = [s["max_usd"] for s in salaries_usd if s.get("max_usd", 0) > 0]
        if min_vals and max_vals:
            salary_range = {
                "min_usd": round(min(min_vals)),
                "max_usd": round(max(max_vals)),
                "avg_usd": round(sum(min_vals + max_vals) / (len(min_vals) + len(max_vals))),
                "sample_size": len(salaries_usd),
            }
    
    # Demand level based on job count relative to dataset
    demand_pct = (total_matched / total_jobs_in_db) * 100
    demand_level = "Very High" if demand_pct > 15 else "High" if demand_pct > 8 else "Medium" if demand_pct > 4 else "Growing"
    
    return {
        "career": career_name,
        "jobCount": total_matched,
        "totalJobsInDB": total_jobs_in_db,
        "demandPercentage": round(demand_pct, 1),
        "topCompanies": top_companies,
        "topLocations": top_locations,
        "topSkills": top_skills,
        "experienceLevels": dict(exp_levels.most_common(6)),
        "employmentTypes": dict(emp_types.most_common()),
        "salaryRange": salary_range,
        "demandLevel": demand_level,
        "dataSource": "job_data.csv + linkedin_job_postings_dataset.csv",
        "matchedJobs": [
            {
                "title": j["title"],
                "company": j.get("company", ""),
                "location": j.get("location", ""),
                "skills": j.get("all_skills", [])[:5],
                "source": j.get("source", ""),
            }
            for j in matched_jobs[:10]
        ]
    }


def get_all_careers_demand() -> List[Dict]:
    """Get demand statistics for all tracked careers."""
    careers = [
        "Software Engineer", "Full Stack Developer", "Data Scientist",
        "Data Analyst", "Machine Learning Engineer", "DevOps Engineer",
        "Cloud Engineer", "Frontend Developer", "Backend Developer",
        "Data Engineer", "Product Manager", "Cybersecurity Engineer",
    ]
    results = []
    all_jobs = _get_all_jobs()
    for career in careers:
        matched = _match_jobs_to_career(career, all_jobs)
        results.append({
            "career": career,
            "jobCount": len(matched),
            "demandPercentage": round(len(matched) / len(all_jobs) * 100, 1) if all_jobs else 0,
        })
    results.sort(key=lambda x: x["jobCount"], reverse=True)
    return results


if __name__ == "__main__":
    insights = get_job_market_insights("Data Scientist")
    print(f"Career: {insights['career']}")
    print(f"Jobs found: {insights['jobCount']} / {insights['totalJobsInDB']}")
    print(f"Demand: {insights['demandLevel']}")
    print(f"Top Skills: {[s['skill'] for s in insights['topSkills'][:5]]}")
    print(f"Top Companies: {[c['company'] for c in insights['topCompanies'][:3]]}")
