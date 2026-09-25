"""
skill_normalizer.py
====================
Canonical skill taxonomy with word-boundary-safe matching.

Key safety rules:
  - "Java" does NOT match "JavaScript"
  - "SQL"  does NOT match "MySQL"
  - "R"    does NOT match "React"
  - All matching uses word-boundary regex
  - Aliases resolve to one canonical name
"""

import re
from typing import Dict, List, Optional, Tuple

# ─────────────────────────────────────────────────────────────────────────────
#  Canonical display names  (canonical_lower → display string)
# ─────────────────────────────────────────────────────────────────────────────
CANONICAL_DISPLAY: Dict[str, str] = {
    "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
    "java": "Java", "c++": "C++", "c#": "C#", "go": "Go", "rust": "Rust",
    "php": "PHP", "ruby": "Ruby", "swift": "Swift", "kotlin": "Kotlin",
    "r": "R", "scala": "Scala", "matlab": "MATLAB", "perl": "Perl",
    "dart": "Dart", "elixir": "Elixir",
    # Frontend
    "react": "React", "angular": "Angular", "vue.js": "Vue.js",
    "next.js": "Next.js", "nuxt.js": "Nuxt.js", "svelte": "Svelte",
    "html": "HTML", "css": "CSS", "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap", "redux": "Redux", "jquery": "jQuery",
    "webpack": "Webpack", "vite": "Vite", "sass": "Sass",
    # Backend
    "node.js": "Node.js", "express.js": "Express.js", "django": "Django",
    "flask": "Flask", "fastapi": "FastAPI", "spring boot": "Spring Boot",
    "laravel": "Laravel", "rails": "Ruby on Rails", "asp.net": "ASP.NET",
    "rest api": "REST API", "graphql": "GraphQL", "grpc": "gRPC",
    "websocket": "WebSocket", "microservices": "Microservices",
    # Databases
    "sql": "SQL", "mysql": "MySQL", "postgresql": "PostgreSQL",
    "sqlite": "SQLite", "mongodb": "MongoDB", "redis": "Redis",
    "elasticsearch": "Elasticsearch", "firebase": "Firebase",
    "cassandra": "Cassandra", "dynamodb": "DynamoDB",
    "sql server": "SQL Server", "snowflake": "Snowflake",
    "bigquery": "BigQuery", "neo4j": "Neo4j",
    # Cloud & DevOps
    "aws": "AWS", "azure": "Azure", "gcp": "GCP", "docker": "Docker",
    "kubernetes": "Kubernetes", "ci/cd": "CI/CD", "terraform": "Terraform",
    "ansible": "Ansible", "jenkins": "Jenkins",
    "github actions": "GitHub Actions", "linux": "Linux",
    "nginx": "Nginx", "prometheus": "Prometheus", "grafana": "Grafana",
    "elk stack": "ELK Stack", "helm": "Helm", "serverless": "Serverless",
    # Data Science & ML
    "machine learning": "Machine Learning", "deep learning": "Deep Learning",
    "data science": "Data Science", "numpy": "NumPy", "pandas": "Pandas",
    "scikit-learn": "Scikit-Learn", "tensorflow": "TensorFlow",
    "pytorch": "PyTorch", "keras": "Keras", "nlp": "NLP",
    "computer vision": "Computer Vision",
    "data visualization": "Data Visualization",
    "power bi": "Power BI", "tableau": "Tableau",
    "matplotlib": "Matplotlib", "seaborn": "Seaborn", "plotly": "Plotly",
    "spark": "Apache Spark", "hadoop": "Hadoop", "statistics": "Statistics",
    "feature engineering": "Feature Engineering", "mlops": "MLOps",
    "xgboost": "XGBoost", "lightgbm": "LightGBM",
    "hugging face": "Hugging Face", "langchain": "LangChain",
    "reinforcement learning": "Reinforcement Learning",
    "time series": "Time Series Analysis",
    # Data Engineering
    "etl": "ETL", "airflow": "Apache Airflow", "kafka": "Apache Kafka",
    "data warehousing": "Data Warehousing", "dbt": "dbt",
    "data modeling": "Data Modeling",
    # Mobile
    "react native": "React Native", "flutter": "Flutter",
    "android": "Android", "ios": "iOS",
    # Tools & Practices
    "git": "Git", "agile": "Agile", "scrum": "Scrum",
    "system design": "System Design", "data structures": "Data Structures",
    "algorithms": "Algorithms", "oop": "OOP", "testing": "Testing",
    "tdd": "TDD", "design patterns": "Design Patterns",
    "api design": "API Design", "devops": "DevOps", "excel": "Excel",
    "figma": "Figma", "jira": "Jira", "postman": "Postman",
    "jupyter": "Jupyter",
    # Security
    "cybersecurity": "Cybersecurity", "networking": "Networking",
    "ethical hacking": "Ethical Hacking",
    "penetration testing": "Penetration Testing",
    "siem": "SIEM", "encryption": "Encryption", "oauth": "OAuth",
    "jwt": "JWT",
    # Soft Skills
    "communication": "Communication", "leadership": "Leadership",
    "problem solving": "Problem Solving", "teamwork": "Teamwork",
    "project management": "Project Management",
    "product management": "Product Management",
    "user research": "User Research", "a/b testing": "A/B Testing",
    "requirements gathering": "Requirements Gathering",
}

# ─────────────────────────────────────────────────────────────────────────────
#  Alias Map  (alias_lower → canonical_lower)
# ─────────────────────────────────────────────────────────────────────────────
ALIAS_MAP: Dict[str, str] = {
    # Python
    "python3": "python", "python 3": "python", "py": "python",
    "python programming": "python",
    # JavaScript — distinct from Java
    "js": "javascript", "ecmascript": "javascript", "es6": "javascript",
    "es2015": "javascript", "vanilla js": "javascript",
    # TypeScript
    "ts": "typescript", "type script": "typescript",
    # Java — NO aliases that could match JavaScript
    "core java": "java", "java se": "java", "java ee": "java",
    "java programming": "java",
    # C++
    "cpp": "c++", "c plus plus": "c++",
    # C#
    "csharp": "c#", "c sharp": "c#", "dotnet": "c#", ".net": "c#",
    # Go
    "golang": "go", "go lang": "go",
    # R — word boundary only; "r language" not "react"
    "r language": "r", "r programming": "r",
    # Spring Boot
    "spring": "spring boot", "spring mvc": "spring boot",
    "spring framework": "spring boot",
    # React (not react native)
    "reactjs": "react", "react.js": "react", "react js": "react",
    "react hooks": "react",
    # React Native
    "reactnative": "react native", "react-native": "react native",
    # Vue.js
    "vue": "vue.js", "vuejs": "vue.js", "vue js": "vue.js", "vue 3": "vue.js",
    # Next.js
    "nextjs": "next.js", "next js": "next.js",
    # Angular
    "angularjs": "angular", "angular js": "angular", "angular 2+": "angular",
    # Tailwind
    "tailwind": "tailwind css", "tailwindcss": "tailwind css",
    # Node.js
    "nodejs": "node.js", "node js": "node.js", "node": "node.js",
    # Express.js
    "express": "express.js", "expressjs": "express.js", "express js": "express.js",
    # FastAPI
    "fast api": "fastapi",
    # REST API
    "rest": "rest api", "restful": "rest api", "restful api": "rest api",
    "rest apis": "rest api", "web api": "rest api", "api": "rest api",
    # SQL — NOT MySQL or PostgreSQL
    "structured query language": "sql", "pl/sql": "sql",
    "t-sql": "sql", "tsql": "sql", "rdbms": "sql",
    # MySQL — separate
    "mysql db": "mysql",
    # PostgreSQL
    "postgres": "postgresql", "postgresql db": "postgresql",
    # MongoDB
    "mongo": "mongodb", "mongo db": "mongodb", "nosql mongodb": "mongodb",
    # Redis
    "redis cache": "redis",
    # Elasticsearch
    "elastic search": "elasticsearch",
    # AWS
    "amazon aws": "aws", "amazon web services": "aws", "aws cloud": "aws",
    "ec2": "aws", "s3": "aws", "lambda": "aws",
    # Azure
    "microsoft azure": "azure", "azure cloud": "azure",
    # GCP
    "google cloud": "gcp", "google cloud platform": "gcp",
    # Docker
    "docker containers": "docker", "containerization": "docker",
    "docker compose": "docker",
    # Kubernetes
    "k8s": "kubernetes", "kube": "kubernetes",
    # CI/CD
    "cicd": "ci/cd", "ci cd": "ci/cd",
    "continuous integration": "ci/cd", "continuous deployment": "ci/cd",
    "continuous delivery": "ci/cd",
    # Linux
    "unix": "linux", "linux os": "linux", "bash": "linux",
    "bash scripting": "linux", "shell scripting": "linux",
    # Machine Learning
    "ml": "machine learning", "supervised learning": "machine learning",
    "unsupervised learning": "machine learning",
    # Deep Learning
    "dl": "deep learning", "neural networks": "deep learning",
    "neural network": "deep learning", "ann": "deep learning",
    # Data Science
    "data analytics": "data science", "data analysis": "data science",
    # NumPy
    "numpy arrays": "numpy", "numerical python": "numpy",
    # Pandas
    "pandas dataframes": "pandas", "data frames": "pandas",
    # Scikit-Learn
    "sklearn": "scikit-learn", "scikit learn": "scikit-learn",
    "scikit": "scikit-learn",
    # TensorFlow
    "tensorflow 2": "tensorflow", "tf": "tensorflow",
    "tensorflow keras": "tensorflow",
    # PyTorch
    "torch": "pytorch",
    # NLP
    "natural language processing": "nlp", "nlp models": "nlp",
    "text mining": "nlp", "text classification": "nlp",
    # Computer Vision
    "cv": "computer vision", "image processing": "computer vision",
    "opencv": "computer vision",
    # Data Visualization
    "data viz": "data visualization",
    # Power BI
    "powerbi": "power bi", "power-bi": "power bi",
    "ms power bi": "power bi", "microsoft power bi": "power bi",
    # Tableau
    "tableau desktop": "tableau", "tableau server": "tableau",
    # Spark
    "apache spark": "spark", "pyspark": "spark",
    # Hadoop
    "apache hadoop": "hadoop", "hdfs": "hadoop",
    # ETL
    "etl pipeline": "etl", "data pipeline": "etl",
    "data engineering": "etl",
    # Airflow
    "apache airflow": "airflow", "workflow orchestration": "airflow",
    # Kafka
    "apache kafka": "kafka",
    # Git
    "git/github": "git", "github": "git", "gitlab": "git",
    "bitbucket": "git", "version control": "git",
    # Agile
    "agile methodology": "agile", "kanban": "agile",
    # Scrum
    "scrum master": "scrum",
    # System Design
    "distributed systems": "system design", "scalability": "system design",
    "high level design": "system design", "hld": "system design",
    # Data Structures
    "dsa": "data structures",
    "data structures and algorithms": "data structures",
    # OOP
    "object oriented programming": "oop", "object-oriented": "oop",
    "oops": "oop",
    # Testing
    "unit testing": "testing", "integration testing": "testing",
    "jest": "testing", "pytest": "testing", "selenium": "testing",
    # TDD
    "test driven development": "tdd",
    # MLOps
    "ml ops": "mlops",
    # Statistics
    "statistical analysis": "statistics", "statistical modeling": "statistics",
    # Excel
    "microsoft excel": "excel", "spreadsheet": "excel",
    # Cybersecurity
    "information security": "cybersecurity", "infosec": "cybersecurity",
    "network security": "cybersecurity", "cyber security": "cybersecurity",
    # Networking
    "computer networks": "networking", "tcp/ip": "networking",
    # Ethical Hacking
    "pen testing": "penetration testing", "pentest": "penetration testing",
    # Hugging Face
    "huggingface": "hugging face", "transformers": "hugging face",
    # Flutter
    "flutter dart": "flutter",
    # Problem Solving
    "problem-solving": "problem solving", "analytical thinking": "problem solving",
    # Communication
    "verbal communication": "communication",
    "written communication": "communication",
    "presentation skills": "communication",
    # Requirements
    "requirement gathering": "requirements gathering",
    # GitHub Actions (as tool, separate from git)
    "github actions ci": "github actions",
}

# ─────────────────────────────────────────────────────────────────────────────
#  Build pre-compiled regex patterns — sorted longest first
# ─────────────────────────────────────────────────────────────────────────────
_PATTERN_LIST: List[Tuple[str, str, re.Pattern]] = []  # (term, canonical_lower, pattern)


def _build_regex(term: str):
    escaped = re.escape(term)
    try:
        # Negative lookbehind/ahead for alphanumeric and +, # (prevents java->javascript)
        return re.compile(
            r'(?<![a-zA-Z0-9_+#\-])' + escaped + r'(?![a-zA-Z0-9_+#\-])',
            re.IGNORECASE
        )
    except re.error:
        return None


def _init():
    global _PATTERN_LIST
    seen: set = set()
    entries = []

    for canonical_lower in CANONICAL_DISPLAY:
        if canonical_lower not in seen:
            seen.add(canonical_lower)
            pat = _build_regex(canonical_lower)
            if pat:
                entries.append((canonical_lower, canonical_lower, pat))

    for alias, canonical_lower in ALIAS_MAP.items():
        if alias not in seen:
            seen.add(alias)
            pat = _build_regex(alias)
            if pat:
                entries.append((alias, canonical_lower, pat))

    # Sort longest term first so "machine learning" beats "learning"
    _PATTERN_LIST = sorted(entries, key=lambda x: -len(x[0]))


_init()


def normalize_term(raw: str) -> str:
    """Normalize raw keyword to canonical_lower. Returns lowercased input if no match."""
    if not raw:
        return ""
    cleaned = raw.strip().lower()
    if cleaned in ALIAS_MAP:
        return ALIAS_MAP[cleaned]
    if cleaned in CANONICAL_DISPLAY:
        return cleaned
    # Strip noise suffixes
    c2 = re.sub(
        r'\s*(programming|development|developer|skills?|framework|library|platform|tool)\s*$',
        '', cleaned
    ).strip()
    if c2 in ALIAS_MAP:
        return ALIAS_MAP[c2]
    if c2 in CANONICAL_DISPLAY:
        return c2
    return cleaned


def display_name(canonical_lower: str) -> str:
    return CANONICAL_DISPLAY.get(canonical_lower, canonical_lower.title())


def extract_skills_with_sections(
    full_text: str,
    sections: Optional[Dict[str, str]] = None
) -> List[Dict]:
    """
    Extract skills from text with section-aware evidence tracking.

    Returns list of:
    {
        "canonical":         "python",
        "display":           "Python",
        "occurrences":       3,
        "sections":          ["skills","experience"],
        "evidence_strength": "high"   # high/medium/low
    }

    Safety: uses word-boundary regex; Java != JavaScript, SQL != MySQL
    """
    if not full_text:
        return []

    text_lower = full_text.lower()
    found: Dict[str, Dict] = {}

    for term, canonical_lower, pattern in _PATTERN_LIST:
        if not pattern.search(text_lower):
            continue

        if canonical_lower in found:
            # Accumulate occurrences for known canonical
            count = len(pattern.findall(text_lower))
            found[canonical_lower]["occurrences"] = min(
                found[canonical_lower]["occurrences"] + count, 8
            )
            continue

        count = min(len(pattern.findall(text_lower)), 8)

        skill_sections = []
        if sections:
            for sec_name, sec_text in sections.items():
                if sec_text and pattern.search(sec_text.lower()):
                    skill_sections.append(sec_name)
        else:
            skill_sections = ["full_text"]

        # Evidence strength
        has_skills_sec = "skills" in skill_sections
        multi_section = len(skill_sections) >= 2
        if has_skills_sec and multi_section:
            strength = "high"
        elif has_skills_sec or multi_section or count >= 3:
            strength = "medium"
        else:
            strength = "low"

        found[canonical_lower] = {
            "canonical":         canonical_lower,
            "display":           display_name(canonical_lower),
            "occurrences":       count,
            "sections":          skill_sections,
            "evidence_strength": strength,
        }

    return list(found.values())


def normalize_keyword_list(raw_list: List[str]) -> List[str]:
    """Normalize a list of raw keywords to unique canonical_lower keys."""
    seen: set = set()
    result = []
    for kw in raw_list:
        n = normalize_term(kw)
        if n and n not in seen:
            seen.add(n)
            result.append(n)
    return result


def get_all_canonical_skills() -> List[str]:
    """Return all canonical display names."""
    return list(CANONICAL_DISPLAY.values())
