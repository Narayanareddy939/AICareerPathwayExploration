/**
 * Job Synchronization Service
 * 
 * Fetches jobs from configured providers, validates, deduplicates, and upserts
 * into the PortalJob collection. Safe for repeated execution.
 */

const PortalJob = require('../models/PortalJob');
const Company = require('../models/Company');
const JobSource = require('../models/JobSource');
const AuditLog = require('../models/AuditLog');
const adzunaProvider = require('./jobProviders/adzunaProvider');

// Prevent concurrent syncs
let syncInProgress = false;
let lastSyncResult = null;

/**
 * Validate and sanitize an application URL.
 * Rejects malformed URLs and unsafe schemes.
 */
function validateApplicationUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!['https:', 'http:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Normalize a company name for deduplication.
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Find or create a Company record for a given company name.
 */
async function findOrCreateCompany(companyName) {
  const normalized = normalizeCompanyName(companyName);
  if (!normalized) return null;

  let company = await Company.findOne({ normalizedName: normalized });
  if (!company) {
    company = await Company.create({
      name: companyName.trim(),
      normalizedName: normalized,
      verificationStatus: 'imported',
    });
  }
  return company;
}

/**
 * Main sync function: fetch from Adzuna and upsert.
 * 
 * @param {Object} options
 * @param {string}  [options.keywords]    - Search keywords
 * @param {string}  [options.location]    - Location filter
 * @param {number}  [options.maxPages]    - Max pages to fetch (default 3)
 * @param {number}  [options.maxDaysOld]  - Max age of listings (default 30)
 * @param {string}  [options.actorId]     - User ID triggering the sync
 * @returns {Promise<Object>} Sync summary
 */
async function syncFromAdzuna(options = {}) {
  if (syncInProgress) {
    return { success: false, message: 'A sync is already in progress. Please wait.' };
  }

  if (!adzunaProvider.isConfigured()) {
    return {
      success: false,
      message: 'Adzuna API credentials are not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY in server/.env',
    };
  }

  syncInProgress = true;
  const startTime = Date.now();
  const summary = {
    provider: 'adzuna',
    startedAt: new Date(),
    pagesProcessed: 0,
    jobsFetched: 0,
    jobsCreated: 0,
    jobsUpdated: 0,
    jobsSkipped: 0,
    companiesCreated: 0,
    errors: [],
    duration: 0,
  };

  try {
    const maxPages = Math.min(options.maxPages || 3, 10);
    const resultsPerPage = 20;
    const searchParams = {
      keywords: options.keywords || 'software developer fresher',
      location: options.location || '',
      maxDaysOld: options.maxDaysOld || 30,
      resultsPerPage,
    };

    for (let page = 1; page <= maxPages; page++) {
      try {
        const result = await adzunaProvider.searchJobs({ ...searchParams, page });

        if (result.error) {
          summary.errors.push({ page, error: typeof result.error === 'string' ? result.error : result.error.message });
          if (result.error.rateLimited) {
            console.warn('[JobSync] Rate limited by Adzuna. Stopping further pages.');
            break;
          }
          continue;
        }

        summary.pagesProcessed++;
        summary.jobsFetched += result.jobs.length;

        for (const jobData of result.jobs) {
          try {
            await upsertJob(jobData, summary);
          } catch (err) {
            summary.errors.push({ externalId: jobData.externalJobId, error: err.message });
            summary.jobsSkipped++;
          }
        }

        // Stop if we've fetched all available results
        if (result.jobs.length < resultsPerPage) break;

        // Small delay between pages to be respectful
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (pageErr) {
        summary.errors.push({ page, error: pageErr.message });
      }
    }

    summary.duration = Date.now() - startTime;
    summary.success = true;
    summary.completedAt = new Date();

    // Record audit log
    try {
      await AuditLog.create({
        actorId: options.actorId || null,
        action: 'job_sync_completed',
        entityType: 'job_sync',
        newValues: {
          provider: 'adzuna',
          jobsFetched: summary.jobsFetched,
          jobsCreated: summary.jobsCreated,
          jobsUpdated: summary.jobsUpdated,
          duration: summary.duration,
          errorCount: summary.errors.length,
        },
      });
    } catch (auditErr) {
      console.error('[JobSync] Audit log error:', auditErr.message);
    }

    lastSyncResult = summary;
    return summary;
  } catch (err) {
    summary.success = false;
    summary.error = err.message;
    summary.duration = Date.now() - startTime;
    lastSyncResult = summary;
    return summary;
  } finally {
    syncInProgress = false;
  }
}

/**
 * Upsert a single normalized job into the database.
 */
async function upsertJob(jobData, summary) {
  // Validate application URL
  jobData.applicationUrl = validateApplicationUrl(jobData.applicationUrl);
  jobData.sourceUrl = validateApplicationUrl(jobData.sourceUrl);

  if (!jobData.externalJobId || !jobData.sourceType) {
    summary.jobsSkipped++;
    return;
  }

  // Check for existing job by external ID + source
  const existing = await PortalJob.findOne({
    externalJobId: jobData.externalJobId,
    sourceType: jobData.sourceType,
  });

  // Find or create company
  let company = null;
  if (jobData.companyName) {
    const existingCompany = await Company.findOne({
      normalizedName: normalizeCompanyName(jobData.companyName),
    });
    if (existingCompany) {
      company = existingCompany;
    } else {
      company = await findOrCreateCompany(jobData.companyName);
      if (company) summary.companiesCreated++;
    }
  }

  const jobRecord = {
    ...jobData,
    companyId: company?._id || null,
    lastSyncedAt: new Date(),
  };

  // Clean internal Adzuna metadata
  delete jobRecord._adzunaCategory;
  delete jobRecord._adzunaCategoryLabel;

  if (existing) {
    // Update only sync-safe fields (don't overwrite manual admin edits)
    const updateFields = {
      lastSyncedAt: new Date(),
    };
    // Only update description if it was auto-imported (not manually edited)
    if (existing.sourceType === 'adzuna' && existing.verificationStatus === 'imported') {
      if (jobData.description) updateFields.description = jobData.description;
      if (jobData.applicationUrl) updateFields.applicationUrl = jobData.applicationUrl;
      if (jobData.salaryMin) {
        updateFields.salaryMin = jobData.salaryMin;
        updateFields.salaryMax = jobData.salaryMax;
        updateFields.salaryDisclosureStatus = jobData.salaryDisclosureStatus;
      }
    }
    await PortalJob.updateOne({ _id: existing._id }, { $set: updateFields });
    summary.jobsUpdated++;
  } else {
    // Create new job
    const newJob = await PortalJob.create(jobRecord);

    // Create JobSource record
    try {
      await JobSource.create({
        jobId: newJob._id,
        provider: jobData.sourceType,
        externalId: jobData.externalJobId,
        originalUrl: jobData.sourceUrl || jobData.applicationUrl,
        sourceType: 'api_import',
        firstImportedAt: new Date(),
        lastSyncedAt: new Date(),
      });
    } catch (srcErr) {
      // Duplicate source is not fatal
      if (srcErr.code !== 11000) {
        console.error('[JobSync] JobSource create error:', srcErr.message);
      }
    }

    summary.jobsCreated++;
  }
}

/**
 * Mark stale jobs for review.
 * Jobs synced from a provider more than `daysOld` days ago that haven't been
 * re-synced are candidates for staleness.
 */
async function markStaleJobs(daysOld = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = await PortalJob.updateMany(
    {
      sourceType: 'adzuna',
      status: 'active',
      verificationStatus: 'imported',
      lastSyncedAt: { $lt: cutoff },
    },
    {
      $set: { verificationStatus: 'pending_review' },
    }
  );

  return { markedStale: result.modifiedCount };
}

/**
 * Get the status of the last sync operation.
 */
function getSyncStatus() {
  return {
    syncInProgress,
    lastSync: lastSyncResult,
  };
}

module.exports = {
  syncFromAdzuna,
  markStaleJobs,
  getSyncStatus,
  findOrCreateCompany,
  validateApplicationUrl,
};
