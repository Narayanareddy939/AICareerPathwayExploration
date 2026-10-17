/**
 * Adzuna Job Provider Adapter
 * 
 * Interfaces with the Adzuna API v1 to search and import job listings for India.
 * Documentation: https://developer.adzuna.com/
 * 
 * Environment variables required:
 *   ADZUNA_APP_ID  - Adzuna developer application ID
 *   ADZUNA_APP_KEY - Adzuna developer application key
 * 
 * The application MUST continue to function if these credentials are missing.
 */

const axios = require('axios');

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api';
const COUNTRY = 'in'; // India
const DEFAULT_RESULTS_PER_PAGE = 20;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RESULTS_PER_PAGE = 50;

/**
 * Check whether Adzuna credentials are configured.
 */
function isConfigured() {
  return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

/**
 * Build common query parameters for Adzuna requests.
 */
function buildAuthParams() {
  return {
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
  };
}

/**
 * Search jobs on Adzuna.
 * 
 * @param {Object} options
 * @param {string}  [options.keywords]       - Free-text search keywords
 * @param {string}  [options.location]       - Location text (e.g. 'Bangalore')
 * @param {string}  [options.category]       - Adzuna category tag (e.g. 'it-jobs')
 * @param {string}  [options.company]        - Company name filter
 * @param {string}  [options.contractType]   - 'permanent' or 'contract'
 * @param {boolean} [options.fullTime]       - true for full-time only
 * @param {boolean} [options.partTime]       - true for part-time only
 * @param {number}  [options.salaryMin]      - Minimum salary
 * @param {number}  [options.salaryMax]      - Maximum salary
 * @param {number}  [options.maxDaysOld]     - Maximum age in days
 * @param {number}  [options.page]           - Page number (1-based)
 * @param {number}  [options.resultsPerPage] - Results per page (max 50)
 * @returns {Promise<{jobs: Array, total: number, page: number}>}
 */
async function searchJobs(options = {}) {
  if (!isConfigured()) {
    return { jobs: [], total: 0, page: 1, error: 'Adzuna API credentials not configured' };
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const resultsPerPage = Math.min(MAX_RESULTS_PER_PAGE, Math.max(1, parseInt(options.resultsPerPage, 10) || DEFAULT_RESULTS_PER_PAGE));

  const params = {
    ...buildAuthParams(),
    results_per_page: resultsPerPage,
    'content-type': 'application/json',
  };

  if (options.keywords) params.what = options.keywords;
  if (options.location) params.where = options.location;
  if (options.category) params.category = options.category;
  if (options.company) params.company = options.company;
  if (options.contractType) params.contract_type = options.contractType;
  if (options.fullTime) params.full_time = 1;
  if (options.partTime) params.part_time = 1;
  if (options.salaryMin) params.salary_min = options.salaryMin;
  if (options.salaryMax) params.salary_max = options.salaryMax;
  if (options.maxDaysOld) params.max_days_old = options.maxDaysOld;

  const url = `${ADZUNA_BASE_URL}/jobs/${COUNTRY}/search/${page}`;

  try {
    const response = await axios.get(url, { params, timeout: REQUEST_TIMEOUT_MS });
    const data = response.data;

    const normalizedJobs = (data.results || []).map(normalizeAdzunaJob);

    return {
      jobs: normalizedJobs,
      total: data.count || 0,
      page,
      resultsPerPage,
      mean: data.mean || null,
    };
  } catch (err) {
    const errorInfo = {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
    };

    // Rate limit detection
    if (err.response?.status === 429) {
      errorInfo.rateLimited = true;
      errorInfo.retryAfter = err.response.headers['retry-after'] || null;
    }

    console.error('[Adzuna] Search error:', errorInfo.message, `status=${errorInfo.status || 'N/A'}`);
    return { jobs: [], total: 0, page, error: errorInfo };
  }
}

/**
 * Get available job categories from Adzuna.
 * @returns {Promise<Array<{tag: string, label: string}>>}
 */
async function getCategories() {
  if (!isConfigured()) return [];

  try {
    const params = buildAuthParams();
    const url = `${ADZUNA_BASE_URL}/jobs/${COUNTRY}/categories`;
    const response = await axios.get(url, { params, timeout: REQUEST_TIMEOUT_MS });
    return (response.data.results || []).map(c => ({
      tag: c.tag,
      label: c.label,
    }));
  } catch (err) {
    console.error('[Adzuna] Categories error:', err.message);
    return [];
  }
}

/**
 * Normalize an Adzuna job result into our internal format.
 * Only maps fields that actually exist in Adzuna responses.
 * Does NOT label the job as verified.
 */
function normalizeAdzunaJob(raw) {
  const job = {
    externalJobId: raw.id ? String(raw.id) : null,
    title: raw.title || 'Untitled',
    companyName: raw.company?.display_name || 'Unknown Company',
    description: raw.description || null,
    location: raw.location?.display_name || null,
    applicationUrl: raw.redirect_url || null,
    sourceType: 'adzuna',
    sourceName: 'Adzuna',
    sourceUrl: raw.redirect_url || null,
    verificationStatus: 'imported',
    status: 'active',
    postedAt: raw.created ? new Date(raw.created) : null,
    lastSyncedAt: new Date(),

    // Employment type inference
    employmentType: inferEmploymentType(raw),
    experienceLevel: 'not_specified',

    // Salary — only if Adzuna provides it, and NOT predicted
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: 'INR',
    salaryPeriod: 'not_specified',
    salaryDisclosureStatus: 'undisclosed',

    // Skills extracted from description (basic extraction)
    requiredSkills: [],

    // Fields Adzuna does not provide — explicitly null
    responsibilities: [],
    preferredSkills: [],
    eligibleDegrees: [],
    eligibleBranches: [],
    eligibleGraduationYears: [],
    minimumCGPA: null,
    backlogCriteria: null,
    workMode: 'not_specified',
    benefits: [],
    bondStatus: 'not_disclosed',
    bondDuration: null,
    bondTerms: null,
    hiringStages: [],
    applicationDeadline: null,
  };

  // Map salary only if present and not predicted
  if (raw.salary_min && raw.salary_is_predicted !== '1' && raw.salary_is_predicted !== 1) {
    job.salaryMin = raw.salary_min;
    job.salaryMax = raw.salary_max || raw.salary_min;
    job.salaryDisclosureStatus = 'disclosed';
    // Adzuna typically provides annual salary
    job.salaryPeriod = 'annual';
  } else if (raw.salary_min) {
    // Predicted salary
    job.salaryMin = raw.salary_min;
    job.salaryMax = raw.salary_max || raw.salary_min;
    job.salaryDisclosureStatus = 'predicted';
    job.salaryPeriod = 'annual';
  }

  // Extract category if provided
  if (raw.category?.tag) {
    job._adzunaCategory = raw.category.tag;
    job._adzunaCategoryLabel = raw.category.label;
  }

  return job;
}

/**
 * Infer employment type from Adzuna contract fields.
 */
function inferEmploymentType(raw) {
  const title = (raw.title || '').toLowerCase();
  const contractType = (raw.contract_type || '').toLowerCase();
  const contractTime = (raw.contract_time || '').toLowerCase();

  if (title.includes('intern') || contractType === 'intern') return 'internship';
  if (contractType === 'contract') return 'contract';
  if (contractTime === 'part_time') return 'part_time';
  if (contractTime === 'full_time' || contractType === 'permanent') return 'full_time';
  return 'full_time'; // default assumption for Adzuna listings
}

module.exports = {
  isConfigured,
  searchJobs,
  getCategories,
  normalizeAdzunaJob,
  PROVIDER_NAME: 'adzuna',
};
