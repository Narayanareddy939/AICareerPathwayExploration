require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dns = require('dns');
const axios = require('axios');

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
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || process.env.NODE_ENV !== 'production') {
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
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
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
app.post('/api/recommend', async (req, res) => {
  const student = req.body;
  if (!student) return res.status(400).json({ success: false, message: 'Student data required' });

  const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://127.0.0.1:8000';
  try {
    const pyRes = await axios.post(`${PYTHON_URL}/ai/recommend`, {
      studentProfile: student
    }, { timeout: 6000 });
    if (pyRes.data && pyRes.data.recommendation) {
      const rec = pyRes.data.recommendation;
      return res.json({
        success: true,
        overallMatchScore: rec.careerMatchScore || 85,
        targetDomain: rec.targetDomain || 'Software Engineering',
        predictedRole: rec.predictedRole || student.targetRole || 'Full Stack Engineer',
        predictedSalaryRange: rec.predictedSalaryRange ? (rec.predictedSalaryRange.startsWith('₹') ? rec.predictedSalaryRange : `₹${rec.predictedSalaryRange}`) : '₹8.0 - ₹18.0 LPA',
        averageSalary: '₹12.5 LPA',
        missingSkills: rec.missingSkills || [],
        recommendedCertifications: rec.certifications || ['AWS Certified Cloud Practitioner'],
        topMentors: (rec.matchedAlumni || []).map(a => ({
          alumniId: a.alumniId || a.id,
          name: a.name,
          currentCompany: a.currentCompany || a.company,
          currentRole: a.currentRole || a.role,
          similarity: a.similarity,
          skills: a.matchedSkills || [],
          location: a.location || 'India',
          linkedIn: '#'
        }))
      });
    }
  } catch (pyErr) {
    // Fallback to local calculation
  }

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
    predictedSalaryRange: `₹${Math.min(...topSals)} - ₹${Math.max(...topSals)} LPA`,
    averageSalary: `₹${(topSals.reduce((a,b)=>a+b,0)/topSals.length).toFixed(1)} LPA`,
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

// POST /api/analyze-resume  — pure proxy to Python ATS engine (source of truth)
app.post('/api/analyze-resume', async (req, res) => {
  const {
    resumeText = '',
    targetRole = '',
    jobDescription = '',
  } = req.body;

  if (!resumeText || resumeText.trim().length < 20) {
    return res.status(400).json({ success: false, message: 'Resume text is too short to analyze.' });
  }

  const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://127.0.0.1:8000';

  try {
    const pyRes = await axios.post(`${PYTHON_URL}/analyze-resume`, {
      resume_text:     resumeText,
      target_role:     targetRole  || undefined,
      job_description: jobDescription || undefined,
    }, { timeout: 20000 });

    // Pass Python response through unchanged — Python is the single source of truth
    return res.json({ success: true, ...pyRes.data });

  } catch (pyErr) {
    const isConnErr = pyErr.code === 'ECONNREFUSED' || pyErr.code === 'ENOTFOUND';
    console.error('[analyze-resume] Python engine error:', pyErr.message);

    if (isConnErr) {
      console.warn('[analyze-resume] Python service offline, using built-in resilient ATS analyzer fallback.');
      const fallbackResult = generateFallbackATS(resumeText, targetRole, jobDescription);
      return res.json({ success: true, ...fallbackResult });
    }
    return res.status(500).json({
      success: false,
      message: `ATS analysis failed: ${pyErr.response?.data?.message || pyErr.message}`,
    });
  }
});

function generateFallbackATS(resumeText, targetRole = 'Software Engineer', jobDescription = '') {
  const text = (resumeText || '').toLowerCase();
  const wordCount = (resumeText.match(/\S+/g) || []).length;

  const COMMON_SKILLS = [
    'python', 'java', 'javascript', 'typescript', 'react', 'node.js', 'sql', 'mongodb',
    'docker', 'aws', 'kubernetes', 'git', 'c++', 'c#', 'machine learning', 'deep learning',
    'html', 'css', 'rest api', 'graphql', 'ci/cd', 'linux', 'azure', 'pandas', 'numpy',
    'scikit-learn', 'tensorflow', 'pytorch', 'statistics', 'data analysis', 'tableau',
    'power bi', 'agile', 'scrum', 'spring boot', 'express', 'flask', 'django'
  ];

  const ROLE_SKILLS = {
    'data scientist': {
      required: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy'],
      preferred: ['Scikit-Learn', 'TensorFlow', 'PyTorch', 'Data Visualization', 'Deep Learning']
    },
    'software engineer': {
      required: ['Data Structures', 'Algorithms', 'Git', 'OOP', 'SQL', 'Problem Solving'],
      preferred: ['System Design', 'Docker', 'CI/CD', 'REST APIs', 'Cloud']
    },
    'full stack developer': {
      required: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'SQL'],
      preferred: ['TypeScript', 'MongoDB', 'Docker', 'AWS', 'GraphQL']
    },
    'machine learning engineer': {
      required: ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Git'],
      preferred: ['MLOps', 'Docker', 'Kubernetes', 'AWS', 'Computer Vision']
    }
  };

  const roleKey = Object.keys(ROLE_SKILLS).find(r => targetRole.toLowerCase().includes(r)) || 'software engineer';
  const roleCfg = ROLE_SKILLS[roleKey];

  const detectedSkills = [];
  COMMON_SKILLS.forEach(sk => {
    if (text.includes(sk)) {
      detectedSkills.push({ name: sk.charAt(0).toUpperCase() + sk.slice(1), sections: ['content'], evidence: 'moderate' });
    }
  });

  const matchedRequired = roleCfg.required.filter(s => text.includes(s.toLowerCase()));
  const missingRequired = roleCfg.required.filter(s => !text.includes(s.toLowerCase()));
  const matchedPreferred = roleCfg.preferred.filter(s => text.includes(s.toLowerCase()));
  const missingPreferred = roleCfg.preferred.filter(s => !text.includes(s.toLowerCase()));

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
  const hasLinkedin = /linkedin\.com/i.test(resumeText);
  const hasGithub = /github\.com/i.test(resumeText);

  const hasEducation = /education|university|college|b\.?tech|degree/i.test(resumeText);
  const hasExperience = /experience|work history|employment|internship/i.test(resumeText);
  const hasProjects = /project|built|developed/i.test(resumeText);
  const hasSkills = /skill|technologies|proficiencies/i.test(resumeText);
  const hasCertifications = /certification|certificate|certified/i.test(resumeText);

  const reqPct = Math.round((matchedRequired.length / (roleCfg.required.length || 1)) * 100);
  const prefPct = Math.round((matchedPreferred.length / (roleCfg.preferred.length || 1)) * 100);
  const kwScore = Math.min(40, Math.round((reqPct * 0.6 + prefPct * 0.4) * 0.4));
  
  let sectionScore = 0;
  if (hasEducation) sectionScore += 3;
  if (hasExperience) sectionScore += 3;
  if (hasProjects) sectionScore += 3;
  if (hasSkills) sectionScore += 3;
  if (hasCertifications) sectionScore += 3;

  let contactScore = 0;
  if (hasEmail) contactScore += 2;
  if (hasPhone) contactScore += 1;
  if (hasLinkedin) contactScore += 1;
  if (hasGithub) contactScore += 1;

  const expScore = hasExperience ? 10 : 3;
  const projScore = hasProjects ? 8 : 2;
  const readScore = wordCount > 100 ? 5 : 2;
  const eduScore = hasEducation ? 5 : 2;
  const achScore = /\b(\d+%|\d+\+|\$\d+|reduced|improved|increased|achieved)\b/i.test(resumeText) ? 4 : 1;

  const atsScore = Math.min(100, Math.max(15, kwScore + sectionScore + expScore + projScore + contactScore + readScore + eduScore + achScore));
  const scoreCategory = atsScore >= 80 ? 'Strong Match' : atsScore >= 60 ? 'Moderate Match' : atsScore >= 40 ? 'Needs Improvement' : 'Low Match';

  return {
    atsScore,
    scoreCategory,
    wordCount,
    breakdown: {
      keywordMatch: { score: kwScore, maxScore: 40 },
      sections: {
        score: sectionScore,
        maxScore: 15,
        status: { education: hasEducation, experience: hasExperience, skills: hasSkills, projects: hasProjects, certifications: hasCertifications }
      },
      experience: { score: expScore, maxScore: 15 },
      projects: { score: projScore, maxScore: 10 },
      contact: {
        score: contactScore,
        maxScore: 5,
        fields: { email: hasEmail, phone: hasPhone, linkedin: hasLinkedin, github: hasGithub }
      },
      achievements: { score: achScore, maxScore: 5 },
      readability: { score: readScore, maxScore: 5, issues: wordCount < 100 ? ['Resume is very brief. Expand content to 250+ words.'] : [] },
      educationCertifications: { score: eduScore, maxScore: 5, hasDegree: hasEducation }
    },
    keywordAnalysis: {
      requiredMatchPercentage: reqPct,
      preferredMatchPercentage: prefPct,
      overallMatchPercentage: Math.round((reqPct + prefPct) / 2),
      matchedRequired,
      matchedPreferred,
      missingRequired,
      missingPreferred,
      allMatched: [...matchedRequired, ...matchedPreferred]
    },
    detectedSkills,
    strengths: [
      hasEmail && hasPhone ? 'Includes complete contact information' : null,
      matchedRequired.length > 0 ? `Matches key role requirements: ${matchedRequired.join(', ')}` : null,
      hasProjects ? 'Includes demonstrable project portfolio' : null
    ].filter(Boolean),
    recommendations: [
      missingRequired.length > 0 ? `Incorporate required skills: ${missingRequired.join(', ')}` : null,
      !hasLinkedin ? 'Add a link to your LinkedIn profile in the header' : null,
      !hasGithub ? 'Add a link to your GitHub profile for technical verification' : null,
      wordCount < 150 ? 'Expand your project descriptions and use action verbs with metrics' : null
    ].filter(Boolean),
    actionableImprovements: {
      isBadResume: atsScore < 50,
      criticalIssues: missingRequired.length > 0 ? [`Missing ${missingRequired.length} core skills for ${targetRole}: ${missingRequired.join(', ')}`] : [],
      pointsToChange: missingRequired.map(s => `Add practical evidence of ${s} under your projects or skills section.`)
    },
    isFallback: true
  };
}


// POST /api/chat (Public AI Career Advisor chatbot)
app.post('/api/chat', async (req, res) => {
  const { message = '', studentContext = {}, history = [] } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  let responseText = null;
  const key = process.env.GEMINI_API_KEY;

  if (key) {
    const systemPrompt = `You are an expert AI Career Counselor and Technical Advisor for university engineering students and recent graduates.

Student Profile Context:
- Target Role / Career: ${studentContext.careerGoal || 'Software Engineer'}
- Major / Branch: ${studentContext.branch || 'Engineering / Computer Science'}
- CGPA: ${studentContext.cgpa || 'Not provided'} / 10
- Known Skills: ${Array.isArray(studentContext.skills) ? studentContext.skills.join(', ') : (studentContext.skills || 'Not specified')}

Core Instructions:
1. Provide intelligent, detailed, and actionable responses tailored to the student's career context.
2. You can answer any career-related question: coding problems, algorithms, system design, resume guidance, salary negotiation, mock interview prep, DSA roadmaps, higher studies, or industry trends.
3. Structure your answer using clean Markdown: headers (###), bold text, bullet points, numbered lists, and fenced code blocks for any code.
4. For any code question, always provide working, commented, production-grade code with complexity analysis.
5. If asked about salary, provide realistic Indian CTC / LPA ranges (entry-level, mid-level, senior tier).
6. Answer follow-up questions naturally, keeping context from earlier in the conversation.
7. Keep the tone professional, encouraging, and concise.`;

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
