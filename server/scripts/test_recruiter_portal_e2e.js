/**
 * End-to-End Automated Test Suite: Recruiter & Company Portal Workflow
 * Tests full lifecycle: Recruiter Registration, Verification, Job Posting,
 * Student Discovery, Direct In-Portal Application, Duplicate Rejection,
 * Recruiter Applicant Review & Status Workflow, Cross-Tenant Isolation,
 * and Student Withdrawal.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const mongoose = require('mongoose');
const dns = require('dns');

try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const User = require('../models/User');
const Company = require('../models/Company');
const PortalJob = require('../models/PortalJob');
const StudentApplication = require('../models/StudentApplication');
const app = require('../index');

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let serverInstance;

// Helper to log test steps
function logStep(step, description) {
  console.log(`\n\x1b[36m▶ [STEP ${step}] ${description}\x1b[0m`);
}
function logSuccess(msg) {
  console.log(`  \x1b[32m✔ ${msg}\x1b[0m`);
}
function logFail(msg, err) {
  console.error(`  \x1b[31m✖ ${msg}\x1b[0m`, err?.response?.data || err?.message || err);
  throw new Error(msg);
}

async function runE2ETests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  STARTING END-TO-END RECRUITER & COMPANY PORTAL TEST SUITE    ');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Boot up server on test port
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`Test Express server listening on ${BASE_URL}`);
      resolve();
    });
  });

  // Unique identifiers for clean test run
  const testRunId = Date.now();
  const recruiterEmailA = `recruiter_a_${testRunId}@quantumai.io`;
  const recruiterEmailB = `recruiter_b_${testRunId}@apexcorp.com`;
  const studentEmail = `student_${testRunId}@university.edu`;
  const password = 'TestSecurePassword123!';

  let recruiterTokenA, companyIdA, jobIdA;
  let recruiterTokenB, companyIdB;
  let studentToken, studentId;
  let adminToken;
  let applicationId;

  try {
    // ─────────────────────────────────────────────────────────────
    // STEP 1: Recruiter A Registration with Company Profile
    // ─────────────────────────────────────────────────────────────
    logStep(1, 'Registering Company Recruiter A with Company Profile...');
    const regResA = await axios.post(`${BASE_URL}/api/auth/company-register`, {
      name: 'Sarah Connor',
      email: recruiterEmailA,
      password: password,
      companyName: `Quantum AI Innovations ${testRunId}`,
      description: 'Pioneering next-generation machine learning and automated reasoning platforms.',
      industry: 'Artificial Intelligence',
      website: 'https://quantumai.example.com',
      location: 'San Francisco, CA / Hybrid',
      contactPhone: '+1-555-0199'
    });

    if (!regResA.data.success || !regResA.data.token) {
      logFail('Failed to register Recruiter A', regResA.data);
    }
    recruiterTokenA = regResA.data.token;
    companyIdA = regResA.data.company?._id || regResA.data.user?.companyId;

    logSuccess(`Recruiter A registered successfully. Role: ${regResA.data.user.role}`);
    const registeredCompName = regResA.data.company.name || regResA.data.company.companyName;
    logSuccess(`Company profile created: "${registeredCompName}" (ID: ${companyIdA})`);
    logSuccess(`Initial Verification Status: ${regResA.data.company.verificationStatus}`);

    if (regResA.data.company.verificationStatus !== 'pending_review') {
      logFail('Expected initial verification status to be pending_review');
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Recruiter Posts Job Opening & Verification Gate Check
    // ─────────────────────────────────────────────────────────────
    logStep(2, 'Recruiter A publishes a Job Opening while in pending_review...');
    const jobResA = await axios.post(`${BASE_URL}/api/company/jobs`, {
      title: 'Senior MERN & AI Platform Engineer',
      description: 'Lead the architecture of our cloud-native AI pipeline and full-stack client applications.',
      responsibilities: [
        'Design scalable Express APIs and microservices',
        'Build reactive React interfaces with modern accessibility standards',
        'Integrate PyTorch & Gemini inference microservices'
      ],
      requiredSkills: ['Node.js', 'React', 'MongoDB', 'Python', 'Docker'],
      preferredSkills: ['TypeScript', 'Kubernetes', 'Redis'],
      eligibilityCriteria: 'B.Tech / M.Tech in CS or related degree',
      eligibleDegree: ['B.Tech', 'M.Tech'],
      minimumCgpa: 7.5,
      experienceLevel: 'Mid-Senior Level (2-5 yrs)',
      employmentType: 'Full-time',
      workMode: 'Hybrid',
      location: 'San Francisco, CA',
      salary: '$135,000 - $165,000 / year',
      vacancies: 3,
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${recruiterTokenA}` }
    });

    if (!jobResA.data.success || !jobResA.data.data?._id) {
      logFail('Recruiter A failed to post job', jobResA.data);
    }
    jobIdA = jobResA.data.data._id;
    logSuccess(`Job posted successfully by Recruiter A: "${jobResA.data.data.title}" (ID: ${jobIdA})`);

    // Verify Unverified Company Gate: Job must NOT appear in public student browse list yet!
    logStep('2b', 'Verifying Job is excluded from Public Student Listings while company is pending_review...');
    const publicJobsBeforeVerify = await axios.get(`${BASE_URL}/api/portal/jobs?search=Quantum`);
    const beforeList = Array.isArray(publicJobsBeforeVerify.data.data) ? publicJobsBeforeVerify.data.data : (publicJobsBeforeVerify.data.data?.jobs || []);
    const foundBefore = beforeList.some(j => String(j._id) === String(jobIdA));
    if (foundBefore) {
      logFail('Unverified company job improperly appeared in public student listings!');
    } else {
      logSuccess('Gate Verified: Pending review company job is correctly HIDDEN from public student listings.');
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Admin Verifies Company
    // ─────────────────────────────────────────────────────────────
    logStep(3, 'Administrator logs in and officially verifies Company A...');
    const adminLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@aicarrier.com',
      password: 'AdminPassword123!'
    });

    if (!adminLoginRes.data.success || !adminLoginRes.data.token) {
      logFail('Admin login failed', adminLoginRes.data);
    }
    adminToken = adminLoginRes.data.token;
    logSuccess('Admin authenticated successfully.');

    // Admin verifies company
    const verifyRes = await axios.patch(
      `${BASE_URL}/api/admin-v2/companies/${companyIdA}/verify`,
      { verificationStatus: 'officially_verified', reason: 'Verified corporate registration and credentials.' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (!verifyRes.data.success || verifyRes.data.data?.verificationStatus !== 'officially_verified') {
      logFail('Admin failed to verify company', verifyRes.data);
    }
    logSuccess(`Company ${companyIdA} officially verified by Administrator.`);

    // Check Student Discovery now: Job SHOULD be listed!
    logStep('3b', 'Checking that Verified Job now appears in Public Student Listings...');
    const publicJobsAfterVerify = await axios.get(`${BASE_URL}/api/portal/jobs?search=Quantum`);
    const afterList = Array.isArray(publicJobsAfterVerify.data.data) ? publicJobsAfterVerify.data.data : (publicJobsAfterVerify.data.data?.jobs || []);
    const foundAfter = afterList.some(j => String(j._id) === String(jobIdA));
    if (!foundAfter) {
      logFail('Verified company job failed to appear in public student listings!');
    } else {
      logSuccess('Verified: Job opening is now visible in the Public Student Openings feed!');
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Student Registration & Direct In-Portal Application
    // ─────────────────────────────────────────────────────────────
    logStep(4, 'Student registers and applies directly in-portal...');
    const studentRegRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Alex Rivera',
      email: studentEmail,
      password: password
    });

    if (!studentRegRes.data.success) {
      logFail('Student registration failed', studentRegRes.data);
    }
    const studentLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: studentEmail,
      password: password
    });
    if (!studentLoginRes.data.success || !studentLoginRes.data.token) {
      logFail('Student login failed', studentLoginRes.data);
    }
    studentToken = studentLoginRes.data.token;
    studentId = studentLoginRes.data.user?.id || studentLoginRes.data.user?._id;
    logSuccess(`Student Alex Rivera registered and logged in. ID: ${studentId}`);

    // Update student profile so candidate snapshot has degree/cgpa
    await axios.post(`${BASE_URL}/api/student/profile`, {
      fullName: 'Alex Rivera',
      branch: 'Computer Science and Engineering',
      graduationYear: 2025,
      cgpa: 8.8,
      skills: ['Node.js', 'React', 'MongoDB', 'Python', 'Machine Learning'],
      interests: ['Full Stack Development', 'AI Engineering']
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logSuccess('Student profile completed with degree, skills, and CGPA.');

    // Submit direct application
    const applyRes = await axios.post(
      `${BASE_URL}/api/portal/jobs/${jobIdA}/apply`,
      {
        useProfileResume: true,
        coverNote: 'I have built enterprise full-stack applications and ML pipelines that match your requirements perfectly!'
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    if (!applyRes.data.success || !applyRes.data.data?._id) {
      logFail('Student application failed', applyRes.data);
    }
    applicationId = applyRes.data.data._id;
    logSuccess(`Application submitted persistently in MongoDB! App ID: ${applicationId}`);
    logSuccess(`Initial status: ${applyRes.data.data.status}`);

    // ─────────────────────────────────────────────────────────────
    // STEP 5: Duplicate Application Rejection Test
    // ─────────────────────────────────────────────────────────────
    logStep(5, 'Testing Duplicate Application Prevention (Database & API constraints)...');
    try {
      await axios.post(
        `${BASE_URL}/api/portal/jobs/${jobIdA}/apply`,
        { useProfileResume: true, coverNote: 'Applying again' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      logFail('Duplicate application was incorrectly accepted!');
    } catch (dupErr) {
      if (dupErr.response?.status === 400 && dupErr.response?.data?.message?.includes('already submitted')) {
        logSuccess(`Duplicate prevented correctly with HTTP 400: "${dupErr.response.data.message}"`);
      } else {
        logFail('Duplicate application failed with unexpected error code or message', dupErr);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 6: Recruiter Applicants View & Controlled Status Updates
    // ─────────────────────────────────────────────────────────────
    logStep(6, 'Recruiter A retrieves applicants and updates hiring workflow status...');
    const applicantsRes = await axios.get(`${BASE_URL}/api/company/applicants`, {
      headers: { Authorization: `Bearer ${recruiterTokenA}` }
    });

    if (!applicantsRes.data.success || applicantsRes.data.data?.length === 0) {
      logFail('Recruiter A received zero applicants for posted job', applicantsRes.data);
    }
    const candidateApp = applicantsRes.data.data.find(a => a._id === applicationId);
    if (!candidateApp) {
      logFail('Candidate application missing from recruiter applicant list');
    }
    const applicantName = candidateApp.applicantData?.fullName || candidateApp.studentId?.fullName || 'Alex Rivera';
    const applicantDegree = candidateApp.applicantData?.branch || 'CS';
    logSuccess(`Recruiter retrieved applicant: "${applicantName}" (${applicantDegree})`);
    logSuccess(`Cover Note received: "${candidateApp.coverNote}"`);

    // Update status to 'shortlisted'
    logStep('6b', 'Updating status to "shortlisted"...');
    const updateStatus1 = await axios.patch(
      `${BASE_URL}/api/company/applications/${applicationId}/status`,
      { status: 'shortlisted', notes: 'Top 5% candidate match.' },
      { headers: { Authorization: `Bearer ${recruiterTokenA}` } }
    );
    if (!updateStatus1.data.success || updateStatus1.data.data?.status !== 'shortlisted') {
      logFail('Failed to update status to shortlisted', updateStatus1.data);
    }
    logSuccess('Recruiter successfully updated status to "shortlisted".');

    // Update status to 'interview_scheduled'
    logStep('6c', 'Updating status to "interview_scheduled"...');
    const updateStatus2 = await axios.patch(
      `${BASE_URL}/api/company/applications/${applicationId}/status`,
      { status: 'interview_scheduled', notes: 'Technical interview scheduled for Thursday.' },
      { headers: { Authorization: `Bearer ${recruiterTokenA}` } }
    );
    if (!updateStatus2.data.success || updateStatus2.data.data?.status !== 'interview_scheduled') {
      logFail('Failed to update status to interview_scheduled', updateStatus2.data);
    }
    logSuccess('Recruiter successfully updated status to "interview_scheduled".');

    // ─────────────────────────────────────────────────────────────
    // STEP 7: Student My Applications Tracking
    // ─────────────────────────────────────────────────────────────
    logStep(7, 'Student verifies updated status in My Applications tracker...');
    const myAppsRes = await axios.get(`${BASE_URL}/api/portal/my-applications`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (!myAppsRes.data.success || !myAppsRes.data.data?.applications?.length) {
      logFail('Student failed to fetch My Applications', myAppsRes.data);
    }
    const studentAppView = myAppsRes.data.data.applications.find(a => a._id === applicationId);
    if (!studentAppView) {
      logFail('Application missing in student My Applications tracker');
    }
    const compName = studentAppView.companyId?.name || studentAppView.jobId?.companyName || 'Quantum AI';
    const jobTitle = studentAppView.jobId?.title || 'Engineer';
    logSuccess(`Student My Applications reflected status: "${studentAppView.status}"`);
    logSuccess(`Company name: "${compName}", Job title: "${jobTitle}"`);
    logSuccess(`Timeline history recorded: ${studentAppView.statusHistory?.length} events`);

    if (studentAppView.status !== 'interview_scheduled') {
      logFail(`Expected status to be interview_scheduled, got: ${studentAppView.status}`);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 8: Cross-Tenant Data Isolation & Security Boundaries
    // ─────────────────────────────────────────────────────────────
    logStep(8, 'Testing Multi-Tenant Data Isolation & Cross-Company Security...');
    // Register Recruiter B
    const regResB = await axios.post(`${BASE_URL}/api/auth/company-register`, {
      name: 'Bruce Wayne',
      email: recruiterEmailB,
      password: password,
      companyName: `Apex Corp ${testRunId}`,
      industry: 'Defense & Technology',
      location: 'Gotham City'
    });
    recruiterTokenB = regResB.data.token;
    companyIdB = regResB.data.company?._id;
    logSuccess(`Recruiter B registered for Apex Corp. (ID: ${companyIdB})`);

    // Recruiter B attempts to fetch Recruiter A's applicants
    const applicantsResB = await axios.get(`${BASE_URL}/api/company/applicants`, {
      headers: { Authorization: `Bearer ${recruiterTokenB}` }
    });
    const leakFound = (applicantsResB.data.data || []).some(a => a._id === applicationId);
    if (leakFound) {
      logFail('SECURITY BREACH: Recruiter B can see Recruiter A applicants!');
    } else {
      logSuccess('Isolation Verified: Recruiter B applicant list does NOT contain Recruiter A applicants.');
    }

    // Recruiter B attempts to modify Recruiter A's application status
    try {
      await axios.patch(
        `${BASE_URL}/api/company/applications/${applicationId}/status`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${recruiterTokenB}` } }
      );
      logFail('SECURITY BREACH: Recruiter B modified Recruiter A application status!');
    } catch (isoErr) {
      if (isoErr.response?.status === 404 || isoErr.response?.status === 403) {
        logSuccess(`Isolation Verified: Recruiter B rejected with HTTP ${isoErr.response.status} when modifying Recruiter A application.`);
      } else {
        logFail('Unexpected response on cross-company modification attempt', isoErr);
      }
    }

    // Recruiter B attempts to tamper with or delete Recruiter A's job opening
    try {
      await axios.delete(
        `${BASE_URL}/api/company/jobs/${jobIdA}`,
        { headers: { Authorization: `Bearer ${recruiterTokenB}` } }
      );
      logFail('SECURITY BREACH: Recruiter B deleted Recruiter A job opening!');
    } catch (jobIsoErr) {
      if (jobIsoErr.response?.status === 404 || jobIsoErr.response?.status === 403) {
        logSuccess(`Isolation Verified: Recruiter B rejected with HTTP ${jobIsoErr.response.status} when deleting Recruiter A job.`);
      } else {
        logFail('Unexpected response on cross-company job modification attempt', jobIsoErr);
      }
    }

    // Student attempts to access Recruiter API
    try {
      await axios.get(`${BASE_URL}/api/company/applicants`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      logFail('SECURITY BREACH: Student accessed Recruiter applicants endpoint!');
    } catch (rbacErr) {
      if (rbacErr.response?.status === 403) {
        logSuccess(`RBAC Verified: Student blocked with HTTP 403: "${rbacErr.response.data.message}"`);
      } else {
        logFail('Unexpected response on student RBAC check', rbacErr);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 9: Recruiter Dashboard Live Metrics
    // ─────────────────────────────────────────────────────────────
    logStep(9, 'Verifying Recruiter Dashboard live database-computed metrics...');
    const statsRes = await axios.get(`${BASE_URL}/api/company/stats`, {
      headers: { Authorization: `Bearer ${recruiterTokenA}` }
    });

    if (!statsRes.data.success || !statsRes.data.data) {
      logFail('Recruiter stats retrieval failed', statsRes.data);
    }
    const kpis = statsRes.data.data.kpis || statsRes.data.data;
    logSuccess(`Dashboard Metrics Computed:
      - Total Jobs Posted: ${kpis.totalJobs}
      - Active Jobs: ${kpis.activeJobs}
      - Total Applications: ${kpis.totalApplications}
      - Interviews Scheduled: ${kpis.interviewsScheduled}
      - Shortlisted: ${kpis.shortlisted}`);

    if (kpis.totalJobs < 1 || kpis.totalApplications < 1 || kpis.interviewsScheduled < 1) {
      logFail('Metrics did not match actual persisted DB records', kpis);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 10: Student Application Withdrawal
    // ─────────────────────────────────────────────────────────────
    logStep(10, 'Testing Student Application Withdrawal...');
    const withdrawRes = await axios.patch(
      `${BASE_URL}/api/portal/my-applications/${applicationId}/withdraw`,
      {},
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    if (!withdrawRes.data.success || withdrawRes.data.data?.status !== 'withdrawn') {
      logFail('Student withdrawal failed', withdrawRes.data);
    }
    logSuccess('Student successfully withdrew application. Status updated to "withdrawn".');

    // Verify Recruiter sees 'withdrawn' status
    const appRecruiterView = await axios.get(`${BASE_URL}/api/company/applicants`, {
      headers: { Authorization: `Bearer ${recruiterTokenA}` }
    });
    const withdrawnInRecruiter = appRecruiterView.data.data.find(a => a._id === applicationId);
    if (withdrawnInRecruiter?.status === 'withdrawn') {
      logSuccess('Recruiter portal synchronously reflects "withdrawn" application status.');
    } else {
      logFail(`Expected withdrawn status in recruiter portal, got: ${withdrawnInRecruiter?.status}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  \x1b[32mALL 10 END-TO-END WORKFLOW INTEGRATION TESTS PASSED!\x1b[0m');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n\x1b[31mTEST SUITE TERMINATED WITH ERROR:\x1b[0m', error.message);
    if (error.response?.data) {
      console.error('Response Data:', error.response.data);
    }
    process.exitCode = 1;
  } finally {
    // Cleanup created test records
    try {
      console.log('Cleaning up test documents from MongoDB Atlas...');
      if (applicationId) await StudentApplication.findByIdAndDelete(applicationId);
      if (jobIdA) await PortalJob.findByIdAndDelete(jobIdA);
      if (companyIdA) await Company.findByIdAndDelete(companyIdA);
      if (companyIdB) await Company.findByIdAndDelete(companyIdB);
      await User.deleteMany({ email: { $in: [recruiterEmailA, recruiterEmailB, studentEmail] } });
      console.log('Cleanup completed cleanly.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runE2ETests();
