import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface UseLoadingOptions {
  /** 最小表示時間（ミリ秒） */
  minDuration?: number;
  /** タイムアウト時間（ミリ秒） */
  timeout?: number;
  /** タイムアウト時のコールバック */
  onTimeout?: () => void;
  /** ローディング開始時のコールバック */
  onStart?: () => void;
  /** ローディング終了時のコールバック */
  onFinish?: () => void;
}

export interface LoadingOperation {
  id: string;
  startTime: number;
  text?: string;
  progress?: number;
}

export const useLoading = (options: UseLoadingOptions = {}) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    loadingText: undefined,
    progress: undefined,
  });
  
  const operationsRef = useRef<Map<string, LoadingOperation>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ローディング状態の更新
  const updateLoadingState = useCallback(() => {
    const operations = Array.from(operationsRef.current.values());
    
    if (operations.length === 0) {
      setState({
        isLoading: false,
        loadingText: undefined,
        progress: undefined,
      });
      return;
    }

    // 最新のoperationのテキストを表示
    const latestOperation = operations[operations.length - 1];
    
    // 全体の進捗を計算（進捗が設定されているもののみ）
    const progressOperations = operations.filter(op => op.progress !== undefined);
    const totalProgress = progressOperations.length > 0
      ? progressOperations.reduce((sum, op) => sum + (op.progress || 0), 0) / progressOperations.length
      : undefined;

    setState({
      isLoading: true,
      loadingText: latestOperation.text,
      progress: totalProgress,
    });
  }, []);

  // ローディング開始
  const startLoading = useCallback((id: string = 'default', text?: string, progress?: number) => {
    const isFirstOperation = operationsRef.current.size === 0;
    
    operationsRef.current.set(id, {
      id,
      startTime: Date.now(),
      text,
      progress,
    });

    updateLoadingState();

    // 最初のローディング開始時の処理
    if (isFirstOperation) {
      if (options.onStart) {
        options.onStart();
      }

      // タイムアウトの設定
      if (options.timeout) {
        timeoutRef.current = setTimeout(() => {
          console.warn(`Loading timeout after ${options.timeout}ms`);
          if (options.onTimeout) {
            options.onTimeout();
          }
          stopAllLoading();
        }, options.timeout);
      }
    }
  }, [options, updateLoadingState]);

  // ローディング停止
  const stopLoading = useCallback((id: string = 'default') => {
    const operation = operationsRef.current.get(id);
    if (!operation) return;

    const elapsedTime = Date.now() - operation.startTime;
    const remainingMinTime = options.minDuration ? Math.max(0, options.minDuration - elapsedTime) : 0;

    const removeOperation = () => {
      operationsRef.current.delete(id);
      updateLoadingState();

      // 全てのローディングが終了した場合
      if (operationsRef.current.size === 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (options.onFinish) {
          options.onFinish();
        }
      }
    };

    // 最小表示時間の考慮
    if (remainingMinTime > 0) {
      minDurationTimeoutRef.current = setTimeout(removeOperation, remainingMinTime);
    } else {
      removeOperation();
    }
  }, [options, updateLoadingState]);

  // 全てのローディング停止
  const stopAllLoading = useCallback(() => {
    operationsRef.current.clear();
    updateLoadingState();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (minDurationTimeoutRef.current) {
      clearTimeout(minDurationTimeoutRef.current);
      minDurationTimeoutRef.current = null;
    }
    if (options.onFinish) {
      options.onFinish();
    }
  }, [options, updateLoadingState]);

  // ローディングテキストの更新
  const updateLoadingText = useCallback((id: string = 'default', text: string) => {
    const operation = operationsRef.current.get(id);
    if (operation) {
      operation.text = text;
      updateLoadingState();
    }
  }, [updateLoadingState]);

  // 進捗の更新
  const updateProgress = useCallback((id: string = 'default', progress: number) => {
    const operation = operationsRef.current.get(id);
    if (operation) {
      operation.progress = Math.max(0, Math.min(100, progress));
      updateLoadingState();
    }
  }, [updateLoadingState]);

  // 非同期処理のラッパー
  const withLoading = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    loadingId: string = 'default',
    loadingText?: string
  ): Promise<T> => {
    startLoading(loadingId, loadingText);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading(loadingId);
    }
  }, [startLoading, stopLoading]);

  // 複数の非同期処理を並列実行
  const withMultipleLoading = useCallback(async <T,>(
    operations: Array<{
      id: string;
      fn: () => Promise<T>;
      text?: string;
    }>
  ): Promise<T[]> => {
    // 全てのローディングを開始
    operations.forEach(op => startLoading(op.id, op.text));

    try {
      // 並列実行
      const results = await Promise.all(
        operations.map(op => op.fn())
      );
      return results;
    } finally {
      // 全てのローディングを停止
      operations.forEach(op => stopLoading(op.id));
    }
  }, [startLoading, stopLoading]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (minDurationTimeoutRef.current) {
        clearTimeout(minDurationTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    stopAllLoading,
    updateLoadingText,
    updateProgress,
    withLoading,
    withMultipleLoading,
  };
};

// グローバルローディング状態管理
let globalLoadingCount = 0;
const globalLoadingListeners = new Set<() => void>();

export const globalLoading = {
  start: () => {
    globalLoadingCount++;
    globalLoadingListeners.forEach(listener => listener());
  },
  
  stop: () => {
    globalLoadingCount = Math.max(0, globalLoadingCount - 1);
    globalLoadingListeners.forEach(listener => listener());
  },
  
  reset: () => {
    globalLoadingCount = 0;
    globalLoadingListeners.forEach(listener => listener());
  },
  
  isLoading: () => globalLoadingCount > 0,
  
  subscribe: (listener: () => void) => {
    globalLoadingListeners.add(listener);
    return () => globalLoadingListeners.delete(listener);
  },
};

// グローバルローディング用フック
export const useGlobalLoading = () => {
  const [isLoading, setIsLoading] = useState(globalLoading.isLoading());

  useEffect(() => {
    const updateState = () => setIsLoading(globalLoading.isLoading());
    const unsubscribe = globalLoading.subscribe(updateState);
    return unsubscribe;
  }, []);

  return {
    isLoading,
    startLoading: globalLoading.start,
    stopLoading: globalLoading.stop,
    resetLoading: globalLoading.reset,
  };
};

// ローディングオーバーレイ用フック
export const useLoadingOverlay = (options?: UseLoadingOptions) => {
  const loading = useLoading(options);
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    if (loading.isLoading) {
      setOverlayVisible(true);
    } else {
      // フェードアウトアニメーションのための遅延
      const timer = setTimeout(() => setOverlayVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading.isLoading]);

  return {
    ...loading,
    overlayVisible,
  };
};

export default useLoading;