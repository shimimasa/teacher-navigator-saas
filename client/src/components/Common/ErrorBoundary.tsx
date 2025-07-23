import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  Home,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // カスタムエラーハンドラーを呼び出す
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // エラー報告サービスに送信（本番環境）
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentryなどのエラー報告サービスに送信
      console.log('Sending error to reporting service...');
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックがある場合
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラー画面
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              textAlign: 'center',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                width: '100%',
                maxWidth: 600,
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              
              <Typography variant="h4" gutterBottom>
                エラーが発生しました
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                申し訳ございません。予期しないエラーが発生しました。
                問題が続く場合は、管理者にお問い合わせください。
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReset}
                >
                  再試行
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                >
                  ホームへ戻る
                </Button>
              </Box>

              {/* エラー詳細（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    onClick={this.toggleDetails}
                    endIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                    size="small"
                  >
                    エラー詳細
                  </Button>
                  
                  <Collapse in={this.state.showDetails}>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        textAlign: 'left',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ fontWeight: 'bold' }}
                      >
                        エラーメッセージ:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          mb: 2,
                          color: 'error.main',
                        }}
                      >
                        {this.state.error.toString()}
                      </Typography>
                      
                      {this.state.errorInfo && (
                        <>
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            sx={{ fontWeight: 'bold' }}
                          >
                            スタックトレース:
                          </Typography>
                          <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              overflow: 'auto',
                              maxHeight: 200,
                              bgcolor: 'grey.200',
                              p: 1,
                              borderRadius: 0.5,
                            }}
                          >
                            {this.state.errorInfo.componentStack}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;