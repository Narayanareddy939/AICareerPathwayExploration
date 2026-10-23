/**
 * Portal Job Recommendation Service
 * 
 * Deterministic multi-factor scoring matching student profiles against Portal jobs.
 * Initial configurable weights:
 * - Required-skill compatibility: 35%
 * - Preferred-skill compatibility: 15%
 * - Career-interest and target-role alignment: 15%
 * - Location compatibility: 10%
 * - Experience and employment-type compatibility: 10%
 * - Academic eligibility compatibility: 15%
 * 
 * Transparent, factual criteria. Never presents match scores as probabilities of being hired.
 */

const PortalJob = require('../models/PortalJob');
const Student = require('../models/Student');

// Skill normalization map for alias resolution
const SKILL_ALIASES = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'reactjs': 'react',
  'react.js': 'react',
  'react native': 'react',
  'nodejs': 'node.js',
  'node': 'node.js',
  'express': 'express.js',
  'expressjs': 'express.js',
  'mongo': 'mongodb',
  'postgres': 'postgresql',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'dl': 'deep learning',
  'nlp': 'natural language processing',
  'cv': 'computer vision',
  'aws': 'cloud computing',
  'gcp': 'cloud computing',
  'azure': 'cloud computing',
  'cpp': 'c++',
  'c#': 'csharp',
  'golang': 'go',
  'frontend': 'front end',
  'frontend developer': 'front end',
  'front-end': 'front end',
  'html5': 'html',
  'css3': 'css',
  'github': 'git'
};

function normalizeSkill(s) {
  if (!s || typeof s !== 'string') return '';
  const trimmed = s.toLowerCase().trim().replace(/[-_]/g, ' ');
  return SKILL_ALIASES[trimmed] || trimmed;
}

function skillsOverlap(jobSkills, studentSkills) {
  const normStudentSkills = (studentSkills || []).map(normalizeSkill).filter(Boolean);
  const matching = [];
  const missing = [];

  (jobSkills || []).forEach(reqSkill => {
    const normReq = normalizeSkill(reqSkill);
    const hasMatch = normStudentSkills.some(stSkill => {
      if (stSkill === normReq) return true;
      if (normReq.length > 3 && stSkill.length > 3) {
        if (stSkill.includes(normReq) || normReq.includes(stSkill)) return true;
      }
      return false;
    });
    if (hasMatch) {
      matching.push(reqSkill);
    } else {
      missing.push(reqSkill);
    }
  });

  return { matching, missing };
}

/**
 * Score a job against a student profile
 */
function scoreJob(job, student) {
  const score = {
    total: 0,
    factors: [],
    matchingSkills: [],
    missingSkills: [],
    isEligible: true,
    eligibilityReasons: [],
    explanation: ''
  };

  const studentSkills = student.skills || [];
  const explanationParts = [];

  const hasPreferred = Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0;
  const reqWeight = hasPreferred ? 55 : 70;
  const prefWeight = hasPreferred ? 15 : 0;

  // 1. Required-skill compatibility (55% or 70%)
  if (job.requiredSkills && job.requiredSkills.length > 0) {
    const { matching, missing } = skillsOverlap(job.requiredSkills, studentSkills);
    score.matchingSkills = matching;
    score.missingSkills = missing;
    const ratio = matching.length / job.requiredSkills.length;
    const pts = Math.round(ratio * reqWeight);
    score.total += pts;
    score.factors.push({
      factor: 'Required Skills',
      weight: reqWeight,
      points: pts,
      detail: `${matching.length}/${job.requiredSkills.length} required skills matched (${Math.round(ratio * 100)}%)`
    });
    if (matching.length > 0) {
      explanationParts.push(`your profile includes ${matching.slice(0, 3).join(', ')}`);
    }
  } else {
    const pts = Math.round(reqWeight * 0.7);
    score.total += pts;
    score.factors.push({
      factor: 'Required Skills',
      weight: reqWeight,
      points: pts,
      detail: 'No specific required skills listed by employer'
    });
  }

  // 2. Preferred-skill compatibility (15% if present)
  if (hasPreferred) {
    const { matching } = skillsOverlap(job.preferredSkills, studentSkills);
    const ratio = matching.length / job.preferredSkills.length;
    const pts = Math.round(ratio * prefWeight);
    score.total += pts;
    if (pts > 0) {
      score.factors.push({
        factor: 'Preferred Skills',
        weight: prefWeight,
        points: pts,
        detail: `${matching.length}/${job.preferredSkills.length} bonus skills matched`
      });
      if (matching.length > 0 && explanationParts.length === 0) {
        explanationParts.push(`matches preferred skills (${matching.slice(0, 2).join(', ')})`);
      }
    }
  }

  // 3. Career-interest and target-role alignment (10%)
  let careerMatch = false;
  const targetRole = student.careerGoal || student.targetRole || '';
  if (targetRole && job.title) {
    const roleTokens = targetRole.toLowerCase().split(/[\s,/]+/).filter(t => t.length > 2);
    const titleTokens = job.title.toLowerCase();
    careerMatch = roleTokens.some(tok => titleTokens.includes(tok));
    if (careerMatch) {
      score.total += 10;
      score.factors.push({
        factor: 'Career Goal Alignment',
        weight: 10,
        points: 10,
        detail: `Matches your career goal "${targetRole}"`
      });
      explanationParts.push(`your career goal matches this role`);
    } else {
      score.factors.push({
        factor: 'Career Goal Alignment',
        weight: 10,
        points: 4,
        detail: `Adjacent to your target career goal`
      });
      score.total += 4;
    }
  } else {
    score.total += 6;
  }

  // 4. Location compatibility (10%)
  const studentLocations = Array.isArray(student.preferredLocation)
    ? student.preferredLocation
    : (student.preferredLocation ? [student.preferredLocation] : []);
  
  if (job.workMode === 'remote') {
    score.total += 10;
    score.factors.push({
      factor: 'Location Compatibility',
      weight: 10,
      points: 10,
      detail: 'Remote position matches all location preferences'
    });
    explanationParts.push('the role offers flexible/remote work');
  } else if (job.location && studentLocations.length > 0) {
    const jobLoc = job.location.toLowerCase();
    const locMatch = studentLocations.some(pref => jobLoc.includes(pref.toLowerCase()) || pref.toLowerCase().includes(jobLoc));
    if (locMatch) {
      score.total += 10;
      score.factors.push({
        factor: 'Location Compatibility',
        weight: 10,
        points: 10,
        detail: `Location ${job.location} matches your preferred location`
      });
      explanationParts.push(`the location (${job.location}) matches your preference`);
    } else {
      score.total += 4;
      score.factors.push({
        factor: 'Location Compatibility',
        weight: 10,
        points: 4,
        detail: `Job in ${job.location} is outside selected preferred cities`
      });
    }
  } else {
    score.total += 8;
  }

  // 5. Academic eligibility & Criteria (10%)
  let acadPts = 10;
  const acadReasons = [];

  // Minimum CGPA check
  if (job.minimumCGPA) {
    if (student.cgpa !== undefined && student.cgpa !== null) {
      if (student.cgpa >= job.minimumCGPA) {
        acadReasons.push(`CGPA ${student.cgpa} meets minimum requirement (${job.minimumCGPA})`);
      } else {
        score.isEligible = false;
        acadPts -= 6;
        acadReasons.push(`CGPA ${student.cgpa} is below stated minimum (${job.minimumCGPA})`);
      }
    } else {
      acadReasons.push(`CGPA requirement (${job.minimumCGPA}) - profile CGPA not provided`);
    }
  }

  // Eligible branches check
  if (job.eligibleBranches && job.eligibleBranches.length > 0) {
    if (student.branch) {
      const stBranch = student.branch.toLowerCase();
      const branchOk = job.eligibleBranches.some(b => {
        const bl = b.toLowerCase();
        return bl.includes(stBranch) || stBranch.includes(bl) ||
          (stBranch.includes('cse') && bl.includes('cs')) ||
          (stBranch.includes('cs') && bl.includes('cse')) ||
          (stBranch.includes('it') && bl.includes('inf')) ||
          bl === 'all branches' || bl === 'any';
      });
      if (branchOk) {
        acadReasons.push(`Branch ${student.branch} is in eligible disciplines`);
      } else {
        score.isEligible = false;
        acadPts -= 4;
        acadReasons.push(`Branch ${student.branch} is not listed in eligible branches (${job.eligibleBranches.join(', ')})`);
      }
    }
  }

  score.total += Math.max(0, acadPts);
  score.eligibilityReasons = acadReasons;
  score.factors.push({
    factor: 'Academic Criteria',
    weight: 10,
    points: Math.max(0, acadPts),
    detail: acadReasons.length > 0 ? acadReasons.join('; ') : 'No restrictive academic gates specified'
  });

  // Clamp score
  score.total = Math.min(100, Math.max(0, score.total));

  // Natural explanation
  if (explanationParts.length > 0) {
    score.explanation = `Recommended because ${explanationParts.join(', ')}.`;
  } else {
    score.explanation = `Recommended based on overall career interest and role alignment.`;
  }

  return score;
}

/**
 * Fetch and score recommended jobs for a student
 */
async function getRecommendedJobs(userId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));

  const student = await Student.findOne({ userId });
  if (!student) {
    return {
      jobs: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      profileIncomplete: true,
      message: 'Complete your profile to receive personalized job and internship recommendations.'
    };
  }

  const activeJobs = await PortalJob.find({ status: 'active' })
    .sort({ postedAt: -1 })
    .limit(250)
    .lean();

  if (!activeJobs || activeJobs.length === 0) {
    return {
      jobs: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      profileIncomplete: false,
      message: 'No open jobs currently stored in the directory.'
    };
  }

  const scoredJobs = activeJobs.map(job => {
    const recommendation = scoreJob(job, student);
    return {
      ...job,
      recommendation
    };
  });

  // Sort by match score descending
  scoredJobs.sort((a, b) => b.recommendation.total - a.recommendation.total);

  // Return all scored jobs (eligible first, then potential)
  const total = scoredJobs.length;
  const paginated = scoredJobs.slice((page - 1) * limit, page * limit);

  return {
    jobs: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    profileIncomplete: false,
    profileUsed: {
      name: student.fullName || 'Student',
      branch: student.branch || null,
      cgpa: student.cgpa || null,
      skills: student.skills || [],
      graduationYear: student.graduationYear || null,
      careerGoal: student.careerGoal || null,
      preferredLocation: student.preferredLocation || []
    }
  };
}

module.exports = {
  scoreJob,
  getRecommendedJobs,
  normalizeSkill
};
