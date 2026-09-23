const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'Datasets', 'processed');

const getAlumniList = (filters = {}) => {
  const ap = path.join(PROCESSED_DIR, 'alumni.json');
  let list = [];
  if (fs.existsSync(ap)) {
    list = JSON.parse(fs.readFileSync(ap, 'utf-8'));
  }

  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(a => 
      (a.name || '').toLowerCase().includes(s) ||
      (a.role || '').toLowerCase().includes(s) ||
      (a.currentCompany || '').toLowerCase().includes(s) ||
      (a.skills || []).some(sk => sk.toLowerCase().includes(s))
    );
  }

  if (filters.branch) {
    list = list.filter(a => (a.branch || '').toLowerCase() === filters.branch.toLowerCase());
  }

  if (filters.company) {
    list = list.filter(a => (a.currentCompany || '').toLowerCase().includes(filters.company.toLowerCase()));
  }

  return list;
};

const getAlumniById = (id) => {
  const ap = path.join(PROCESSED_DIR, 'alumni.json');
  if (!fs.existsSync(ap)) return null;
  const list = JSON.parse(fs.readFileSync(ap, 'utf-8'));
  return list.find(a => String(a.id) === String(id)) || null;
};

module.exports = { getAlumniList, getAlumniById };
