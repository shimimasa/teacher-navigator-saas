import axios from 'axios';
import {
  TeachingStyle,
  TeachingStyleFilter,
  PaginatedTeachingStyles,
  TeachingStyleComparison,
  TeachingStyleFeedback,
} from '../types/teachingStyle';

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

// 授業スタイル一覧取得
const getTeachingStyles = async (
  page: number = 1,
  limit: number = 10,
  filters?: TeachingStyleFilter
): Promise<PaginatedTeachingStyles> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters) {
    if (filters.category?.length) {
      params.append('category', filters.category.join(','));
    }
    if (filters.subjects?.length) {
      params.append('subjects', filters.subjects.join(','));
    }
    if (filters.gradeLevel?.length) {
      params.append('gradeLevel', filters.gradeLevel.join(','));
    }
    if (filters.personalityTypes?.length) {
      params.append('personalityTypes', filters.personalityTypes.join(','));
    }
    if (filters.technologyUse?.length) {
      params.append('technologyUse', filters.technologyUse.join(','));
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
  }

  const response = await api.get(`/teaching-styles?${params}`);
  return response.data;
};

// 授業スタイル詳細取得
const getTeachingStyleById = async (id: string): Promise<TeachingStyle> => {
  const response = await api.get(`/teaching-styles/${id}`);
  return response.data;
};

// 診断結果に基づくおすすめスタイル取得
const getRecommendedStyles = async (diagnosisId: string): Promise<TeachingStyle[]> => {
  const response = await api.get(`/teaching-styles/recommend/diagnosis/${diagnosisId}`);
  return response.data.styles;
};

// パーソナリティタイプに基づくおすすめスタイル取得
const getStylesByPersonalityType = async (personalityType: string): Promise<TeachingStyle[]> => {
  const response = await api.get(`/teaching-styles/recommend/personality/${personalityType}`);
  return response.data.styles;
};

// スタイル比較
const compareStyles = async (styleIds: string[]): Promise<TeachingStyleComparison> => {
  const response = await api.post('/teaching-styles/compare', { styleIds });
  return response.data;
};

// フィードバック送信
const submitFeedback = async (
  styleId: string,
  effectiveness: number,
  satisfaction: number,
  comment?: string
): Promise<void> => {
  await api.post(`/teaching-styles/${styleId}/feedback`, {
    effectiveness,
    satisfaction,
    comment,
  });
};

// スタイル統計取得
const getStyleStatistics = async (styleId: string): Promise<any> => {
  const response = await api.get(`/teaching-styles/${styleId}/statistics`);
  return response.data;
};

// 人気のスタイル取得
const getPopularStyles = async (limit: number = 5): Promise<TeachingStyle[]> => {
  const response = await api.get(`/teaching-styles/popular?limit=${limit}`);
  return response.data.styles;
};

// 最近使用されたスタイル取得
const getRecentlyUsedStyles = async (): Promise<TeachingStyle[]> => {
  const response = await api.get('/teaching-styles/recent');
  return response.data.styles;
};

export default {
  getTeachingStyles,
  getTeachingStyleById,
  getRecommendedStyles,
  getStylesByPersonalityType,
  compareStyles,
  submitFeedback,
  getStyleStatistics,
  getPopularStyles,
  getRecentlyUsedStyles,
};