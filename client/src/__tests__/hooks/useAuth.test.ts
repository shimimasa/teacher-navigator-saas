import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/auth';
import { User } from '../../types';

// モック
jest.mock('../../services/auth');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// localStorageのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ラッパーコンポーネント
const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('initializes with user when token exists', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    };
    
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockedAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles login successfully', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    };
    
    mockedAuthService.login.mockResolvedValueOnce({
      user: mockUser,
      token: 'mock-token',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-token');
  });

  it('handles login failure', async () => {
    mockedAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await expect(
      act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      })
    ).rejects.toThrow('Invalid credentials');
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles register successfully', async () => {
    const mockUser: User = {
      id: '1',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'teacher',
    };
    
    mockedAuthService.register.mockResolvedValueOnce({
      user: mockUser,
      token: 'mock-token',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.register({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        school: 'Test School',
        subjects: ['math'],
        grades: ['grade7'],
      });
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-token');
  });

  it('handles logout', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    };
    
    // ユーザーをログイン状態にする
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockedAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);
    
    const { result, rerender } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
    
    // ログアウト
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('handles token expiration', async () => {
    localStorageMock.getItem.mockReturnValue('expired-token');
    mockedAuthService.getCurrentUser.mockRejectedValueOnce(new Error('Token expired'));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('updates user profile', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    };
    
    const updatedUser: User = {
      ...mockUser,
      name: 'Updated User',
    };
    
    // ユーザーをログイン状態にする
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockedAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);
    mockedAuthService.updateProfile.mockResolvedValueOnce(updatedUser);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
    
    // プロフィール更新
    await act(async () => {
      await result.current.updateProfile({ name: 'Updated User' });
    });
    
    expect(result.current.user).toEqual(updatedUser);
  });

  it('checks specific permissions', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    };
    
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockedAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
    
    // 権限チェック
    expect(result.current.hasRole('teacher')).toBe(true);
    expect(result.current.hasRole('admin')).toBe(false);
    expect(result.current.hasRole('student')).toBe(false);
  });

  it('handles concurrent login attempts', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    };
    
    let loginCallCount = 0;
    mockedAuthService.login.mockImplementation(() => {
      loginCallCount++;
      return new Promise(resolve => 
        setTimeout(() => resolve({
          user: mockUser,
          token: `mock-token-${loginCallCount}`,
        }), 100)
      );
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // 複数のログイン試行
    const loginPromises = await act(async () => {
      const promise1 = result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      const promise2 = result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      
      return Promise.all([promise1, promise2]);
    });
    
    // 最初のログインのみが処理される
    expect(loginCallCount).toBe(1);
    expect(result.current.user).toEqual(mockUser);
  });

  it('refreshes authentication token', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    };
    
    localStorageMock.getItem.mockReturnValue('old-token');
    mockedAuthService.getCurrentUser.mockResolvedValueOnce(mockUser);
    mockedAuthService.refreshToken.mockResolvedValueOnce({
      token: 'new-token',
      user: mockUser,
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
    
    // トークンをリフレッシュ
    await act(async () => {
      await result.current.refreshToken();
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
  });
});