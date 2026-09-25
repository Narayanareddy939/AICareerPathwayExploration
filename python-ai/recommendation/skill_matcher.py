"""
skill_matcher.py
Normalizes raw skill strings against a canonical skill taxonomy.
Handles aliases, abbreviations, case/spacing variations, fuzzy matching.
"""

import re
from difflib import SequenceMatcher

# ─────────────────────────────────────────────────────────────────────────────
#  Canonical Skill Taxonomy with Aliases
#  Format: "canonical_name": [alias1, alias2, ...]
# ─────────────────────────────────────────────────────────────────────────────
SKILL_TAXONOMY = {
    # Programming Languages
    "Python": ["python3", "py", "python 3", "python programming"],
    "JavaScript": ["js", "java script", "javascript es6", "es6", "ecmascript", "node js", "nodejs"],
    "TypeScript": ["ts", "type script"],
    "Java": ["java programming", "core java", "java se", "java ee"],
    "C++": ["cpp", "c plus plus", "c/c++"],
    "C#": ["csharp", "c sharp", "dotnet c#"],
    "Go": ["golang", "go lang"],
    "Rust": ["rust lang", "rust programming"],
    "PHP": ["php programming"],
    "Ruby": ["ruby on rails", "ror"],
    "Swift": ["swift programming", "swiftui"],
    "Kotlin": ["kotlin programming"],
    "R": ["r programming", "r language"],
    "Scala": ["scala programming"],
    "MATLAB": ["matlab programming"],

    # Web Frontend
    "React": ["reactjs", "react.js", "react js", "react hooks", "react 18", "react 19"],
    "Angular": ["angularjs", "angular.js", "angular js", "angular 2+"],
    "Vue.js": ["vue", "vuejs", "vue js", "vue 3"],
    "Next.js": ["nextjs", "next js"],
    "HTML": ["html5", "html 5", "html/css"],
    "CSS": ["css3", "css 3", "css/html", "stylesheets"],
    "Tailwind CSS": ["tailwind", "tailwindcss"],
    "Bootstrap": ["bootstrap css", "bootstrap 5"],
    "Redux": ["redux toolkit", "react redux"],
    "jQuery": ["jquery js"],

    # Backend & APIs
    "Node.js": ["nodejs", "node js", "express.js", "expressjs"],
    "Express.js": ["express", "expressjs", "express js"],
    "Django": ["django rest", "django framework"],
    "Flask": ["flask python", "flask api"],
    "FastAPI": ["fast api"],
    "Spring Boot": ["spring", "spring framework", "spring mvc"],
    "REST API": ["rest", "restful", "restful api", "rest apis", "api design", "web api"],
    "GraphQL": ["graphql api"],
    "gRPC": ["grpc"],

    # Databases
    "SQL": ["mysql", "postgresql", "sqlite", "sql server", "tsql", "pl/sql", "oracle sql", "rdbms"],
    "MongoDB": ["mongo", "mongo db", "nosql mongodb"],
    "PostgreSQL": ["postgres", "postgresql db"],
    "MySQL": ["mysql db"],
    "Redis": ["redis cache"],
    "Elasticsearch": ["elastic search", "elk stack"],
    "Firebase": ["firebase db", "firestore"],

    # Cloud & DevOps
    "AWS": ["amazon aws", "amazon web services", "aws cloud", "ec2", "s3", "lambda", "aws services"],
    "Azure": ["microsoft azure", "azure cloud"],
    "GCP": ["google cloud", "google cloud platform", "gcp cloud"],
    "Docker": ["docker containers", "containerization", "docker compose"],
    "Kubernetes": ["k8s", "kubernetes orchestration", "kube"],
    "CI/CD": ["cicd", "ci cd", "continuous integration", "continuous deployment", "github actions", "jenkins"],
    "Terraform": ["terraform iac", "infrastructure as code"],
    "Linux": ["unix", "linux os", "bash scripting", "shell scripting", "bash"],

    # Data Science & ML
    "Machine Learning": ["ml", "machine learning algorithms", "supervised learning", "unsupervised learning"],
    "Deep Learning": ["dl", "neural networks", "artificial neural networks", "ann"],
    "Data Science": ["data analytics", "data analysis", "data scientist"],
    "Python Data": ["numpy", "pandas", "scipy"],
    "NumPy": ["numpy arrays", "numerical python"],
    "Pandas": ["pandas dataframes", "data frames"],
    "Scikit-Learn": ["sklearn", "scikit learn", "scikit-learn ml"],
    "TensorFlow": ["tensorflow 2", "tf", "tensorflow keras"],
    "PyTorch": ["pytorch", "torch"],
    "Keras": ["keras api"],
    "NLP": ["natural language processing", "nlp models", "text mining"],
    "Computer Vision": ["cv", "image processing", "opencv"],
    "Data Visualization": ["tableau", "power bi", "matplotlib", "seaborn", "plotly", "d3.js"],
    "Power BI": ["powerbi", "power-bi", "ms power bi"],
    "Tableau": ["tableau desktop", "tableau server"],
    "Spark": ["apache spark", "pyspark", "spark streaming"],
    "Hadoop": ["apache hadoop", "hdfs", "mapreduce"],

    # Mobile
    "React Native": ["react-native", "reactnative"],
    "Flutter": ["flutter dart", "dart flutter"],
    "Android": ["android development", "android sdk"],
    "iOS": ["ios development", "swift ios"],

    # Tools & Practices
    "Git": ["git/github", "github", "gitlab", "bitbucket", "version control", "git version control"],
    "Agile": ["agile methodology", "scrum", "kanban", "jira", "sprint"],
    "System Design": ["distributed systems", "scalability", "high level design", "hld"],
    "Data Structures": ["dsa", "data structures and algorithms", "algorithms"],
    "DSA": ["data structures", "algorithms", "competitive programming"],
    "Problem Solving": ["problem solving skills", "analytical thinking", "critical thinking"],
    "OOP": ["object oriented programming", "object-oriented", "oops"],
    "Microservices": ["microservice architecture", "service oriented", "soa"],
    "Testing": ["unit testing", "integration testing", "test driven development", "tdd", "jest", "pytest"],

    # Cybersecurity
    "Cybersecurity": ["information security", "infosec", "network security", "ethical hacking"],
    "Networking": ["computer networks", "tcp/ip", "network protocols"],

    # Data Engineering
    "ETL": ["etl pipeline", "data pipeline", "data engineering"],
    "Airflow": ["apache airflow", "workflow orchestration"],

    # Other
    "Communication": ["verbal communication", "written communication", "presentation skills"],
    "Leadership": ["team leadership", "people management"],
    "Project Management": ["pm", "project planning"],
}

# Build reverse lookup: alias → canonical
_ALIAS_MAP = {}
for canonical, aliases in SKILL_TAXONOMY.items():
    _ALIAS_MAP[canonical.lower()] = canonical
    for alias in aliases:
        _ALIAS_MAP[alias.lower().strip()] = canonical


def normalize_skill(raw_skill: str) -> str:
    """
    Normalize a raw skill string to its canonical form.
    
    Steps:
    1. Clean and lowercase the input
    2. Exact match against alias map
    3. Fuzzy match if no exact match found
    4. Return cleaned original if no match
    """
    if not raw_skill or not isinstance(raw_skill, str):
        return raw_skill
    
    cleaned = raw_skill.strip()
    lookup = cleaned.lower()
    
    # Step 1: Exact match
    if lookup in _ALIAS_MAP:
        return _ALIAS_MAP[lookup]
    
    # Step 2: Strip common suffixes and try again
    cleaned2 = re.sub(r'\s*(programming|development|skills?|framework|library)\s*$', '', lookup, flags=re.IGNORECASE).strip()
    if cleaned2 in _ALIAS_MAP:
        return _ALIAS_MAP[cleaned2]
    
    # Step 3: Fuzzy match (only if string length > 3)
    if len(cleaned) > 3:
        best_ratio = 0.0
        best_match = None
        for alias, canonical in _ALIAS_MAP.items():
            ratio = SequenceMatcher(None, lookup, alias).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = canonical
        
        if best_ratio >= 0.82:  # Canonical threshold from specification
            return best_match
    
    # Step 4: Return original with proper casing
    return cleaned


def normalize_skills_list(skills: list) -> list:
    """Normalize a list of skill strings, removing duplicates."""
    if not skills:
        return []
    
    normalized = []
    seen = set()
    
    for skill in skills:
        if isinstance(skill, str) and skill.strip():
            norm = normalize_skill(skill.strip())
            if norm and norm.lower() not in seen:
                seen.add(norm.lower())
                normalized.append(norm)
    
    return normalized


def skills_overlap(skills_a: list, skills_b: list) -> dict:
    """
    Calculate skill overlap between two skill lists.
    
    Returns:
        matched: skills in both
        only_a: skills in A but not B
        only_b: skills in B but not A
        jaccard: Jaccard similarity score
    """
    norm_a = set(s.lower() for s in normalize_skills_list(skills_a))
    norm_b = set(s.lower() for s in normalize_skills_list(skills_b))
    
    if not norm_a and not norm_b:
        return {"matched": [], "only_a": [], "only_b": [], "jaccard": 0.0}
    
    intersection = norm_a & norm_b
    union = norm_a | norm_b
    
    return {
        "matched": list(intersection),
        "only_a": list(norm_a - norm_b),
        "only_b": list(norm_b - norm_a),
        "jaccard": round(len(intersection) / len(union), 4) if union else 0.0,
        "overlap_ratio": round(len(intersection) / len(norm_a), 4) if norm_a else 0.0
    }


def get_all_canonical_skills() -> list:
    """Return all canonical skill names."""
    return list(SKILL_TAXONOMY.keys())


def get_skill_category(skill: str) -> str:
    """Get a rough category for a skill based on the taxonomy."""
    canonical = normalize_skill(skill)
    lang_skills = {"Python","JavaScript","TypeScript","Java","C++","C#","Go","Rust","PHP","Ruby","Swift","Kotlin","R","Scala"}
    web_skills = {"React","Angular","Vue.js","Next.js","HTML","CSS","Tailwind CSS","Bootstrap","Redux"}
    backend_skills = {"Node.js","Express.js","Django","Flask","FastAPI","Spring Boot","REST API","GraphQL"}
    data_skills = {"Machine Learning","Deep Learning","Data Science","NumPy","Pandas","Scikit-Learn","TensorFlow","PyTorch","NLP","Computer Vision"}
    db_skills = {"SQL","MongoDB","PostgreSQL","MySQL","Redis","Elasticsearch","Firebase"}
    cloud_skills = {"AWS","Azure","GCP","Docker","Kubernetes","CI/CD","Terraform","Linux"}
    
    if canonical in lang_skills: return "Programming Language"
    if canonical in web_skills: return "Frontend"
    if canonical in backend_skills: return "Backend"
    if canonical in data_skills: return "Data Science / ML"
    if canonical in db_skills: return "Database"
    if canonical in cloud_skills: return "Cloud / DevOps"
    return "General"


if __name__ == "__main__":
    # Quick test
    test_skills = ["JS", "Machine Learning", "ML", "react.js", "AWS Cloud", "DSA", "nosql mongodb", "power-bi"]
    print("Normalization test:")
    for s in test_skills:
        print(f"  '{s}' → '{normalize_skill(s)}'")
    
    overlap = skills_overlap(
        ["Python", "React", "JS", "SQL", "Machine Learning"],
        ["Python", "JavaScript", "MongoDB", "ML", "Docker"]
    )
    print("\nSkill overlap test:")
    print(f"  Matched: {overlap['matched']}")
    print(f"  Jaccard: {overlap['jaccard']}")
