require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dns = require('dns');

// DNS configuration to prevent querySrv ECONNREFUSED on Windows
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}


const app = express();
const PORT = process.env.PORT || 5000;
const { callGeminiMultiModel, getIntelligentTechnicalFallback } = require('./services/geminiService');


// ─────────────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─────────────────────────────────────────────────────
//  MongoDB Connection
// ─────────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<username>')) {
    console.warn('⚠️  MongoDB URI not configured. Auth & Profile features require MongoDB Atlas.');
    console.warn('    Set MONGODB_URI in server/.env to enable full functionality.');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Atlas connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('   Running without database — auth routes will be unavailable.');
  }
};
connectDB();

// ─────────────────────────────────────────────────────
//  Load Datasets (for local AI recommendation engine)
// ─────────────────────────────────────────────────────
let alumniList = [];
let studentList = [];

try {
  const processedAlumniPath = path.join(__dirname, '../Datasets/processed/alumni.json');
  if (fs.existsSync(processedAlumniPath)) {
    alumniList = JSON.parse(fs.readFileSync(processedAlumniPath, 'utf8'));
    console.log(`[DATASETS] Loaded ${alumniList.length} alumni from processed/alumni.json`);
  }
} catch (err) {
  console.error('Error loading processed/alumni.json', err.message);
}

if (!alumniList || alumniList.length === 0) {
  try {
    const alumniDataPath = path.join(__dirname, '../Datasets/alumniData.js');
    if (fs.existsSync(alumniDataPath)) {
      alumniList = require(alumniDataPath);
    }
  } catch (err) {}
}

try {
  const studentsJsonPath = path.join(__dirname, '../Datasets/students.json');
  if (fs.existsSync(studentsJsonPath)) {
    studentList = JSON.parse(fs.readFileSync(studentsJsonPath, 'utf8'));
  }
} catch (err) {
  console.error('Error loading students.json', err);
}

// ─────────────────────────────────────────────────────
//  Auth & Feature Routes
// ─────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/careers', require('./routes/careerRoutes'));
app.use('/api/alumni-v2', require('./routes/alumniRoutes'));
app.use('/api/roadmaps', require('./routes/roadmapRoutes'));
app.use('/api/scenarios', require('./routes/scenarioRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/admin-v2', require('./routes/adminRoutes'));

// ─────────────────────────────────────────────────────
//  Legacy Dataset-Powered API Endpoints (no auth required)
// ─────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    alumniCount: alumniList.length,
    studentCount: studentList.length
  });
});

// ── Similarity algorithm ──────────────────────────────
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
  const tr = (student.targetRole || student.careerGoal || '').toLowerCase();
  const cr = (alumnus.currentRole || alumnus.role || '').toLowerCase();
  const dom = (alumnus.domain || '').toLowerCase();
  if (tr) {
    if (cr.includes(tr) || tr.includes(cr)) score += 25;
    else if (dom.includes(tr) || tr.includes(dom)) score += 20;
    else score += 8;
  } else { score += 15; }
  const diff = Math.abs((parseFloat(student.cgpa) || 8) - (parseFloat(alumnus.cgpa || alumnus.cgpaAtGraduation) || 8));
  score += diff <= 0.3 ? 15 : diff <= 0.8 ? 10 : 5;
  return Math.min(Math.round(score), 99);
}

// GET /api/alumni
app.get('/api/alumni', (req, res) => {
  let { search, branch, domain, company, minSalary, higherStudies } = req.query;
  let filtered = [...alumniList];
  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(a => {
      const name = (a.name || '').toLowerCase();
      const role = (a.currentRole || a.role || '').toLowerCase();
      const comp = (a.currentCompany || a.company || '').toLowerCase();
      const dom = (a.domain || '').toLowerCase();
      const br = (a.branch || '').toLowerCase();
      const skills = (a.skills || []).join(' ').toLowerCase();
      return name.includes(q) || role.includes(q) || comp.includes(q) || dom.includes(q) || br.includes(q) || skills.includes(q);
    });
  }
  if (branch) filtered = filtered.filter(a => a.branch?.toLowerCase().includes(branch.toLowerCase()));
  if (domain) filtered = filtered.filter(a => a.domain?.toLowerCase().includes(domain.toLowerCase()));
  if (company) filtered = filtered.filter(a => (a.currentCompany || a.company || '').toLowerCase().includes(company.toLowerCase()));
  if (minSalary) filtered = filtered.filter(a => (a.salaryLPA || a.salary / 100000) >= parseFloat(minSalary));
  if (higherStudies !== undefined) filtered = filtered.filter(a => !!a.higherStudies === (higherStudies === 'true'));
  res.json({ success: true, count: filtered.length, data: filtered });
});

// GET /api/alumni/:id
app.get('/api/alumni/:id', (req, res) => {
  const targetId = req.params.id;
  const alumnus = alumniList.find(a => 
    String(a.id) === targetId || 
    String(a.alumniId) === targetId || 
    String(a._id) === targetId
  );
  if (!alumnus) {
    return res.status(404).json({ success: false, message: 'Alumnus not found' });
  }
  res.json({ success: true, alumnus });
});

// POST /api/alumni/mentorship
app.post('/api/alumni/mentorship', (req, res) => {
  const { alumniId, studentName, note } = req.body;
  const alumnus = alumniList.find(a => 
    String(a.id) === String(alumniId) || 
    String(a.alumniId) === String(alumniId)
  );
  res.json({ 
    success: true, 
    message: `Mentorship request sent to ${alumnus ? alumnus.name : 'Alumnus'}!`, 
    alumnus: alumnus || null 
  });
});

// GET /api/admin/stats
app.get('/api/admin/stats', async (req, res) => {
  let registeredStudents = 0;
  let totalRecommendations = 0;
  try {
    const Student = require('./models/Student');
    const Recommendation = require('./models/Recommendation');
    if (mongoose.connection.readyState === 1) {
      registeredStudents = await Student.countDocuments();
      totalRecommendations = await Recommendation.countDocuments();
    }
  } catch (e) {}

  res.json({
    success: true,
    stats: {
      totalAlumni: alumniList.length,
      registeredStudents,
      totalRecommendations,
      activeJobs: 700,
      mlModelStatus: 'Gradient Boosting (Trained, F1: 0.724)',
      hybridScoringWeights: {
        skillMatch: '30%',
        interestMatch: '20%',
        academicMatch: '15%',
        jobMarket: '15%',
        alumniSimilarity: '10%',
        locationMatch: '10%'
      }
    }
  });
});

// GET /api/students
app.get('/api/students', (req, res) => {
  res.json({ success: true, count: studentList.length, data: studentList });
});

// GET /api/analytics
app.get('/api/analytics', (req, res) => {
  const domainMap = {}, companyMap = {}, skillCountMap = {};
  let totalHigherStudies = 0, totalSalaries = 0, salaryCount = 0;
  alumniList.forEach(a => {
    const sal = a.salaryLPA || (a.salary ? a.salary / 100000 : null);
    if (sal) { totalSalaries += sal; salaryCount++; }
    if (a.higherStudies) totalHigherStudies++;
    const d = a.domain || 'Software Engineering';
    if (!domainMap[d]) domainMap[d] = { count: 0, totalSalary: 0, countSal: 0 };
    domainMap[d].count++; if (sal) { domainMap[d].totalSalary += sal; domainMap[d].countSal++; }
    const c = a.currentCompany || a.company || 'Unknown';
    companyMap[c] = (companyMap[c] || 0) + 1;
    (a.skills || []).forEach(sk => { skillCountMap[sk.trim()] = (skillCountMap[sk.trim()] || 0) + 1; });
  });
  const domainStats = Object.keys(domainMap).map(domain => ({
    domain, count: domainMap[domain].count,
    avgSalary: domainMap[domain].countSal > 0 ? parseFloat((domainMap[domain].totalSalary / domainMap[domain].countSal).toFixed(2)) : 5.0
  })).sort((a, b) => b.avgSalary - a.avgSalary);
  const topCompanies = Object.keys(companyMap).map(name => ({ name, count: companyMap[name] })).sort((a, b) => b.count - a.count).slice(0, 8);
  const topSkills = Object.keys(skillCountMap).map(name => ({ name, count: skillCountMap[name] })).sort((a, b) => b.count - a.count).slice(0, 10);
  const avgSalaryOverall = salaryCount > 0 ? parseFloat((totalSalaries / salaryCount).toFixed(2)) : 6.2;
  res.json({
    success: true,
    summary: {
      totalAlumni: alumniList.length,
      avgSalaryOverall: `${avgSalaryOverall} LPA`,
      placementRate: `${Math.round(((alumniList.length - totalHigherStudies) / alumniList.length) * 100)}%`,
      higherStudiesRate: `${Math.round((totalHigherStudies / alumniList.length) * 100)}%`,
      topDomain: domainStats[0]?.domain || 'Software Development'
    },
    domainStats, topCompanies, topSkills
  });
});

// POST /api/recommend
app.post('/api/recommend', (req, res) => {
  const student = req.body;
  if (!student) return res.status(400).json({ success: false, message: 'Student data required' });
  const studentSkills = (student.skills || []).map(s => s.trim().toLowerCase());
  const matches = alumniList.map(alumnus => ({ alumnus, similarity: calculateSimilarity(student, alumnus) })).sort((a, b) => b.similarity - a.similarity);
  const topMatches = matches.slice(0, 5);
  const topSals = topMatches.map(m => m.alumnus.salaryLPA || 6.0);
  const missingSkillsMap = {};
  topMatches.forEach(({ alumnus }) => {
    (alumnus.skills || []).forEach(sk => {
      if (!studentSkills.includes(sk.trim().toLowerCase())) missingSkillsMap[sk] = (missingSkillsMap[sk] || 0) + 1;
    });
  });
  const missingSkills = Object.keys(missingSkillsMap).sort((a, b) => missingSkillsMap[b] - missingSkillsMap[a]).slice(0, 6);
  res.json({
    success: true, overallMatchScore: topMatches[0]?.similarity || 85,
    targetDomain: topMatches[0]?.alumnus.domain || 'Software Engineering',
    predictedRole: topMatches[0]?.alumnus.currentRole || 'Full Stack Engineer',
    predictedSalaryRange: `${Math.min(...topSals)} - ${Math.max(...topSals)} LPA`,
    averageSalary: `${(topSals.reduce((a,b)=>a+b,0)/topSals.length).toFixed(1)} LPA`,
    missingSkills,
    recommendedCertifications: [...new Set(topMatches.flatMap(m => m.alumnus.certifications || []))].slice(0, 4),
    topMentors: topMatches.map(m => ({
      alumniId: m.alumnus.alumniId, name: m.alumnus.name,
      currentCompany: m.alumnus.currentCompany || m.alumnus.company,
      currentRole: m.alumnus.currentRole || m.alumnus.role,
      branch: m.alumnus.branch, similarity: m.similarity,
      skills: m.alumnus.skills, location: m.alumnus.location, linkedIn: m.alumnus.linkedIn || '#'
    }))
  });
});

// POST /api/roadmap
app.post('/api/roadmap', (req, res) => {
  const { targetRole } = req.body;
  const role = (targetRole || 'Software Engineer').toLowerCase();
  let milestones;
  if (role.includes('data') || role.includes('ai') || role.includes('ml')) {
    milestones = [
      { phase: 'Phase 1 (Month 1-2)', title: 'Python, Math & SQL Mastery', description: 'Master Python data structures, NumPy, Pandas, Linear Algebra, and Advanced SQL.', skillsToLearn: ['Python', 'Pandas', 'NumPy', 'SQL', 'Git'], recommendedCourse: 'Google Data Analytics / DeepLearning.AI' },
      { phase: 'Phase 2 (Month 3-4)', title: 'Machine Learning Core', description: 'Supervised/Unsupervised learning, EDA, Power BI/Tableau visualizations.', skillsToLearn: ['Scikit-Learn', 'Feature Engineering', 'Power BI', 'Tableau'], recommendedCourse: 'ML Specialization by Andrew Ng' },
      { phase: 'Phase 3 (Month 5-6)', title: 'Deep Learning & MLOps', description: 'Neural Networks, Docker-based model deployment, MLflow tracking.', skillsToLearn: ['PyTorch', 'TensorFlow', 'Docker', 'FastAPI', 'MLflow'], recommendedCourse: 'AWS Certified Machine Learning Specialty' },
      { phase: 'Phase 4 (Month 7+)', title: 'Portfolio & Interviews', description: 'Deploy 2 AI apps, Kaggle competitions, system design mock interviews.', skillsToLearn: ['System Design', 'MLOps', 'Model Monitoring'], recommendedCourse: 'Kaggle Competitions & Mock Interviews' }
    ];
  } else {
    milestones = [
      { phase: 'Phase 1 (Month 1-2)', title: 'Web Foundations', description: 'HTML5, Modern CSS, JavaScript ES6+, Git version control.', skillsToLearn: ['JavaScript ES6+', 'HTML5/CSS3', 'Git/GitHub'], recommendedCourse: 'Meta Frontend Developer Certificate' },
      { phase: 'Phase 2 (Month 3-4)', title: 'React & State Management', description: 'React 19 hooks, Context API, REST API integration.', skillsToLearn: ['React', 'Redux Toolkit', 'REST APIs', 'Vite'], recommendedCourse: 'Ultimate React Mastery' },
      { phase: 'Phase 3 (Month 5-6)', title: 'Backend & Database', description: 'Node.js microservices, Express, MongoDB/PostgreSQL, JWT auth.', skillsToLearn: ['Node.js', 'Express.js', 'MongoDB', 'JWT'], recommendedCourse: 'Node.js Developer Bootcamp' },
      { phase: 'Phase 4 (Month 7+)', title: 'Cloud & DevOps', description: 'Docker, AWS, CI/CD GitHub Actions, system design.', skillsToLearn: ['Docker', 'AWS EC2/S3', 'CI/CD'], recommendedCourse: 'AWS Certified Cloud Practitioner' }
    ];
  }
  res.json({ success: true, targetRole, milestones });
});

// POST /api/analyze-resume
app.post('/api/analyze-resume', (req, res) => {
  const { resumeText = '', targetRole = 'Software Engineer' } = req.body;
  const text = resumeText.toLowerCase();
  let score = 50;
  const criticalSections = ['education', 'experience', 'projects', 'skills', 'certifications'];
  const detectedSections = criticalSections.filter(sec => text.includes(sec));
  score += detectedSections.length * 5;
  const techKeywords = ['python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'machine learning', 'api', 'git', 'javascript', 'c++', 'data'];
  const matchedKeywords = techKeywords.filter(kw => text.includes(kw));
  score += Math.min(matchedKeywords.length * 3, 20);
  const actionVerbs = ['developed', 'designed', 'built', 'implemented', 'optimized', 'led', 'created', 'achieved', 'increased', 'reduced'];
  const matchedVerbs = actionVerbs.filter(v => text.includes(v));
  score += Math.min(matchedVerbs.length * 2, 10);
  const finalScore = Math.min(Math.max(score, 45), 98);
  const missingKeywords = techKeywords.filter(kw => !matchedKeywords.includes(kw)).slice(0, 5);
  const suggestions = [];
  const missingSecs = criticalSections.filter(s => !detectedSections.includes(s));
  if (missingSecs.length) suggestions.push(`Add explicit section headers for: ${missingSecs.join(', ').toUpperCase()}`);
  if (matchedVerbs.length < 3) suggestions.push('Use strong action verbs (Developed, Optimized, Engineered) at bullet start.');
  if (missingKeywords.length) suggestions.push(`Add industry terms: ${missingKeywords.join(', ')}.`);
  suggestions.push('Quantify achievements with metrics (e.g., "Improved query performance by 35%").');
  res.json({ success: true, atsScore: finalScore, scoreCategory: finalScore >= 80 ? 'Excellent' : finalScore >= 65 ? 'Good' : 'Needs Improvement', sectionsFound: detectedSections, detectedSkills: matchedKeywords, missingKeywords, suggestions });
});

// POST /api/chat (Public Gemini chatbot - ChatGPT style)
app.post('/api/chat', async (req, res) => {
  const { message = '', studentContext = {}, history = [] } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  let responseText = null;
  const key = process.env.GEMINI_API_KEY;

  if (key) {
    const systemPrompt = `You are an elite AI Career Mentor, Senior Technical Interviewer, Tech Placement Coach, and Career Advisor (operating with the intelligence, empathy, and versatility of ChatGPT) for university students and engineers.

Student Profile Context:
- Target Role / Career: ${studentContext.careerGoal || 'Software Engineer'}
- Major / Branch: ${studentContext.branch || 'Engineering / Computer Science'}
- CGPA: ${studentContext.cgpa || 8.0} / 10
- Known Skills: ${Array.isArray(studentContext.skills) ? studentContext.skills.join(', ') : (studentContext.skills || 'General Tech Stack')}

Core Instructions:
1. Provide a direct, highly intelligent, detailed, and engaging response just like ChatGPT. You can answer ANY topic: coding problems, algorithms, system design, resume critique, salary negotiation, mock interview questions, DSA roadmaps, higher studies, or industry tech trends.
2. Structure your answer using clean GitHub Markdown: headers (###), bold text, bullet points, numbered lists, and fenced code blocks (\`\`\`language ... \`\`\`) for any code.
3. For any code question, always provide working, commented, production-grade code with complexity analysis.
4. If asked about salary, provide realistic Indian CTC / LPA ranges (entry-level, mid-level, senior tier) and negotiation strategies.
5. Answer follow-up questions naturally, keeping track of what was discussed earlier in the conversation.
6. Keep the tone friendly, empowering, and professional.`;

    // Multi-turn contents
    const contents = [];
    if (Array.isArray(history)) {
      for (const m of history.slice(-8)) {
        const role = (m.role === 'user' || m.sender === 'user') ? 'user' : 'model';
        const text = m.content || m.text || '';
        if (text) {
          contents.push({ role, parts: [{ text }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    responseText = await callGeminiMultiModel(contents, systemPrompt, 1200);
  }

  // Never return a canned generic greeting for questions or code!
  if (!responseText) {
    responseText = getIntelligentTechnicalFallback(message, studentContext);
  }

  res.json({ success: true, reply: responseText, timestamp: new Date().toISOString() });
});

// POST /api/mentorship/request
app.post('/api/mentorship/request', (req, res) => {
  const { alumniId, studentName } = req.body;
  const alumni = alumniList.find(a => a.alumniId === alumniId);
  res.json({ success: true, message: `Mentorship request sent to ${alumni ? alumni.name : 'Alumnus'}!`, alumniName: alumni ? alumni.name : 'Alumnus' });
});

// ─────────────────────────────────────────────────────
//  Start Server
// ─────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 AI Carrier Server running on http://localhost:${PORT}`);
    console.log(`   MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected (set MONGODB_URI in .env)'}`);
  });
}

module.exports = app;
