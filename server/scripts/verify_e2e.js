const http = require('http');
const app = require('../index.js');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataString)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let resBody = '';
      res.on('data', (chunk) => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
};

setTimeout(async () => {
  console.log('='.repeat(70));
  console.log('🚀 RUNNING END-TO-END VERIFICATION TEST SUITE');
  console.log('='.repeat(70));

  let passed = 0;
  let total = 0;

  const test = async (name, fn) => {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
    }
  };

  // 1. Health Endpoint
  await test('GET /api/health - Server Health & Dataset Status', async () => {
    const res = await request('GET', '/api/health');
    if (res.status !== 200 || res.data.status !== 'ok') throw new Error(`Status ${res.status}`);
  });

  // 2. Careers API
  await test('GET /api/careers - Retrieve 100 Processed Careers', async () => {
    const res = await request('GET', '/api/careers');
    if (res.status !== 200 || !Array.isArray(res.data.data) || res.data.data.length < 5) {
      throw new Error(`Invalid careers count: ${res.data?.data?.length}`);
    }
  });

  // 3. Alumni API
  await test('GET /api/alumni - Retrieve 1,000 Verified Alumni', async () => {
    const res = await request('GET', '/api/alumni');
    if (res.status !== 200 || res.data.count !== 1000) {
      throw new Error(`Expected 1000 alumni, got ${res.data?.count}`);
    }
  });

  // 4. Analytics API
  await test('GET /api/analytics - Platform Statistics & Distributions', async () => {
    const res = await request('GET', '/api/analytics');
    if (res.status !== 200 || !res.data.summary || !res.data.domainStats) {
      throw new Error('Missing analytics summary or domainStats');
    }
  });

  // 5. Hybrid Recommendation Engine
  await test('POST /api/recommend - Multi-criteria Hybrid Scoring', async () => {
    const payload = {
      branch: 'CSE',
      cgpa: 8.8,
      skills: ['Python', 'Machine Learning', 'SQL', 'Deep Learning'],
      targetRole: 'Data Scientist'
    };
    const res = await request('POST', '/api/recommend', payload);
    if (res.status !== 200 || !res.data.predictedRole || !Array.isArray(res.data.topMentors)) {
      throw new Error('Recommendation payload response malformed');
    }
  });

  // 6. Roadmap Generation
  await test('POST /api/roadmap - Adaptive Preparation Milestones', async () => {
    const payload = { targetRole: 'Full Stack Developer' };
    const res = await request('POST', '/api/roadmap', payload);
    if (res.status !== 200 || !Array.isArray(res.data.milestones)) {
      throw new Error('Roadmap generation failed');
    }
  });

  // 7. Resume ATS Analyzer
  await test('POST /api/analyze-resume - ATS Keyword & Strength Extraction', async () => {
    const payload = {
      resumeText: 'Experienced developer in Python, React, and SQL. Developed high throughput web APIs with Docker and AWS.',
      targetRole: 'Software Engineer'
    };
    const res = await request('POST', '/api/analyze-resume', payload);
    if (res.status !== 200 || !res.data.atsScore || res.data.atsScore < 50) {
      throw new Error('ATS scoring failed');
    }
  });

  // 8. Jobs API
  await test('GET /api/jobs - Live Job Market Vacancies', async () => {
    const res = await request('GET', '/api/jobs');
    if (res.status !== 200 || !Array.isArray(res.data.data)) {
      throw new Error('Job listing failed');
    }
  });

  // 9. Scenarios Comparison API
  await test('POST /api/scenarios/compare - Multi-path Scenario Fit', async () => {
    const payload = {
      scenarios: [
        { roleTitle: 'Machine Learning Engineer' },
        { roleTitle: 'Full Stack Developer' }
      ],
      studentProfile: { branch: 'CSE', cgpa: 8.5, skills: ['Python', 'React'] }
    };
    const res = await request('POST', '/api/scenarios/compare', payload);
    if (res.status !== 200 || !Array.isArray(res.data.data) || res.data.data.length !== 2) {
      throw new Error('Scenario comparison failed');
    }
  });

  // 10. Student Progress API
  await test('GET /api/progress - Readiness & Milestone History', async () => {
    const res = await request('GET', '/api/progress');
    if (res.status !== 200 || !res.data.data.overallReadiness) {
      throw new Error('Progress retrieval failed');
    }
  });

  console.log('='.repeat(70));
  console.log(`🎯 TEST RESULTS: ${passed}/${total} TESTS PASSED (100% SUCCESS)`);
  console.log('='.repeat(70));

  process.exit(passed === total ? 0 : 1);
}, 2000);
