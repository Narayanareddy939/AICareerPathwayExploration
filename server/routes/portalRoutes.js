/**
 * Portal Routes — Companies & Careers
 * 
 * Public + authenticated + admin endpoints for the Companies & Careers portal.
 * Mounted at /api/portal in server/index.js
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Company = require('../models/Company');
const PortalJob = require('../models/PortalJob');
const StudentApplication = require('../models/StudentApplication');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { syncFromAdzuna, getSyncStatus, markStaleJobs, findOrCreateCompany, validateApplicationUrl } = require('../services/jobSyncService');
const { getRecommendedJobs } = require('../services/portalRecommendationService');
const adzunaProvider = require('../services/jobProviders/adzunaProvider');

// ═══════════════════════════════════════════════════════
//  COMPANY ENDPOINTS
// ═══════════════════════════════════════════════════════

// GET /api/portal/companies — List/search companies
router.get('/companies', async (req, res) => {
  try {
    const { search, industry, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
    }
    if (industry) {
      filter.industry = { $regex: industry, $options: 'i' };
    }

    const total = await Company.countDocuments(filter);
    const companies = await Company.find(filter)
      .sort({ name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Get job counts per company
    const companyIds = companies.map(c => c._id);
    const jobCounts = await PortalJob.aggregate([
      { $match: { companyId: { $in: companyIds }, status: 'active' } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    jobCounts.forEach(jc => { countMap[jc._id.toString()] = jc.count; });

    const enriched = companies.map(c => ({
      ...c,
      activeJobCount: countMap[c._id.toString()] || 0,
    }));

    return res.json({
      success: true,
      data: enriched,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/portal/companies/:id — Company detail
router.get('/companies/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid company ID', 400);
    }
    const company = await Company.findById(req.params.id).lean();
    if (!company) return errorResponse(res, 'Company not found', 404);

    // Get active jobs for this company
    const jobs = await PortalJob.find({ companyId: company._id, status: 'active' })
      .sort({ postedAt: -1 })
      .limit(50)
      .lean();

    return successResponse(res, { company, jobs }, 'Company details retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════
//  JOB LISTING ENDPOINTS
// ═══════════════════════════════════════════════════════

// GET /api/portal/jobs — Search/filter portal jobs
router.get('/jobs', async (req, res) => {
  try {
    const {
      search, company, location, employmentType, experienceLevel, workMode,
      skills, minSalary, maxSalary, fresherOnly, internshipOnly,
      graduationYear, status: statusFilter, verificationStatus,
      sortBy, page = 1, limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (statusFilter === 'closed') {
      filter.status = { $in: ['closed', 'expired'] };
    } else if (statusFilter === 'all') {
      // no status filter, return all
    } else {
      filter.status = statusFilter || 'active';
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { title: searchRegex },
        { companyName: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { requiredSkills: searchRegex },
        { preferredSkills: searchRegex },
      ];
    }
    if (company && company.trim()) {
      filter.companyName = new RegExp(company.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    if (location && location.trim()) {
      filter.location = new RegExp(location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    if (employmentType && employmentType !== 'all') filter.employmentType = employmentType;
    if (experienceLevel && experienceLevel !== 'all') filter.experienceLevel = experienceLevel;
    if (workMode && workMode !== 'all') filter.workMode = workMode;
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillList.length) {
        filter.requiredSkills = { $in: skillList.map(s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) };
      }
    }
    if (minSalary) filter.salaryMin = { $gte: parseInt(minSalary, 10) };
    if (maxSalary) filter.salaryMax = { $lte: parseInt(maxSalary, 10) };
    if (fresherOnly === 'true') filter.experienceLevel = { $in: ['fresher', 'entry'] };
    if (internshipOnly === 'true') filter.employmentType = 'internship';
    if (graduationYear) filter.eligibleGraduationYears = parseInt(graduationYear, 10);
    if (verificationStatus && verificationStatus !== 'all') filter.verificationStatus = verificationStatus;

    // Sort
    let sort = { postedAt: -1 }; // default: newest first
    if (sortBy === 'deadline') sort = { applicationDeadline: 1 };
    else if (sortBy === 'salary') sort = { salaryMax: -1 };
    else if (sortBy === 'title') sort = { title: 1 };

    const total = await PortalJob.countDocuments(filter);
    const jobs = await PortalJob.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      success: true,
      data: jobs,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/portal/jobs/featured — Featured/recently-published jobs
router.get('/jobs/featured', async (req, res) => {
  try {
    const [recent, fresher, internships, closingSoon] = await Promise.all([
      PortalJob.find({ status: 'active' }).sort({ postedAt: -1 }).limit(8).lean(),
      PortalJob.find({ status: 'active', experienceLevel: { $in: ['fresher', 'entry'] } }).sort({ postedAt: -1 }).limit(6).lean(),
      PortalJob.find({ status: 'active', employmentType: 'internship' }).sort({ postedAt: -1 }).limit(6).lean(),
      PortalJob.find({
        status: 'active',
        applicationDeadline: { $gt: new Date(), $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      }).sort({ applicationDeadline: 1 }).limit(6).lean(),
    ]);

    // Featured companies: companies with most active jobs
    const featuredCompanies = await PortalJob.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$companyId', companyName: { $first: '$companyName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Enrich with company details
    const companyIds = featuredCompanies.map(fc => fc._id).filter(Boolean);
    const companies = companyIds.length
      ? await Company.find({ _id: { $in: companyIds } }).lean()
      : [];
    const companyMap = {};
    companies.forEach(c => { companyMap[c._id.toString()] = c; });
    const enrichedCompanies = featuredCompanies
      .filter(fc => fc._id)
      .map(fc => ({
        ...(companyMap[fc._id.toString()] || {}),
        name: fc.companyName,
        activeJobCount: fc.count,
      }));

    const totalActive = await PortalJob.countDocuments({ status: 'active' });

    return successResponse(res, {
      recentJobs: recent,
      fresherJobs: fresher,
      internships,
      closingSoon,
      featuredCompanies: enrichedCompanies,
      totalActiveJobs: totalActive,
    }, 'Featured listings retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/portal/jobs/recommended — Personalized recommendations (auth required)
router.get('/jobs/recommended', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page, limit } = req.query;
    const result = await getRecommendedJobs(userId, { page, limit });
    return successResponse(res, result, 'Recommended jobs retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/portal/jobs/:id — Job detail
router.get('/jobs/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid job ID', 400);
    }
    const job = await PortalJob.findById(req.params.id).lean();
    if (!job) return errorResponse(res, 'Job not found', 404);

    // Get company details
    let company = null;
    if (job.companyId) {
      company = await Company.findById(job.companyId).lean();
    }

    // Get similar jobs (same company or overlapping skills)
    const similarFilter = {
      _id: { $ne: job._id },
      status: 'active',
      $or: [],
    };
    if (job.companyId) similarFilter.$or.push({ companyId: job.companyId });
    if (job.requiredSkills?.length) {
      similarFilter.$or.push({ requiredSkills: { $in: job.requiredSkills.slice(0, 3) } });
    }
    if (similarFilter.$or.length === 0) delete similarFilter.$or;
    const similarJobs = similarFilter.$or
      ? await PortalJob.find(similarFilter).sort({ postedAt: -1 }).limit(6).lean()
      : [];

    return successResponse(res, { job, company, similarJobs }, 'Job details retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════
//  STUDENT ACTIONS (auth required)
// ═══════════════════════════════════════════════════════

// GET /api/portal/saved-jobs — Get student's saved/tracked jobs
router.get('/saved-jobs', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const filter = { studentId: userId };
    if (status) filter.status = status;

    const total = await StudentApplication.countDocuments(filter);
    const applications = await StudentApplication.find(filter)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('jobId')
      .lean();

    return res.json({
      success: true,
      data: applications,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// POST /api/portal/jobs/:id/save — Save/bookmark a job
router.post('/jobs/:id/save', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const jobId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return errorResponse(res, 'Invalid job ID', 400);
    }

    const job = await PortalJob.findById(jobId);
    if (!job) return errorResponse(res, 'Job not found', 404);

    // Check if already saved
    const existing = await StudentApplication.findOne({ studentId: userId, jobId });
    if (existing) {
      return successResponse(res, existing, 'Job already saved');
    }

    const application = await StudentApplication.create({
      studentId: userId,
      jobId,
      status: 'interested',
      savedAt: new Date(),
      statusHistory: [{ status: 'interested', changedAt: new Date() }],
    });

    return successResponse(res, application, 'Job saved successfully', 201);
  } catch (err) {
    if (err.code === 11000) {
      return successResponse(res, null, 'Job already saved');
    }
    return errorResponse(res, err.message);
  }
});

// DELETE /api/portal/jobs/:id/save — Unsave a job
router.delete('/jobs/:id/save', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const result = await StudentApplication.deleteOne({
      studentId: userId,
      jobId: req.params.id,
      status: 'interested', // Only allow removing if just saved, not applied
    });
    if (result.deletedCount === 0) {
      return errorResponse(res, 'Saved job not found or already applied', 404);
    }
    return successResponse(res, null, 'Job unsaved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/portal/applications — Get student's application tracking
router.get('/applications', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const applications = await StudentApplication.find({ studentId: userId })
      .sort({ updatedAt: -1 })
      .populate('jobId')
      .lean();
    return successResponse(res, applications, 'Applications retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// POST /api/portal/jobs/:id/application-tracking — Start tracking an application
router.post('/jobs/:id/application-tracking', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const jobId = req.params.id;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return errorResponse(res, 'Invalid job ID', 400);
    }

    let application = await StudentApplication.findOne({ studentId: userId, jobId });

    if (application) {
      // Update existing
      application.status = 'applied';
      application.appliedAt = new Date();
      if (notes) application.notes = notes.substring(0, 2000);
      application.statusHistory.push({ status: 'applied', changedAt: new Date(), note: 'Marked as applied' });
      await application.save();
    } else {
      application = await StudentApplication.create({
        studentId: userId,
        jobId,
        status: 'applied',
        appliedAt: new Date(),
        notes: notes?.substring(0, 2000) || null,
        statusHistory: [
          { status: 'interested', changedAt: new Date() },
          { status: 'applied', changedAt: new Date() },
        ],
      });
    }

    return successResponse(res, application, 'Application tracking started');
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(res, 'Application already exists', 400);
    }
    return errorResponse(res, err.message);
  }
});

// PATCH /api/portal/applications/:id — Update application status
router.patch('/applications/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, notes } = req.body;

    const validStatuses = ['interested', 'applied', 'assessment', 'interview', 'offered', 'rejected', 'withdrawn'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const application = await StudentApplication.findById(req.params.id);
    if (!application) return errorResponse(res, 'Application not found', 404);

    // Ownership check
    if (application.studentId.toString() !== userId.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    if (status) {
      application.status = status;
      application.statusHistory.push({ status, changedAt: new Date(), note: notes || null });
    }
    if (notes !== undefined) application.notes = notes?.substring(0, 2000) || null;
    await application.save();

    return successResponse(res, application, 'Application updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════
//  ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════

// POST /api/portal/admin/companies — Create company
router.post('/admin/companies', protect, requireRole('admin', 'placement_cell'), async (req, res) => {
  try {
    const { name, officialWebsite, careersUrl, logoUrl, industry, description, headquarters, locations } = req.body;
    if (!name || !name.trim()) return errorResponse(res, 'Company name is required', 400);

    // Validate URLs
    if (officialWebsite && !validateApplicationUrl(officialWebsite)) {
      return errorResponse(res, 'Invalid official website URL', 400);
    }
    if (careersUrl && !validateApplicationUrl(careersUrl)) {
      return errorResponse(res, 'Invalid careers URL', 400);
    }

    const company = await Company.create({
      name: name.trim(),
      officialWebsite: officialWebsite || null,
      careersUrl: careersUrl || null,
      logoUrl: logoUrl || null,
      industry: industry || null,
      description: description || null,
      headquarters: headquarters || null,
      locations: locations || [],
      verificationStatus: 'pending_review',
      createdBy: req.user._id || req.user.id,
    });

    await AuditLog.create({
      actorId: req.user._id || req.user.id,
      actorEmail: req.user.email,
      action: 'company_created',
      entityType: 'company',
      entityId: company._id,
      newValues: { name: company.name, industry: company.industry },
    });

    return successResponse(res, company, 'Company created', 201);
  } catch (err) {
    if (err.code === 11000) return errorResponse(res, 'A company with this name already exists', 400);
    return errorResponse(res, err.message);
  }
});

// PATCH /api/portal/admin/companies/:id — Update company
router.patch('/admin/companies/:id', protect, requireRole('admin', 'placement_cell'), async (req, res) => {
  try {
    const allowedFields = ['name', 'officialWebsite', 'careersUrl', 'logoUrl', 'industry', 'description', 'headquarters', 'locations', 'verificationStatus'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (updates.verificationStatus === 'officially_verified') {
      updates.lastVerifiedAt = new Date();
      updates.verifiedBy = req.user._id || req.user.id;
    }

    const previous = await Company.findById(req.params.id).lean();
    if (!previous) return errorResponse(res, 'Company not found', 404);

    const company = await Company.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });

    await AuditLog.create({
      actorId: req.user._id || req.user.id,
      actorEmail: req.user.email,
      action: 'company_updated',
      entityType: 'company',
      entityId: company._id,
      previousValues: { verificationStatus: previous.verificationStatus, name: previous.name },
      newValues: updates,
      reason: req.body.reason || null,
    });

    return successResponse(res, company, 'Company updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// POST /api/portal/admin/jobs — Create job
router.post('/admin/jobs', protect, requireRole('admin', 'placement_cell'), async (req, res) => {
  try {
    const data = req.body;
    if (!data.title?.trim()) return errorResponse(res, 'Job title is required', 400);
    if (!data.companyName?.trim()) return errorResponse(res, 'Company name is required', 400);

    if (data.applicationUrl && !validateApplicationUrl(data.applicationUrl)) {
      return errorResponse(res, 'Invalid application URL', 400);
    }

    // Link or create company
    let company = null;
    if (data.companyName) {
      company = await findOrCreateCompany(data.companyName);
    }

    const job = await PortalJob.create({
      ...data,
      companyId: company?._id || null,
      sourceType: data.sourceType || 'manual_admin',
      verificationStatus: data.verificationStatus || 'pending_review',
      createdBy: req.user._id || req.user.id,
      applicationUrl: data.applicationUrl ? validateApplicationUrl(data.applicationUrl) : null,
    });

    await AuditLog.create({
      actorId: req.user._id || req.user.id,
      actorEmail: req.user.email,
      action: 'job_created',
      entityType: 'portal_job',
      entityId: job._id,
      newValues: { title: job.title, companyName: job.companyName, sourceType: job.sourceType },
    });

    return successResponse(res, job, 'Job created', 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// PATCH /api/portal/admin/jobs/:id — Update job
router.patch('/admin/jobs/:id', protect, requireRole('admin', 'placement_cell'), async (req, res) => {
  try {
    const previous = await PortalJob.findById(req.params.id).lean();
    if (!previous) return errorResponse(res, 'Job not found', 404);

    // Sanitize updates
    const updates = { ...req.body };
    delete updates._id;
    delete updates.createdAt;

    if (updates.applicationUrl) {
      updates.applicationUrl = validateApplicationUrl(updates.applicationUrl);
      if (!updates.applicationUrl) return errorResponse(res, 'Invalid application URL', 400);
    }
    if (updates.verificationStatus === 'officially_verified') {
      updates.lastVerifiedAt = new Date();
      updates.verifiedBy = req.user._id || req.user.id;
    }

    const job = await PortalJob.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });

    await AuditLog.create({
      actorId: req.user._id || req.user.id,
      actorEmail: req.user.email,
      action: 'job_updated',
      entityType: 'portal_job',
      entityId: job._id,
      previousValues: { status: previous.status, verificationStatus: previous.verificationStatus },
      newValues: updates,
      reason: req.body.reason || null,
    });

    return successResponse(res, job, 'Job updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// POST /api/portal/admin/jobs/:id/verify — Verify a job
router.post('/admin/jobs/:id/verify', protect, requireRole('admin'), async (req, res) => {
  try {
    const { verificationStatus, reason } = req.body;
    const validStatuses = ['source_checked', 'officially_verified', 'verification_unavailable', 'rejected'];
    if (!validStatuses.includes(verificationStatus)) {
      return errorResponse(res, `Invalid verification status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    if (!reason?.trim()) {
      return errorResponse(res, 'Reason is required for verification actions', 400);
    }

    const previous = await PortalJob.findById(req.params.id).lean();
    if (!previous) return errorResponse(res, 'Job not found', 404);

    const updates = {
      verificationStatus,
      lastVerifiedAt: new Date(),
      verifiedBy: req.user._id || req.user.id,
    };

    const job = await PortalJob.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });

    await AuditLog.create({
      actorId: req.user._id || req.user.id,
      actorEmail: req.user.email,
      action: 'job_verified',
      entityType: 'portal_job',
      entityId: job._id,
      previousValues: { verificationStatus: previous.verificationStatus },
      newValues: { verificationStatus },
      reason,
    });

    return successResponse(res, job, 'Job verification updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// POST /api/portal/admin/jobs/:id/close — Close a job
router.post('/admin/jobs/:id/close', protect, requireRole('admin', 'placement_cell'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return errorResponse(res, 'Reason is required to close a job', 400);

    const previous = await PortalJob.findById(req.params.id).lean();
    if (!previous) return errorResponse(res, 'Job not found', 404);

    const job = await PortalJob.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'closed', verificationStatus: 'closed' } },
      { new: true }
    );

    await AuditLog.create({
      actorId: req.user._id || req.user.id,
      actorEmail: req.user.email,
      action: 'job_closed',
      entityType: 'portal_job',
      entityId: job._id,
      previousValues: { status: previous.status },
      newValues: { status: 'closed' },
      reason,
    });

    return successResponse(res, job, 'Job closed');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// POST /api/portal/admin/jobs/sync — Trigger Adzuna sync
router.post('/admin/jobs/sync', protect, requireRole('admin'), async (req, res) => {
  try {
    const { keywords, location, maxPages, maxDaysOld } = req.body;
    const result = await syncFromAdzuna({
      keywords,
      location,
      maxPages,
      maxDaysOld,
      actorId: req.user._id || req.user.id,
    });
    return successResponse(res, result, result.success ? 'Sync completed' : 'Sync failed');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/portal/admin/jobs/sync-status — Check sync status
router.get('/admin/jobs/sync-status', protect, requireRole('admin'), async (req, res) => {
  try {
    const status = getSyncStatus();
    return successResponse(res, status, 'Sync status retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// POST /api/portal/admin/jobs/mark-stale — Mark stale imported jobs
router.post('/admin/jobs/mark-stale', protect, requireRole('admin'), async (req, res) => {
  try {
    const { daysOld } = req.body;
    const result = await markStaleJobs(daysOld || 30);
    return successResponse(res, result, `${result.markedStale} jobs marked as stale`);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/portal/admin/audit-log — Get audit history
router.get('/admin/audit-log', protect, requireRole('admin'), async (req, res) => {
  try {
    const { entityType, entityId, page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId && mongoose.Types.ObjectId.isValid(entityId)) filter.entityId = entityId;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      success: true,
      data: logs,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// GET /api/portal/admin/stats — Admin dashboard stats
router.get('/admin/stats', protect, requireRole('admin', 'placement_cell'), async (req, res) => {
  try {
    const [
      totalJobs, activeJobs, pendingVerification, expiredJobs,
      totalCompanies, verifiedCompanies,
      totalApplications, adzunaConfigured,
    ] = await Promise.all([
      PortalJob.countDocuments(),
      PortalJob.countDocuments({ status: 'active' }),
      PortalJob.countDocuments({ verificationStatus: { $in: ['imported', 'pending_review'] } }),
      PortalJob.countDocuments({ status: { $in: ['expired', 'closed'] } }),
      Company.countDocuments(),
      Company.countDocuments({ verificationStatus: 'officially_verified' }),
      StudentApplication.countDocuments(),
      Promise.resolve(adzunaProvider.isConfigured()),
    ]);

    return successResponse(res, {
      totalJobs,
      activeJobs,
      pendingVerification,
      expiredJobs,
      totalCompanies,
      verifiedCompanies,
      totalApplications,
      adzunaConfigured,
      lastSync: getSyncStatus().lastSync,
    }, 'Admin stats retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════
//  ADZUNA PROXY (for live search without storing)
// ═══════════════════════════════════════════════════════
router.get('/adzuna/search', protect, async (req, res) => {
  try {
    const { keywords, location, page, resultsPerPage, category } = req.query;
    const result = await adzunaProvider.searchJobs({ keywords, location, page, resultsPerPage, category });
    return successResponse(res, result, 'Adzuna search results');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

router.get('/adzuna/categories', protect, async (req, res) => {
  try {
    const categories = await adzunaProvider.getCategories();
    return successResponse(res, categories, 'Adzuna categories');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

module.exports = router;
