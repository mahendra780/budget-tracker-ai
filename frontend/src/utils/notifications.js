import { toast } from "react-toastify";

const DEFAULT_API_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const notifySuccess = (message) => {
  toast.success(message);
};

export const notifyError = (
  error,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE
) => {
  const message =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;

  toast.error(message);
};

export const notifyWarning = (message) => {
  toast.warning(message);
};
