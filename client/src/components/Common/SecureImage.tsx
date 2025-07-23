import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { BrokenImage, Lock } from '@mui/icons-material';
import { sanitizeUrl } from '../../utils/security';

interface SecureImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  loading?: 'eager' | 'lazy';
  referrerPolicy?: ReferrerPolicy;
  crossOrigin?: 'anonymous' | 'use-credentials';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  validateSrc?: (src: string) => boolean;
  transformSrc?: (src: string) => string;
  maxRetries?: number;
  retryDelay?: number;
  showLoadingIndicator?: boolean;
  showErrorIndicator?: boolean;
  cspNonce?: string;
}

const SecureImage: React.FC<SecureImageProps> = ({
  src,
  alt,
  width,
  height,
  fallbackSrc,
  onLoad,
  onError,
  loading = 'lazy',
  referrerPolicy = 'strict-origin-when-cross-origin',
  crossOrigin = 'anonymous',
  className,
  style,
  placeholder,
  errorPlaceholder,
  validateSrc,
  transformSrc,
  maxRetries = 3,
  retryDelay = 1000,
  showLoadingIndicator = true,
  showErrorIndicator = true,
  cspNonce,
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const mountedRef = useRef(true);

  // URLのサニタイゼーションと検証
  useEffect(() => {
    mountedRef.current = true;
    
    const processSrc = async () => {
      try {
        // URLのサニタイゼーション
        let processedSrc = sanitizeUrl(src);
        
        if (!processedSrc) {
          throw new Error('Invalid URL');
        }

        // カスタム検証
        if (validateSrc && !validateSrc(processedSrc)) {
          throw new Error('URL validation failed');
        }

        // URLの変換
        if (transformSrc) {
          processedSrc = transformSrc(processedSrc);
        }

        // Content Security Policyの検証
        if (typeof window !== 'undefined' && 'cspNonce' in window && cspNonce) {
          // CSPノンスの検証
          if (window.cspNonce !== cspNonce) {
            throw new Error('CSP nonce mismatch');
          }
        }

        if (mountedRef.current) {
          setCurrentSrc(processedSrc);
          setImageState('loading');
        }
      } catch (error) {
        if (mountedRef.current) {
          setImageState('error');
          if (onError) {
            onError(error as Error);
          }
        }
      }
    };

    processSrc();

    return () => {
      mountedRef.current = false;
    };
  }, [src, validateSrc, transformSrc, cspNonce, onError]);

  // 画像の読み込み成功
  const handleLoad = () => {
    if (mountedRef.current) {
      setImageState('loaded');
      setRetryCount(0);
      if (onLoad) {
        onLoad();
      }
    }
  };

  // 画像の読み込みエラー
  const handleError = () => {
    if (!mountedRef.current) return;

    if (retryCount < maxRetries) {
      // リトライ
      setTimeout(() => {
        if (mountedRef.current) {
          setRetryCount(prev => prev + 1);
          // キャッシュバスティングのためのクエリパラメータを追加
          const separator = currentSrc.includes('?') ? '&' : '?';
          setCurrentSrc(prev => `${prev.split('?')[0]}${separator}retry=${Date.now()}`);
        }
      }, retryDelay * (retryCount + 1));
    } else if (fallbackSrc) {
      // フォールバック画像を使用
      setCurrentSrc(sanitizeUrl(fallbackSrc));
      setRetryCount(maxRetries + 1); // フォールバックでの無限ループを防ぐ
    } else {
      // エラー状態に設定
      setImageState('error');
      if (onError) {
        onError(new Error('Image failed to load'));
      }
    }
  };

  // セキュリティヘッダーの設定
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
  };

  // レンダリング内容の決定
  const renderContent = () => {
    switch (imageState) {
      case 'loading':
        if (placeholder) {
          return placeholder;
        }
        if (showLoadingIndicator) {
          return (
            <Skeleton
              variant="rectangular"
              width={width || '100%'}
              height={height || 200}
              animation="wave"
            />
          );
        }
        return null;

      case 'error':
        if (errorPlaceholder) {
          return errorPlaceholder;
        }
        if (showErrorIndicator) {
          return (
            <Box
              sx={{
                width: width || '100%',
                height: height || 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
              }}
            >
              <BrokenImage sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                画像を読み込めませんでした
              </Typography>
            </Box>
          );
        }
        return null;

      case 'loaded':
        return (
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            referrerPolicy={referrerPolicy}
            crossOrigin={crossOrigin}
            onLoad={handleLoad}
            onError={handleError}
            className={className}
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              ...style,
            }}
            // セキュリティ属性
            data-csp-nonce={cspNonce}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        position: 'relative',
        width: width || 'auto',
        height: height || 'auto',
      }}
    >
      {renderContent()}
      
      {/* 画像がロード中でもイメージタグは常にレンダリング（SEO対策） */}
      {imageState !== 'loaded' && currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: 'none' }}
          loading={loading}
          referrerPolicy={referrerPolicy}
          crossOrigin={crossOrigin}
        />
      )}
      
      {/* HTTPS以外の画像の場合の警告表示 */}
      {currentSrc && !currentSrc.startsWith('https://') && !currentSrc.startsWith('data:') && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            borderRadius: '50%',
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="この画像は安全でない接続を使用しています"
        >
          <Lock sx={{ fontSize: 16 }} />
        </Box>
      )}
    </Box>
  );
};

// 画像のプリロード用ユーティリティ
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = sanitizeUrl(src);
  });
};

// 複数画像のプリロード
export const preloadImages = async (srcs: string[]): Promise<void[]> => {
  return Promise.all(srcs.map(src => preloadImage(src)));
};

// 画像の遅延読み込み用フック
export const useLazyLoadImage = (src: string, options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      options || { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return {
    imgRef,
    src: isIntersecting ? src : '',
    isLoading: isIntersecting && !hasLoaded,
    onLoad: () => setHasLoaded(true),
  };
};

export default SecureImage;