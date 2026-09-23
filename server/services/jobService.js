const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'Datasets', 'processed');

const getJobs = (filters = {}) => {
  const jp = path.join(PROCESSED_DIR, 'jobs.json');
  let list = [];
  if (fs.existsSync(jp)) {
    list = JSON.parse(fs.readFileSync(jp, 'utf-8'));
  }

  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(j => 
      (j.title || '').toLowerCase().includes(s) ||
      (j.company || '').toLowerCase().includes(s) ||
      (j.location || '').toLowerCase().includes(s) ||
      (j.requiredSkills || []).some(sk => sk.toLowerCase().includes(s))
    );
  }

  if (filters.location) {
    list = list.filter(j => (j.location || '').toLowerCase().includes(filters.location.toLowerCase()));
  }

  return list;
};

module.exports = { getJobs };
