import api from "./api";

export const getTopCategory = async () => {
  const response = await api.get("/ai/top-categories");
  return response.data;
};

export const getSpendingBreakdown = async () => {
  const response = await api.get("/ai/spending-breakdown");
  return response.data;
};

export const getRecommendations = async () => {
  const response = await api.get("/ai/recommendations");
  return response.data;
};
export const getMonthlyTrend = async () => {
  const response = await api.get(
    "/ai/monthly-trend"
  );
  return response.data;
};
export const getSummary = async () => {
  const response = await api.get(
    "/ai/summary"
  );

  return response.data;
};