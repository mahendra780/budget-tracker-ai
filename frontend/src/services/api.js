import axios from "axios";

import {
  clearAuthToken,
  getAuthToken,
} from "./authStorage";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401
      && !window.location.pathname.startsWith("/login")
    ) {
      clearAuthToken();
    }

    return Promise.reject(error);
  }
);

export default api;
