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

// GET /api/jobs/market-insights — Aggregated analytics on job postings
router.get('/market-insights', (req, res) => {
  if (jobsList.length === 0) loadJobs();

  const skillCount = {};
  const companyCount = {};
  const locationCount = {};
  const roleCount = {};

  jobsList.forEach(j => {
    (j.skills || []).forEach(s => {
      const trimmed = s.trim();
      if (trimmed) skillCount[trimmed] = (skillCount[trimmed] || 0) + 1;
    });

    if (j.company) companyCount[j.company] = (companyCount[j.company] || 0) + 1;
    if (j.location) locationCount[j.location] = (locationCount[j.location] || 0) + 1;
    if (j.title) {
      const normalizedTitle = j.title.split('-')[0].split('(')[0].trim();
      roleCount[normalizedTitle] = (roleCount[normalizedTitle] || 0) + 1;
    }
  });

  const topSkills = Object.entries(skillCount)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

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

  res.json({
    success: true,
    totalJobs: jobsList.length,
    topSkills,
    topCompanies,
    topLocations,
    topRoles,
    dataSource: 'LinkedIn Job Postings + Curated Industry Job Datasets'
  });
});

// GET /api/jobs/:id
router.get('/:id', (req, res) => {
  if (jobsList.length === 0) loadJobs();
  const job = jobsList.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({ success: true, job });
});

module.exports = router;
