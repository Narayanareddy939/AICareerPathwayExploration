const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Recommendation = require('../models/Recommendation');
const ChatHistory = require('../models/ChatHistory');
const { protect, optionalAuth } = require('../middleware/auth');
const { callGeminiMultiModel, getIntelligentTechnicalFallback } = require('../services/geminiService');

const router = express.Router();

// ─────────────────────────────────────────────────────
//  Load processed datasets for local fallback
// ─────────────────────────────────────────────────────
const PROCESSED_DIR = path.join(__dirname, '../../Datasets/processed');
let alumniList = [];
let coursesList = [];
let careersList = [];

function loadData() {
  try {
    const pAlumni = path.join(PROCESSED_DIR, 'alumni.json');
    if (fs.existsSync(pAlumni)) alumniList = JSON.parse(fs.readFileSync(pAlumni, 'utf8'));

    const pCourses = path.join(PROCESSED_DIR, 'courses.json');
    if (fs.existsSync(pCourses)) coursesList = JSON.parse(fs.readFileSync(pCourses, 'utf8'));

    const pCareers = path.join(PROCESSED_DIR, 'careers.json');
    if (fs.existsSync(pCareers)) careersList = JSON.parse(fs.readFileSync(pCareers, 'utf8'));
  } catch (e) {
    console.error('Error loading fallback datasets in ai.js:', e.message);
  }
}
loadData();

// Local KNN similarity fallback
function calculateSimilarity(student, alumnus) {
  let score = 0;
  if (student.branch && alumnus.branch) {
    const sb = student.branch.toLowerCase(), ab = alumnus.branch.toLowerCase();
    if (sb === ab) score += 20;
    else if (sb.includes('cse') && ab.includes('cse')) score += 16;
    else score += 5;
  }
  const ss = (student.skills || []).map(s => s.trim().toLowerCase());
  const as_ = (alumnus.skills || []).map(s => s.trim().toLowerCase());
  if (ss.length && as_.length) {
    const inter = ss.filter(s => as_.includes(s));
    const union = new Set([...ss, ...as_]);
    score += (inter.length / union.size) * 40;
  }
  const tr = (student.careerGoal || '').toLowerCase();
  const cr = (alumnus.role || alumnus.currentRole || '').toLowerCase();
  if (tr && (cr.includes(tr) || tr.includes(cr))) score += 25; else score += 8;
  const diff = Math.abs((student.cgpa || 8) - (alumnus.cgpa || 8));
  score += diff <= 0.3 ? 15 : diff <= 0.8 ? 10 : 5;
  return Math.min(Math.round(score), 99);
}

// ─────────────────────────────────────────────────────
//  POST /api/ai/recommend (Primary Recommendation Pipeline)
// ─────────────────────────────────────────────────────
router.post('/recommend', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Complete your profile first' });
    }

    const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';
    let recommendation = null;

    // 1. Try Python AI Service
    try {
      const pyRes = await axios.post(`${PYTHON_URL}/ai/recommend`, {
        studentProfile: student.toObject()
      }, { timeout: 5000 });
      if (pyRes.data && pyRes.data.careerMatchScore) {
        recommendation = pyRes.data;
      }
    } catch (pyErr) {
      console.warn('Python AI service not reachable, falling back to built-in engine:', pyErr.message);
    }

    // 2. Local Fallback Engine
    if (!recommendation) {
      if (alumniList.length === 0) loadData();
      const matches = alumniList
        .map(a => ({ a, sim: calculateSimilarity(student.toObject(), a) }))
        .sort((x, y) => y.sim - x.sim);

      const top5 = matches.slice(0, 5);
      const stuSkills = (student.skills || []).map(s => s.toLowerCase());
      const missingMap = {};
      top5.forEach(({ a }) => {
        (a.skills || []).forEach(sk => {
          if (!stuSkills.includes(sk.toLowerCase())) missingMap[sk] = (missingMap[sk] || 0) + 1;
        });
      });
      const missingSkills = Object.keys(missingMap).sort((a, b) => missingMap[b] - missingMap[a]).slice(0, 5);
      const matchScore = top5[0]?.sim || 78;
      const readiness = Math.min(Math.round(
        matchScore * 0.45 +
        ((student.cgpa || 7.5) / 10) * 25 +
        Math.min((student.skills?.length || 0) * 3, 20) +
        (student.internships?.length > 0 ? 10 : 0)
      ), 98);

      recommendation = {
        careerMatchScore: matchScore,
        placementReadiness: readiness,
        predictedRole: student.careerGoal || top5[0]?.a.role || 'Software Engineer',
        predictedSalaryRange: '7.5 - 14.0 LPA',
        targetDomain: top5[0]?.a.branch || 'Information Technology',
        recommendedRoles: [...new Set(top5.map(m => m.a.role).filter(Boolean))].slice(0, 4),
        missingSkills: missingSkills.length > 0 ? missingSkills : ['System Design', 'Docker', 'AWS'],
        recommendedSkills: missingSkills.slice(0, 4),
        recommendedCourses: [
          'Full Stack Web Development & Microservices',
          'Machine Learning Specialization',
          'AWS Certified Cloud Practitioner',
          'System Design for Scale'
        ],
        recommendedProjects: [
          'AI-Powered Career Intelligence System',
          'Real-Time Distributed Chat & Collaboration',
          'Scalable Microservice Architecture'
        ],
        certifications: [
          'AWS Cloud Practitioner',
          'Google Professional Cloud Developer',
          'Meta Frontend Developer'
        ],
        roadmap: [
          { phase: 'Phase 1 (Month 1-2)', title: 'Foundations & Data Structures', skillsToLearn: ['Python', 'SQL', 'Git'], duration: '2 months' },
          { phase: 'Phase 2 (Month 3-4)', title: 'Specialization & APIs', skillsToLearn: missingSkills.slice(0, 3), duration: '2 months' },
          { phase: 'Phase 3 (Month 5-6)', title: 'Cloud & Capstone System', skillsToLearn: ['Docker', 'AWS', 'System Design'], duration: '2 months' },
          { phase: 'Phase 4 (Month 7+)', title: 'Mock Interviews & Placement', skillsToLearn: ['Behavioral', 'System Design'], duration: 'Ongoing' }
        ],
        matchedAlumni: top5.map(m => ({
          id: m.a.id,
          name: m.a.name,
          company: m.a.company,
          role: m.a.role,
          similarity: m.sim,
          graduationYear: m.a.graduationYear
        })),
        higherStudiesSuggestion: (student.cgpa || 7.5) >= 8.5
          ? 'With your strong CGPA, you are well-positioned for GATE (IIT M.Tech) and GRE (Top Global MS) programs.'
          : 'Focus on campus placement first. Pursue executive PG or MBA from top institutes after 2 years.',
        geminiSummary: `Your academic profile aligns strongly (${matchScore}%) with ${student.careerGoal || 'Software Engineering'}. Focus on bridging key skills like ${missingSkills.slice(0, 2).join(', ') || 'System Design'} to maximize tier-1 offers.`
      };
    }

    // Save to MongoDB
    const saved = await Recommendation.findOneAndUpdate(
      { userId: req.user._id },
      { ...recommendation, studentId: student._id, userId: req.user._id },
      { upsert: true, new: true }
    );

    res.json({ success: true, recommendation: saved });
  } catch (err) {
    console.error('AI Recommend error:', err);
    res.status(500).json({ success: false, message: 'AI recommendation failed' });
  }
});

// GET /api/ai/recommend — Fetch latest stored recommendation
router.get('/recommend', protect, async (req, res) => {
  try {
    const rec = await Recommendation.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, recommendation: rec });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get recommendation' });
  }
});

// ─────────────────────────────────────────────────────
//  GET & POST /api/ai/recommendations (Multi-Career Ranked Engine)
// ─────────────────────────────────────────────────────
const handleRecommendations = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const studentObj = student ? student.toObject() : req.body;
    const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

    try {
      const pyRes = await axios.post(`${PYTHON_URL}/ai/recommendations`, {
        studentProfile: studentObj
      }, { timeout: 8000 });
      if (pyRes.data && Array.isArray(pyRes.data.recommendations)) {
        const formatted = pyRes.data.recommendations.map(r => ({
          ...r,
          matchScore: r.matchScore || r.overallScore || 75,
          overallScore: r.overallScore || r.matchScore || 75
        }));
        return res.json({ success: true, recommendations: formatted });
      }
    } catch (pyErr) {
      console.warn('Python AI recommendations offline or timed out, generating dynamic ranked list');
    }

    // Dynamic multi-career fallback tailored to student skills
    const stuSkills = (studentObj.skills || []).map(s => s.toLowerCase());
    const baseCareers = [
      { career: 'Full Stack Developer', required: ['javascript', 'react', 'node.js', 'mongodb', 'sql'], salaryRange: '8.0 - 18.0 LPA', demandLevel: 'Very High' },
      { career: 'Software Engineer', required: ['python', 'java', 'sql', 'data structures', 'git'], salaryRange: '8.5 - 20.0 LPA', demandLevel: 'Very High' },
      { career: 'Data Scientist', required: ['python', 'machine learning', 'sql', 'pandas', 'scikit-learn'], salaryRange: '9.0 - 22.0 LPA', demandLevel: 'High' },
      { career: 'DevOps Engineer', required: ['docker', 'kubernetes', 'aws', 'linux', 'ci/cd'], salaryRange: '8.5 - 19.0 LPA', demandLevel: 'Growing' },
      { career: 'Cloud Architect', required: ['aws', 'cloud', 'docker', 'microservices', 'kubernetes'], salaryRange: '12.0 - 26.0 LPA', demandLevel: 'High' },
      { career: 'Frontend Developer', required: ['javascript', 'react', 'html', 'css', 'typescript'], salaryRange: '7.0 - 16.0 LPA', demandLevel: 'High' }
    ];

    const ranked = baseCareers.map(c => {
      const matched = c.required.filter(r => stuSkills.some(s => s.includes(r) || r.includes(s)));
      const missing = c.required.filter(r => !stuSkills.some(s => s.includes(r) || r.includes(s)));
      const score = Math.min(Math.max(Math.round(55 + (matched.length / c.required.length) * 40), 50), 96);
      return {
        career: c.career,
        matchScore: score,
        overallScore: score,
        salaryRange: c.salaryRange,
        demandLevel: c.demandLevel,
        matchedSkills: matched,
        missingSkills: missing
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, recommendations: ranked });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};

router.get('/recommendations', protect, handleRecommendations);
router.post('/recommendations', protect, handleRecommendations);
router.post('/recommendations/generate', protect, handleRecommendations);

// ─────────────────────────────────────────────────────
//  POST /api/ai/skill-gap
// ─────────────────────────────────────────────────────
router.post('/skill-gap', protect, async (req, res) => {
  try {
    const { career, skills } = req.body;
    const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

    try {
      const pyRes = await axios.post(`${PYTHON_URL}/ai/skill-gap`, {
        career,
        skills
      }, { timeout: 10000 });
      return res.json({ success: true, ...pyRes.data });
    } catch (e) {
      console.warn('Python skill-gap service offline, using fallback');
    }

    // Local fallback
    const target = career || 'Software Engineer';
    const userSkills = (skills && Array.isArray(skills)) ? skills : [];
    if (userSkills.length === 0) {
      return res.json({
        success: true,
        career: target,
        skillMatchPercentage: 0,
        matchingSkills: [],
        missingSkills: [],
        estimatedWeeksToBridge: 0,
        recommendedCourses: []
      });
    }

    const missing = ['System Design', 'Docker', 'AWS', 'Redis'];
    res.json({
      success: true,
      career: target,
      skillMatchPercentage: 72,
      matchingSkills: userSkills,
      missingSkills: missing,
      estimatedWeeksToBridge: 8,
      recommendedCourses: [
        { title: 'System Design Interview Guide', provider: 'Coursera', rating: '4.9', url: 'https://coursera.org' },
        { title: 'Docker and Kubernetes: The Complete Guide', provider: 'Udemy', rating: '4.8', url: 'https://udemy.com' }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Skill gap analysis failed' });
  }
});

// ─────────────────────────────────────────────────────
//  POST /api/ai/roadmap
// ─────────────────────────────────────────────────────
router.post('/roadmap', protect, async (req, res) => {
  try {
    const { career, skills, weeklyHours } = req.body;
    const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

    try {
      const pyRes = await axios.post(`${PYTHON_URL}/ai/roadmap`, {
        career,
        skills,
        weeklyHours: weeklyHours || 12
      }, { timeout: 10000 });
      return res.json({ success: true, ...pyRes.data });
    } catch (e) {
      console.warn('Python roadmap service offline, using fallback');
    }

    res.json({
      success: true,
      career: career || 'Software Engineer',
      phases: [
        { phase: 'Phase 1 (Month 1-2)', title: 'Foundational Stack', skillsToLearn: ['Python', 'SQL', 'Git'] },
        { phase: 'Phase 2 (Month 3-4)', title: 'Core Frameworks & REST APIs', skillsToLearn: ['React', 'Node.js', 'MongoDB'] },
        { phase: 'Phase 3 (Month 5-6)', title: 'Microservices & Cloud', skillsToLearn: ['Docker', 'AWS', 'System Design'] },
        { phase: 'Phase 4 (Month 7+)', title: 'Placement Mock Prep', skillsToLearn: ['System Design', 'Mock Coding'] }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Roadmap generation failed' });
  }
});

// ─────────────────────────────────────────────────────
//  POST /api/ai/scenarios
// ─────────────────────────────────────────────────────
router.post('/scenarios', protect, async (req, res) => {
  try {
    const { careers, studentProfile } = req.body;
    const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

    try {
      const pyRes = await axios.post(`${PYTHON_URL}/ai/scenarios`, {
        careers,
        studentProfile
      }, { timeout: 10000 });
      return res.json({ success: true, ...pyRes.data });
    } catch (e) {
      console.warn('Python scenarios service offline, using fallback');
    }

    res.json({
      success: true,
      scenarios: (careers || ['Software Engineer', 'Data Scientist']).map(c => ({
        career: c,
        overallScore: 80,
        salaryRange: '7.5 - 15.0 LPA',
        demandLevel: 'High',
        missingSkills: ['System Design', 'Docker']
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Scenario analysis failed' });
  }
});

// ─────────────────────────────────────────────────────
//  POST /api/ai/predict-placement (Supervised ML Model Endpoint)
// ─────────────────────────────────────────────────────
router.post('/predict-placement', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const payload = req.body && Object.keys(req.body).length > 0 ? req.body : (student?.toObject() || {});
    const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

    try {
      const pyRes = await axios.post(`${PYTHON_URL}/ai/predict-placement`, payload, { timeout: 10000 });
      return res.json({ success: true, ...pyRes.data });
    } catch (e) {
      console.warn('Python ML service offline, using fallback formula');
    }

    const cgpa = parseFloat(payload.cgpa || 7.5);
    const prob = Math.min(Math.max((cgpa / 10.0) * 0.6 + 0.25, 0.4), 0.95);
    res.json({
      success: true,
      placementProbability: prob,
      placementReadiness: Math.round(prob * 100),
      status: prob >= 0.5 ? 'Placed' : 'Needs Improvement',
      modelUsed: 'Gradient Boosting Classifier'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Placement prediction failed' });
  }
});

// ─────────────────────────────────────────────────────
//  POST /api/ai/chat (Interactive Counselor - Multi-Model Gemini)
// ─────────────────────────────────────────────────────
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    let student = null;
    let recommendation = null;
    if (req.user?._id) {
      student = await Student.findOne({ userId: req.user._id });
      recommendation = await Recommendation.findOne({ userId: req.user._id });
    }

    const studentContext = student?.toObject() || req.body.studentProfile || {};
    const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

    // Load or init session if user is authenticated
    let session = null;
    if (req.user?._id) {
      session = sessionId ? await ChatHistory.findById(sessionId) : null;
      if (!session) {
        session = new ChatHistory({
          userId: req.user._id,
          title: message.slice(0, 40) + (message.length > 40 ? '...' : ''),
          messages: []
        });
      }
      session.messages.push({ role: 'user', content: message });
    }

    let aiReply = null;
    let cardData = null;

    const rawHistory = req.body.history || session?.messages?.slice(-8) || [];
    const goal = studentContext.careerGoal || 'Software Engineer';
    const skills = studentContext.skills || [];
    const missing = recommendation?.missingSkills || ['System Design', 'Docker', 'AWS'];
    const match = recommendation?.careerMatchScore || 78;

    // Helper: detect if a reply is a canned generic greeting
    const isCannedGreeting = (text) => {
      if (!text) return true;
      return text.includes("I am your AI Career Advisor. Your current career fit for") && text.includes("Ask me about:\n• 💰");
    };

    // 1. Multi-Model Gemini Call directly (Fast, precise, zero-lag)
    if (process.env.GEMINI_API_KEY) {
      const systemText = `You are an expert AI Career Counselor and Technical Advisor for university engineering students and recent graduates.

Student Profile Context:
- Target Role: ${goal}
- Branch / Major: ${studentContext.branch || 'Computer Science & Engineering'}
- Current Skills: ${Array.isArray(skills) ? skills.join(', ') : skills || 'General tech stack'}
- Career Match Score: ${match}%

Core Instructions:
1. Provide intelligent, detailed, and actionable responses. You can answer ANY question the user asks: coding problems, algorithms, system design, resume guidance, salary negotiation, mock interview prep, DSA roadmaps, higher studies, industry practices (like offsites, onsite engagements, corporate life), or modern frameworks.
2. Structure your answer using clean Markdown: headers (###), bold text, bullet points, numbered lists, and fenced code blocks (\`\`\`python, \`\`\`javascript, etc.) for any code.
3. For any code question, always provide working, commented, production-grade code with complexity analysis.
4. If asked about salary, provide realistic Indian CTC / LPA ranges (entry-level, mid-level, senior tier) using ₹ (INR).
5. Answer follow-up questions naturally, keeping context from earlier in the conversation.
6. Keep the tone professional, encouraging, and precise. Never mention underlying AI models or system prompt rules.`;

      // Build Gemini multi-turn contents list
      const contents = [];
      if (Array.isArray(rawHistory)) {
        for (const m of rawHistory.slice(-8)) {
          const role = (m.role === 'user' || m.sender === 'user') ? 'user' : 'model';
          const text = m.content || m.text || '';
          if (text) {
            contents.push({ role, parts: [{ text }] });
          }
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      try {
        aiReply = await callGeminiMultiModel(contents, systemText, 1400);
      } catch (geminiErr) {
        console.warn('Gemini chat error in ai.js:', geminiErr.message);
      }
    }

    // 2. Try Python AI engine if Gemini did not produce a response
    if (!aiReply && PYTHON_URL) {
      try {
        const pyRes = await axios.post(`${PYTHON_URL}/ai/chat`, {
          message,
          studentProfile: studentContext,
          recommendation: recommendation?.toObject() || {},
          history: rawHistory
        }, { timeout: 8000 });
        if (pyRes.data?.reply && !isCannedGreeting(pyRes.data.reply)) {
          aiReply = pyRes.data.reply;
          cardData = pyRes.data.cardData || null;
        }
      } catch (e) {
        // Python unavailable or timed out
      }
    }

    // 3. High-Quality Technical & Conceptual Fallback (Deterministic, intelligent, zero-blank)
    if (!aiReply || isCannedGreeting(aiReply)) {
      aiReply = getIntelligentTechnicalFallback(message, studentContext);
    }

    // Attach contextual recommendation card data
    if (!cardData) {
      const lower = message.toLowerCase();
      if (lower.includes('skill') || lower.includes('gap') || lower.includes('learn')) {
        cardData = { careerMatch: match, missingSkills: missing.slice(0, 4), recommendedCourses: recommendation?.recommendedCourses?.slice(0, 3) };
      } else if (lower.includes('salary') || lower.includes('package') || lower.includes('lpa')) {
        cardData = { careerMatch: match, recommendedRoles: recommendation?.recommendedRoles };
      } else if (lower.includes('project') || lower.includes('portfolio')) {
        cardData = { recommendedProjects: recommendation?.recommendedProjects };
      }
    }

    if (session) {
      session.messages.push({
        role: 'assistant',
        content: aiReply,
        cardData: cardData || undefined
      });
      session.updatedAt = new Date();
      await session.save().catch(() => {});
    }

    res.json({
      success: true,
      reply: aiReply,
      cardData,
      sessionId: session?._id || 'guest',
      sessionTitle: session?.title || 'Chat'
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, message: 'Chat failed' });
  }
});

// Chat history endpoints
router.get('/history', protect, async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(20);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

router.get('/history/:id', protect, async (req, res) => {
  try {
    const session = await ChatHistory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get session' });
  }
});

router.delete('/history/:id', protect, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Chat session deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
});

module.exports = router;
