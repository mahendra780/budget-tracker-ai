import api from "./api";

// GET all transactions
export const getTransactions = async () => {
  const response = await api.get("/transactions");
  return response.data;
};

// CREATE transaction
export const createTransaction = async (data) => {
  const response = await api.post("/transactions", data);
  return response.data;
};

// UPDATE transaction
export const updateTransaction = async (id, data) => {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data;
};

// DELETE transaction
export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};