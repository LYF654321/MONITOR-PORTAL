import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';
import { mockAdapter } from '@/mock/adapter';
export const TOKEN_KEY = 'monitor-portal:token';
export const isMock = process.env.UMI_APP_MOCK !== 'false';
const http = axios.create({
  baseURL: process.env.UMI_APP_API_BASE,
  timeout: 15000,
  ...(isMock ? { adapter: mockAdapter } : {}),
});
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiResponse<T>>(config);
  if (response.data.code !== 'SUCCESS') {
    if (response.data.code === 'UNAUTHORIZED') {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('portal:unauthorized'));
    }
    throw new Error(response.data.message || '请求失败，请稍后重试');
  }
  return response.data.data;
}
