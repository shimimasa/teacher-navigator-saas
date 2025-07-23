import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  useTheme,
  keyframes,
} from '@mui/material';

interface LoadingSpinnerProps {
  /** ローディングメッセージ */
  message?: string;
  /** サイズ（small | medium | large） */
  size?: 'small' | 'medium' | 'large';
  /** フルスクリーン表示 */
  fullScreen?: boolean;
  /** オーバーレイ表示 */
  overlay?: boolean;
  /** 最小表示高さ */
  minHeight?: string | number;
  /** カスタムカラー */
  color?: 'primary' | 'secondary' | 'inherit';
  /** アニメーションタイプ */
  variant?: 'circular' | 'dots' | 'pulse';
}

// ドットアニメーション
const dotAnimation = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

// パルスアニメーション
const pulseAnimation = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
`;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'medium',
  fullScreen = false,
  overlay = false,
  minHeight = '200px',
  color = 'primary',
  variant = 'circular',
}) => {
  const theme = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 56;
      default:
        return 40;
    }
  };

  const getMessageSize = () => {
    switch (size) {
      case 'small':
        return 'body2';
      case 'large':
        return 'h6';
      default:
        return 'body1';
    }
  };

  // ドットローダー
  const DotsLoader = () => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: getSize() / 3,
            height: getSize() / 3,
            borderRadius: '50%',
            bgcolor: `${color}.main`,
            animation: `${dotAnimation} 1.4s ease-in-out ${index * 0.16}s infinite`,
          }}
        />
      ))}
    </Box>
  );

  // パルスローダー
  const PulseLoader = () => (
    <Box
      sx={{
        width: getSize(),
        height: getSize(),
        borderRadius: '50%',
        bgcolor: `${color}.main`,
        animation: `${pulseAnimation} 1.5s ease-in-out infinite`,
      }}
    />
  );

  const getLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      default:
        return (
          <CircularProgress
            size={getSize()}
            color={color}
            thickness={size === 'small' ? 5 : size === 'large' ? 3 : 4}
          />
        );
    }
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: fullScreen ? '100vh' : minHeight,
        width: '100%',
      }}
    >
      {getLoader()}
      {message && (
        <Typography
          variant={getMessageSize() as any}
          color="text.secondary"
          sx={{
            mt: 1,
            textAlign: 'center',
            maxWidth: 300,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (overlay) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
        }}
        open
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress color="inherit" size={getSize()} />
          {message && (
            <Typography variant={getMessageSize() as any}>
              {message}
            </Typography>
          )}
        </Box>
      </Backdrop>
    );
  }

  return content;
};

// 便利なプリセットコンポーネント
export const PageLoader: React.FC<{ message?: string }> = ({ message = '読み込み中...' }) => (
  <LoadingSpinner
    message={message}
    size="large"
    minHeight="50vh"
  />
);

export const ButtonLoader: React.FC = () => (
  <LoadingSpinner
    size="small"
    minHeight="auto"
  />
);

export const OverlayLoader: React.FC<{ message?: string }> = ({ message = '処理中...' }) => (
  <LoadingSpinner
    message={message}
    overlay
    size="large"
  />
);

export const InlineLoader: React.FC<{ message?: string }> = ({ message }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
    <CircularProgress size={16} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

export default LoadingSpinner;