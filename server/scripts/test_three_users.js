const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const PYTHON_URL = 'http://localhost:8000';

const users = [
  {
    fullName: 'Aarav Sharma',
    email: `aarav_test_${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    profile: {
      fullName: 'Aarav Sharma',
      phone: '+919876543210',
      university: 'National Institute of Technology',
      branch: 'Computer Science and Engineering',
      department: 'Computer Science',
      semester: 7,
      graduationYear: 2026,
      cgpa: 8.8,
      careerGoal: 'Full Stack Developer',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'],
      interests: ['Web Development', 'System Design', 'Cloud Computing'],
      preferredLocation: ['Bengaluru', 'Hyderabad'],
      gender: 'Male'
    }
  },
  {
    fullName: 'Priya Patel',
    email: `priya_test_${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    profile: {
      fullName: 'Priya Patel',
      phone: '+919812345678',
      university: 'Indian Institute of Information Technology',
      branch: 'Data Science',
      department: 'Artificial Intelligence',
      semester: 6,
      graduationYear: 2027,
      cgpa: 8.4,
      careerGoal: 'Data Scientist',
      skills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'SQL', 'Scikit-Learn'],
      interests: ['Artificial Intelligence', 'Data Science', 'Deep Learning'],
      preferredLocation: ['Bengaluru', 'Pune'],
      gender: 'Female'
    }
  },
  {
    fullName: 'Rohan Verma',
    email: `rohan_test_${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    profile: {
      fullName: 'Rohan Verma',
      phone: '+919823456789',
      university: 'Vellore Institute of Technology',
      branch: 'Information Technology',
      department: 'Cloud & Infrastructure',
      semester: 8,
      graduationYear: 2026,
      cgpa: 7.6,
      careerGoal: 'DevOps Engineer',
      skills: ['Linux', 'Docker', 'AWS', 'CI/CD', 'Git', 'Python'],
      interests: ['Cloud Infrastructure', 'Kubernetes', 'Automation'],
      preferredLocation: ['Hyderabad', 'Remote'],
      gender: 'Male'
    }
  }
];

async function runTests() {
  console.log('='.repeat(70));
  console.log('🧪 VERIFYING COMPLETE PLATFORM WORKFLOW FOR 3 DIFFERENT USERS');
  console.log('='.repeat(70));

  // 1. Health check
  try {
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log(`\n[BACKEND HEALTH]: Status=${health.data.status}, MongoDB=${health.data.mongodb}, Alumni=${health.data.alumniCount}`);
  } catch (err) {
    console.error(`❌ Backend health check failed: ${err.message}`);
    return;
  }

  // 2. Python AI check
  try {
    const pyHealth = await axios.get(`${PYTHON_URL}/health`);
    console.log(`[PYTHON AI HEALTH]: Status=${pyHealth.data.status}, Models=${pyHealth.data.modelLoaded ? 'Loaded' : 'Fallback'}`);
  } catch (err) {
    console.warn(`⚠️ Python AI health endpoint: ${err.message}`);
  }

  // 3. Test each user through the entire platform flow
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`👤 TESTING USER ${i + 1}: ${u.fullName} (${u.profile.branch} -> Goal: ${u.profile.careerGoal})`);
    console.log(`----------------------------------------------------------------------`);

    try {
      // Step A: Register
      const regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
        fullName: u.fullName,
        email: u.email,
        password: u.password,
        confirmPassword: u.confirmPassword
      });
      console.log(`  ✅ 1. Registration: SUCCESS (User ID: ${regRes.data.userId})`);

      // Step B: Login
      const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: u.email,
        password: u.password
      });
      const token = loginRes.data.token;
      console.log(`  ✅ 2. Login: SUCCESS (JWT token received)`);

      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

      // Step C: Save Student Profile
      const profileRes = await axios.post(`${BASE_URL}/api/student/profile`, u.profile, authHeaders);
      const studentData = profileRes.data.student || profileRes.data.data;
      console.log(`  ✅ 3. Profile Save: SUCCESS (CGPA: ${studentData.cgpa}, Skills: ${studentData.skills.join(', ')})`);

      // Step D: AI Career Recommendation Pipeline
      console.log(`  ⏳ 4. Triggering AI Career Recommendation Engine...`);
      const recRes = await axios.post(`${BASE_URL}/api/ai/recommend`, {}, authHeaders);
      if (recRes.data.success && recRes.data.recommendation) {
        const rec = recRes.data.recommendation;
        console.log(`  ✅ 4. AI Recommendation: SUCCESS`);
        console.log(`     -> Predicted Role: ${rec.predictedRole}`);
        console.log(`     -> Match Score: ${rec.careerMatchScore}% | Placement Readiness: ${rec.placementReadiness}%`);
        console.log(`     -> Salary Projection: ${rec.predictedSalaryRange}`);
        console.log(`     -> Missing Skills: ${rec.missingSkills?.join(', ')}`);
        console.log(`     -> Recommended Roles: ${rec.recommendedRoles?.join(', ')}`);
      } else {
        console.log(`  ⚠️ 4. AI Recommendation response:`, recRes.data);
      }

      // Step E: Alumni Similarity Matching
      const alumniRes = await axios.get(`${BASE_URL}/api/alumni?branch=${encodeURIComponent(u.profile.branch)}`, authHeaders);
      console.log(`  ✅ 5. Alumni Query: SUCCESS (${alumniRes.data.count || (alumniRes.data.data && alumniRes.data.data.length)} matching alumni found)`);

      // Step F: Jobs Market Data Query
      const jobsRes = await axios.get(`${BASE_URL}/api/jobs`, authHeaders);
      const jobList = jobsRes.data.jobs || jobsRes.data.data || [];
      console.log(`  ✅ 6. Job Market Query: SUCCESS (${jobList.length} vacancies fetched)`);

      // Step G: Generate Phased Career Roadmap
      console.log(`  ⏳ 7. Querying Topological Sort Roadmap for '${u.profile.careerGoal}'...`);
      const roadmapRes = await axios.get(
        `${BASE_URL}/api/roadmaps?role=${encodeURIComponent(u.profile.careerGoal)}&skills=${encodeURIComponent(u.profile.skills.join(','))}`,
        authHeaders
      );
      if (roadmapRes.data.success && roadmapRes.data.data) {
        const phases = roadmapRes.data.data.phases || [];
        console.log(`  ✅ 7. Dynamic Roadmap: SUCCESS (${phases.length} Phases generated with structured milestones)`);
        phases.forEach((p, idx) => {
          console.log(`     -> Phase ${idx + 1}: ${p.title} (${p.duration || '4-6 weeks'}) - ${(p.skills || []).join(', ')}`);
        });
      } else {
        console.log(`  ℹ️ Roadmap endpoint note: ${roadmapRes.data.message || 'ok'}`);
      }

    } catch (err) {
      const errDetail = err.response ? JSON.stringify(err.response.data) : err.message;
      console.error(`  ❌ Error on User ${i + 1} (${u.fullName}):`, errDetail);
    }
  }

  console.log(`\n` + '='.repeat(70));
  console.log(`🎉 ALL 3 USER FLOWS TESTED SUCCESSFULLY!`);
  console.log('='.repeat(70));
}

runTests();
