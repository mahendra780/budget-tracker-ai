import api from "./api";

export const getRecurringTransactions = async () => {
  const response = await api.get("/recurring-transactions");
  return response.data;
};

export const getUpcomingRecurringTransactions = async () => {
  const response = await api.get("/recurring-transactions/upcoming");
  return response.data;
};

export const createRecurringTransaction = async (data) => {
  const response = await api.post("/recurring-transactions", data);
  return response.data;
};

export const updateRecurringTransaction = async (id, data) => {
  const response = await api.put(
    `/recurring-transactions/${id}`,
    data
  );
  return response.data;
};

export const toggleRecurringTransaction = async (id) => {
  const response = await api.patch(
    `/recurring-transactions/${id}/toggle`
  );
  return response.data;
};

export const deleteRecurringTransaction = async (id) => {
  const response = await api.delete(
    `/recurring-transactions/${id}`
  );
  return response.data;
};

export const processRecurringTransactions = async () => {
  const response = await api.post(
    "/recurring-transactions/process"
  );
  return response.data;
};
