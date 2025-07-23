// デバウンス関数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  }
): T & { cancel: () => void; flush: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;
  let result: any;

  const leading = options?.leading ?? false;
  const trailing = options?.trailing ?? true;
  const maxWait = options?.maxWait;

  const invokeFunc = (time: number) => {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  };

  const leadingEdge = (time: number) => {
    lastInvokeTime = time;
    timeout = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const remainingWait = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(remainingWait, maxWait - timeSinceLastInvoke)
      : remainingWait;
  };

  const shouldInvoke = (time: number) => {
    if (lastCallTime === null) return true;
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeout = setTimeout(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time: number) => {
    timeout = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    lastThis = null;
    return result;
  };

  const cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (maxTimeout !== null) {
      clearTimeout(maxTimeout);
      maxTimeout = null;
    }
    lastCallTime = null;
    lastInvokeTime = 0;
    lastArgs = null;
    lastThis = null;
  };

  const flush = () => {
    return timeout === null ? result : trailingEdge(Date.now());
  };

  const debounced = function (this: any, ...args: any[]) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeout = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeout === null) {
      timeout = setTimeout(timerExpired, wait);
    }
    return result;
  } as T;

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}

// スロットル関数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
  }
): T & { cancel: () => void; flush: () => void } {
  const leading = options?.leading ?? true;
  const trailing = options?.trailing ?? true;
  
  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait,
  });
}

// メモ化関数
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  const memoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func.apply(this, args);
    cache.set(key, result);
    
    // キャッシュサイズ制限（LRU）
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  } as T;
  
  // キャッシュクリア機能
  (memoized as any).cache = cache;
  (memoized as any).clear = () => cache.clear();
  
  return memoized;
}

// リクエストアニメーションフレームのラッパー
export function rafThrottle<T extends (...args: any[]) => any>(func: T): T {
  let rafId: number | null = null;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;

  const throttled = function (this: any, ...args: any[]) {
    lastArgs = args;
    lastThis = this;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(lastThis, lastArgs!);
        rafId = null;
      });
    }
  } as T;

  return throttled;
}

// 遅延実行
export function defer(func: () => void): void {
  if (typeof setImmediate !== 'undefined') {
    setImmediate(func);
  } else if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel();
    channel.port1.onmessage = func;
    channel.port2.postMessage(null);
  } else {
    setTimeout(func, 0);
  }
}

// バッチ処理
export function batchProcessor<T>(
  processor: (items: T[]) => void | Promise<void>,
  options?: {
    maxBatchSize?: number;
    maxWait?: number;
  }
) {
  const maxBatchSize = options?.maxBatchSize ?? 100;
  const maxWait = options?.maxWait ?? 100;
  
  let batch: T[] = [];
  let timeout: NodeJS.Timeout | null = null;

  const processBatch = async () => {
    if (batch.length === 0) return;
    
    const currentBatch = [...batch];
    batch = [];
    
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    
    await processor(currentBatch);
  };

  const add = (item: T) => {
    batch.push(item);
    
    if (batch.length >= maxBatchSize) {
      processBatch();
    } else if (!timeout) {
      timeout = setTimeout(processBatch, maxWait);
    }
  };

  const flush = () => processBatch();

  return { add, flush };
}

// 仮想スクロール計算
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  
  return { start, end };
}

// パフォーマンス測定
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    if (!endTime) {
      console.warn(`End mark "${endMark}" not found`);
      return 0;
    }

    const duration = endTime - startTime;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);
    
    return duration;
  }

  getStats(name: string): {
    count: number;
    total: number;
    average: number;
    min: number;
    max: number;
  } | null {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) return null;

    const total = measures.reduce((sum, val) => sum + val, 0);
    const average = total / measures.length;
    const min = Math.min(...measures);
    const max = Math.max(...measures);

    return { count: measures.length, total, average, min, max };
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  log(): void {
    console.group('Performance Metrics');
    this.measures.forEach((_, name) => {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`, {
          ...stats,
          average: `${stats.average.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
        });
      }
    });
    console.groupEnd();
  }
}

// メモリ使用量監視
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentUsed: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

// FPS監視
export class FPSMonitor {
  private lastTime = performance.now();
  private frames = 0;
  private fps = 0;
  private callback?: (fps: number) => void;
  private rafId?: number;

  constructor(callback?: (fps: number) => void) {
    this.callback = callback;
  }

  start(): void {
    this.measure();
  }

  stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private measure = (): void => {
    const currentTime = performance.now();
    this.frames++;

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
      
      if (this.callback) {
        this.callback(this.fps);
      }
    }

    this.rafId = requestAnimationFrame(this.measure);
  };

  getFPS(): number {
    return this.fps;
  }
}

// イメージ最適化
export async function optimizeImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }
): Promise<Blob> {
  const maxWidth = options?.maxWidth ?? 1920;
  const maxHeight = options?.maxHeight ?? 1080;
  const quality = options?.quality ?? 0.85;
  const format = options?.format ?? 'jpeg';

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    img.onload = () => {
      let { width, height } = img;

      // アスペクト比を保持しながらリサイズ
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// プリコネクト
export function preconnect(url: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = new URL(url).origin;
  document.head.appendChild(link);
}

// プリフェッチ
export function prefetch(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}