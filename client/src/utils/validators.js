export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

export const validateCGPA = (cgpa) => {
  const val = parseFloat(cgpa);
  return !isNaN(val) && val >= 0 && val <= 10;
};
