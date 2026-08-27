const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Recommendation = require('../models/Recommendation');
const ChatHistory = require('../models/ChatHistory');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────────────
//  Load datasets for fallback local AI engine
// ─────────────────────────────────────────────────────
let alumniList = [];
try {
  const p = path.join(__dirname, '../../Datasets/alumniData.js');
  if (fs.existsSync(p)) alumniList = require(p);
} catch {}

// Local similarity fallback (same KNN algorithm from existing server)
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
  const cr = (alumnus.currentRole || '').toLowerCase();
  if (tr && cr.includes(tr)) score += 25; else score += 8;
  const diff = Math.abs((student.cgpa || 8) - (alumnus.cgpa || 8));
  score += diff <= 0.3 ? 15 : diff <= 0.8 ? 10 : 5;
  return Math.min(Math.round(score), 99);
}

// ─────────────────────────────────────────────────────
//  POST /api/ai/recommend
// ─────────────────────────────────────────────────────
router.post('/recommend', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Complete your profile first' });
    }

    const PYTHON_URL = process.env.PYTHON_AI_URL;
    let recommendation;

    // Try Python AI Engine first
    if (PYTHON_URL) {
      try {
        const pyRes = await axios.post(`${PYTHON_URL}/ai/recommend`, {
          studentProfile: student.toObject()
        }, { timeout: 15000 });
        recommendation = pyRes.data;
      } catch (pyErr) {
        console.warn('Python AI service unavailable, using local fallback:', pyErr.message);
      }
    }

    // Local fallback KNN engine
    if (!recommendation) {
      const matches = alumniList
        .map(a => ({ a, sim: calculateSimilarity(student.toObject(), a) }))
        .sort((x, y) => y.sim - x.sim);

      const top5 = matches.slice(0, 5);
      const topSals = top5.map(m => m.a.salaryLPA || 6.0);
      const stuSkills = (student.skills || []).map(s => s.toLowerCase());
      const missing = {};
      top5.forEach(({ a }) => {
        (a.skills || []).forEach(sk => {
          if (!stuSkills.includes(sk.toLowerCase())) missing[sk] = (missing[sk] || 0) + 1;
        });
      });
      const missingSkills = Object.keys(missing).sort((a, b) => missing[b] - missing[a]).slice(0, 6);
      const readiness = Math.min(Math.round(
        (top5[0]?.sim || 70) * 0.5 +
        ((student.cgpa || 7) / 10) * 20 +
        Math.min((student.skills?.length || 0) * 2, 20) +
        (student.resumePath ? 10 : 0)
      ), 99);

      recommendation = {
        careerMatchScore: top5[0]?.sim || 75,
        placementReadiness: readiness,
        predictedRole: top5[0]?.a.currentRole || 'Software Engineer',
        predictedSalaryRange: `${Math.min(...topSals)} - ${Math.max(...topSals)} LPA`,
        targetDomain: top5[0]?.a.domain || 'Software Engineering',
        recommendedRoles: [...new Set(top5.map(m => m.a.currentRole || '').filter(Boolean))].slice(0, 4),
        missingSkills,
        recommendedSkills: missingSkills.slice(0, 4),
        recommendedCourses: [
          'Python & Machine Learning by Andrew Ng',
          'AWS Certified Solutions Architect',
          'Full Stack Web Development Bootcamp',
          'System Design Interview Masterclass'
        ],
        recommendedProjects: [
          'Resume Screening AI',
          'Student Performance Predictor',
          'Fake News Detection System',
          'E-Commerce Microservices App'
        ],
        certifications: [
          'Google Data Analytics',
          'AWS Cloud Practitioner',
          'Meta Frontend Developer',
          'IBM AI Engineering'
        ],
        roadmap: [
          { phase: 'Phase 1 (Month 1-2)', title: 'Core Foundation', description: 'Master programming, data structures, and SQL basics.', skillsToLearn: ['Python', 'SQL', 'Git'], duration: '2 months' },
          { phase: 'Phase 2 (Month 3-4)', title: 'Domain Specialization', description: 'Dive deep into your target role technology stack.', skillsToLearn: missingSkills.slice(0, 3), duration: '2 months' },
          { phase: 'Phase 3 (Month 5-6)', title: 'Projects & Cloud', description: 'Build 2 production-grade capstone projects.', skillsToLearn: ['Docker', 'AWS', 'System Design'], duration: '2 months' },
          { phase: 'Phase 4 (Month 7+)', title: 'Industry Readiness', description: 'Mock interviews, resume polish, alumni networking.', skillsToLearn: ['System Design', 'Behavioral Interviews'], duration: 'Ongoing' }
        ],
        matchedAlumni: top5.map(m => ({
          name: m.a.name,
          company: m.a.currentCompany,
          role: m.a.currentRole,
          similarity: m.sim
        })),
        higherStudiesSuggestion: (student.cgpa || 7) >= 8.5
          ? 'With your CGPA you are eligible for top PG programs. Consider GATE, GRE, or MBA from IIMs.'
          : 'Focus on industry placement first. Pursue higher studies after 2-3 years of experience.',
        geminiSummary: `Based on your profile analysis, you have a strong alignment with ${top5[0]?.a.currentRole || 'Software Engineering'} roles. Focus on bridging ${missingSkills.slice(0, 3).join(', ')} skill gaps to reach the 90%+ match tier.`
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

// Get latest recommendation
router.get('/recommend', protect, async (req, res) => {
  try {
    const rec = await Recommendation.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, recommendation: rec });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get recommendation' });
  }
});

// ─────────────────────────────────────────────────────
//  POST /api/ai/chat
// ─────────────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const student = await Student.findOne({ userId: req.user._id });
    const recommendation = await Recommendation.findOne({ userId: req.user._id });
    const PYTHON_URL = process.env.PYTHON_AI_URL;

    // Load existing session
    let session = sessionId ? await ChatHistory.findById(sessionId) : null;
    if (!session) {
      session = new ChatHistory({
        userId: req.user._id,
        title: message.slice(0, 40) + (message.length > 40 ? '...' : ''),
        messages: []
      });
    }

    // Add user message
    session.messages.push({ role: 'user', content: message });

    // Try Python/Gemini AI engine
    let aiReply = null;
    let cardData = null;

    if (PYTHON_URL) {
      try {
        const pyRes = await axios.post(`${PYTHON_URL}/ai/chat`, {
          message,
          studentProfile: student?.toObject() || {},
          recommendation: recommendation?.toObject() || {},
          history: session.messages.slice(-10)
        }, { timeout: 20000 });
        aiReply = pyRes.data.reply;
        cardData = pyRes.data.cardData || null;
      } catch (e) {
        console.warn('Python chat service unavailable, using fallback');
      }
    }

    // Local rule-based fallback chatbot
    if (!aiReply) {
      const msg = message.toLowerCase();
      const stuSkills = (student?.skills || []).join(', ');
      const missingSkills = recommendation?.missingSkills || ['Docker', 'AWS', 'React'];
      const matchScore = recommendation?.careerMatchScore || 75;

      if (msg.includes('salary') || msg.includes('pay') || msg.includes('package')) {
        aiReply = `Based on your profile and alumni data:\n\n• **Your predicted salary range**: ${recommendation?.predictedSalaryRange || '6.5 - 10 LPA'}\n• **Average for ${student?.careerGoal || 'your domain'}**: 8.2 LPA\n• To reach 15+ LPA, bridge these gaps: **${missingSkills.slice(0, 3).join(', ')}**`;
        cardData = { careerMatch: matchScore, missingSkills: missingSkills.slice(0, 3) };
      } else if (msg.includes('skill') || msg.includes('learn') || msg.includes('roadmap')) {
        aiReply = `**Personalized Skill Roadmap for ${student?.careerGoal || 'your target role'}**:\n\n**You have:** ${stuSkills || 'No skills listed yet'}\n**You need:** ${missingSkills.join(', ')}\n\nStart with **${missingSkills[0]}** → then **${missingSkills[1]}** → deploy using **Docker + AWS**.`;
        cardData = { recommendedCourses: recommendation?.recommendedCourses, missingSkills, certifications: recommendation?.certifications };
      } else if (msg.includes('placement') || msg.includes('ready') || msg.includes('campus')) {
        aiReply = `**Placement Readiness Score: ${recommendation?.placementReadiness || 72}%**\n\n✅ Strong areas: ${(student?.skills || []).slice(0, 3).join(', ')}\n⚠️ Improve: ${missingSkills.slice(0, 3).join(', ')}\n\n**Top Companies for you:** ${(recommendation?.matchedAlumni || []).slice(0, 3).map(a => a.company).join(', ')}`;
        cardData = { careerMatch: recommendation?.placementReadiness, recommendedRoles: recommendation?.recommendedRoles };
      } else if (msg.includes('project') || msg.includes('build')) {
        aiReply = `**Recommended Projects for ${student?.careerGoal || 'your role'}:**\n\n${(recommendation?.recommendedProjects || ['Resume Screening AI', 'Fake News Detector', 'E-Commerce App']).map((p, i) => `${i + 1}. **${p}**`).join('\n')}\n\nBuild these on GitHub and deploy on Vercel/AWS to stand out to recruiters.`;
        cardData = { recommendedProjects: recommendation?.recommendedProjects };
      } else if (msg.includes('higher stud') || msg.includes('ms ') || msg.includes('mba') || msg.includes('gate')) {
        aiReply = recommendation?.higherStudiesSuggestion || `With CGPA ${student?.cgpa || 7.5}, your higher studies options:\n• **GATE** → IIT/NIT MTech\n• **GRE** → MS in USA/Germany\n• **MBA** → IIM after 2-3 years work exp\n\nFocus on placement first, higher studies after industry exposure.`;
      } else if (msg.includes('alumni') || msg.includes('mentor') || msg.includes('similar')) {
        const al = (recommendation?.matchedAlumni || []).slice(0, 3);
        aiReply = `**Alumni with similar profiles to you:**\n\n${al.map(a => `• **${a.name}** → ${a.role} @ ${a.company} (${a.similarity}% match)`).join('\n')}\n\nConnect with them through the Alumni Directory tab for 1-on-1 mentorship!`;
      } else {
        aiReply = `Hello **${student?.fullName || req.user.fullName}**! I'm your AI Career Counselor.\n\nYour current career match score is **${matchScore}%** for the role of **${student?.careerGoal || 'Software Engineer'}**.\n\nAsk me about:\n• 💰 **Salary expectations**\n• 🧠 **Skill gap and roadmap**\n• 🏢 **Placement readiness**\n• 🚀 **Projects to build**\n• 📚 **Higher studies options**\n• 👥 **Alumni who match your profile**`;
        cardData = { careerMatch: matchScore, recommendedRoles: recommendation?.recommendedRoles };
      }
    }

    // Add assistant response
    session.messages.push({
      role: 'assistant',
      content: aiReply,
      cardData: cardData || undefined
    });
    session.updatedAt = new Date();
    await session.save();

    res.json({
      success: true,
      reply: aiReply,
      cardData,
      sessionId: session._id,
      sessionTitle: session.title
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, message: 'Chat failed' });
  }
});

// GET /api/ai/history — get all chat sessions
router.get('/history', protect, async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user._id })
      .select('title updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// GET /api/ai/history/:id — get specific session
router.get('/history/:id', protect, async (req, res) => {
  try {
    const session = await ChatHistory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get session' });
  }
});

// DELETE /api/ai/history/:id
router.delete('/history/:id', protect, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Chat session deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
});

// PATCH /api/ai/history/:id/rename
router.patch('/history/:id/rename', protect, async (req, res) => {
  try {
    const { title } = req.body;
    const session = await ChatHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title },
      { new: true }
    );
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to rename session' });
  }
});

module.exports = router;
