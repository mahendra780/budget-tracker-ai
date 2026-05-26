export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Savings",
  "Other",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Bonus",
  "Other",
];

export const getCategoriesByType = (type) =>
  type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

export const resolveCategory = (category, customCategory) =>
  category === "Other" ? customCategory.trim() : category;
