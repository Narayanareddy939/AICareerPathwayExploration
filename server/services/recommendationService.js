const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'Datasets', 'processed');

// Load cached datasets
let cachedCareers = [];
let cachedSkills = [];
let cachedCourses = [];
let cachedAlumni = [];

const loadDatasets = () => {
  try {
    const cp = path.join(PROCESSED_DIR, 'careers.json');
    if (fs.existsSync(cp)) cachedCareers = JSON.parse(fs.readFileSync(cp, 'utf-8'));
    
    const sp = path.join(PROCESSED_DIR, 'skills.json');
    if (fs.existsSync(sp)) cachedSkills = JSON.parse(fs.readFileSync(sp, 'utf-8'));

    const crp = path.join(PROCESSED_DIR, 'courses.json');
    if (fs.existsSync(crp)) cachedCourses = JSON.parse(fs.readFileSync(crp, 'utf-8'));

    const ap = path.join(PROCESSED_DIR, 'alumni.json');
    if (fs.existsSync(ap)) cachedAlumni = JSON.parse(fs.readFileSync(ap, 'utf-8'));
  } catch (e) {
    console.error('[RecommendationService] Error loading cached datasets:', e.message);
  }
};

loadDatasets();

const normalizeSkill = (s) => (s || '').toLowerCase().trim().replace(/[\s\-_.]/g, '');

const computeHybridScore = (studentData, career) => {
  const studentSkills = (studentData.skills || []).map(normalizeSkill);
  const careerSkills = (career.requiredSkills || []).map(normalizeSkill);

  // 1. Skill Match (35% weight)
  let matchedCount = 0;
  careerSkills.forEach(cs => {
    if (studentSkills.some(ss => ss.includes(cs) || cs.includes(ss))) {
      matchedCount++;
    }
  });
  const skillMatchScore = careerSkills.length > 0 ? (matchedCount / careerSkills.length) * 100 : 50;

  // 2. Academic / CGPA Match (20% weight)
  const cgpa = parseFloat(studentData.cgpa) || 7.5;
  const academicScore = Math.min(100, (cgpa / 10) * 100 + 5);

  // 3. Domain / Interest Match (20% weight)
  const target = (studentData.targetRole || studentData.domainInterest || '').toLowerCase();
  const title = (career.title || '').toLowerCase();
  const category = (career.category || '').toLowerCase();
  let interestScore = 60;
  if (target && (title.includes(target) || target.includes(title))) {
    interestScore = 98;
  } else if (target && (category.includes(target) || target.includes(category))) {
    interestScore = 85;
  }

  // 4. Alumni Pathway Match (15% weight)
  const branch = (studentData.branch || 'CSE').toLowerCase();
  const matchingAlumni = cachedAlumni.filter(a => 
    (a.branch || '').toLowerCase().includes(branch) &&
    (a.role || '').toLowerCase().includes(title)
  );
  const alumniScore = Math.min(100, 50 + matchingAlumni.length * 5);

  // 5. Market Demand Factor (10% weight)
  const marketScore = career.demandIndex || 85;

  // Final Hybrid Weighted Score
  const totalScore = Math.round(
    skillMatchScore * 0.35 +
    interestScore * 0.20 +
    academicScore * 0.20 +
    alumniScore * 0.15 +
    marketScore * 0.10
  );

  return Math.min(99, Math.max(45, totalScore));
};

const getRecommendations = async (studentData) => {
  if (cachedCareers.length === 0) loadDatasets();

  // Try Python AI Engine if available
  const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://127.0.0.1:5001';
  try {
    const res = await axios.post(`${PYTHON_AI_URL}/recommend`, studentData, { timeout: 1500 });
    if (res.data && res.data.recommendations) {
      return res.data.recommendations;
    }
  } catch (pyErr) {
    // Graceful fallback to embedded hybrid algorithm
  }

  const studentSkills = (studentData.skills || []).map(s => s.trim());
  const normalizedStudentSkills = studentSkills.map(normalizeSkill);

  const scoredCareers = cachedCareers.map(c => {
    const score = computeHybridScore(studentData, c);
    const reqSkills = c.requiredSkills || [];
    
    const matched = [];
    const missing = [];

    reqSkills.forEach(req => {
      const nReq = normalizeSkill(req);
      if (normalizedStudentSkills.some(ns => ns.includes(nReq) || nReq.includes(ns))) {
        matched.push(req);
      } else {
        missing.push(req);
      }
    });

    // Associated courses for missing skills
    const suggestedCourses = cachedCourses.filter(course => 
      missing.some(m => (course.skills || []).some(cs => normalizeSkill(cs).includes(normalizeSkill(m))))
    ).slice(0, 3);

    // Similar alumni in this role
    const similarAlumni = cachedAlumni.filter(a => 
      (a.role || '').toLowerCase().includes(c.title.toLowerCase())
    ).slice(0, 3);

    return {
      id: c.id,
      title: c.title,
      category: c.category,
      matchPercentage: score,
      description: c.description,
      averageSalary: c.averageSalary,
      growthRate: c.growthRate,
      matchedSkills: matched,
      missingSkills: missing,
      suggestedCourses,
      similarAlumni,
      educationRequirements: c.educationRequirements
    };
  });

  scoredCareers.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return scoredCareers.slice(0, 5);
};

module.exports = {
  getRecommendations,
  computeHybridScore,
  loadDatasets
};
