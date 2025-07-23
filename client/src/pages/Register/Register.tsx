import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../types/auth';

const steps = ['基本情報', 'プロフィール'];

const subjects = [
  '国語', '数学', '理科', '社会', '英語',
  '美術', '音楽', '体育', '技術', '家庭科',
  '情報', 'その他'
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    school: '',
    subjects: [],
    experienceYears: undefined,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<any>({});

  // 入力値の変更ハンドラー
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    
    if (name === 'subjects') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'experienceYears') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // エラーをクリア
    if (validationErrors[name]) {
      setValidationErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  // ステップ1のバリデーション
  const validateStep1 = (): boolean => {
    const errors: any = {};
    
    if (!formData.email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!formData.password) {
      errors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      errors.password = 'パスワードは8文字以上で入力してください';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    if (!formData.name) {
      errors.name = '名前を入力してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ステップ2のバリデーション
  const validateStep2 = (): boolean => {
    const errors: any = {};
    
    if (formData.experienceYears !== undefined && formData.experienceYears < 0) {
      errors.experienceYears = '経験年数は0以上の数値で入力してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 次へボタンのハンドラー
  const handleNext = () => {
    if (activeStep === 0 && validateStep1()) {
      setActiveStep(1);
    } else if (activeStep === 1 && validateStep2()) {
      handleSubmit();
    }
  };

  // 戻るボタンのハンドラー
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // フォーム送信ハンドラー
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (error) {
      // エラーはAuthContextで処理される
      setActiveStep(0); // エラー時は最初のステップに戻る
    } finally {
      setLoading(false);
    }
  };

  // ステップコンテンツの取得
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="メールアドレス"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="パスワード"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!validationErrors.password}
              helperText={validationErrors.password || '8文字以上で入力してください'}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="パスワード（確認）"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (validationErrors.confirmPassword) {
                  setValidationErrors((prev: any) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="name"
              label="名前"
              id="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              disabled={loading}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              margin="normal"
              fullWidth
              name="school"
              label="学校名"
              id="school"
              value={formData.school || ''}
              onChange={handleChange}
              disabled={loading}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="subjects-label">担当教科</InputLabel>
              <Select
                labelId="subjects-label"
                id="subjects"
                name="subjects"
                multiple
                value={formData.subjects || []}
                onChange={handleChange}
                label="担当教科"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                disabled={loading}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>複数選択可能です</FormHelperText>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              name="experienceYears"
              label="教員経験年数"
              type="number"
              id="experienceYears"
              value={formData.experienceYears || ''}
              onChange={handleChange}
              error={!!validationErrors.experienceYears}
              helperText={validationErrors.experienceYears}
              disabled={loading}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            新規登録
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" noValidate>
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : activeStep === steps.length - 1 ? (
                  '登録'
                ) : (
                  '次へ'
                )}
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              すでにアカウントをお持ちの方は
            </Typography>
            <Link component={RouterLink} to="/login" variant="body2">
              ログイン
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;