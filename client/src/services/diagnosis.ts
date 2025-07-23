import api, { ApiResponse } from './api';
import {
  DiagnosisQuestion,
  DiagnosisSession,
  DiagnosisAnswer,
  DiagnosisResult,
  DiagnosisHistory,
  DiagnosisStats,
} from '../types/diagnosis';

// 診断サービス
class DiagnosisService {
  // 診断質問を取得
  async getQuestions(category?: string): Promise<DiagnosisQuestion[]> {
    const params = category ? { category } : {};
    const response = await api.get<ApiResponse<DiagnosisQuestion[]>>('/diagnosis/questions', { params });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('質問の取得に失敗しました');
  }

  // 診断を開始
  async startDiagnosis(): Promise<DiagnosisSession> {
    const response = await api.post<ApiResponse<DiagnosisSession>>('/diagnosis/start');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('診断の開始に失敗しました');
  }

  // 回答を保存
  async saveAnswer(
    diagnosisId: string,
    questionId: string,
    value: number
  ): Promise<DiagnosisAnswer> {
    const response = await api.put<ApiResponse<DiagnosisAnswer>>(
      `/diagnosis/${diagnosisId}/answer`,
      { questionId, value }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('回答の保存に失敗しました');
  }

  // 診断を完了
  async submitDiagnosis(diagnosisId: string): Promise<{
    diagnosisId: string;
    result: DiagnosisResult;
    reliability: any;
  }> {
    const response = await api.post<ApiResponse<{
      diagnosisId: string;
      result: DiagnosisResult;
      reliability: any;
    }>>(`/diagnosis/${diagnosisId}/submit`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || '診断の完了に失敗しました');
  }

  // 診断結果を取得
  async getDiagnosisResult(diagnosisId: string): Promise<{
    diagnosis: any;
    result: DiagnosisResult;
    reliability: any;
  }> {
    const response = await api.get<ApiResponse<{
      diagnosis: any;
      result: DiagnosisResult;
      reliability: any;
    }>>(`/diagnosis/${diagnosisId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('診断結果の取得に失敗しました');
  }

  // 診断履歴を取得
  async getDiagnosisHistory(page = 1, limit = 10): Promise<{
    diagnoses: DiagnosisHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await api.get<ApiResponse<{
      diagnoses: DiagnosisHistory[];
      pagination: any;
    }>>('/diagnosis/history', {
      params: { page, limit }
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('診断履歴の取得に失敗しました');
  }

  // フィードバックを送信
  async submitFeedback(diagnosisId: string, rating: number, comment?: string): Promise<void> {
    const response = await api.post<ApiResponse>(`/diagnosis/${diagnosisId}/feedback`, {
      rating,
      comment,
    });
    
    if (!response.data.success) {
      throw new Error('フィードバックの送信に失敗しました');
    }
  }

  // 診断統計を取得
  async getDiagnosisStats(): Promise<DiagnosisStats> {
    const response = await api.get<ApiResponse<DiagnosisStats>>('/diagnosis/stats');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('診断統計の取得に失敗しました');
  }

  // 診断の進捗を計算（クライアント側）
  calculateProgress(answers: DiagnosisAnswer[], totalQuestions: number): {
    percentage: number;
    categoryProgress: Record<string, number>;
  } {
    const answeredCount = answers.length;
    const percentage = Math.round((answeredCount / totalQuestions) * 100);
    
    // カテゴリー別の進捗を計算
    const categoryProgress: Record<string, number> = {
      extroversion: 0,
      sensing: 0,
      thinking: 0,
      judging: 0,
    };
    
    // 実際のカテゴリー別計算はサーバーから取得した質問データに基づいて行う
    
    return { percentage, categoryProgress };
  }

  // 回答の妥当性をチェック（クライアント側）
  validateAnswers(answers: DiagnosisAnswer[], minPerCategory = 5): {
    isValid: boolean;
    missingCategories: string[];
  } {
    // カテゴリー別の回答数をカウント
    const categoryCounts: Record<string, number> = {
      extroversion: 0,
      sensing: 0,
      thinking: 0,
      judging: 0,
    };
    
    // 実際のカウントはサーバーから取得した質問データに基づいて行う
    
    const missingCategories = Object.entries(categoryCounts)
      .filter(([_, count]) => count < minPerCategory)
      .map(([category]) => category);
    
    return {
      isValid: missingCategories.length === 0,
      missingCategories,
    };
  }
}

export default new DiagnosisService();