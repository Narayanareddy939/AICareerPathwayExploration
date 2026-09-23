/**
 * Server Validation Utilities
 */

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

const sanitizeString = (str) => {
  if (!str) return '';
  return String(str).trim();
};

const sanitizeArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => String(item).trim()).filter(Boolean);
};

module.exports = {
  isValidEmail,
  isValidPassword,
  sanitizeString,
  sanitizeArray
};
