import axios from 'axios';
import {
  AnalyticsSummary,
  UserActivity,
  DiagnosisStatistics,
  TeachingStyleUsage,
  TemplateStatistics,
  UserGrowth,
  AnalyticsFilter,
  Report,
  HeatmapData,
  GrowthMetrics,
} from '../types/analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（トークン付与）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// サマリー情報取得
const getAnalyticsSummary = async (filter?: AnalyticsFilter): Promise<AnalyticsSummary> => {
  const params = filter ? buildFilterParams(filter) : undefined;
  const response = await api.get('/analytics/summary', { params });
  return response.data;
};

// ユーザーアクティビティ取得
const getUserActivity = async (filter: AnalyticsFilter): Promise<UserActivity[]> => {
  const params = buildFilterParams(filter);
  const response = await api.get('/analytics/user-activity', { params });
  return response.data;
};

// 診断統計取得
const getDiagnosisStatistics = async (filter?: AnalyticsFilter): Promise<DiagnosisStatistics> => {
  const params = filter ? buildFilterParams(filter) : undefined;
  const response = await api.get('/analytics/diagnosis-stats', { params });
  return response.data;
};

// 授業スタイル使用状況取得
const getTeachingStyleUsage = async (filter?: AnalyticsFilter): Promise<TeachingStyleUsage[]> => {
  const params = filter ? buildFilterParams(filter) : undefined;
  const response = await api.get('/analytics/teaching-style-usage', { params });
  return response.data;
};

// テンプレート統計取得
const getTemplateStatistics = async (filter?: AnalyticsFilter): Promise<TemplateStatistics> => {
  const params = filter ? buildFilterParams(filter) : undefined;
  const response = await api.get('/analytics/template-stats', { params });
  return response.data;
};

// ユーザー成長データ取得
const getUserGrowth = async (
  userId?: string,
  filter?: AnalyticsFilter
): Promise<UserGrowth[]> => {
  const params = filter ? buildFilterParams(filter) : undefined;
  const url = userId 
    ? `/analytics/user-growth/${userId}`
    : '/analytics/user-growth';
  const response = await api.get(url, { params });
  return response.data;
};

// 使用状況ヒートマップデータ取得
const getUsageHeatmap = async (filter: AnalyticsFilter): Promise<HeatmapData[]> => {
  const params = buildFilterParams(filter);
  const response = await api.get('/analytics/usage-heatmap', { params });
  return response.data;
};

// 成長メトリクス取得
const getGrowthMetrics = async (
  userId: string,
  filter: AnalyticsFilter
): Promise<GrowthMetrics[]> => {
  const params = buildFilterParams(filter);
  const response = await api.get(`/analytics/growth-metrics/${userId}`, { params });
  return response.data;
};

// レポート生成
const generateReport = async (
  type: string,
  filter: AnalyticsFilter,
  format: string = 'pdf'
): Promise<Report> => {
  const response = await api.post('/analytics/reports/generate', {
    type,
    filter,
    format,
  });
  return response.data;
};

// レポート一覧取得
const getReports = async (): Promise<Report[]> => {
  const response = await api.get('/analytics/reports');
  return response.data;
};

// レポートダウンロード
const downloadReport = async (reportId: string): Promise<Blob> => {
  const response = await api.get(`/analytics/reports/${reportId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

// パーソナリティタイプ分布取得
const getPersonalityTypeDistribution = async (
  filter?: AnalyticsFilter
): Promise<{ type: string; count: number; percentage: number }[]> => {
  const params = filter ? buildFilterParams(filter) : undefined;
  const response = await api.get('/analytics/personality-distribution', { params });
  return response.data;
};

// 効果性トレンド取得
const getEffectivenessTrend = async (
  filter: AnalyticsFilter
): Promise<{ date: string; effectiveness: number; satisfaction: number }[]> => {
  const params = buildFilterParams(filter);
  const response = await api.get('/analytics/effectiveness-trend', { params });
  return response.data;
};

// フィルターパラメータ構築
const buildFilterParams = (filter: AnalyticsFilter): URLSearchParams => {
  const params = new URLSearchParams();
  
  if (filter.timeRange) {
    params.append('startDate', filter.timeRange.startDate.toISOString());
    params.append('endDate', filter.timeRange.endDate.toISOString());
    params.append('period', filter.timeRange.period);
  }
  
  if (filter.userType) {
    params.append('userType', filter.userType);
  }
  
  if (filter.subject?.length) {
    params.append('subject', filter.subject.join(','));
  }
  
  if (filter.gradeLevel?.length) {
    params.append('gradeLevel', filter.gradeLevel.join(','));
  }
  
  if (filter.personalityType?.length) {
    params.append('personalityType', filter.personalityType.join(','));
  }
  
  return params;
};

export default {
  getAnalyticsSummary,
  getUserActivity,
  getDiagnosisStatistics,
  getTeachingStyleUsage,
  getTemplateStatistics,
  getUserGrowth,
  getUsageHeatmap,
  getGrowthMetrics,
  generateReport,
  getReports,
  downloadReport,
  getPersonalityTypeDistribution,
  getEffectivenessTrend,
};