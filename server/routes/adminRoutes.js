const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const PortalJob = require('../models/PortalJob');
const StudentApplication = require('../models/StudentApplication');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const { successResponse, errorResponse } = require('../utils/response');
const { getAdminOverview } = require('../controllers/adminController');

// Public read-only analytics endpoint for legacy widgets
router.get('/analytics', getAdminOverview);

// All other admin endpoints require authentication and admin role
router.use(protect);
router.use(requireRole('admin'));

// ─────────────────────────────────────────────────────────────
//  ADMIN OVERVIEW & PLATFORM STATS
// ─────────────────────────────────────────────────────────────

router.get('/overview', async (req, res) => {
  try {
    const [
      totalStudents,
      totalRecruiters,
      totalCompanies,
      pendingCompanyVerifications,
      activeJobs,
      totalJobs,
      totalApplications,
      shortlistedCount,
      selectedCount
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['recruiter', 'company'] } }),
      Company.countDocuments(),
      Company.countDocuments({ verificationStatus: 'pending_review' }),
      PortalJob.countDocuments({ status: 'active' }),
      PortalJob.countDocuments(),
      StudentApplication.countDocuments({ status: { $ne: 'interested' } }),
      StudentApplication.countDocuments({ status: 'shortlisted' }),
      StudentApplication.countDocuments({ status: { $in: ['selected', 'offered'] } })
    ]);

    // Recent activity log
    const recentAuditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return successResponse(res, {
      kpis: {
        totalStudents,
        totalRecruiters,
        totalCompanies,
        pendingCompanyVerifications,
        activeJobs,
        totalJobs,
        totalApplications,
        shortlistedCount,
        selectedCount
      },
      recentAuditLogs
    }, 'Admin platform overview retrieved');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────
//  STUDENTS MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get('/students', async (req, res) => {
  try {
    const { search, branch, graduationYear, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const profileFilter = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      profileFilter.$or = [
        { fullName: regex },
        { email: regex },
        { university: regex },
        { branch: regex }
      ];
    }
    if (branch) profileFilter.branch = new RegExp(branch, 'i');
    if (graduationYear) profileFilter.graduationYear = Number(graduationYear);

    const hasProfileFilters = Object.keys(profileFilter).length > 0;
    const matchingProfileUserIds = hasProfileFilters
      ? await Student.distinct('userId', profileFilter)
      : [];
    const userFilter = { role: 'student' };
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      userFilter.$or = [
        { fullName: regex },
        { email: regex },
        { _id: { $in: matchingProfileUserIds } }
      ];
    } else if (hasProfileFilters) {
      userFilter._id = { $in: matchingProfileUserIds };
    }

    const total = await User.countDocuments(userFilter);
    const users = await User.find(userFilter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
    const userIds = users.map(user => user._id);
    const profiles = await Student.find({ userId: { $in: userIds } }).lean();
    const profilesByUserId = new Map(profiles.map(profile => [profile.userId.toString(), profile]));
    const students = users.map(user => {
      const profile = profilesByUserId.get(user._id.toString());
      return {
        ...(profile || {}),
        _id: profile?._id || user._id,
        userId: {
          _id: user._id,
          email: user.email,
          createdAt: user.createdAt,
          profileCompleted: user.profileCompleted
        },
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        hasProfile: Boolean(profile),
        profileCompleted: Boolean(user.profileCompleted || profile?.profileComplete),
        createdAt: user.createdAt
      };
    });

    return res.json({
      success: true,
      data: students,
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

// ─────────────────────────────────────────────────────────────
//  COMPANIES MANAGEMENT & VERIFICATION
// ─────────────────────────────────────────────────────────────

router.get('/companies', async (req, res) => {
  try {
    const { search, verificationStatus, status, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const filter = {};
    if (verificationStatus && verificationStatus !== 'all') {
      filter.verificationStatus = verificationStatus;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { industry: regex },
        { headquarters: regex },
        { contactEmail: regex }
      ];
    }

    const total = await Company.countDocuments(filter);
    const companies = await Company.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('createdBy', 'fullName email')
      .populate('verifiedBy', 'fullName email')
      .lean();

    // Enrich with posted jobs count & applications count
    const companyIds = companies.map(c => c._id);
    const [jobCounts, appCounts] = await Promise.all([
      PortalJob.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $group: { _id: '$companyId', count: { $sum: 1 } } }
      ]),
      StudentApplication.aggregate([
        { $match: { companyId: { $in: companyIds }, status: { $ne: 'interested' } } },
        { $group: { _id: '$companyId', count: { $sum: 1 } } }
      ])
    ]);

    const jobMap = {};
    jobCounts.forEach(jc => { jobMap[jc._id.toString()] = jc.count; });
    const appMap = {};
    appCounts.forEach(ac => { appMap[ac._id.toString()] = ac.count; });

    const enriched = companies.map(c => ({
      ...c,
      totalJobs: jobMap[c._id.toString()] || 0,
      totalApplications: appMap[c._id.toString()] || 0
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

// PATCH /api/admin-v2/companies/:id/verify — Approve or reject company verification
router.patch('/companies/:id/verify', async (req, res) => {
  try {
    const { verificationStatus, reason } = req.body;
    const valid = ['officially_verified', 'rejected', 'pending_review'];
    if (!valid.includes(verificationStatus)) {
      return errorResponse(res, `Invalid verificationStatus. Must be one of: ${valid.join(', ')}`, 400);
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return errorResponse(res, 'Company not found', 404);
    }

    const previousStatus = company.verificationStatus;
    company.verificationStatus = verificationStatus;
    if (verificationStatus === 'officially_verified') {
      company.lastVerifiedAt = new Date();
      company.verifiedBy = req.user._id;

      // Also mark company's posted jobs as officially_verified
      await PortalJob.updateMany(
        { companyId: company._id, verificationStatus: 'pending_review' },
        { $set: { verificationStatus: 'officially_verified', lastVerifiedAt: new Date(), verifiedBy: req.user._id } }
      );
    }

    await company.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'company_verified',
      entityType: 'company',
      entityId: company._id,
      previousValues: { verificationStatus: previousStatus },
      newValues: { verificationStatus },
      reason: reason || null
    });

    return successResponse(res, company, `Company verification status updated to ${verificationStatus}`);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// PATCH /api/admin-v2/companies/:id/status — Suspend or reactivate company account
router.patch('/companies/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    const valid = ['active', 'suspended'];
    if (!valid.includes(status)) {
      return errorResponse(res, 'Status must be active or suspended', 400);
    }

    const company = await Company.findById(req.params.id);
    if (!company) return errorResponse(res, 'Company not found', 404);

    const prev = company.status;
    company.status = status;
    await company.save();

    // If suspended, also close their active jobs
    if (status === 'suspended') {
      await PortalJob.updateMany(
        { companyId: company._id, status: 'active' },
        { $set: { status: 'closed' } }
      );
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'company_status_changed',
      entityType: 'company',
      entityId: company._id,
      previousValues: { status: prev },
      newValues: { status },
      reason: reason || null
    });

    return successResponse(res, company, `Company account ${status === 'active' ? 'reactivated' : 'suspended'}`);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────
//  JOB MODERATION
// ─────────────────────────────────────────────────────────────

router.get('/jobs', async (req, res) => {
  try {
    const { search, status, verificationStatus, sourceType, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (verificationStatus && verificationStatus !== 'all') filter.verificationStatus = verificationStatus;
    if (sourceType && sourceType !== 'all') filter.sourceType = sourceType;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: regex },
        { companyName: regex },
        { location: regex }
      ];
    }

    const total = await PortalJob.countDocuments(filter);
    const jobs = await PortalJob.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('companyId', 'name verificationStatus status')
      .populate('createdBy', 'fullName email')
      .lean();

    return res.json({
      success: true,
      data: jobs,
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

// PATCH /api/admin-v2/jobs/:id/verify — Verify or reject a job listing
router.patch('/jobs/:id/verify', async (req, res) => {
  try {
    const { verificationStatus, reason } = req.body;
    const job = await PortalJob.findById(req.params.id);
    if (!job) return errorResponse(res, 'Job not found', 404);

    const prev = job.verificationStatus;
    job.verificationStatus = verificationStatus;
    job.lastVerifiedAt = new Date();
    job.verifiedBy = req.user._id;
    await job.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'job_verified_by_admin',
      entityType: 'portal_job',
      entityId: job._id,
      previousValues: { verificationStatus: prev },
      newValues: { verificationStatus },
      reason: reason || null
    });

    return successResponse(res, job, 'Job verification updated');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// DELETE /api/admin-v2/jobs/:id — Remove fraudulent or inappropriate job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await PortalJob.findById(req.params.id);
    if (!job) return errorResponse(res, 'Job not found', 404);

    await PortalJob.deleteOne({ _id: job._id });

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'job_deleted_by_admin',
      entityType: 'portal_job',
      entityId: job._id,
      previousValues: { title: job.title, companyName: job.companyName }
    });

    return successResponse(res, null, 'Job removed successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// ─────────────────────────────────────────────────────────────
//  PLATFORM APPLICATIONS AUDIT
// ─────────────────────────────────────────────────────────────

router.get('/applications', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

    const filter = { status: { $ne: 'interested' } };
    if (status && status !== 'all') filter.status = status;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { 'applicantData.fullName': regex },
        { 'applicantData.email': regex }
      ];
    }

    const total = await StudentApplication.countDocuments(filter);
    const applications = await StudentApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('jobId', 'title companyName location')
      .populate('companyId', 'name verificationStatus')
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

// ─────────────────────────────────────────────────────────────
//  AUDIT LOGS
// ─────────────────────────────────────────────────────────────

router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 40 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 40));

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      success: true,
      data: logs,
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

module.exports = router;
