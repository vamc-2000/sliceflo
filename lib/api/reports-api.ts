import axiosInstance from './axios-instance';
import {
  CreateReportPayload,
  UpdateReportPayload,
  GetAxesResponse,
  GetChartTypesResponse,
  Report,
} from "@/types/reports.types";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const reportAPI = {
  createReport: (payload: CreateReportPayload) =>
    axiosInstance.post(`${API_BASE_URL}/reports`, payload),

  getReports: () =>
    axiosInstance.get<{
      reports: Report[];
      totalReports: number;
      currentPage: number;
      perPage: number;
      pageCount: number;
    }>(`${API_BASE_URL}/reports`),

  getReportById: (reportId: string) =>
    axiosInstance.get<Report>(`${API_BASE_URL}/reports/${reportId}`),

  getAxes: () =>
    axiosInstance.get<GetAxesResponse>(`${API_BASE_URL}/reports/axes`),

  getAxesByProjectId: (projectId: string) =>
    axiosInstance.get<GetAxesResponse>(
      `${API_BASE_URL}/reports/axes?projectId=${projectId}`
    ),

  getChartTypes: () =>
    axiosInstance.get<GetChartTypesResponse>(`${API_BASE_URL}/reports/chart-types`),

  getReportTemplates: () =>
    axiosInstance.get(`${API_BASE_URL}/reports/templates`),

  updateReport: (reportId: string, payload: UpdateReportPayload) =>
    axiosInstance.put(`${API_BASE_URL}/reports/${reportId}`, payload),

  deleteReport: (reportId: string) =>
    axiosInstance.delete(`${API_BASE_URL}/reports/${reportId}`),

  addFavorite: (reportId: string) =>
    axiosInstance.post(`${API_BASE_URL}/reports/${reportId}/favorite`),

  removeFavorite: (reportId: string) =>
    axiosInstance.delete(`${API_BASE_URL}/reports/${reportId}/favorite`),

  getAggregations: (yAxisField: string, projectId?: string) => {
    const params = new URLSearchParams({ yAxisField });
    if (projectId) params.append("projectId", projectId);
    return axiosInstance.get(`${API_BASE_URL}/reports/aggregations?${params}`);
  },

  getReportsByProject: (projectId: string) =>
    axiosInstance.get<{ reports: Report[] }>(
      `${API_BASE_URL}/reports/project/${projectId}`
    ),

  getFavoriteReports: () =>
    axiosInstance.get<Report[]>(`${API_BASE_URL}/reports/favorites`),

  getFavoriteStatus: (reportId: string) =>
    axiosInstance.get<{ isFavorite: boolean }>(
      `${API_BASE_URL}/reports/${reportId}/favorite/status`
    ),

  shareReport: (reportId: string, userIds: string[]) =>
    axiosInstance.post(`${API_BASE_URL}/reports/${reportId}/share`, { userIds }),

  deleteChart: (reportId: string, chartId: string) =>
    axiosInstance.delete(
      `${API_BASE_URL}/reports/${reportId}/charts/${chartId}`
    ),

  getChartsConfig: () =>
    axiosInstance.get(`${API_BASE_URL}/reports/charts`),
};