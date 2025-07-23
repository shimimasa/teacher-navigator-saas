import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Home,
  ArrowBack,
  Refresh,
  HelpOutline,
  Lock,
  SearchOff,
  CloudOff,
  BrokenImage,
} from '@mui/icons-material';

export type ErrorType = '404' | '403' | '500' | 'network' | 'generic';

interface ErrorPageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  illustration?: React.ReactNode;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  type = 'generic',
  title,
  message,
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = true,
  onRefresh,
  illustration,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const getErrorConfig = () => {
    switch (type) {
      case '404':
        return {
          icon: <SearchOff sx={{ fontSize: 100, color: 'primary.main' }} />,
          defaultTitle: 'ページが見つかりません',
          defaultMessage: 'お探しのページは存在しないか、移動した可能性があります。',
          color: theme.palette.primary.main,
        };
      case '403':
        return {
          icon: <Lock sx={{ fontSize: 100, color: 'warning.main' }} />,
          defaultTitle: 'アクセスが拒否されました',
          defaultMessage: 'このページを表示する権限がありません。',
          color: theme.palette.warning.main,
        };
      case '500':
        return {
          icon: <ErrorIcon sx={{ fontSize: 100, color: 'error.main' }} />,
          defaultTitle: 'サーバーエラー',
          defaultMessage: 'サーバーで問題が発生しました。しばらくしてからもう一度お試しください。',
          color: theme.palette.error.main,
        };
      case 'network':
        return {
          icon: <CloudOff sx={{ fontSize: 100, color: 'grey.500' }} />,
          defaultTitle: 'ネットワークエラー',
          defaultMessage: 'インターネット接続を確認してください。',
          color: theme.palette.grey[500],
        };
      default:
        return {
          icon: <BrokenImage sx={{ fontSize: 100, color: 'error.main' }} />,
          defaultTitle: 'エラーが発生しました',
          defaultMessage: '予期しないエラーが発生しました。',
          color: theme.palette.error.main,
        };
    }
  };

  const config = getErrorConfig();
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            bgcolor: 'background.default',
          }}
        >
          {/* エラーアイコンまたはカスタムイラスト */}
          <Box sx={{ mb: 3 }}>
            {illustration || config.icon}
          </Box>

          {/* エラーコード（該当する場合） */}
          {['404', '403', '500'].includes(type) && (
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '4rem', sm: '6rem' },
                fontWeight: 'bold',
                color: config.color,
                mb: 2,
                opacity: 0.8,
              }}
            >
              {type}
            </Typography>
          )}

          {/* タイトル */}
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 'medium',
              mb: 2,
            }}
          >
            {displayTitle}
          </Typography>

          {/* メッセージ */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            {displayMessage}
          </Typography>

          {/* アクションボタン */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {showBackButton && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                size="large"
              >
                前のページへ
              </Button>
            )}
            
            {showHomeButton && (
              <Button
                variant="contained"
                startIcon={<Home />}
                onClick={handleHome}
                size="large"
              >
                ホームへ戻る
              </Button>
            )}
            
            {showRefreshButton && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                size="large"
              >
                再読み込み
              </Button>
            )}
          </Box>

          {/* ヘルプリンク */}
          <Box sx={{ mt: 4 }}>
            <Button
              startIcon={<HelpOutline />}
              onClick={() => navigate('/help')}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              お困りですか？ヘルプセンターへ
            </Button>
          </Box>

          {/* エラーID（デバッグ用） */}
          {process.env.NODE_ENV === 'development' && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 3,
                display: 'block',
                fontFamily: 'monospace',
              }}
            >
              Error ID: {Date.now()}-{Math.random().toString(36).substr(2, 9)}
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

// 個別のエラーページコンポーネント
export const NotFoundPage: React.FC = () => (
  <ErrorPage type="404" />
);

export const ForbiddenPage: React.FC = () => (
  <ErrorPage type="403" />
);

export const ServerErrorPage: React.FC = () => (
  <ErrorPage type="500" />
);

export const NetworkErrorPage: React.FC = () => (
  <ErrorPage type="network" />
);

export default ErrorPage;