const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Company = require('../models/Company');
const PortalJob = require('../models/PortalJob');
const StudentApplication = require('../models/StudentApplication');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const { successResponse, errorResponse } = require('../utils/response');

// ─────────────────────────────────────────────────────────────
//  Multer Logo Upload Configuration
// ─────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `company-logo-${req.user._id}-${unique}${ext}`);
  }
});

const logoFileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (.png, .jpg, .jpeg, .svg, .webp) are allowed'), false);
  }
};

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: logoFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ─────────────────────────────────────────────────────────────
//  Middleware to Resolve & Enforce Company Ownership
// ─────────────────────────────────────────────────────────────
const resolveCompany = async (req, res, next) => {
  try {
    let company = null;

    if (req.user.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    if (!company) {
      company = await Company.findOne({ createdBy: req.user._id });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'No company profile found associated with your account. Please complete company registration.'
      });
    }

    // Attach company to request
    req.company = company;
    next();
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// All routes in this router require authentication and Recruiter / Company / Admin role
router.use(protect);
router.use(requireRole('recruiter', 'company', 'admin'));

// ─────────────────────────────────────────────────────────────
//  COMPANY PROFILE ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /api/company/profile — Get authenticated company's profile
router.get('/profile', resolveCompany, async (req, res) => {
  try {
    const company = req.company;
    const [jobCount, activeJobCount, applicationCount] = await Promise.all([
      PortalJob.countDocuments({ companyId: company._id }),
      PortalJob.countDocuments({ companyId: company._id, status: 'active' }),
      StudentApplication.countDocuments({ companyId: company._id })
    ]);

    return res.json({
      success: true,
      data: {
        ...company.toObject(),
        stats: {
          totalJobs: jobCount,
          activeJobs: activeJobCount,
          totalApplications: applicationCount
        }
      }
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// PUT /api/company/profile — Update company profile
router.put('/profile', resolveCompany, async (req, res) => {
  try {
    const company = req.company;
    const {
      name,
      description,
      industry,
      officialWebsite,
      careersUrl,
      headquarters,
      locations,
      contactEmail,
      contactPhone,
      logoUrl
    } = req.body;

    const previousName = company.name;

    if (name && name.trim()) {
      company.name = name.trim();
      company.normalizedName = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }
    if (description !== undefined) company.description = description ? description.trim() : null;
    if (industry !== undefined) company.industry = industry ? industry.trim() : null;
    if (officialWebsite !== undefined) company.officialWebsite = officialWebsite ? officialWebsite.trim() : null;
    if (careersUrl !== undefined) company.careersUrl = careersUrl ? careersUrl.trim() : null;
    if (headquarters !== undefined) company.headquarters = headquarters ? headquarters.trim() : null;
    if (Array.isArray(locations)) company.locations = locations.filter(l => typeof l === 'string' && l.trim());
    if (contactEmail !== undefined) company.contactEmail = contactEmail ? contactEmail.trim().toLowerCase() : null;
    if (contactPhone !== undefined) company.contactPhone = contactPhone ? contactPhone.trim() : null;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;

    await company.save();

    // If company name was updated, synchronize active company name on all company's posted jobs
    if (name && name.trim() !== previousName) {
      await PortalJob.updateMany(
        { companyId: company._id },
        { $set: { companyName: company.name } }
      );
    }

    // Log update
    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'company_updated',
      entityType: 'company',
      entityId: company._id,
      newValues: { name: company.name, industry: company.industry }
    });

    return successResponse(res, company, 'Company profile updated successfully');
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(res, 'A company with this normalized name already exists', 400);
    }
    return errorResponse(res, err.message);
  }
});

// POST /api/company/logo — Upload company logo
router.post('/logo', resolveCompany, uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No image file uploaded', 400);
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    req.company.logoUrl = logoUrl;
    await req.company.save();

    return successResponse(res, {
      logoUrl,
      filename: req.file.filename,
      size: req.file.size
    }, 'Company logo uploaded successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────
//  DASHBOARD & STATS
// ─────────────────────────────────────────────────────────────

// GET /api/company/stats — Recruiter dashboard KPIs (strictly scoped to this company)
router.get('/stats', resolveCompany, async (req, res) => {
  try {
    const companyId = req.company._id;

    const [
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      awaitingReview,
      shortlisted,
      interviewsScheduled,
      selected,
      rejected
    ] = await Promise.all([
      PortalJob.countDocuments({ companyId }),
      PortalJob.countDocuments({ companyId, status: 'active' }),
      PortalJob.countDocuments({ companyId, status: 'draft' }),
      PortalJob.countDocuments({ companyId, status: { $in: ['closed', 'expired'] } }),
      StudentApplication.countDocuments({ companyId }),
      StudentApplication.countDocuments({ companyId, status: { $in: ['applied', 'under_review'] } }),
      StudentApplication.countDocuments({ companyId, status: 'shortlisted' }),
      StudentApplication.countDocuments({ companyId, status: 'interview_scheduled' }),
      StudentApplication.countDocuments({ companyId, status: 'selected' }),
      StudentApplication.countDocuments({ companyId, status: 'rejected' })
    ]);

    // Recent applications (last 6)
    const recentApplications = await StudentApplication.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('jobId', 'title location employmentType')
      .populate('studentId', 'fullName email')
      .lean();

    // Recent jobs (last 5)
    const recentJobs = await PortalJob.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Enrich recent jobs with application counts
    const jobIds = recentJobs.map(j => j._id);
    const appCounts = await StudentApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } }
    ]);
    const appCountMap = {};
    appCounts.forEach(ac => { appCountMap[ac._id.toString()] = ac.count; });

    const enrichedRecentJobs = recentJobs.map(job => ({
      ...job,
      applicantCount: appCountMap[job._id.toString()] || 0
    }));

    return res.json({
      success: true,
      data: {
        company: {
          id: req.company._id,
          name: req.company.name,
          verificationStatus: req.company.verificationStatus,
          status: req.company.status,
          logoUrl: req.company.logoUrl
        },
        kpis: {
          totalJobs,
          activeJobs,
          draftJobs,
          closedJobs,
          totalApplications,
          awaitingReview,
          shortlisted,
          interviewsScheduled,
          selected,
          rejected
        },
        recentApplications,
        recentJobs: enrichedRecentJobs
      }
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────
//  JOB MANAGEMENT (CRUD)
// ─────────────────────────────────────────────────────────────

// GET /api/company/jobs — List company's jobs with filters & stats
router.get('/jobs', resolveCompany, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const filter = { companyId: req.company._id };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: regex },
        { location: regex },
        { requiredSkills: regex }
      ];
    }

    const total = await PortalJob.countDocuments(filter);
    const jobs = await PortalJob.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Aggregate applicant counts per job
    const jobIds = jobs.map(j => j._id);
    const appCounts = await StudentApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    appCounts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const enriched = jobs.map(j => ({
      ...j,
      applicantCount: countMap[j._id.toString()] || 0
    }));

    return res.json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

function normalizeEmploymentType(val) {
  if (!val) return 'full_time';
  const v = String(val).toLowerCase().replace(/[^a-z]/g, '');
  if (v.includes('full')) return 'full_time';
  if (v.includes('part')) return 'part_time';
  if (v.includes('intern')) return 'internship';
  if (v.includes('contract')) return 'contract';
  if (v.includes('free')) return 'freelance';
  return 'other';
}

function normalizeExperienceLevel(val) {
  if (!val) return 'not_specified';
  const v = String(val).toLowerCase();
  if (v.includes('fresh')) return 'fresher';
  if (v.includes('entry') || v.includes('junior')) return 'entry';
  if (v.includes('lead') || v.includes('principal')) return 'lead';
  if (v.includes('senior') || v.includes('sr')) return 'senior';
  if (v.includes('mid')) return 'mid';
  if (v.includes('exec') || v.includes('director')) return 'executive';
  return 'not_specified';
}

function normalizeWorkMode(val) {
  if (!val) return 'not_specified';
  const v = String(val).toLowerCase();
  if (v.includes('remote')) return 'remote';
  if (v.includes('hybrid')) return 'hybrid';
  if (v.includes('site') || v.includes('office') || v.includes('on')) return 'onsite';
  return 'not_specified';
}

// POST /api/company/jobs — Create / Publish a job opening
router.post('/jobs', resolveCompany, async (req, res) => {
  try {
    const data = req.body;

    // Required field validation
    if (!data.title || !data.title.trim()) {
      return errorResponse(res, 'Job title is required', 400);
    }
    if (!data.description || !data.description.trim()) {
      return errorResponse(res, 'Job description is required', 400);
    }

    // Company verification check:
    // If company is officially verified, jobs are verified. If pending review, job verification is pending.
    const isCompanyVerified = req.company.verificationStatus === 'officially_verified';
    const initialVerificationStatus = isCompanyVerified ? 'officially_verified' : 'pending_review';

    // Status: draft or active
    const initialStatus = data.status === 'draft' ? 'draft' : 'active';

    // Responsibilities and skills parsing
    const responsibilities = Array.isArray(data.responsibilities)
      ? data.responsibilities.filter(r => typeof r === 'string' && r.trim())
      : (data.responsibilities ? String(data.responsibilities).split('\n').map(s => s.trim()).filter(Boolean) : []);

    const requiredSkills = Array.isArray(data.requiredSkills)
      ? data.requiredSkills.filter(s => typeof s === 'string' && s.trim())
      : (data.requiredSkills ? String(data.requiredSkills).split(',').map(s => s.trim()).filter(Boolean) : []);

    const preferredSkills = Array.isArray(data.preferredSkills)
      ? data.preferredSkills.filter(s => typeof s === 'string' && s.trim())
      : (data.preferredSkills ? String(data.preferredSkills).split(',').map(s => s.trim()).filter(Boolean) : []);

    const eligibleDegrees = Array.isArray(data.eligibleDegrees)
      ? data.eligibleDegrees.filter(Boolean)
      : (data.eligibleDegrees ? String(data.eligibleDegrees).split(',').map(s => s.trim()).filter(Boolean) : []);

    const eligibleBranches = Array.isArray(data.eligibleBranches)
      ? data.eligibleBranches.filter(Boolean)
      : (data.eligibleBranches ? String(data.eligibleBranches).split(',').map(s => s.trim()).filter(Boolean) : []);

    const eligibleGraduationYears = Array.isArray(data.eligibleGraduationYears)
      ? data.eligibleGraduationYears.map(Number).filter(n => !isNaN(n))
      : (data.eligibleGraduationYears ? [Number(data.eligibleGraduationYears)].filter(n => !isNaN(n)) : []);

    const hiringStages = Array.isArray(data.hiringStages)
      ? data.hiringStages.filter(Boolean)
      : (data.hiringStages ? String(data.hiringStages).split(',').map(s => s.trim()).filter(Boolean) : []);

    // Create job locked strictly to authenticated company!
    const job = await PortalJob.create({
      companyId: req.company._id,
      companyName: req.company.name, // Securely taken from company record, no impersonation!
      title: data.title.trim(),
      description: data.description.trim(),
      responsibilities,
      requiredSkills,
      preferredSkills,
      employmentType: normalizeEmploymentType(data.employmentType),
      experienceLevel: normalizeExperienceLevel(data.experienceLevel),
      eligibleDegrees,
      eligibleBranches,
      eligibleGraduationYears,
      minimumCGPA: data.minimumCGPA !== undefined && data.minimumCGPA !== '' ? Number(data.minimumCGPA) : null,
      backlogCriteria: data.backlogCriteria?.trim() || null,
      location: data.location?.trim() || req.company.headquarters || 'Remote / Hybrid',
      workMode: normalizeWorkMode(data.workMode),
      salaryMin: data.salaryMin ? Number(data.salaryMin) : null,
      salaryMax: data.salaryMax ? Number(data.salaryMax) : null,
      salaryCurrency: data.salaryCurrency || 'INR',
      salaryPeriod: data.salaryPeriod || 'annual',
      salaryDisclosureStatus: data.salaryMin ? 'disclosed' : 'undisclosed',
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      bondStatus: data.bondStatus || 'no_bond',
      bondDuration: data.bondDuration || null,
      bondTerms: data.bondTerms || null,
      hiringStages: hiringStages.length ? hiringStages : ['Resume Screening', 'Technical Round', 'Final Interview'],
      postedAt: new Date(),
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
      applicationUrl: data.applicationUrl?.trim() || null,
      applicationInstructions: data.applicationInstructions?.trim() || null,
      vacancies: data.vacancies ? Math.max(1, Number(data.vacancies)) : 1,
      sourceType: 'official_employer',
      sourceName: req.company.name,
      verificationStatus: initialVerificationStatus,
      status: initialStatus,
      isDemonstration: false,
      createdBy: req.user._id
    });

    // Audit log
    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'job_created',
      entityType: 'portal_job',
      entityId: job._id,
      newValues: {
        title: job.title,
        companyName: req.company.name,
        status: job.status
      }
    });

    const msg = !isCompanyVerified && initialStatus === 'active'
      ? 'Job saved! Your company verification is pending admin review. The job will be fully public once company is verified.'
      : initialStatus === 'draft'
        ? 'Job saved as draft'
        : 'Job opening published successfully!';

    return successResponse(res, job, msg, 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/company/jobs/:id — Get single job details (scoped to company)
router.get('/jobs/:id', resolveCompany, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid job ID', 400);
    }

    const job = await PortalJob.findOne({
      _id: req.params.id,
      companyId: req.company._id
    }).lean();

    if (!job) {
      return errorResponse(res, 'Job opening not found or access denied', 404);
    }

    const applicantCount = await StudentApplication.countDocuments({ jobId: job._id });

    return successResponse(res, { ...job, applicantCount });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// PUT /api/company/jobs/:id — Update job opening
router.put('/jobs/:id', resolveCompany, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid job ID', 400);
    }

    const job = await PortalJob.findOne({
      _id: req.params.id,
      companyId: req.company._id
    });

    if (!job) {
      return errorResponse(res, 'Job not found or access denied', 404);
    }

    const data = req.body;
    const allowed = [
      'title', 'description', 'responsibilities', 'requiredSkills', 'preferredSkills',
      'employmentType', 'experienceLevel', 'eligibleDegrees', 'eligibleBranches',
      'eligibleGraduationYears', 'minimumCGPA', 'backlogCriteria', 'location',
      'workMode', 'salaryMin', 'salaryMax', 'salaryCurrency', 'salaryPeriod',
      'salaryDisclosureStatus', 'benefits', 'bondStatus', 'bondDuration', 'bondTerms',
      'hiringStages', 'applicationDeadline', 'applicationUrl', 'applicationInstructions',
      'vacancies', 'status'
    ];

    allowed.forEach(field => {
      if (data[field] !== undefined) {
        if (field === 'responsibilities' && typeof data[field] === 'string') {
          job[field] = data[field].split('\n').map(s => s.trim()).filter(Boolean);
        } else if (['requiredSkills', 'preferredSkills', 'eligibleDegrees', 'eligibleBranches'].includes(field) && typeof data[field] === 'string') {
          job[field] = data[field].split(',').map(s => s.trim()).filter(Boolean);
        } else if (field === 'employmentType') {
          job[field] = normalizeEmploymentType(data[field]);
        } else if (field === 'experienceLevel') {
          job[field] = normalizeExperienceLevel(data[field]);
        } else if (field === 'workMode') {
          job[field] = normalizeWorkMode(data[field]);
        } else {
          job[field] = data[field];
        }
      }
    });

    // Company name always stays linked to company
    job.companyName = req.company.name;
    await job.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'job_updated',
      entityType: 'portal_job',
      entityId: job._id,
      newValues: { title: job.title, status: job.status }
    });

    return successResponse(res, job, 'Job updated successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// PATCH /api/company/jobs/:id/status — Toggle job status (active, closed, draft, archived)
router.patch('/jobs/:id/status', resolveCompany, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['active', 'closed', 'draft', 'archived'];
    if (!valid.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${valid.join(', ')}`, 400);
    }

    const job = await PortalJob.findOne({
      _id: req.params.id,
      companyId: req.company._id
    });

    if (!job) {
      return errorResponse(res, 'Job not found or access denied', 404);
    }

    job.status = status;
    await job.save();

    return successResponse(res, job, `Job status updated to ${status}`);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// DELETE /api/company/jobs/:id — Archive or delete job
router.delete('/jobs/:id', resolveCompany, async (req, res) => {
  try {
    const job = await PortalJob.findOne({
      _id: req.params.id,
      companyId: req.company._id
    });

    if (!job) {
      return errorResponse(res, 'Job not found or access denied', 404);
    }

    const appCount = await StudentApplication.countDocuments({ jobId: job._id });
    if (appCount > 0) {
      // If students already applied, preserve data integrity by archiving
      job.status = 'archived';
      await job.save();
      return successResponse(res, { archived: true }, 'Job has applicants; safely archived instead of deleted to preserve records.');
    } else {
      await PortalJob.deleteOne({ _id: job._id });
      return successResponse(res, { deleted: true }, 'Job opening deleted successfully');
    }
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────
//  APPLICANTS MANAGEMENT
// ─────────────────────────────────────────────────────────────

// GET /api/company/applicants — View all student applicants for company's jobs
router.get('/applicants', resolveCompany, async (req, res) => {
  try {
    const {
      jobId,
      status,
      search,
      graduationYear,
      minCGPA,
      skills,
      page = 1,
      limit = 25
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    // Base filter: strictly applications for this company
    const filter = {
      companyId: req.company._id,
      status: { $ne: 'interested' } // Exclude bookmarked jobs, only actual applications!
    };

    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      filter.jobId = jobId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { 'applicantData.fullName': regex },
        { 'applicantData.email': regex },
        { 'applicantData.university': regex },
        { 'applicantData.branch': regex },
        { 'applicantData.skills': regex },
        { coverNote: regex }
      ];
    }

    if (graduationYear) {
      filter['applicantData.graduationYear'] = Number(graduationYear);
    }

    if (minCGPA) {
      filter['applicantData.cgpa'] = { $gte: Number(minCGPA) };
    }

    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillArr.length) {
        filter['applicantData.skills'] = { $in: skillArr.map(s => new RegExp(s, 'i')) };
      }
    }

    const total = await StudentApplication.countDocuments(filter);
    const applications = await StudentApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('jobId', 'title location employmentType experienceLevel')
      .populate('studentId', 'fullName email')
      .lean();

    return res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// PATCH /api/company/applications/:id/status — Update applicant status
router.patch('/applications/:id/status', resolveCompany, async (req, res) => {
  try {
    const { status, note } = req.body;

    const validStatuses = [
      'applied',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'selected',
      'rejected'
    ];

    if (!validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Verify application belongs to this company
    const application = await StudentApplication.findOne({
      _id: req.params.id,
      companyId: req.company._id
    });

    if (!application) {
      return errorResponse(res, 'Application not found or unauthorized', 404);
    }

    const previousStatus = application.status;
    application.status = status;

    // Record status history with actor and timestamp
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: note ? note.trim() : `Status updated from ${previousStatus} to ${status}`
    });

    await application.save();

    // Log in AuditLog
    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'application_status_updated',
      entityType: 'student_application',
      entityId: application._id,
      previousValues: { status: previousStatus },
      newValues: { status },
      reason: note || null
    });

    return successResponse(res, application, `Application status updated to ${status}`);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

module.exports = router;
