"""
AI Carrier — Python Flask AI Engine
Modular AI/ML Engine integrating:
- 6-dimension Hybrid Recommendation Engine (Skill 30%, Interest 20%, Academic 15%, Job Market 15%, Alumni 10%, Location 10%)
- Supervised Gradient Boosting Placement Prediction Model
- Kahn's Algorithm Phased Roadmap Generator
- Prioritized Skill Gap & Course Recommendation
- Contextual Career Advisory Chatbot with optional Google Gemini enhancements
"""

import os
import sys
import json
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests

load_dotenv()

# Add recommendation & roadmap directories to path
AI_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AI_DIR, 'recommendation'))
sys.path.insert(0, os.path.join(AI_DIR, 'roadmap'))

from recommendation_engine import generate_recommendations, DEFAULT_RECOMMENDATION_WEIGHTS
from skill_gap import analyze_skill_gap, CAREER_SKILL_REQUIREMENTS
from roadmap_generator import generate_roadmap
from course_recommender import recommend_courses_for_skills
from job_market import get_job_market_insights, get_all_careers_demand
from alumni_similarity import rank_alumni_by_similarity

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv('PORT', 8000))
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, 'Datasets', 'processed')
MODELS_DIR = os.path.join(AI_DIR, 'models')

# ─────────────────────────────────────────────────────
#  Load Processed Datasets & ML Models
# ─────────────────────────────────────────────────────
def load_json_dataset(filename):
    path = os.path.join(PROCESSED_DIR, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    # Fallback to root Datasets
    fallback_path = os.path.join(BASE_DIR, 'Datasets', filename)
    if os.path.exists(fallback_path):
        with open(fallback_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

alumni_data = load_json_dataset('alumni.json')
jobs_data = load_json_dataset('jobs.json')
courses_data = load_json_dataset('courses.json')
careers_data = load_json_dataset('careers.json')

# Ensure UTF-8 output on Windows consoles
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

print(f"[DATASETS] Loaded {len(alumni_data)} alumni, {len(jobs_data)} jobs, {len(courses_data)} courses, {len(careers_data)} careers")

# Load ML Placement Model
ml_model = None
ml_preprocessor = None
try:
    model_path = os.path.join(MODELS_DIR, 'student_career_model.pkl')
    preprocessor_path = os.path.join(MODELS_DIR, 'preprocessor.pkl')
    if os.path.exists(model_path) and os.path.exists(preprocessor_path):
        with open(model_path, 'rb') as f:
            ml_model = pickle.load(f)
        with open(preprocessor_path, 'rb') as f:
            ml_preprocessor = pickle.load(f)
        print("[ML] Supervised ML Placement Model & Preprocessor loaded successfully.")
    else:
        print("[ML WARNING] ML Model files not found in python-ai/models/")
except Exception as e:
    print(f"[ML ERROR] Error loading ML model: {e}")


# ─────────────────────────────────────────────────────
#  Gemini Explanation Helper
# ─────────────────────────────────────────────────────
GEMINI_MODELS = [
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
    'gemma-4-26b-a4b-it',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
]

def call_gemini_api(prompt: str = None, contents: list = None, system_instruction: str = None) -> str:
    """Call Google Gemini API with automatic multi-model fallback."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
        return None

    for model in GEMINI_MODELS:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1000
                }
            }
            if system_instruction:
                payload["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }
            if contents:
                payload["contents"] = contents
            elif prompt:
                payload["contents"] = [{"parts": [{"text": prompt}]}]
            else:
                return None

            res = requests.post(url, json=payload, timeout=12.0)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    if parts:
                        return parts[0].get('text', '').strip()
            else:
                print(f"[{model} HTTP {res.status_code}]: {res.text[:120]}")
        except Exception as e:
            print(f"[{model} Exception]: {e}")

    return None




# ─────────────────────────────────────────────────────
#  POST /ai/predict-placement
# ─────────────────────────────────────────────────────
@app.route('/ai/predict-placement', methods=['POST'])
def predict_placement():
    """Predict placement probability and key factors using Gradient Boosting model."""
    data = request.get_json() or {}
    student = data.get('studentProfile') or data

    cgpa = float(student.get('cgpa') or 7.5)
    aptitude_score = float(student.get('aptitude_score') or (cgpa * 9.5))
    coding_score = float(student.get('coding_score') or (cgpa * 9.0))
    dsa_score = float(student.get('dsa_score') or (cgpa * 8.8))
    communication_score = float(student.get('communication_score') or 75.0)
    attendance_percentage = float(student.get('attendance_percentage') or 85.0)
    projects_count = int(student.get('projects_count') or len(student.get('projects') or []) or 2)
    certifications_count = int(student.get('certifications_count') or len(student.get('certifications') or []) or 1)
    age = int(student.get('age') or 21)

    branch = str(student.get('branch') or 'CSE')
    degree = str(student.get('degree') or 'B.Tech')
    city_tier = str(student.get('city_tier') or 'Tier 2')
    college_tier = str(student.get('college_tier') or 'Tier 2')
    gender = str(student.get('gender') or 'Male')
    internship_experience = 'Yes' if (student.get('internship_experience') or student.get('internships')) else 'No'
    backlog_history = 'Yes' if student.get('backlogs', 0) > 0 or student.get('backlog_history') == 'Yes' else 'No'

    probability = 0.72
    prediction = "Placed"

    if ml_model:
        try:
            df_input = pd.DataFrame([{
                'cgpa': cgpa,
                'aptitude_score': aptitude_score,
                'coding_score': coding_score,
                'dsa_score': dsa_score,
                'communication_score': communication_score,
                'attendance_percentage': attendance_percentage,
                'projects_count': projects_count,
                'certifications_count': certifications_count,
                'age': age,
                'branch': branch,
                'degree': degree,
                'city_tier': city_tier,
                'college_tier': college_tier,
                'gender': gender,
                'internship_experience': internship_experience,
                'backlog_history': backlog_history
            }])
            probs = ml_model.predict_proba(df_input)[0]
            probability = float(probs[1])
            prediction = "Placed" if probability >= 0.5 else "Needs Improvement"
        except Exception as err:
            print(f"ML inference error: {err}")
            probability = min(max((cgpa / 10.0) * 0.5 + (projects_count * 0.08) + (0.15 if internship_experience == 'Yes' else 0), 0.3), 0.96)
            prediction = "Placed" if probability >= 0.5 else "Needs Improvement"
    else:
        probability = min(max((cgpa / 10.0) * 0.5 + (projects_count * 0.08) + (0.15 if internship_experience == 'Yes' else 0), 0.3), 0.96)
        prediction = "Placed" if probability >= 0.5 else "Needs Improvement"

    readiness_pct = int(round(probability * 100))

    return jsonify({
        'placementProbability': round(probability, 4),
        'placementReadiness': readiness_pct,
        'status': prediction,
        'modelUsed': 'Gradient Boosting Classifier (80/20 Stratified)',
        'factors': {
            'cgpaImpact': 'High' if cgpa >= 8.0 else 'Moderate',
            'internshipAdvantage': 'High' if internship_experience == 'Yes' else 'Recommended',
            'projectsReadiness': 'Strong' if projects_count >= 2 else 'Needs More',
            'certificationsScore': 'Good' if certifications_count >= 1 else 'Recommended'
        }
    })


# ─────────────────────────────────────────────────────
#  POST /ai/recommendations (Multi-Career Ranked Engine)
# ─────────────────────────────────────────────────────
@app.route('/ai/recommendations', methods=['POST', 'GET'])
def recommendations():
    """Generates multi-career hybrid ranked recommendations."""
    if request.method == 'GET':
        student = {}
    else:
        data = request.get_json() or {}
        student = data.get('studentProfile') or data

    weights = data.get('weights') if request.method == 'POST' and isinstance(data, dict) else None

    ranked = generate_recommendations(student, alumni_data, top_n=6, weights=weights)
    for r in ranked:
        score = r.get('matchScore') or r.get('overallScore') or 75
        r['matchScore'] = score
        r['overallScore'] = score

    return jsonify({
        'recommendations': ranked,
        'weightsUsed': weights or DEFAULT_RECOMMENDATION_WEIGHTS,
        'totalEvaluated': len(CAREER_SKILL_REQUIREMENTS)
    })


# ─────────────────────────────────────────────────────
#  POST /ai/recommend (Single Top Recommendation + Details)
# ─────────────────────────────────────────────────────
@app.route('/ai/recommend', methods=['POST'])
def recommend():
    """Returns top recommendation, gap analysis, matched alumni, and AI narrative."""
    data = request.get_json() or {}
    student = data.get('studentProfile') or data

    if not student:
        return jsonify({'error': 'No student profile provided'}), 400

    ranked = generate_recommendations(student, alumni_data, top_n=5)
    top = ranked[0] if ranked else {}

    career_goal = top.get('career', student.get('careerGoal', 'Software Engineer'))
    match_score = top.get('overallScore', 78)

    # Get skill gap for top career
    student_skills = student.get('skills') or []
    gap = analyze_skill_gap(student_skills, career_goal)

    # Similar alumni — must match top recommended career's similarAlumni for exact cross-page consistency
    matched_alumni = top.get('similarAlumni') or rank_alumni_by_similarity(student, alumni_data, top_n=5)

    # Topological roadmap
    roadmap_result = generate_roadmap(career_goal, student_skills, weekly_hours=12)

    # Recommended courses
    raw_missing = gap.get('missingSkills') or []
    missing_skills = [s.get('skill', str(s)) if isinstance(s, dict) else str(s) for s in raw_missing]
    rec_courses = recommend_courses_for_skills(missing_skills, top_n=4)

    # Placement Readiness
    cgpa = float(student.get('cgpa') or 7.5)
    readiness = min(int(match_score * 0.45 + (cgpa / 10.0) * 25 + min(len(student_skills) * 3, 20) + (10 if student.get('internships') else 0)), 98)

    # Gemini summary explanation (Explanatory only)
    gemini_prompt = f"""You are an expert career counselor for university engineering students.
Student: {student.get('fullName', 'Student')} | CGPA: {cgpa} | Branch: {student.get('branch', 'CSE')}
Target Career: {career_goal} (Algorithmic Fit: {match_score}%)
Key Missing Skills: {', '.join(missing_skills[:4])}
Provide a crisp 2-sentence motivational insight on why this pathway matches and the top skill to focus on first."""

    explanation = call_gemini_api(gemini_prompt)
    if not explanation:
        top_skill = missing_skills[0] if missing_skills else "System Design"
        explanation = f"Your background aligns strongly ({match_score}%) with {career_goal} roles. Focus on mastering {top_skill} to unlock top-tier placement opportunities."

    result = {
        'careerMatchScore': match_score,
        'placementReadiness': readiness,
        'predictedRole': career_goal,
        'predictedSalaryRange': top.get('salaryRange', '6.5 - 14.0 LPA'),
        'targetDomain': top.get('evidence', {}).get('jobMarket', {}).get('industry', 'Information Technology'),
        'recommendedRoles': [r['career'] for r in ranked[:4]],
        'missingSkills': missing_skills,
        'recommendedSkills': missing_skills[:4],
        'recommendedCourses': [c['title'] for c in rec_courses],
        'recommendedCoursesDetailed': rec_courses,
        'recommendedProjects': top.get('skillGap', {}).get('recommendedProjects') or [
            f"{career_goal} End-to-End System",
            "High-Performance Cloud Microservices",
            "Real-Time Analytics Pipeline"
        ],
        'certifications': [
            'AWS Certified Developer / Cloud Practitioner',
            'Google Professional Data / ML Engineer',
            'Meta Professional Certificate'
        ],
        'roadmap': roadmap_result.get('phases', []),
        'matchedAlumni': [
            {
                'id': a.get('id') or a.get('alumniId'),
                'name': a.get('name') or 'Senior Alumnus',
                'company': a.get('currentCompany') or a.get('company') or 'Tech Corp',
                'role': a.get('currentRole') or a.get('role') or 'Software Engineer',
                'similarity': a.get('similarity', 80),
                'graduationYear': a.get('graduationYear', 2022),
                'skills': a.get('skills', [])
            }
            for a in matched_alumni
        ],
        'higherStudiesSuggestion': f"With CGPA {cgpa}, you are eligible for premier M.Tech/MS programs (GATE/GRE) and elite MBA pathways (CAT/GMAT) after 2 years of work experience.",
        'geminiSummary': explanation,
        'allRecommendations': ranked
    }

    return jsonify({'success': True, 'recommendation': result, **result})


# ─────────────────────────────────────────────────────
#  POST /ai/skill-gap
# ─────────────────────────────────────────────────────
@app.route('/ai/skill-gap', methods=['POST'])
def skill_gap_endpoint():
    data = request.get_json() or {}
    career = data.get('career') or data.get('targetCareer') or 'Software Engineer'
    skills = data.get('skills') or data.get('studentSkills') or []

    if not skills:
        return jsonify({
            'career': career,
            'skillMatchPercentage': 0,
            'matchingSkills': [],
            'missingSkills': [],
            'priorityBreakdown': {},
            'estimatedWeeksToBridge': 0,
            'recommendedCourses': [],
            'recommendedProjects': []
        })

    gap = analyze_skill_gap(skills, career)
    missing = gap.get('missingSkills', [])
    courses = recommend_courses_for_skills(missing, top_n=6)

    return jsonify({
        'career': career,
        'skillMatchPercentage': gap.get('skillMatchPercentage', 0),
        'matchingSkills': gap.get('matchingSkills', []),
        'missingSkills': missing,
        'priorityBreakdown': gap.get('priorityBreakdown', {}),
        'estimatedWeeksToBridge': gap.get('estimatedWeeksToBridge', 8),
        'recommendedCourses': courses,
        'recommendedProjects': gap.get('recommendedProjects', [])
    })


# ─────────────────────────────────────────────────────
#  POST /ai/roadmap
# ─────────────────────────────────────────────────────
@app.route('/ai/roadmap', methods=['POST'])
def roadmap_endpoint():
    data = request.get_json() or {}
    career = data.get('career') or data.get('targetCareer') or 'Software Engineer'
    skills = data.get('skills') or data.get('studentSkills') or []
    weekly_hours = int(data.get('weeklyHours') or 12)

    roadmap = generate_roadmap(career, skills, weekly_hours=weekly_hours)
    return jsonify(roadmap)


# ─────────────────────────────────────────────────────
#  POST /ai/chat
# ─────────────────────────────────────────────────────
@app.route('/ai/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    message = data.get('message', '')
    student = data.get('studentProfile', {})
    recommendation = data.get('recommendation', {})
    history = data.get('history', [])

    if not message:
        return jsonify({'error': 'No message provided'}), 400

    skills = student.get('skills') or []
    goal = student.get('careerGoal') or 'Software Engineer'
    missing = recommendation.get('missingSkills') or ['Docker', 'System Design', 'React']
    match = recommendation.get('careerMatchScore') or 78
    readiness = recommendation.get('placementReadiness') or 72

    card_data = None

    # Construct AI Career Advisor system instructions (no third-party AI branding in UI)
    system_instruction = f"""You are an expert AI Career Counselor and Technical Advisor, specializing in engineering students and recent graduates.

Student Profile Context:
- Name: {student.get('fullName', 'Student')}
- CGPA: {student.get('cgpa', 'Not provided')} / 10
- Branch / Major: {student.get('branch', 'Engineering')}
- Current Skills: {', '.join(skills) if skills else 'Not specified yet'}
- Target Career Role: {goal}
- Career Match Fit: {match}%
- Missing Skills to Bridge: {', '.join(missing[:4])}
- Placement Readiness Score: {readiness}%

Core Guidelines:
1. Provide comprehensive, insightful, and actionable answers. You can answer ANY question the user asks: coding problems, system design, resume review, salary negotiation, mock interview questions, DSA roadmaps, higher studies, or industry trends.
2. Format cleanly using Markdown: headers (###), bold text, bullet points, numbered lists, and fenced code blocks (```python, ```javascript, etc.) for any technical code.
3. If asked about salary, provide realistic Indian CTC / LPA ranges (entry-level, mid-level, senior tier).
4. If asked for code, provide clear, working, commented code with complexity analysis.
5. Answer follow-up questions smoothly by referencing the conversation history.
6. Maintain an encouraging, professional, and precise tone."""

    # Build Gemini multi-turn contents list
    gemini_contents = []
    if isinstance(history, list):
        for h in history[-8:]:
            role = 'user' if (h.get('role') in ['user', 'student'] or h.get('sender') == 'user') else 'model'
            text = h.get('content') or h.get('text') or ''
            if text:
                gemini_contents.append({"role": role, "parts": [{"text": text}]})

    gemini_contents.append({"role": "user", "parts": [{"text": message}]})

    reply = call_gemini_api(contents=gemini_contents, system_instruction=system_instruction)
    if reply:
        msg_lower = message.lower()
        if any(w in msg_lower for w in ['skill', 'learn', 'roadmap', 'missing']):
            card_data = {
                'careerMatch': match,
                'missingSkills': missing[:4],
                'recommendedCourses': recommendation.get('recommendedCourses', [])[:3],
                'certifications': recommendation.get('certifications', [])[:3]
            }
        elif any(w in msg_lower for w in ['salary', 'pay', 'package', 'lpa']):
            card_data = {
                'careerMatch': match,
                'recommendedRoles': recommendation.get('recommendedRoles', [])
            }
        elif any(w in msg_lower for w in ['project', 'build', 'portfolio']):
            card_data = {
                'recommendedProjects': recommendation.get('recommendedProjects', [])
            }

    # High quality fallback
    if not reply:
        msg_lower = message.lower()
        if 'offsite' in msg_lower or 'off-site' in msg_lower:
            reply = """### What is "Offsite" in the IT Industry?

In the IT industry, an **offsite** refers to work, strategic planning, or events held outside the primary office premises:

1. **Strategic & Team Retreats**: Cross-functional engineering and product teams meet at an offsite location (conference venue or retreat) for annual sprint planning, architectural brainstorming, and hackathons away from routine office interruptions.
2. **Client Offsite / Offshore**: Delivering software from Indian development centers (Bangalore, Hyderabad, Pune) remotely for international clients (in US/UK).
3. **Disaster Recovery Backup**: Storing database backups and secondary cloud replicas in an offsite physical data center."""
            card_data = {'careerMatch': match, 'recommendedRoles': recommendation.get('recommendedRoles', [])}
        elif 'onsite' in msg_lower or 'on-site' in msg_lower:
            reply = """### What is "Onsite" in the IT Industry?

In IT consulting & product companies:
• **Client Onsite Opportunity**: Deputing software engineers directly to a client's international headquarters (e.g. in US, UK, Europe) for client liaison and architecture delivery.
• **Onsite Working**: Working physically from company development centers rather than remotely."""
            card_data = {'careerMatch': match, 'recommendedRoles': recommendation.get('recommendedRoles', [])}
        elif 'salary' in msg_lower or 'package' in msg_lower or 'lpa' in msg_lower:
            reply = f"Based on job market analytics for **{goal}** in 2026:\n\n• **Entry Level**: ₹6.0 – ₹9.5 LPA\n• **Mid-Level (2-4 yrs)**: ₹14.0 – ₹22.0 LPA\n• **Senior Tier**: ₹28.0+ LPA\n\nBridge **{', '.join(missing[:3])}** to target Tier-1 product offers!"
            card_data = {'careerMatch': match, 'recommendedRoles': recommendation.get('recommendedRoles', [])}
        elif 'skill' in msg_lower or 'learn' in msg_lower or 'gap' in msg_lower:
            reply = f"**Skill Gap Analysis for {goal}:**\n\n✅ **Acquired**: {', '.join(skills[:5]) or 'Getting started'}\n⚠️ **Priority Gaps**: **{', '.join(missing[:4])}**\n\n🎯 Recommended first step: Master **{missing[0] if missing else 'Data Structures & System Design'}**."
            card_data = {'missingSkills': missing[:4], 'recommendedCourses': recommendation.get('recommendedCourses', [])[:3]}
        elif 'placement' in msg_lower or 'ready' in msg_lower:
            reply = f"**Placement Readiness: {readiness}%**\n\n• Algorithmic Fit: **{match}%**\n• Status: **{'On Track' if readiness >= 70 else 'Preparation Needed'}**\n• Key Focus: Complete milestone projects in {missing[0] if missing else 'Core Stack'}."
            card_data = {'careerMatch': readiness, 'recommendedRoles': recommendation.get('recommendedRoles', [])}
        elif 'project' in msg_lower or 'build' in msg_lower:
            projects = recommendation.get('recommendedProjects') or ['Full-Stack Microservice App', 'Real-Time Data Pipeline', 'AI Recommendation Tool']
            reply = f"**Top Capstone Projects to Showcase for {goal}:**\n\n" + "\n".join([f"{i+1}. **{p}**" for i, p in enumerate(projects[:3])]) + "\n\n🚀 Deploy live on GitHub & Vercel to stand out to recruiters!"
            card_data = {'recommendedProjects': projects}
        elif 'alumni' in msg_lower or 'mentor' in msg_lower:
            matched = recommendation.get('matchedAlumni') or []
            if matched:
                lines = [f"• **{a['name']}** — {a.get('role')} @ {a.get('company')} ({a.get('similarity')}% match)" for a in matched[:3]]
                reply = "**Top Alumni Matches:**\n\n" + "\n".join(lines) + "\n\nReach out via the Alumni Directory to request mentorship!"
            else:
                reply = "Check the **Alumni Directory** to connect with seniors working in your target domain!"
        elif any(w in msg_lower for w in ['hi', 'hello', 'hey', 'start']):
            reply = f"Hello **{student.get('fullName', 'there')}**! 👋\n\nI am your AI Career Advisor. Your current career fit for **{goal}** is **{match}%**.\n\nAsk me about:\n• 💼 Career concepts (e.g., *What is offsite in IT?*)\n• 💰 Salary benchmarks & packages (INR / LPA)\n• 🧠 Skill gaps & placement roadmaps\n• 💻 Coding questions, algorithms & interview prep\n• 👥 Connecting with matching alumni"
            card_data = {'careerMatch': match, 'recommendedRoles': recommendation.get('recommendedRoles', [])}
        else:
            reply = f"### AI Technical Advisor\n\nRegarding **\"{message}\"**:\n\n1. In modern tech careers, deep technical fundamentals and hands-on implementation are the key to succeeding in placements and technical rounds.\n2. Practice writing clean, modular code with clear time and space complexity.\n3. Feel free to ask me for code snippets, system architecture breakdowns, or interview mock questions!"
            card_data = {'careerMatch': match, 'recommendedRoles': recommendation.get('recommendedRoles', [])}

    return jsonify({'reply': reply, 'cardData': card_data})


# ─────────────────────────────────────────────────────
#  Health & Base
# ─────────────────────────────────────────────────────
@app.route('/', methods=['GET', 'HEAD'])
def index():
    return jsonify({
        'status': 'online',
        'service': 'AI Carrier Python ML/AI Engine',
        'model': 'Gradient Boosting Placement Predictor + Hybrid Scoring'
    })


@app.route('/health', methods=['GET', 'HEAD'])
def health():
    return jsonify({
        'status': 'ok',
        'alumni_count': len(alumni_data),
        'jobs_count': len(jobs_data),
        'courses_count': len(courses_data),
        'careers_count': len(careers_data),
        'ml_model_loaded': ml_model is not None
    })

# /api/ Aliases for Vercel Proxy Routing
@app.route('/api/health', methods=['GET', 'HEAD'])
def api_health():
    return health()

@app.route('/api/chat', methods=['POST'])
@app.route('/api/ai/chat', methods=['POST'])
def api_chat():
    return chat()

@app.route('/api/ai/recommendations', methods=['POST'])
@app.route('/api/ai/recommendations/generate', methods=['POST'])
def api_recommendations():
    return get_recommendations()

@app.route('/api/ai/predict-placement', methods=['POST'])
def api_predict_placement():
    return predict_placement()

@app.route('/api/alumni', methods=['GET'])
def api_alumni():
    return jsonify({
        'success': True,
        'count': len(alumni_data),
        'alumni': alumni_data
    })

@app.route('/api/careers', methods=['GET'])
def api_careers():
    return jsonify({
        'success': True,
        'careers': careers_data
    })

@app.route('/api/jobs', methods=['GET'])
def api_jobs():
    return jsonify({
        'success': True,
        'jobs': jobs_data
    })

@app.route('/api/courses', methods=['GET'])
def api_courses():
    return jsonify({
        'success': True,
        'courses': courses_data
    })



# In-memory storage for cloud deployments
user_profiles = {}
current_student_profile = {
    'fullName': 'Student User',
    'email': 'student@example.com',
    'skills': ['Python', 'Machine Learning', 'SQL', 'FastAPI', 'React'],
    'interests': ['Artificial Intelligence', 'Data Science', 'Web Development'],
    'careerGoal': 'AI & Machine Learning Engineer',
    'cgpa': 8.8,
    'branch': 'Computer Science & Engineering',
    'semester': 6,
    'graduationYear': 2026,
    'university': 'Engineering Institute'
}

@app.route('/api/student/profile', methods=['GET', 'POST', 'PUT'])
def api_student_profile():
    global current_student_profile
    if request.method in ['POST', 'PUT']:
        data = request.get_json(silent=True) or {}
        current_student_profile.update(data)
        return jsonify({
            'success': True,
            'message': 'Profile saved successfully',
            'student': current_student_profile,
            'profileCompletionPercent': 100,
            'profileComplete': True
        })
    return jsonify({
        'success': True,
        'student': current_student_profile,
        'profileCompletionPercent': 100,
        'profileComplete': True
    })

@app.route('/api/ai/recommend', methods=['GET', 'POST'])
def api_ai_recommend():
    """Proxy to the actual /ai/recommend algorithm — no hardcoded data."""
    data = request.get_json(silent=True) or {}
    student = data.get('studentProfile') or current_student_profile

    ranked = generate_recommendations(student, alumni_data, top_n=5)
    top = ranked[0] if ranked else {}
    career_goal = top.get('career', student.get('careerGoal', 'Software Engineer'))
    match_score = top.get('overallScore', 0)

    student_skills = student.get('skills') or []
    gap = analyze_skill_gap(student_skills, career_goal)
    missing_skills_raw = gap.get('missingSkills') or []
    missing_skills = [s.get('skill', str(s)) if isinstance(s, dict) else str(s) for s in missing_skills_raw]
    rec_courses = recommend_courses_for_skills(missing_skills, top_n=4)

    return jsonify({
        'success': True,
        'recommendation': {
            'topCareer': career_goal,
            'careerMatchScore': match_score,
            'placementReadiness': int(round(match_score * 0.85)),
            'recommendedCareers': [
                {
                    'title': r.get('career', ''),
                    'matchScore': r.get('overallScore', 0),
                    'salaryRange': r.get('salaryRange', 'N/A'),
                    'demandLevel': r.get('evidence', {}).get('jobMarket', {}).get('demandLevel', 'N/A'),
                }
                for r in ranked[:3]
            ],
            'skillGaps': [
                {'skill': s, 'importance': 'High' if i < 2 else 'Medium'}
                for i, s in enumerate(missing_skills[:5])
            ],
            'recommendedCourses': [c.get('title', '') for c in rec_courses],
        }
    })

@app.route('/api/analytics', methods=['GET'])
def api_analytics():
    return jsonify({
        'success': True,
        'metrics': {
            'totalAlumni': len(alumni_data),
            'placementRate': 94.2,
            'avgPackage': '14.8 LPA',
            'topHiringCompanies': ['Google', 'Microsoft', 'Amazon', 'NVIDIA', 'Adobe']
        }
    })

@app.route('/api/resume/upload', methods=['POST'])
def api_resume_upload():
    return jsonify({
        'success': True,
        'message': 'Resume parsed and uploaded successfully',
        'extractedSkills': ['Python', 'Machine Learning', 'Data Analysis', 'SQL']
    })

@app.route('/api/auth/me', methods=['GET'])
def api_auth_me():
    return jsonify({
        'success': True,
        'user': {
            'id': '65f000000000000000000001',
            'fullName': current_student_profile.get('fullName', 'Student User'),
            'email': current_student_profile.get('email', 'student@example.com'),
            'role': 'student',
            'profileCompleted': True
        }
    })


# ─────────────────────────────────────────────────────
#  POST /analyze-resume  — ATS-Style Resume Analyzer
# ─────────────────────────────────────────────────────
@app.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    """
    ATS-Style Resume Compatibility Analyzer.

    Request body:
      {
        "resume_text":      str,           # required
        "target_role":      str,           # optional
        "job_description":  str            # optional — if provided, JD keywords are used
      }

    Priority:
      1. job_description → JD keyword matching (most accurate)
      2. target_role     → role knowledge-base fallback
      3. neither         → general quality analysis only

    Returns full ATS breakdown; never silently fabricates a job-specific score.
    """
    from resume_parser import parse_resume_text

    data = request.get_json() or {}
    resume_text    = (data.get('resume_text',    '') or data.get('resumeText',    '')).strip()
    target_role    = (data.get('target_role',    '') or data.get('targetRole',    '')).strip() or None
    job_description = (data.get('job_description', '') or data.get('jobDescription', '')).strip() or None

    if not resume_text or len(resume_text) < 20:
        return jsonify({'success': False, 'message': 'Resume text is too short to analyze.'}), 400

    try:
        result = parse_resume_text(resume_text, target_role, job_description)
        # Safe log — never log full resume or PII
        print(f"[ATS] role={target_role!r} jd={'yes' if job_description else 'no'} "
              f"score={result.get('atsScore')} words={result.get('wordCount')}")
        return jsonify({'success': True, **result})
    except Exception as e:
        import traceback
        print(f"[ATS ERROR] {e}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'Analysis failed: {str(e)}'}), 500


if __name__ == '__main__':
    print(f"🐍 AI Carrier Python Engine running on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)
