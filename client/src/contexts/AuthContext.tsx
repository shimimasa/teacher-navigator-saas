import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/auth';
import { User, LoginCredentials, RegisterData, AuthContextType } from '../types/auth';

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーのプロパティ
interface AuthProviderProps {
  children: ReactNode;
}

// 認証プロバイダーコンポーネント
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期化時にトークンを確認
  useEffect(() => {
    checkAuth();
  }, []);

  // 認証状態の確認
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const isValid = await authService.verifyToken();
        if (isValid) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('認証チェックエラー:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  // ログイン
  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);
      const { user } = await authService.login(credentials);
      setUser(user);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || error.message || 'ログインに失敗しました');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ユーザー登録
  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setLoading(true);
      const { user } = await authService.register(data);
      setUser(user);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || error.message || '登録に失敗しました');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // プロフィール更新
  const updateProfile = async (data: Partial<User['profile']>) => {
    try {
      setError(null);
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || error.message || 'プロフィールの更新に失敗しました');
      throw error;
    }
  };

  // エラーのクリア
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 認証コンテキストを使用するカスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};