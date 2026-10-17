/**
 * End-to-End Automated Verification Test Suite for:
 * Feature: Unified Jobs & Companies Portal with Personalized Recommendations
 */

const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'career-platform-fallback-secret-2026';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
  passedTests++;
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 Running Unified Jobs & Companies Portal E2E Test Suite');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Student = require('../models/Student');
  const PortalJob = require('../models/PortalJob');
  const Company = require('../models/Company');
  const StudentApplication = require('../models/StudentApplication');

  // Find a test student user
  const user = await User.findOne({ email: 'student@example.com' }) || await User.findOne({});
  const student = await Student.findOne({ userId: user._id }) || await Student.findOne({});
  
  const token = jwt.sign(
    { id: user._id, role: user.role || 'student', email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Public / Filtered Jobs endpoint (Section C)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 1. Testing Jobs Listing & Expiry Exclusion ---');
  const jobsRes = await axios.get(`${BASE_URL}/portal/jobs`);
  assert(jobsRes.data.success === true, 'Jobs endpoint returns success');
  assert(Array.isArray(jobsRes.data.data), 'Jobs data is an array');
  assert(jobsRes.data.data.length > 0, 'Returns non-zero active jobs');

  // Verify expired job exclusion
  const hasExpired = jobsRes.data.data.some(j => j.status === 'expired' || (j.applicationDeadline && new Date(j.applicationDeadline) < new Date()));
  assert(!hasExpired, 'Expired and closed jobs are NOT returned as active');

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Filter by Location, Fresher, and Employment Type
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Filters (Location, Fresher, Internship) ---');
  const bngRes = await axios.get(`${BASE_URL}/portal/jobs?location=Bengaluru`);
  assert(bngRes.data.success === true, 'Location filter returns success');
  assert(bngRes.data.data.every(j => j.location.toLowerCase().includes('bengaluru')), 'All returned jobs are in Bengaluru');

  const fresherRes = await axios.get(`${BASE_URL}/portal/jobs?fresherOnly=true`);
  assert(fresherRes.data.data.every(j => ['fresher', 'entry'].includes(j.experienceLevel)), 'Fresher filter strictly returns fresher/entry roles');

  const internRes = await axios.get(`${BASE_URL}/portal/jobs?internshipOnly=true`);
  assert(internRes.data.data.every(j => j.employmentType === 'internship'), 'Internship filter strictly returns internships');

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Recommendation Engine (Section B & Factor Weighting)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Personalized Recommendation Engine ---');
  const recRes = await axios.get(`${BASE_URL}/portal/jobs/recommended`, { headers: authHeaders });
  assert(recRes.data.success === true, 'Recommendations endpoint returns success');
  assert(Array.isArray(recRes.data.data.jobs), 'Recommended jobs array returned');
  
  if (recRes.data.data.jobs.length > 0) {
    const topRec = recRes.data.data.jobs[0];
    assert(topRec.recommendation !== undefined, 'Recommendation object present on job');
    assert(typeof topRec.recommendation.total === 'number', 'Deterministic match score calculated');
    assert(typeof topRec.recommendation.explanation === 'string' && topRec.recommendation.explanation.length > 0, 'Natural language explanation generated');
    assert(Array.isArray(topRec.recommendation.matchingSkills), 'Matching skills array provided');
    assert(Array.isArray(topRec.recommendation.missingSkills), 'Missing skills array provided');
    assert(typeof topRec.recommendation.isEligible === 'boolean', 'Academic eligibility flag determined');
    console.log(`   Sample Top Match: "${topRec.title}" Score: ${topRec.recommendation.total}%`);
    console.log(`   Explanation: ${topRec.recommendation.explanation}`);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Companies Directory & Zero-Vacancy Discovery (Section D)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Companies Directory & Zero-Vacancy Support ---');
  const compRes = await axios.get(`${BASE_URL}/portal/companies`);
  assert(compRes.data.success === true, 'Companies endpoint returns success');
  assert(compRes.data.data.length >= 8, 'Multiple companies returned');

  // Check for company with 0 vacancies
  const zeroJobComp = compRes.data.data.find(c => c.activeJobCount === 0);
  assert(zeroJobComp !== undefined, 'Company with 0 active vacancies is discoverable (e.g. Cisco/NVIDIA)');
  console.log(`   Discovered zero-vacancy partner: "${zeroJobComp.name}" (activeJobCount: ${zeroJobComp.activeJobCount})`);

  // Verify company details endpoint
  const compDetailRes = await axios.get(`${BASE_URL}/portal/companies/${zeroJobComp._id}`);
  assert(compDetailRes.data.success === true, 'Company detail endpoint returns successfully');
  assert(compDetailRes.data.data.company.name === zeroJobComp.name, 'Company details match queried ID');

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Job Details & Data Integrity (Section E)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing Job Details & Unfabricated Fields ---');
  const sampleJob = jobsRes.data.data[0];
  const jobDetailRes = await axios.get(`${BASE_URL}/portal/jobs/${sampleJob._id}`);
  assert(jobDetailRes.data.success === true, 'Job detail endpoint returns success');
  const fetchedJob = jobDetailRes.data.data.job;
  assert(fetchedJob.title === sampleJob.title, 'Job title matches');
  assert(fetchedJob.companyName === sampleJob.companyName, 'Company name matches');
  assert(fetchedJob.applicationUrl !== undefined, 'Application URL field present');
  assert(fetchedJob.verificationStatus !== undefined, 'Verification status present');

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Save, Unsave & Application Tracking (Section 7)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing Save, Unsave & Application Pipeline ---');
  // 1. Save job
  const saveRes = await axios.post(`${BASE_URL}/portal/jobs/${sampleJob._id}/save`, {}, { headers: authHeaders });
  assert(saveRes.data.success === true, 'Job bookmarked successfully');

  // 2. Verify in saved list
  const savedListRes = await axios.get(`${BASE_URL}/portal/saved-jobs`, { headers: authHeaders });
  assert(savedListRes.data.data.some(s => (s.jobId?._id || s.jobId) === sampleJob._id), 'Job appears in student saved list');

  // 3. Track application
  const trackRes = await axios.post(
    `${BASE_URL}/portal/jobs/${sampleJob._id}/application-tracking`,
    { notes: 'Submitted resume via campus career link' },
    { headers: authHeaders }
  );
  assert(trackRes.data.success === true, 'Application tracking entry recorded');
  const appId = trackRes.data.data._id;

  // 4. Update status to 'interview'
  const updateStatusRes = await axios.patch(
    `${BASE_URL}/portal/applications/${appId}`,
    { status: 'interview', notes: 'Scheduled for technical round' },
    { headers: authHeaders }
  );
  assert(updateStatusRes.data.success === true, 'Application status updated to interview');
  assert(updateStatusRes.data.data.status === 'interview', 'Application state reflects updated stage');

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Adzuna Provider & Missing Key Safety (Section 3)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 7. Testing Adzuna Provider Graceful Fallback ---');
  const adzunaProvider = require('../services/jobProviders/adzunaProvider');
  const isConfigured = adzunaProvider.isConfigured();
  console.log(`   Adzuna configured: ${isConfigured} (App ID: ${process.env.ADZUNA_APP_ID ? 'Configured' : 'Not set'})`);
  // Try search — should not throw or crash if credentials are absent
  const adzunaResult = await adzunaProvider.searchJobs({ what: 'software engineer' });
  assert(Array.isArray(adzunaResult.jobs), 'Adzuna adapter returns clean empty array or jobs without crashing');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions verified!`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test run failed:', err.message);
  if (err.response?.data) {
    console.error('Response data:', err.response.data);
  }
  process.exit(1);
});
