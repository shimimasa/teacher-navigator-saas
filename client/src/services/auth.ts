import api, { ApiResponse, setAuthToken, removeAuthToken } from './api';
import { User, LoginCredentials, RegisterData } from '../types/auth';

// 認証サービス
class AuthService {
  // ログイン
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      const { user, token } = response.data.data;
      setAuthToken(token);
      return { user, token };
    }
    
    throw new Error(response.data.error?.message || 'ログインに失敗しました');
  }

  // ユーザー登録
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    
    if (response.data.success && response.data.data) {
      const { user, token } = response.data.data;
      setAuthToken(token);
      return { user, token };
    }
    
    throw new Error(response.data.error?.message || '登録に失敗しました');
  }

  // ログアウト
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // エラーが発生してもローカルのトークンは削除
      console.error('ログアウトエラー:', error);
    } finally {
      removeAuthToken();
    }
  }

  // 現在のユーザー情報を取得
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  // パスワードリセット要求
  async requestPasswordReset(email: string): Promise<void> {
    const response = await api.post<ApiResponse>('/auth/reset-password/request', { email });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'パスワードリセットの要求に失敗しました');
    }
  }

  // パスワードリセット実行
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await api.post<ApiResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'パスワードのリセットに失敗しました');
    }
  }

  // プロフィール更新
  async updateProfile(data: Partial<User['profile']>): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('プロフィールの更新に失敗しました');
  }

  // パスワード変更
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.put<ApiResponse>('/auth/password', {
      currentPassword,
      newPassword,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'パスワードの変更に失敗しました');
    }
  }

  // トークン検証
  async verifyToken(): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse>('/auth/verify');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();