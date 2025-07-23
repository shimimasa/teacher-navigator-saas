import axios, { AxiosInstance, AxiosError } from 'axios';

// APIレスポンスの基本型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any[];
  };
  message?: string;
}

// Axiosインスタンスの作成
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
api.interceptors.request.use(
  (config) => {
    // トークンをヘッダーに追加
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

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // エラーハンドリング
    if (error.response) {
      // サーバーからのエラーレスポンス
      const { status } = error.response;
      
      switch (status) {
        case 401:
          // 認証エラー - トークンをクリアしてログイン画面へ
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // 権限エラー
          console.error('アクセス権限がありません');
          break;
        case 404:
          // Not Found
          console.error('リソースが見つかりません');
          break;
        case 500:
          // サーバーエラー
          console.error('サーバーエラーが発生しました');
          break;
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      console.error('サーバーに接続できません');
    } else {
      // リクエストの設定でエラーが発生
      console.error('リクエストエラー:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API関数のエクスポート
export default api;

// 便利な関数
export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};