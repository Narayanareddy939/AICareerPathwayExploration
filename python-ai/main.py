"""
AI Carrier — Python Flask AI Engine
Uses Google Gemini API to generate structured career recommendations and chatbot responses.
Run: python main.py
Requires: pip install -r requirements.txt
"""

import os
import json
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv('PORT', 8000))
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# ─────────────────────────────────────────────────────
#  Gemini AI REST Client Setup
# ─────────────────────────────────────────────────────
import requests

if GEMINI_API_KEY and GEMINI_API_KEY != 'your_gemini_api_key_here':
    print("✅ Gemini AI REST Client active")
else:
    print("⚠️  GEMINI_API_KEY not set. Using dataset fallback.")


def call_gemini_api(prompt: str) -> str:
    """Call Google Gemini API directly via HTTP REST endpoint."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        res = requests.post(url, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get('candidates', [])
            if candidates:
                parts = candidates[0].get('content', {}).get('parts', [])
                if parts:
                    return parts[0].get('text', '')
        else:
            print(f"Gemini API returned status {res.status_code}: {res.text[:200]}")
    except Exception as e:
        print(f"Gemini API call failed: {e}")
    return None



# ─────────────────────────────────────────────────────
#  Load Datasets
# ─────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_json(filename):
    path = os.path.join(BASE_DIR, 'Datasets', filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

alumni_data = load_json('alumni.json')
students_data = load_json('students.json')
print(f"📦 Loaded {len(alumni_data)} alumni, {len(students_data)} student records")


# ─────────────────────────────────────────────────────
#  Utility: Skill Match Score
# ─────────────────────────────────────────────────────
def compute_similarity(student: dict, alumnus: dict) -> int:
    score = 0

    # Branch match
    s_br = (student.get('branch') or '').lower()
    a_br = (alumnus.get('branch') or '').lower()
    if s_br and a_br:
        if s_br == a_br:
            score += 20
        elif 'cse' in s_br and 'cse' in a_br:
            score += 16
        else:
            score += 5

    # Skill Jaccard similarity
    s_skills = set(sk.strip().lower() for sk in (student.get('skills') or []))
    a_skills = set(sk.strip().lower() for sk in (alumnus.get('skills') or []))
    if s_skills and a_skills:
        inter = s_skills & a_skills
        union = s_skills | a_skills
        score += int((len(inter) / len(union)) * 40)

    # Career goal vs role match
    goal = (student.get('careerGoal') or '').lower()
    role = (alumnus.get('currentRole') or alumnus.get('role') or '').lower()
    domain = (alumnus.get('domain') or '').lower()
    if goal:
        if goal in role or role in goal:
            score += 25
        elif goal in domain or domain in goal:
            score += 18
        else:
            score += 8
    else:
        score += 12

    # CGPA match
    try:
        s_cgpa = float(student.get('cgpa') or 8.0)
        a_cgpa = float(alumnus.get('cgpa') or alumnus.get('cgpaAtGraduation') or 8.0)
        diff = abs(s_cgpa - a_cgpa)
        score += 15 if diff <= 0.3 else (10 if diff <= 0.8 else 5)
    except:
        score += 8

    return min(score, 99)


def compute_missing_skills(student_skills, alumni_list):
    """Find skills present in top alumni but missing in student"""
    s_set = set(sk.strip().lower() for sk in student_skills)
    skill_freq = {}
    for a in alumni_list:
        for sk in (a.get('skills') or []):
            if sk.strip().lower() not in s_set:
                skill_freq[sk] = skill_freq.get(sk, 0) + 1
    return sorted(skill_freq, key=skill_freq.get, reverse=True)[:8]


# ─────────────────────────────────────────────────────
#  POST /ai/recommend
# ─────────────────────────────────────────────────────
@app.route('/ai/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    student = data.get('studentProfile', {})

    if not student:
        return jsonify({'error': 'No student profile provided'}), 400

    # Rank all alumni
    ranked = sorted(alumni_data, key=lambda a: compute_similarity(student, a), reverse=True)
    top5 = ranked[:5]

    match_score = compute_similarity(student, top5[0]) if top5 else 70
    salaries = [a.get('salaryLPA', a.get('salary', 600000) / 100000) for a in top5]
    min_sal = round(min(salaries), 1) if salaries else 5.5
    max_sal = round(max(salaries), 1) if salaries else 10.0

    student_skills = student.get('skills') or []
    missing_skills = compute_missing_skills(student_skills, top5)
    career_goal = student.get('careerGoal', 'Software Engineer')

    # Placement readiness
    readiness = min(int(
        match_score * 0.5 +
        (float(student.get('cgpa') or 7) / 10) * 20 +
        min(len(student_skills) * 2, 20) +
        (10 if student.get('resumePath') else 0)
    ), 99)

    recommended_roles = list({a.get('currentRole') or a.get('role') for a in top5 if a.get('currentRole') or a.get('role')})[:4]

    # Roadmap
    role_lower = career_goal.lower()
    if 'data' in role_lower or 'ai' in role_lower or 'ml' in role_lower:
        roadmap = [
            {'phase': 'Phase 1 (Month 1-2)', 'title': 'Python & SQL Foundation', 'skillsToLearn': ['Python', 'Pandas', 'SQL'], 'duration': '2 months'},
            {'phase': 'Phase 2 (Month 3-4)', 'title': 'Machine Learning Core', 'skillsToLearn': ['Scikit-Learn', 'Feature Engineering', 'Power BI'], 'duration': '2 months'},
            {'phase': 'Phase 3 (Month 5-6)', 'title': 'Deep Learning & MLOps', 'skillsToLearn': ['PyTorch', 'TensorFlow', 'Docker'], 'duration': '2 months'},
            {'phase': 'Phase 4 (Month 7+)', 'title': 'Portfolio & Interview Prep', 'skillsToLearn': ['System Design', 'Kaggle', 'MLOps'], 'duration': 'Ongoing'},
        ]
    else:
        roadmap = [
            {'phase': 'Phase 1 (Month 1-2)', 'title': 'Web Fundamentals', 'skillsToLearn': ['HTML', 'CSS', 'JavaScript'], 'duration': '2 months'},
            {'phase': 'Phase 2 (Month 3-4)', 'title': 'React & APIs', 'skillsToLearn': ['React', 'REST API', 'Git'], 'duration': '2 months'},
            {'phase': 'Phase 3 (Month 5-6)', 'title': 'Backend & Cloud', 'skillsToLearn': ['Node.js', 'MongoDB', 'Docker', 'AWS'], 'duration': '2 months'},
            {'phase': 'Phase 4 (Month 7+)', 'title': 'Capstone & Deployment', 'skillsToLearn': ['CI/CD', 'System Design'], 'duration': 'Ongoing'},
        ]

    higher_studies = (
        f"With CGPA {student.get('cgpa', 7.5)}, consider GATE (IIT/NIT MTech) or GRE (MS in USA/Germany). "
        "Pursue after 2-3 years of experience for MBA from IIMs."
    )

    # Generate Gemini summary if available
    prompt = f"""
You are an AI career counselor for engineering students in India.

Student Profile:
- Name: {student.get('fullName', 'Student')}
- Branch: {student.get('branch', 'CSE')}
- CGPA: {student.get('cgpa', 8.0)}
- Skills: {', '.join(student_skills[:10])}
- Career Goal: {career_goal}

Top Alumni Match: {top5[0].get('name', 'Alumnus')} at {top5[0].get('currentCompany', 'Company')} ({match_score}% match)
Missing Skills: {', '.join(missing_skills[:5])}

Write a 3-sentence personalized career insight summary. Be direct, motivating, and specific.
"""
    gemini_summary = call_gemini_api(prompt)
    if not gemini_summary:
        gemini_summary = f"Based on your profile, you have a {match_score}% alignment with {career_goal} roles. Focus on {', '.join(missing_skills[:3])} to boost your match score to 90%+. Connect with alumni at {top5[0].get('currentCompany', 'top companies')} for mentorship and referrals."

    result = {
        'careerMatchScore': match_score,
        'placementReadiness': readiness,
        'predictedRole': recommended_roles[0] if recommended_roles else career_goal,
        'predictedSalaryRange': f'{min_sal} - {max_sal} LPA',
        'targetDomain': top5[0].get('domain', 'Software Engineering') if top5 else 'Software Engineering',
        'recommendedRoles': recommended_roles,
        'missingSkills': missing_skills,
        'recommendedSkills': missing_skills[:4],
        'recommendedCourses': [
            'Python & Machine Learning Specialization',
            'AWS Certified Solutions Architect',
            'Full Stack Web Development Bootcamp',
            'System Design Interview Masterclass'
        ],
        'recommendedProjects': [
            'Resume Screening AI Tool',
            'Student Performance Predictor',
            'Fake News Detection System',
            'Real-time Stock Price Dashboard'
        ],
        'certifications': [
            'Google Data Analytics Professional',
            'AWS Cloud Practitioner',
            'Meta Frontend Developer',
            'IBM AI Engineering'
        ],
        'roadmap': roadmap,
        'matchedAlumni': [
            {'name': a.get('name'), 'company': a.get('currentCompany') or a.get('company'),
             'role': a.get('currentRole') or a.get('role'), 'similarity': compute_similarity(student, a)}
            for a in top5
        ],
        'higherStudiesSuggestion': higher_studies,
        'geminiSummary': gemini_summary or f'Your {match_score}% match score is strong. Bridge {", ".join(missing_skills[:3])} to maximize offer potential.'
    }

    return jsonify(result)


# ─────────────────────────────────────────────────────
#  POST /ai/chat
# ─────────────────────────────────────────────────────
@app.route('/ai/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')
    student = data.get('studentProfile', {})
    recommendation = data.get('recommendation', {})
    history = data.get('history', [])

    if not message:
        return jsonify({'error': 'No message provided'}), 400

    # Build context
    skills = student.get('skills') or []
    goal = student.get('careerGoal') or 'Software Engineer'
    missing = recommendation.get('missingSkills') or ['Docker', 'AWS', 'React']
    match = recommendation.get('careerMatchScore') or 75
    readiness = recommendation.get('placementReadiness') or 70

    card_data = None
    reply = None

    # Try Gemini
    hist_text = "\n".join([f"{'Student' if m['role'] == 'user' else 'AI'}: {m['content']}" for m in history[-6:]])

    prompt = f"""You are an AI career counselor for engineering students in India at a university placement system.

Student Context:
- Name: {student.get('fullName', 'Student')}
- Branch: {student.get('branch', 'CSE')}
- CGPA: {student.get('cgpa', 8.0)}
- Skills: {', '.join(skills[:10])}
- Career Goal: {goal}
- Career Match Score: {match}%
- Placement Readiness: {readiness}%
- Missing Skills: {', '.join(missing[:5])}

Previous Conversation:
{hist_text}

Current Question: {message}

Respond in a helpful, structured manner. Use **bold** for important terms. Be specific about skills, companies, salaries relevant to India's tech job market in 2026. Keep response under 200 words.
"""
    reply = call_gemini_api(prompt)
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


    # Local rule-based fallback
    if not reply:
        msg_lower = message.lower()
        if 'salary' in msg_lower or 'package' in msg_lower or 'lpa' in msg_lower:
            reply = f"Based on your profile, your **predicted salary range** is {recommendation.get('predictedSalaryRange', '6.5 - 10 LPA')}.\n\nFor {goal} roles in 2026:\n• **Entry level**: 5 - 8 LPA\n• **Mid level (2-3 yrs)**: 12 - 20 LPA\n• **Senior (5+ yrs)**: 25 - 40 LPA\n\nBridge **{', '.join(missing[:3])}** gaps to command premium offers."
            card_data = {'careerMatch': match, 'recommendedRoles': recommendation.get('recommendedRoles', [])}
        elif 'skill' in msg_lower or 'learn' in msg_lower or 'roadmap' in msg_lower:
            reply = f"**Your personalized roadmap for {goal}:**\n\n✅ You have: {', '.join(skills[:5]) or 'No skills listed'}\n⚠️ You need: **{', '.join(missing[:4])}**\n\n🚀 Priority: Start with **{missing[0] if missing else 'System Design'}** this week!"
            card_data = {'missingSkills': missing[:4], 'recommendedCourses': recommendation.get('recommendedCourses', [])[:3]}
        elif 'placement' in msg_lower or 'ready' in msg_lower or 'campus' in msg_lower:
            reply = f"**Placement Readiness: {readiness}%**\n\n✅ Strengths: {', '.join(skills[:3]) or 'Build your skillset'}\n📈 Career Match: {match}%\n⚡ Key gaps: {', '.join(missing[:3])}\n\n💡 Connect with alumni mentors for mock interviews!"
            card_data = {'careerMatch': readiness, 'recommendedRoles': recommendation.get('recommendedRoles', [])}
        elif 'project' in msg_lower or 'build' in msg_lower:
            projects = recommendation.get('recommendedProjects') or ['Resume AI Screener', 'Fake News Detector', 'E-Commerce App']
            reply = f"**Top Projects to Build for {goal}:**\n\n" + "\n".join([f"{i+1}. **{p}**" for i, p in enumerate(projects[:4])]) + "\n\n🔗 Deploy on GitHub + Vercel for maximum recruiter visibility!"
            card_data = {'recommendedProjects': projects}
        elif 'higher' in msg_lower or 'ms' in msg_lower or 'mba' in msg_lower or 'gate' in msg_lower:
            reply = recommendation.get('higherStudiesSuggestion') or "Focus on industry placement first. Pursue higher studies after 2-3 years of experience."
        elif 'alumni' in msg_lower or 'mentor' in msg_lower:
            matched = recommendation.get('matchedAlumni') or []
            if matched:
                lines = [f"• **{a['name']}** → {a['role']} @ {a['company']} ({a['similarity']}% match)" for a in matched[:3]]
                reply = "**Alumni with similar profiles:**\n\n" + "\n".join(lines) + "\n\nVisit the Alumni Directory to request mentorship!"
            else:
                reply = "Check the **Alumni Directory** tab to find mentors who match your profile and target role!"
        else:
            reply = f"Hello **{student.get('fullName', 'there')}**! 👋\n\nYour career match score is **{match}%** for **{goal}**.\n\nAsk me about:\n• 💰 Salary expectations\n• 🧠 Skill roadmap & gaps\n• 🏢 Placement readiness\n• 🚀 Projects to build\n• 📚 Higher studies advice\n• 👥 Alumni who match your profile"
            card_data = {'careerMatch': match, 'recommendedRoles': recommendation.get('recommendedRoles', [])}

    return jsonify({'reply': reply, 'cardData': card_data})


# ─────────────────────────────────────────────────────
@app.route('/', methods=['GET', 'HEAD'])
def index():
    return jsonify({
        'status': 'online',
        'service': 'AI Carrier Python Engine',
        'gemini': 'configured' if gemini_model else 'not configured (using fallback)'
    })


@app.route('/health', methods=['GET', 'HEAD'])
def health():
    return jsonify({
        'status': 'ok',
        'gemini': 'configured' if gemini_model else 'not configured (using fallback)',
        'alumni_records': len(alumni_data),
        'student_records': len(students_data)
    })


if __name__ == '__main__':
    print(f"🐍 Python AI Engine starting on http://localhost:{PORT}")
    print(f"   Gemini: {'✅ Active' if gemini_model else '⚠️  Not configured'}")
    is_dev = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=PORT, debug=is_dev)

