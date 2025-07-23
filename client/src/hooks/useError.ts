import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

export interface ErrorState {
  message: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
}

export interface UseErrorOptions {
  /** エラーを自動的にクリアするまでの時間（ミリ秒） */
  autoClearTimeout?: number;
  /** エラー発生時のコールバック */
  onError?: (error: ErrorState) => void;
  /** 特定のエラーコードでリダイレクトする */
  redirectOn?: {
    403?: string;
    404?: string;
    500?: string;
  };
  /** エラーメッセージのカスタマイズ */
  messageMap?: Record<string | number, string>;
}

export const useError = (options: UseErrorOptions = {}) => {
  const navigate = useNavigate();
  const [error, setError] = useState<ErrorState | null>(null);
  const [isError, setIsError] = useState(false);

  // エラーのクリア
  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  // エラーメッセージの取得
  const getErrorMessage = useCallback((err: any): string => {
    // カスタムメッセージマップから取得
    if (options.messageMap && err.code && options.messageMap[err.code]) {
      return options.messageMap[err.code];
    }

    // Axiosエラーの処理
    if (err.isAxiosError) {
      const axiosError = err as AxiosError<any>;
      
      // レスポンスエラー
      if (axiosError.response) {
        const { status, data } = axiosError.response;
        
        // カスタムメッセージマップから取得
        if (options.messageMap && options.messageMap[status]) {
          return options.messageMap[status];
        }
        
        // APIからのエラーメッセージ
        if (data?.message) {
          return data.message;
        }
        
        // デフォルトのHTTPステータスメッセージ
        switch (status) {
          case 400:
            return '入力内容に誤りがあります';
          case 401:
            return '認証が必要です';
          case 403:
            return 'アクセス権限がありません';
          case 404:
            return 'リソースが見つかりません';
          case 409:
            return 'データの競合が発生しました';
          case 422:
            return '入力データが無効です';
          case 429:
            return 'リクエストが多すぎます。しばらくしてからお試しください';
          case 500:
            return 'サーバーエラーが発生しました';
          case 502:
            return 'サーバーが一時的に利用できません';
          case 503:
            return 'サービスが一時的に利用できません';
          default:
            return `エラーが発生しました (${status})`;
        }
      }
      
      // ネットワークエラー
      if (axiosError.request) {
        return 'ネットワークエラーが発生しました。接続を確認してください';
      }
    }

    // 一般的なエラー
    if (err.message) {
      return err.message;
    }

    return '予期しないエラーが発生しました';
  }, [options.messageMap]);

  // エラーコードの取得
  const getErrorCode = useCallback((err: any): string | number | undefined => {
    if (err.code) return err.code;
    if (err.isAxiosError && err.response) {
      return err.response.status;
    }
    return undefined;
  }, []);

  // エラーの設定
  const setErrorFromException = useCallback((err: any) => {
    const errorState: ErrorState = {
      message: getErrorMessage(err),
      code: getErrorCode(err),
      details: err,
      timestamp: new Date(),
    };

    setError(errorState);
    setIsError(true);

    // コールバックの実行
    if (options.onError) {
      options.onError(errorState);
    }

    // リダイレクトの処理
    if (options.redirectOn && errorState.code) {
      const redirectPath = options.redirectOn[errorState.code as keyof typeof options.redirectOn];
      if (redirectPath) {
        navigate(redirectPath);
      }
    }

    // コンソールにエラーを出力（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by useError:', err);
    }
  }, [getErrorMessage, getErrorCode, navigate, options]);

  // エラーハンドラー（Promise用）
  const handleError = useCallback((err: any) => {
    setErrorFromException(err);
    return Promise.reject(err);
  }, [setErrorFromException]);

  // try-catchラッパー
  const tryAsync = useCallback(async <T,>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      clearError();
      return await asyncFn();
    } catch (err) {
      setErrorFromException(err);
      return null;
    }
  }, [clearError, setErrorFromException]);

  // 同期関数用のtry-catchラッパー
  const trySync = useCallback(<T,>(
    fn: () => T
  ): T | null => {
    try {
      clearError();
      return fn();
    } catch (err) {
      setErrorFromException(err);
      return null;
    }
  }, [clearError, setErrorFromException]);

  // 自動クリアの設定
  useEffect(() => {
    if (error && options.autoClearTimeout) {
      const timer = setTimeout(() => {
        clearError();
      }, options.autoClearTimeout);

      return () => clearTimeout(timer);
    }
  }, [error, options.autoClearTimeout, clearError]);

  return {
    error,
    isError,
    errorMessage: error?.message || '',
    errorCode: error?.code,
    setError: setErrorFromException,
    clearError,
    handleError,
    tryAsync,
    trySync,
  };
};

// グローバルエラーハンドラー
export const useGlobalErrorHandler = () => {
  const { setError } = useError({
    redirectOn: {
      403: '/forbidden',
      404: '/not-found',
      500: '/server-error',
    },
  });

  useEffect(() => {
    // unhandledrejectionイベントのリスナー
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(event.reason);
    };

    // errorイベントのリスナー
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setError(event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [setError]);
};

export default useError;