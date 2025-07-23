import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import authService from '../../services/auth';

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [mode, setMode] = useState<'request' | 'reset'>(token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<any>({});

  useEffect(() => {
    if (token) {
      setMode('reset');
    }
  }, [token]);

  // リセット要求のバリデーション
  const validateRequest = (): boolean => {
    const errors: any = {};
    
    if (!email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // パスワードリセットのバリデーション
  const validateReset = (): boolean => {
    const errors: any = {};
    
    if (!newPassword) {
      errors.newPassword = '新しいパスワードを入力してください';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'パスワードは8文字以上で入力してください';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // リセット要求の送信
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRequest()) return;
    
    setLoading(true);
    setError('');
    
    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || error.message || 'リセット要求の送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセットの実行
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateReset()) return;
    
    if (!token) {
      setError('リセットトークンが見つかりません');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || error.message || 'パスワードのリセットに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 成功メッセージの表示
  if (success && mode === 'request') {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography component="h1" variant="h5" gutterBottom>
              メールを送信しました
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              パスワードリセットの手順をメールでお送りしました。
              メールボックスをご確認ください。
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              ログインページへ戻る
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            {mode === 'request' ? 'パスワードリセット' : '新しいパスワードの設定'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && mode === 'reset' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              パスワードがリセットされました。ログインページへリダイレクトします...
            </Alert>
          )}
          
          {mode === 'request' ? (
            <Box component="form" onSubmit={handleRequestSubmit} noValidate>
              <Typography variant="body2" color="text.secondary" paragraph>
                登録したメールアドレスを入力してください。
                パスワードリセットの手順をお送りします。
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="メールアドレス"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors({ ...validationErrors, email: '' });
                  }
                  if (error) setError('');
                }}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                disabled={loading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'リセットメールを送信'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleResetSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="新しいパスワード"
                type="password"
                id="newPassword"
                autoComplete="new-password"
                autoFocus
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (validationErrors.newPassword) {
                    setValidationErrors({ ...validationErrors, newPassword: '' });
                  }
                  if (error) setError('');
                }}
                error={!!validationErrors.newPassword}
                helperText={validationErrors.newPassword || '8文字以上で入力してください'}
                disabled={loading || success}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="新しいパスワード（確認）"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors({ ...validationErrors, confirmPassword: '' });
                  }
                }}
                error={!!validationErrors.confirmPassword}
                helperText={validationErrors.confirmPassword}
                disabled={loading || success}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || success}
              >
                {loading ? <CircularProgress size={24} /> : 'パスワードをリセット'}
              </Button>
            </Box>
          )}
          
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              ログインページへ戻る
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PasswordReset;