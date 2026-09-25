const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const PROCESSED_JOBS_PATH = path.join(__dirname, '../../Datasets/processed/jobs.json');

let jobsList = [];
function loadJobs() {
  try {
    if (fs.existsSync(PROCESSED_JOBS_PATH)) {
      jobsList = JSON.parse(fs.readFileSync(PROCESSED_JOBS_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading jobs.json:', err);
  }
}
loadJobs();

// GET /api/jobs — Search, filter & paginate jobs
router.get('/', (req, res) => {
  if (jobsList.length === 0) loadJobs();

  let { search, location, experienceLevel, employmentType, skill, page = 1, limit = 20 } = req.query;
  let results = [...jobsList];

  if (search) {
    const q = search.trim().toLowerCase();
    results = results.filter(j =>
      (j.title || '').toLowerCase().includes(q) ||
      (j.company || '').toLowerCase().includes(q) ||
      (j.industry || '').toLowerCase().includes(q) ||
      (j.skills || []).some(s => s.toLowerCase().includes(q))
    );
  }

  if (location) {
    const loc = location.trim().toLowerCase();
    results = results.filter(j => (j.location || '').toLowerCase().includes(loc));
  }

  if (experienceLevel) {
    const exp = experienceLevel.trim().toLowerCase();
    results = results.filter(j => (j.experienceLevel || '').toLowerCase().includes(exp));
  }

  if (employmentType) {
    const emp = employmentType.trim().toLowerCase();
    results = results.filter(j => (j.employmentType || '').toLowerCase().includes(emp));
  }

  if (skill) {
    const sk = skill.trim().toLowerCase();
    results = results.filter(j => (j.skills || []).some(s => s.toLowerCase().includes(sk)));
  }

  const total = results.length;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const paginated = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
    jobs: paginated,
    data: paginated
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/market-insights — Aggregated analytics on job postings
// CRITICAL: MUST be declared BEFORE /:id — otherwise Express treats
//           "market-insights" as an :id param and returns 404.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/market-insights', (req, res) => {
  if (jobsList.length === 0) loadJobs();

  const { career } = req.query;
  let filteredJobs = [...jobsList];

  // Career-specific keyword filtering using inverted-index style matching
  if (career && career.trim()) {
    const careerLower = career.trim().toLowerCase();
    const CAREER_KEYWORD_MAP = {
      'software engineer': ['software engineer', 'swe', 'sde', 'software developer', 'backend engineer'],
      'data scientist': ['data scientist', 'data science', 'ml scientist'],
      'machine learning engineer': ['machine learning', 'ml engineer', 'ai engineer', 'deep learning'],
      'full stack developer': ['full stack', 'fullstack', 'full-stack'],
      'frontend developer': ['frontend', 'front-end', 'ui developer', 'react developer'],
      'backend developer': ['backend', 'back-end', 'api developer'],
      'devops engineer': ['devops', 'sre', 'platform engineer', 'site reliability'],
      'cloud engineer': ['cloud engineer', 'cloud architect', 'aws engineer', 'azure engineer'],
      'data engineer': ['data engineer', 'etl developer', 'data pipeline'],
      'data analyst': ['data analyst', 'business analyst', 'analytics'],
      'product manager': ['product manager', 'product management', 'program manager'],
      'cybersecurity engineer': ['security engineer', 'cybersecurity', 'infosec', 'security analyst'],
      'mobile developer': ['mobile developer', 'android developer', 'ios developer', 'flutter developer'],
    };

    let keywords = [];
    for (const [key, kws] of Object.entries(CAREER_KEYWORD_MAP)) {
      if (careerLower.includes(key) || key.includes(careerLower) ||
          kws.some(kw => careerLower.includes(kw))) {
        keywords = kws;
        break;
      }
    }
    // Generic fallback: use words longer than 3 chars from career name
    if (!keywords.length) {
      keywords = careerLower.split(/\s+/).filter(w => w.length > 3);
    }

    if (keywords.length > 0) {
      const matched = jobsList.filter(j => {
        const t = (j.title || '').toLowerCase();
        const ind = (j.industry || '').toLowerCase();
        return keywords.some(kw => t.includes(kw) || ind.includes(kw));
      });
      // Only apply career filter if we actually get results
      if (matched.length > 0) {
        filteredJobs = matched;
      }
    }
  }

  // Aggregate statistics from actual dataset records
  const skillCount = {};
  const companyCount = {};
  const locationCount = {};
  const roleCount = {};

  filteredJobs.forEach(j => {
    (j.skills || []).forEach(s => {
      const trimmed = s.trim();
      if (trimmed && trimmed.length > 1) {
        skillCount[trimmed] = (skillCount[trimmed] || 0) + 1;
      }
    });
    if (j.company && j.company.trim()) {
      companyCount[j.company] = (companyCount[j.company] || 0) + 1;
    }
    if (j.location && j.location.trim()) {
      locationCount[j.location] = (locationCount[j.location] || 0) + 1;
    }
    if (j.title) {
      const normalizedTitle = j.title.split('-')[0].split('(')[0].trim();
      if (normalizedTitle) roleCount[normalizedTitle] = (roleCount[normalizedTitle] || 0) + 1;
    }
  });

  const topSkills = Object.entries(skillCount)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const topCompanies = Object.entries(companyCount)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topLocations = Object.entries(locationCount)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topRoles = Object.entries(roleCount)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Demand level: ratio of matched jobs to total jobs in DB
  const matchedCount = filteredJobs.length;
  const totalCount = jobsList.length;
  const demandPct = totalCount > 0 ? (matchedCount / totalCount) * 100 : 0;
  const demandLevel = demandPct > 15 ? 'Very High'
    : demandPct > 8 ? 'High'
    : demandPct > 3 ? 'Medium'
    : 'Growing';

  // Salary: only from records that actually have salary data (no fabrication)
  const salaryJobs = filteredJobs.filter(j =>
    (j.salaryMin && parseFloat(j.salaryMin) > 10000) ||
    (j.salary_min_usd && parseFloat(j.salary_min_usd) > 10000)
  );
  let salaryRange = null;
  if (salaryJobs.length > 0) {
    const mins = salaryJobs
      .map(j => parseFloat(j.salaryMin || j.salary_min_usd || 0))
      .filter(v => v > 10000 && v < 500000);
    const maxs = salaryJobs
      .map(j => parseFloat(j.salaryMax || j.salary_max_usd || 0))
      .filter(v => v > 10000 && v < 500000);
    if (mins.length > 0) {
      const minUSD = Math.round(Math.min(...mins));
      const maxUSD = Math.round(Math.max(...(maxs.length ? maxs : mins)));
      const minINR = Math.round(minUSD * 83);
      const maxINR = Math.round(maxUSD * 83);
      const minLPA = parseFloat(((minUSD * 83) / 100000).toFixed(1));
      const maxLPA = parseFloat(((maxUSD * 83) / 100000).toFixed(1));
      salaryRange = {
        minUSD,
        maxUSD,
        minINR,
        maxINR,
        minLPA,
        maxLPA,
        sampleSize: mins.length,
      };
    }
  }

  // Sample matched job listings (capped at 10)
  const matchedJobs = filteredJobs.slice(0, 10).map(j => ({
    title: j.title || '',
    company: j.company || '',
    location: j.location || '',
    skills: (j.skills || []).slice(0, 5),
    source: j.source || 'Dataset',
    employmentType: j.employmentType || '',
    experienceLevel: j.experienceLevel || '',
  }));

  res.json({
    success: true,
    career: career || 'All Careers',
    jobCount: matchedCount,
    totalJobsInDB: totalCount,
    demandLevel,
    demandPercentage: Math.round(demandPct * 10) / 10,
    topSkills,
    topCompanies,
    topLocations,
    topRoles,
    salaryRange,
    matchedJobs,
    dataSource: 'job_data.csv + linkedin_job_postings_dataset.csv',
  });
});

// GET /api/jobs/:id  — MUST remain AFTER /market-insights
router.get('/:id', (req, res) => {
  if (jobsList.length === 0) loadJobs();
  const job = jobsList.find(j => String(j.id) === req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({ success: true, job });
});

module.exports = router;
