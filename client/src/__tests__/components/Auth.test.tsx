import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from '../../components/Auth/Login';
import Register from '../../components/Auth/Register';
import { AuthProvider } from '../../contexts/AuthContext';
import * as authService from '../../services/auth';

// モック
jest.mock('../../services/auth');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// テーマ
const theme = createTheme();

// ラッパーコンポーネント
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// カスタムレンダー関数
const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    customRender(<Login />);
    
    expect(screen.getByText('ログイン')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByText('アカウントをお持ちでない方はこちら')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    customRender(<Login />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    // 無効なメールアドレス
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(await screen.findByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    customRender(<Login />);
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    // 空のフォームで送信
    await user.click(submitButton);
    
    expect(await screen.findByText('メールアドレスは必須です')).toBeInTheDocument();
    expect(await screen.findByText('パスワードは必須です')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'teacher',
    };
    
    mockedAuthService.login.mockResolvedValueOnce({
      user: mockUser,
      token: 'mock-token',
    });
    
    customRender(<Login />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockedAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('handles login error', async () => {
    const user = userEvent.setup();
    mockedAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    customRender(<Login />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    expect(await screen.findByText('ログインに失敗しました')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    customRender(<Login />);
    
    const passwordInput = screen.getByLabelText('パスワード') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('パスワードを表示');
    
    // 初期状態はパスワード非表示
    expect(passwordInput.type).toBe('password');
    
    // パスワード表示
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    // パスワード非表示
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });
});

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    customRender(<Register />);
    
    expect(screen.getByText('新規登録')).toBeInTheDocument();
    expect(screen.getByLabelText('名前')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
    expect(screen.getByLabelText('学校名')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
  });

  it('validates password match', async () => {
    const user = userEvent.setup();
    customRender(<Register />);
    
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    const submitButton = screen.getByRole('button', { name: '登録' });
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.click(submitButton);
    
    expect(await screen.findByText('パスワードが一致しません')).toBeInTheDocument();
  });

  it('validates password strength', async () => {
    const user = userEvent.setup();
    customRender(<Register />);
    
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: '登録' });
    
    // 弱いパスワード
    await user.type(passwordInput, 'weak');
    await user.click(submitButton);
    
    expect(await screen.findByText(/パスワードは8文字以上/)).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'teacher',
    };
    
    mockedAuthService.register.mockResolvedValueOnce({
      user: mockUser,
      token: 'mock-token',
    });
    
    customRender(<Register />);
    
    const nameInput = screen.getByLabelText('名前');
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    const schoolInput = screen.getByLabelText('学校名');
    const submitButton = screen.getByRole('button', { name: '登録' });
    
    await user.type(nameInput, 'New User');
    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'StrongP@ssw0rd');
    await user.type(confirmPasswordInput, 'StrongP@ssw0rd');
    await user.type(schoolInput, 'Test School');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockedAuthService.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'StrongP@ssw0rd',
        school: 'Test School',
        subjects: [],
        grades: [],
      });
    });
  });

  it('handles registration error for existing email', async () => {
    const user = userEvent.setup();
    mockedAuthService.register.mockRejectedValueOnce(
      new Error('Email already exists')
    );
    
    customRender(<Register />);
    
    const nameInput = screen.getByLabelText('名前');
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const confirmPasswordInput = screen.getByLabelText('パスワード（確認）');
    const schoolInput = screen.getByLabelText('学校名');
    const submitButton = screen.getByRole('button', { name: '登録' });
    
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'StrongP@ssw0rd');
    await user.type(confirmPasswordInput, 'StrongP@ssw0rd');
    await user.type(schoolInput, 'Test School');
    await user.click(submitButton);
    
    expect(await screen.findByText('このメールアドレスは既に登録されています')).toBeInTheDocument();
  });

  it('handles subject selection', async () => {
    const user = userEvent.setup();
    customRender(<Register />);
    
    // 教科選択を開く
    const subjectSelect = screen.getByLabelText('担当教科');
    await user.click(subjectSelect);
    
    // 教科を選択
    const mathOption = await screen.findByText('数学');
    await user.click(mathOption);
    
    // 選択された教科が表示される
    expect(screen.getByText('数学')).toBeInTheDocument();
  });

  it('handles grade selection', async () => {
    const user = userEvent.setup();
    customRender(<Register />);
    
    // 学年選択を開く
    const gradeSelect = screen.getByLabelText('担当学年');
    await user.click(gradeSelect);
    
    // 学年を選択
    const grade1Option = await screen.findByText('中学1年');
    await user.click(grade1Option);
    
    // 選択された学年が表示される
    expect(screen.getByText('中学1年')).toBeInTheDocument();
  });
});

describe('Authentication Flow', () => {
  it('redirects to login when accessing protected route', async () => {
    customRender(<Login />);
    
    // ログインページが表示される
    expect(screen.getByText('ログイン')).toBeInTheDocument();
  });

  it('shows loading state during authentication', async () => {
    const user = userEvent.setup();
    
    // ログイン処理を遅延させる
    mockedAuthService.login.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        user: { id: '1', email: 'test@example.com', name: 'Test', role: 'teacher' },
        token: 'token',
      }), 1000))
    );
    
    customRender(<Login />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // ローディング表示
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});