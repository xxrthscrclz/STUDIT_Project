import axios from 'axios';
import { API_BASE_URL } from '@/api/config';
import { ApiRequestError } from '@/api/errors';
import { getToken } from '@/utils/auth';

export const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data as { message?: string; code?: string } | undefined;
    throw new ApiRequestError(data?.message ?? '요청에 실패했습니다.', data?.code);
  },
);
