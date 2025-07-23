import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface UseInfiniteScrollOptions {
  // 次のページを読み込むトリガーとなる要素までの距離（ピクセル）
  threshold?: number;
  // 次のページを読み込む関数
  onLoadMore: () => void | Promise<void>;
  // 読み込み中かどうか
  isLoading?: boolean;
  // 全てのデータを読み込んだかどうか
  hasMore?: boolean;
  // ルート要素（デフォルトはdocument）
  root?: Element | null;
  // ルート要素のマージン
  rootMargin?: string;
  // スクロール方向（縦または横）
  direction?: 'vertical' | 'horizontal';
  // デバウンス遅延（ミリ秒）
  debounceDelay?: number;
}

export function useInfiniteScroll({
  threshold = 100,
  onLoadMore,
  isLoading = false,
  hasMore = true,
  root = null,
  rootMargin = '0px',
  direction = 'vertical',
  debounceDelay = 200,
}: UseInfiniteScrollOptions) {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // デバウンスされたonLoadMore
  const debouncedLoadMore = useDebounce(
    useCallback(async () => {
      if (!isLoading && hasMore && !isFetching) {
        setIsFetching(true);
        try {
          await onLoadMore();
        } finally {
          setIsFetching(false);
        }
      }
    }, [onLoadMore, isLoading, hasMore, isFetching]),
    debounceDelay
  );

  // Intersection Observerのセットアップ
  useEffect(() => {
    if (!sentinelRef.current) return;

    const options: IntersectionObserverInit = {
      root,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading) {
        debouncedLoadMore();
      }
    }, options);

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [debouncedLoadMore, hasMore, isLoading, root, threshold]);

  return {
    sentinelRef,
    isFetching: isFetching || isLoading,
  };
}

// 仮想スクロール用の無限スクロールフック
export function useVirtualInfiniteScroll<T>({
  items,
  itemHeight,
  containerHeight,
  loadMore,
  hasMore = true,
  isLoading = false,
  overscan = 3,
  threshold = 5,
}: {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  loadMore: () => void | Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
  overscan?: number;
  threshold?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  // アイテムの高さを取得
  const getItemHeight = useCallback(
    (index: number) => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // 総高さを計算
  const totalHeight = useCallback(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight]);

  // 表示範囲を計算
  useEffect(() => {
    let accumulatedHeight = 0;
    let start = 0;
    let end = 0;

    // スタート位置を見つける
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // エンド位置を見つける
    accumulatedHeight = 0;
    for (let i = start; i < items.length; i++) {
      if (i > 0) {
        for (let j = 0; j < i; j++) {
          accumulatedHeight += getItemHeight(j);
        }
      }
      if (accumulatedHeight > scrollTop + containerHeight) {
        end = Math.min(items.length, i + overscan);
        break;
      }
    }

    if (end === 0) {
      end = Math.min(items.length, Math.ceil(containerHeight / getItemHeight(0)) + overscan);
    }

    setVisibleRange({ start, end });

    // 無限スクロールのトリガー
    if (hasMore && !isLoading && end >= items.length - threshold) {
      loadMore();
    }
  }, [scrollTop, containerHeight, items.length, getItemHeight, overscan, hasMore, isLoading, loadMore, threshold]);

  // オフセットを計算
  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    },
    [getItemHeight]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleRange,
    totalHeight: totalHeight(),
    handleScroll,
    getItemOffset,
    getItemHeight,
  };
}

// ページネーション型の無限スクロール
export function usePaginatedInfiniteScroll<T>({
  fetchPage,
  pageSize = 20,
  initialPage = 1,
}: {
  fetchPage: (page: number, pageSize: number) => Promise<{
    data: T[];
    hasNextPage: boolean;
    totalPages?: number;
    totalItems?: number;
  }>;
  pageSize?: number;
  initialPage?: number;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState<number | undefined>();
  const [totalItems, setTotalItems] = useState<number | undefined>();

  const loadNextPage = useCallback(async () => {
    if (isLoading || !hasNextPage) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchPage(page, pageSize);
      
      setItems(prev => [...prev, ...result.data]);
      setHasNextPage(result.hasNextPage);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, page, pageSize, isLoading, hasNextPage]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasNextPage(true);
    setError(null);
    setTotalPages(undefined);
    setTotalItems(undefined);
  }, [initialPage]);

  const refresh = useCallback(async () => {
    reset();
    await loadNextPage();
  }, [reset, loadNextPage]);

  return {
    items,
    isLoading,
    error,
    hasNextPage,
    loadNextPage,
    reset,
    refresh,
    totalPages,
    totalItems,
    currentPage: page - 1,
  };
}

// カーソル型の無限スクロール
export function useCursorInfiniteScroll<T>({
  fetchItems,
  pageSize = 20,
  initialCursor,
}: {
  fetchItems: (cursor: string | undefined, pageSize: number) => Promise<{
    items: T[];
    nextCursor: string | undefined;
    hasMore: boolean;
  }>;
  pageSize?: number;
  initialCursor?: string;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchItems(cursor, pageSize);
      
      setItems(prev => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems, cursor, pageSize, isLoading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(initialCursor);
    setHasMore(true);
    setError(null);
  }, [initialCursor]);

  const refresh = useCallback(async () => {
    reset();
    await loadMore();
  }, [reset, loadMore]);

  return {
    items,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
    refresh,
    cursor,
  };
}