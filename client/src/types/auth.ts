// ユーザー型定義
export interface User {
  _id: string;
  email: string;
  profile: {
    name: string;
    school?: string;
    subjects?: string[];
    experienceYears?: number;
  };
  role: 'teacher' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ログイン認証情報
export interface LoginCredentials {
  email: string;
  password: string;
}

// ユーザー登録データ
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  school?: string;
  subjects?: string[];
  experienceYears?: number;
}

// 認証コンテキストの型
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User['profile']>) => Promise<void>;
  clearError: () => void;
}