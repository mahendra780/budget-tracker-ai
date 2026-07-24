import api from "./api";

export const getSummary = async () => {
  const response = await api.get("/transactions/summary");
  return response.data;
};

export const getOverview = async () => {
  const response = await api.get("/dashboard/overview");
  return response.data;
};

export const getCategorySummary = async () => {
  const response = await api.get("/transactions/category-summary");
  return response.data;
};
