export const formatSalary = (salary) => {
  if (!salary) return '₹8,00,000 - ₹18,00,000';
  if (typeof salary === 'number') {
    return `₹${(salary / 100000).toFixed(1)} LPA`;
  }
  return String(salary);
};

export const formatMatchPercentage = (pct) => {
  const num = Math.round(parseFloat(pct) || 0);
  return `${Math.min(99, Math.max(0, num))}%`;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
