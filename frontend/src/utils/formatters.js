export const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;

export const formatPercentage = (value) =>
  `${Number(value || 0).toFixed(0)}%`;

export const clampPercentage = (value) =>
  Math.min(Math.max(Number(value) || 0, 0), 100);
