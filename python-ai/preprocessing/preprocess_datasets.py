"""
preprocess_datasets.py
Processes raw CSV datasets into clean, indexed JSON files in Datasets/processed/
for rapid querying by backend API and Python recommendation modules.
"""

import os
import json
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, "Datasets", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "Datasets", "processed")

os.makedirs(PROCESSED_DIR, exist_ok=True)

# Role to skills heuristic mapping for enriched alumni matching
ROLE_SKILL_MAP = {
    "software engineer": ["Python", "Java", "Data Structures", "Algorithms", "Git", "SQL"],
    "frontend developer": ["React", "JavaScript", "HTML", "CSS", "TypeScript", "Tailwind CSS"],
    "backend developer": ["Node.js", "Python", "SQL", "MongoDB", "REST APIs", "Docker"],
    "full stack developer": ["React", "Node.js", "JavaScript", "MongoDB", "Express", "SQL"],
    "data scientist": ["Python", "Machine Learning", "Pandas", "NumPy", "SQL", "Scikit-Learn"],
    "data analyst": ["SQL", "Python", "Excel", "Tableau", "Power BI", "Statistics"],
    "machine learning engineer": ["Python", "TensorFlow", "PyTorch", "Scikit-Learn", "Deep Learning", "MLOps"],
    "cloud architect": ["AWS", "Azure", "Docker", "Kubernetes", "DevOps", "Linux"],
    "devops engineer": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Terraform"],
    "cybersecurity analyst": ["Network Security", "Ethical Hacking", "Cryptography", "Linux", "SIEM"],
    "product manager": ["Product Strategy", "Agile", "User Research", "Roadmapping", "Data Analysis"],
    "qa engineer": ["Selenium", "Test Automation", "Python", "Postman", "Jest", "Bug Tracking"],
    "embedded systems engineer": ["C", "C++", "Microcontrollers", "RTOS", "Embedded Linux", "IoT"]
}

def infer_skills_for_role(role: str) -> list:
    if not isinstance(role, str):
        return ["Communication", "Problem Solving", "Teamwork"]
    role_lower = role.lower()
    for key, skills in ROLE_SKILL_MAP.items():
        if key in role_lower or any(word in role_lower for word in key.split()):
            return skills
    return ["Problem Solving", "Communication", "Software Engineering", "Project Management"]

def process_alumni():
    print("Processing Alumni Data...")
    file_path = os.path.join(RAW_DIR, "Alumni_Data_1000_Rows.csv")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    df = pd.read_csv(file_path)
    alumni_list = []
    
    for idx, row in df.iterrows():
        job_title = str(row.get("Job_Title", "")).strip()
        first_name = str(row.get("First_Name", "")).strip()
        last_name = str(row.get("Last_Name", "")).strip()
        full_name = f"{first_name} {last_name}".strip()
        
        skills = infer_skills_for_role(job_title)
        
        # Calculate experience based on graduation year
        grad_year = row.get("Graduation_Year")
        try:
            grad_year = int(grad_year)
            current_year = 2026
            experience_years = max(1, current_year - grad_year)
        except:
            grad_year = 2021
            experience_years = 5
            
        alumni_item = {
            "id": str(row.get("Alumni_ID", f"ALU_{idx+1:04d}")),
            "name": full_name,
            "firstName": first_name,
            "lastName": last_name,
            "graduationYear": grad_year,
            "degree": str(row.get("Degree_Earned", "B.Tech")),
            "branch": str(row.get("Major_Academic_Program", "Computer Science")),
            "company": str(row.get("Current_Company", "Tech Corp")),
            "role": job_title if job_title else "Software Engineer",
            "email": str(row.get("Email_Address", f"{first_name.lower()}.{last_name.lower()}@alumni.edu")),
            "phone": str(row.get("Phone_Number", "")),
            "consent": bool(row.get("Brochure_Feature_Consent", True)),
            "skills": skills,
            "experienceYears": experience_years,
            "location": "Bangalore, India",
            "linkedin": f"https://linkedin.com/in/{first_name.lower()}-{last_name.lower()}",
            "availableForMentorship": bool(idx % 3 != 0)  # ~67% available
        }
        alumni_list.append(alumni_item)
        
    out_path = os.path.join(PROCESSED_DIR, "alumni.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(alumni_list, f, indent=2)
    print(f"Saved {len(alumni_list)} alumni to {out_path}")


def process_jobs():
    print("Processing Job Postings Data...")
    jobs_list = []
    
    # 1. linkedin_job_postings_dataset.csv
    linkedin_path = os.path.join(RAW_DIR, "linkedin_job_postings_dataset.csv")
    if os.path.exists(linkedin_path):
        df_li = pd.read_csv(linkedin_path)
        for idx, row in df_li.iterrows():
            skills_raw = str(row.get("skills_required", ""))
            skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
            
            jobs_list.append({
                "id": str(row.get("job_id", f"JOB_LI_{idx+1:04d}")),
                "title": str(row.get("job_title", "Software Developer")),
                "company": str(row.get("company", "Tech Enterprise")),
                "location": str(row.get("location", "Remote")),
                "employmentType": str(row.get("employment_type", "Full-time")),
                "experienceLevel": str(row.get("experience_level", "Mid-Senior level")),
                "industry": str(row.get("industry", "Technology")),
                "skills": skills,
                "salaryMin": float(row.get("salary_min_usd", 60000)) if not pd.isna(row.get("salary_min_usd")) else 50000,
                "salaryMax": float(row.get("salary_max_usd", 120000)) if not pd.isna(row.get("salary_max_usd")) else 100000,
                "remoteAllowed": bool(row.get("remote_allowed", False)),
                "postedDate": str(row.get("posted_date", "2026-03-01")),
                "source": "LinkedIn"
            })
            
    # 2. job_data.csv
    job_data_path = os.path.join(RAW_DIR, "job_data.csv")
    if os.path.exists(job_data_path):
        df_jd = pd.read_csv(job_data_path)
        for idx, row in df_jd.iterrows():
            hard_skills = [s.strip() for s in str(row.get("Hard Skills", "")).split(",") if s.strip()]
            soft_skills = [s.strip() for s in str(row.get("Soft Skills", "")).split(",") if s.strip()]
            all_skills = list(set(hard_skills + soft_skills))
            
            exp_str = str(row.get("Years of Experience", "0-2"))
            jobs_list.append({
                "id": str(row.get("Job ID", f"JOB_JD_{idx+1:04d}")),
                "title": str(row.get("Job Title", "Associate Engineer")),
                "company": "Global Technology Partners",
                "location": "Bangalore / Hybrid",
                "employmentType": "Full-time",
                "experienceLevel": f"{exp_str} years",
                "industry": str(row.get("Industry", "Information Technology")),
                "skills": all_skills,
                "salaryMin": 45000,
                "salaryMax": 95000,
                "remoteAllowed": True,
                "postedDate": "2026-03-10",
                "source": "JobData"
            })
            
    out_path = os.path.join(PROCESSED_DIR, "jobs.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(jobs_list, f, indent=2)
    print(f"Saved {len(jobs_list)} jobs to {out_path}")


def process_courses():
    print("Processing Coursera Courses Data...")
    coursera_path = os.path.join(RAW_DIR, "coursera_courses.csv")
    if not os.path.exists(coursera_path):
        print(f"File not found: {coursera_path}")
        return
        
    df = pd.read_csv(coursera_path)
    courses_list = []
    
    for idx, row in df.iterrows():
        skills_raw = str(row.get("course_skills", ""))
        skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
        
        rating = row.get("course_rating")
        try:
            rating = float(rating)
            if np.isnan(rating):
                rating = 4.6
        except:
            rating = 4.6
            
        reviews = row.get("course_reviews_num")
        try:
            reviews = int(reviews) if not np.isnan(reviews) else 1500
        except:
            reviews = 1500
            
        courses_list.append({
            "id": f"CRS_{idx+1:05d}",
            "title": str(row.get("course_title", "Foundations of Computer Science")),
            "organization": str(row.get("course_organization", "Coursera")),
            "certificateType": str(row.get("course_certificate_type", "Specialization")),
            "time": str(row.get("course_time", "1-3 Months")),
            "rating": round(rating, 2),
            "reviewsCount": reviews,
            "difficulty": str(row.get("course_difficulty", "Intermediate")),
            "url": str(row.get("course_url", "https://www.coursera.org")),
            "studentsEnrolled": str(row.get("course_students_enrolled", "50,000+")),
            "skills": skills,
            "summary": str(row.get("course_summary", "")),
            "description": str(row.get("course_description", ""))[:300]
        })
        
    out_path = os.path.join(PROCESSED_DIR, "courses.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(courses_list, f, indent=2)
    print(f"Saved {len(courses_list)} courses to {out_path}")


def process_careers():
    print("Processing Career Taxonomy Data...")
    career_path = os.path.join(RAW_DIR, "career_dataset.csv")
    if not os.path.exists(career_path):
        print(f"File not found: {career_path}")
        return
        
    df = pd.read_csv(career_path)
    careers_list = []
    
    for idx, row in df.iterrows():
        skills_raw = str(row.get("Skills_required", ""))
        skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
        
        careers_list.append({
            "id": str(row.get("ID_num", f"CAR_{idx+1:04d}")),
            "title": str(row.get("job_title", "Software Engineer")),
            "description": str(row.get("Short_description", "")),
            "skills": skills,
            "industry": str(row.get("Industry", "Information Technology")),
            "payGrade": str(row.get("Pay_grade", "Tier 1"))
        })
        
    out_path = os.path.join(PROCESSED_DIR, "careers.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(careers_list, f, indent=2)
    print(f"Saved {len(careers_list)} careers to {out_path}")


if __name__ == "__main__":
    process_alumni()
    process_jobs()
    process_courses()
    process_careers()
    print("Dataset preprocessing complete!")
