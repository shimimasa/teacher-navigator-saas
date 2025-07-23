import React, { Suspense, lazy, ComponentType, ReactNode, useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';

interface LazyComponentProps {
  // 遅延読み込みするコンポーネントのパス
  componentPath: string;
  // コンポーネントに渡すprops
  componentProps?: Record<string, any>;
  // ローディング時の表示
  fallback?: ReactNode;
  // エラー時の表示
  errorFallback?: ReactNode;
  // 最小ローディング表示時間（ミリ秒）
  minLoadTime?: number;
  // プリロード
  preload?: boolean;
  // リトライ機能
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

// 動的インポートのキャッシュ
const componentCache = new Map<string, ComponentType<any>>();
const loadingPromises = new Map<string, Promise<ComponentType<any>>>();

// コンポーネントをロードする関数
async function loadComponent(path: string): Promise<ComponentType<any>> {
  // キャッシュをチェック
  if (componentCache.has(path)) {
    return componentCache.get(path)!;
  }

  // すでにロード中の場合は、同じPromiseを返す
  if (loadingPromises.has(path)) {
    return loadingPromises.get(path)!;
  }

  // 動的インポート
  const loadPromise = import(path).then(module => {
    const Component = module.default || module;
    componentCache.set(path, Component);
    loadingPromises.delete(path);
    return Component;
  });

  loadingPromises.set(path, loadPromise);
  return loadPromise;
}

// プリロード関数
export function preloadComponent(path: string): void {
  loadComponent(path).catch(err => {
    console.error(`Failed to preload component: ${path}`, err);
  });
}

// 複数コンポーネントのプリロード
export function preloadComponents(paths: string[]): void {
  paths.forEach(path => preloadComponent(path));
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  componentPath,
  componentProps = {},
  fallback,
  errorFallback,
  minLoadTime = 0,
  preload = false,
  retry = true,
  maxRetries = 3,
  retryDelay = 1000,
}) => {
  const [Component, setComponent] = useState<ComponentType<any> | null>(() => {
    // キャッシュから取得を試みる
    return componentCache.get(componentPath) || null;
  });
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(!Component);

  // コンポーネントのロード
  useEffect(() => {
    if (Component) return;

    let isMounted = true;
    const startTime = Date.now();

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const LoadedComponent = await loadComponent(componentPath);

        // 最小ローディング時間の確保
        const elapsedTime = Date.now() - startTime;
        if (minLoadTime > 0 && elapsedTime < minLoadTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime));
        }

        if (isMounted) {
          setComponent(() => LoadedComponent);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);

          // リトライ処理
          if (retry && retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, retryDelay * (retryCount + 1));
          }
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [componentPath, minLoadTime, retry, retryCount, maxRetries, retryDelay, Component]);

  // プリロード処理
  useEffect(() => {
    if (preload && !Component) {
      preloadComponent(componentPath);
    }
  }, [preload, componentPath, Component]);

  // エラー時の表示
  if (error && retryCount >= maxRetries) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }

    return (
      <Alert 
        severity="error" 
        sx={{ m: 2 }}
        action={
          retry ? (
            <Box
              component="button"
              onClick={() => setRetryCount(0)}
              sx={{
                border: 'none',
                background: 'none',
                color: 'inherit',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              再試行
            </Box>
          ) : undefined
        }
      >
        コンポーネントの読み込みに失敗しました: {componentPath}
      </Alert>
    );
  }

  // ローディング中の表示
  if (isLoading || !Component) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          p: 3,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // コンポーネントのレンダリング
  return (
    <ErrorBoundary>
      <Component {...componentProps} />
    </ErrorBoundary>
  );
};

// 遅延読み込みフック
export function useLazyComponent<T = any>(
  componentPath: string,
  options?: {
    preload?: boolean;
    minLoadTime?: number;
  }
): {
  Component: ComponentType<T> | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const [Component, setComponent] = useState<ComponentType<T> | null>(() => {
    return componentCache.get(componentPath) as ComponentType<T> | null;
  });
  const [isLoading, setIsLoading] = useState(!Component);
  const [error, setError] = useState<Error | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (Component) return;

    let isMounted = true;
    const startTime = Date.now();

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const LoadedComponent = await loadComponent(componentPath);

        // 最小ローディング時間
        if (options?.minLoadTime) {
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < options.minLoadTime) {
            await new Promise(resolve => 
              setTimeout(resolve, options.minLoadTime - elapsedTime)
            );
          }
        }

        if (isMounted) {
          setComponent(() => LoadedComponent as ComponentType<T>);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [componentPath, options?.minLoadTime, retryTrigger, Component]);

  // プリロード
  useEffect(() => {
    if (options?.preload && !Component) {
      preloadComponent(componentPath);
    }
  }, [options?.preload, componentPath, Component]);

  const retry = () => {
    setRetryTrigger(prev => prev + 1);
  };

  return { Component, isLoading, error, retry };
}

// 複数コンポーネントの遅延読み込み
export function LazyComponentGroup({
  components,
  fallback,
  errorFallback,
}: {
  components: Array<{
    path: string;
    props?: Record<string, any>;
    wrapper?: ComponentType<{ children: ReactNode }>;
  }>;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || <CircularProgress />}>
        {components.map(({ path, props, wrapper: Wrapper }, index) => {
          const LazyComp = lazy(() => loadComponent(path));
          const content = <LazyComp key={path} {...(props || {})} />;
          
          return Wrapper ? (
            <Wrapper key={`${path}-wrapper`}>{content}</Wrapper>
          ) : content;
        })}
      </Suspense>
    </ErrorBoundary>
  );
}

// ルート定義用の遅延読み込み
export function lazyRoute(
  componentPath: string,
  options?: {
    preload?: boolean;
    chunkName?: string;
  }
): ComponentType<any> {
  if (options?.preload) {
    preloadComponent(componentPath);
  }

  return lazy(() => 
    loadComponent(componentPath).catch(err => {
      console.error(`Failed to load route component: ${componentPath}`, err);
      // エラー時のフォールバックコンポーネントを返す
      return Promise.resolve(() => (
        <Alert severity="error" sx={{ m: 2 }}>
          ページの読み込みに失敗しました
        </Alert>
      ));
    })
  );
}

export default LazyComponent;