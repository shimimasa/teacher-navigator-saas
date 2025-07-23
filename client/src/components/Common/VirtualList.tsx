import React, { useRef, useState, useEffect, useCallback, CSSProperties, ReactNode } from 'react';
import { Box } from '@mui/material';
import { calculateVisibleRange } from '../../utils/performance';

interface VirtualListProps<T> {
  // データ配列
  items: T[];
  // アイテムの高さ（固定値または関数）
  itemHeight: number | ((index: number, item: T) => number);
  // コンテナの高さ
  height: number;
  // アイテムのレンダリング関数
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  // オーバースキャン数（表示範囲外に余分にレンダリングする数）
  overscan?: number;
  // キー生成関数
  getItemKey?: (item: T, index: number) => string | number;
  // スクロールイベントハンドラー
  onScroll?: (scrollTop: number) => void;
  // 空の時の表示
  emptyMessage?: ReactNode;
  // ローディング表示
  loading?: boolean;
  loadingComponent?: ReactNode;
  // 無限スクロール
  onEndReached?: () => void;
  endReachedThreshold?: number;
  // スタイル
  className?: string;
  style?: CSSProperties;
}

function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  getItemKey,
  onScroll,
  emptyMessage = 'データがありません',
  loading = false,
  loadingComponent,
  onEndReached,
  endReachedThreshold = 0.9,
  className,
  style,
}: VirtualListProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // アイテムの高さを取得
  const getHeight = useCallback(
    (index: number) => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index, items[index]);
      }
      return itemHeight;
    },
    [itemHeight, items]
  );

  // 全体の高さを計算
  const totalHeight = useCallback(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getHeight(i);
    }
    return height;
  }, [items.length, itemHeight, getHeight]);

  // 表示範囲を計算
  const visibleRange = useCallback(() => {
    if (typeof itemHeight === 'number') {
      return calculateVisibleRange(
        scrollTop,
        height,
        itemHeight,
        items.length,
        overscan
      );
    }

    // 可変高さの場合
    let accumulatedHeight = 0;
    let start = 0;
    let end = items.length;

    // スタート位置を見つける
    for (let i = 0; i < items.length; i++) {
      const itemH = getHeight(i);
      if (accumulatedHeight + itemH > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += itemH;
    }

    // エンド位置を見つける
    accumulatedHeight = 0;
    for (let i = 0; i < items.length; i++) {
      accumulatedHeight += getHeight(i);
      if (accumulatedHeight > scrollTop + height) {
        end = Math.min(items.length, i + overscan + 1);
        break;
      }
    }

    return { start, end };
  }, [scrollTop, height, itemHeight, items.length, overscan, getHeight]);

  // アイテムのオフセットを計算
  const getItemOffset = useCallback(
    (index: number) => {
      if (typeof itemHeight === 'number') {
        return index * itemHeight;
      }
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getHeight(i);
      }
      return offset;
    },
    [itemHeight, getHeight]
  );

  // スクロールハンドラー
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      setIsScrolling(true);

      // スクロール終了の検出
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      if (onScroll) {
        onScroll(newScrollTop);
      }

      // 無限スクロールのトリガー
      if (onEndReached) {
        const scrollHeight = e.currentTarget.scrollHeight;
        const scrollPosition = newScrollTop + height;
        const threshold = scrollHeight * endReachedThreshold;

        if (scrollPosition >= threshold && !loading) {
          onEndReached();
        }
      }
    },
    [height, onScroll, onEndReached, endReachedThreshold, loading]
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // レンダリング
  const { start, end } = visibleRange();
  const visibleItems: ReactNode[] = [];

  for (let i = start; i < end; i++) {
    const item = items[i];
    const key = getItemKey ? getItemKey(item, i) : i;
    const itemStyle: CSSProperties = {
      position: 'absolute',
      top: getItemOffset(i),
      left: 0,
      right: 0,
      height: getHeight(i),
    };

    visibleItems.push(
      <Box key={key} style={itemStyle}>
        {renderItem(item, i, itemStyle)}
      </Box>
    );
  }

  // 空の状態
  if (!loading && items.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        {emptyMessage}
      </Box>
    );
  }

  return (
    <Box
      ref={scrollContainerRef}
      className={className}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
        ...style,
      }}
      onScroll={handleScroll}
    >
      {/* 全体の高さを確保するための要素 */}
      <Box
        style={{
          height: totalHeight(),
          position: 'relative',
        }}
      >
        {visibleItems}
      </Box>

      {/* ローディング表示 */}
      {loading && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            py: 2,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {loadingComponent || 'Loading...'}
        </Box>
      )}
    </Box>
  );
}

// 固定高さ用の最適化されたバージョン
export function FixedHeightVirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  getItemKey,
  onScroll,
  emptyMessage,
  loading,
  loadingComponent,
  onEndReached,
  endReachedThreshold = 0.9,
  className,
  style,
}: Omit<VirtualListProps<T>, 'itemHeight'> & { itemHeight: number }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);

      if (onScroll) {
        onScroll(newScrollTop);
      }

      // 無限スクロールのトリガー
      if (onEndReached) {
        const scrollPosition = newScrollTop + height;
        const threshold = totalHeight * endReachedThreshold;

        if (scrollPosition >= threshold && !loading) {
          onEndReached();
        }
      }
    },
    [height, totalHeight, onScroll, onEndReached, endReachedThreshold, loading]
  );

  if (!loading && items.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        {emptyMessage || 'データがありません'}
      </Box>
    );
  }

  const visibleItems = [];
  for (let i = startIndex; i < endIndex; i++) {
    const item = items[i];
    const key = getItemKey ? getItemKey(item, i) : i;
    const itemStyle: CSSProperties = {
      position: 'absolute',
      top: i * itemHeight,
      left: 0,
      right: 0,
      height: itemHeight,
    };

    visibleItems.push(
      <Box key={key} style={itemStyle}>
        {renderItem(item, i, itemStyle)}
      </Box>
    );
  }

  return (
    <Box
      ref={scrollContainerRef}
      className={className}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
        ...style,
      }}
      onScroll={handleScroll}
    >
      <Box
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </Box>

      {loading && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            py: 2,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {loadingComponent || 'Loading...'}
        </Box>
      )}
    </Box>
  );
}

export default VirtualList;