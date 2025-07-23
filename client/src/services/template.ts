import axios from 'axios';
import {
  Template,
  TemplateFilter,
  PaginatedTemplates,
  TemplateFormData,
} from '../types/template';

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

// テンプレート一覧取得
const getTemplates = async (
  page: number = 1,
  limit: number = 10,
  filters?: TemplateFilter
): Promise<PaginatedTemplates> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters) {
    if (filters.type?.length) {
      params.append('type', filters.type.join(','));
    }
    if (filters.subject?.length) {
      params.append('subject', filters.subject.join(','));
    }
    if (filters.gradeLevel?.length) {
      params.append('gradeLevel', filters.gradeLevel.join(','));
    }
    if (filters.teachingStyleId) {
      params.append('teachingStyleId', filters.teachingStyleId);
    }
    if (filters.isPublic !== undefined) {
      params.append('isPublic', filters.isPublic.toString());
    }
    if (filters.isTemplate !== undefined) {
      params.append('isTemplate', filters.isTemplate.toString());
    }
    if (filters.userId) {
      params.append('userId', filters.userId);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.tags?.length) {
      params.append('tags', filters.tags.join(','));
    }
  }

  const response = await api.get(`/templates?${params}`);
  return response.data;
};

// テンプレート詳細取得
const getTemplateById = async (id: string): Promise<Template> => {
  const response = await api.get(`/templates/${id}`);
  return response.data;
};

// テンプレート作成
const createTemplate = async (data: TemplateFormData): Promise<Template> => {
  const response = await api.post('/templates', data);
  return response.data;
};

// テンプレート更新
const updateTemplate = async (id: string, data: Partial<TemplateFormData>): Promise<Template> => {
  const response = await api.put(`/templates/${id}`, data);
  return response.data;
};

// テンプレート削除
const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/templates/${id}`);
};

// テンプレートコピー
const copyTemplate = async (id: string): Promise<Template> => {
  const response = await api.post(`/templates/${id}/copy`);
  return response.data;
};

// テンプレート共有
const shareTemplate = async (id: string, userIds: string[]): Promise<void> => {
  await api.post(`/templates/${id}/share`, { userIds });
};

// 共有解除
const unshareTemplate = async (id: string, userId: string): Promise<void> => {
  await api.delete(`/templates/${id}/share/${userId}`);
};

// いいね
const likeTemplate = async (id: string): Promise<void> => {
  await api.post(`/templates/${id}/like`);
};

// いいね解除
const unlikeTemplate = async (id: string): Promise<void> => {
  await api.delete(`/templates/${id}/like`);
};

// 評価
const rateTemplate = async (id: string, rating: number): Promise<void> => {
  await api.post(`/templates/${id}/rate`, { rating });
};

// PDF生成
const generatePDF = async (id: string): Promise<Blob> => {
  const response = await api.get(`/templates/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
};

// 人気のテンプレート取得
const getPopularTemplates = async (limit: number = 5): Promise<Template[]> => {
  const response = await api.get(`/templates/popular?limit=${limit}`);
  return response.data.templates;
};

// 最近のテンプレート取得
const getRecentTemplates = async (limit: number = 5): Promise<Template[]> => {
  const response = await api.get(`/templates/recent?limit=${limit}`);
  return response.data.templates;
};

// 診断結果からテンプレート生成
const generateFromDiagnosis = async (
  diagnosisId: string,
  styleId: string,
  type: string
): Promise<Template> => {
  const response = await api.post('/templates/generate', {
    diagnosisId,
    styleId,
    type,
  });
  return response.data;
};

// 統計情報取得
const getTemplateStatistics = async (id: string): Promise<any> => {
  const response = await api.get(`/templates/${id}/statistics`);
  return response.data;
};

export default {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  copyTemplate,
  shareTemplate,
  unshareTemplate,
  likeTemplate,
  unlikeTemplate,
  rateTemplate,
  generatePDF,
  getPopularTemplates,
  getRecentTemplates,
  generateFromDiagnosis,
  getTemplateStatistics,
};