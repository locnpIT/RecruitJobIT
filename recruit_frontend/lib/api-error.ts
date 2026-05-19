import type { AxiosError } from "axios";

type ApiEnvelope = {
  message?: string;
  error?: string;
};

// Chuẩn hoá lỗi API để hook/UI dùng chung một cách ổn định.
export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  const axiosError = error as AxiosError<ApiEnvelope> | undefined;
  const messageFromEnvelope = axiosError?.response?.data?.message ?? axiosError?.response?.data?.error;

  if (typeof messageFromEnvelope === "string" && messageFromEnvelope.trim().length > 0) {
    return messageFromEnvelope;
  }

  if (typeof axiosError?.message === "string" && axiosError.message.trim().length > 0) {
    return axiosError.message;
  }

  return fallbackMessage;
}
