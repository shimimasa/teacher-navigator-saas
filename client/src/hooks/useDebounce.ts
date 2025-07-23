import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from '../utils/performance';

// 値のデバウンス
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// コールバックのデバウンス
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  }
): T & { cancel: () => void; flush: () => void } {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const debouncedCallback = useRef(
    debounce(
      (...args: Parameters<T>) => callbackRef.current(...args),
      delay,
      options
    )
  );

  // delayやoptionsが変更された場合は新しいデバウンス関数を作成
  useEffect(() => {
    debouncedCallback.current = debounce(
      (...args: Parameters<T>) => callbackRef.current(...args),
      delay,
      options
    );
  }, [delay, options?.leading, options?.trailing, options?.maxWait]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      debouncedCallback.current.cancel();
    };
  }, []);

  return debouncedCallback.current as T & { cancel: () => void; flush: () => void };
}

// 検索用のデバウンスフック
export function useDebouncedSearch(
  initialQuery = '',
  searchFunction: (query: string) => void | Promise<void>,
  delay = 300
) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, delay);

  const debouncedSearch = useDebouncedCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        await searchFunction(searchQuery);
      } finally {
        setIsSearching(false);
      }
    },
    delay
  );

  // デバウンスされた値が変更されたときに検索を実行
  useEffect(() => {
    debouncedSearch(debouncedQuery);
  }, [debouncedQuery]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      setIsSearching(true);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setIsSearching(false);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  return {
    query,
    debouncedQuery,
    isSearching,
    handleQueryChange,
    clearSearch,
  };
}

// 入力フィールド用のデバウンスフック
export function useDebouncedInput<T = string>(
  initialValue: T,
  onChange: (value: T) => void,
  delay = 500,
  options?: {
    leading?: boolean;
    trailing?: boolean;
  }
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  const debouncedOnChange = useDebouncedCallback(
    (newValue: T) => {
      setIsPending(false);
      onChange(newValue);
    },
    delay,
    options
  );

  const handleChange = useCallback(
    (newValue: T) => {
      setValue(newValue);
      setIsPending(true);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  const flush = useCallback(() => {
    debouncedOnChange.flush();
    setIsPending(false);
  }, [debouncedOnChange]);

  const cancel = useCallback(() => {
    debouncedOnChange.cancel();
    setIsPending(false);
  }, [debouncedOnChange]);

  // 初期値が外部から変更された場合
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    isPending,
    handleChange,
    flush,
    cancel,
  };
}

// フォーム送信用のデバウンスフック
export function useDebouncedSubmit<T extends Record<string, any>>(
  onSubmit: (data: T) => void | Promise<void>,
  delay = 1000
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<T | null>(null);

  const debouncedSubmit = useDebouncedCallback(
    async (data: T) => {
      setIsSubmitting(true);
      try {
        await onSubmit(data);
        setLastSubmittedData(data);
      } finally {
        setIsSubmitting(false);
      }
    },
    delay,
    { leading: false, trailing: true }
  );

  const submit = useCallback(
    (data: T) => {
      debouncedSubmit(data);
    },
    [debouncedSubmit]
  );

  const submitImmediately = useCallback(
    async (data: T) => {
      debouncedSubmit.cancel();
      setIsSubmitting(true);
      try {
        await onSubmit(data);
        setLastSubmittedData(data);
      } finally {
        setIsSubmitting(false);
      }
    },
    [debouncedSubmit, onSubmit]
  );

  return {
    submit,
    submitImmediately,
    isSubmitting,
    lastSubmittedData,
    cancel: debouncedSubmit.cancel,
  };
}

// リサイズイベント用のデバウンスフック
export function useDebouncedResize(
  callback: (width: number, height: number) => void,
  delay = 200
) {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const debouncedCallback = useDebouncedCallback(callback, delay);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      setDimensions({ width: newWidth, height: newHeight });
      debouncedCallback(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return dimensions;
}

// スクロールイベント用のデバウンスフック
export function useDebouncedScroll(
  callback: (scrollTop: number, scrollLeft: number) => void,
  delay = 100,
  element?: HTMLElement | null
) {
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
  const debouncedCallback = useDebouncedCallback(callback, delay);

  useEffect(() => {
    const targetElement = element || window;
    
    const handleScroll = () => {
      const scrollTop = element 
        ? element.scrollTop 
        : window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = element 
        ? element.scrollLeft 
        : window.pageXOffset || document.documentElement.scrollLeft;
      
      setScrollPosition({ top: scrollTop, left: scrollLeft });
      debouncedCallback(scrollTop, scrollLeft);
    };

    targetElement.addEventListener('scroll', handleScroll);
    
    return () => {
      targetElement.removeEventListener('scroll', handleScroll);
      debouncedCallback.cancel();
    };
  }, [element, debouncedCallback]);

  return scrollPosition;
}