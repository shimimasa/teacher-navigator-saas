import DOMPurify from 'dompurify';

// XSS防止のためのHTML sanitization
export const sanitizeHtml = (dirty: string, options?: DOMPurify.Config): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span', 'div', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    ...options,
  });
};

// URLの検証とサニタイゼーション
export const sanitizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    // 許可されたプロトコルのみ
    if (!['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

// ファイル名のサニタイゼーション
export const sanitizeFilename = (filename: string): string => {
  // 危険な文字を削除
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
};

// CSRFトークン管理
class CSRFTokenManager {
  private token: string | null = null;
  private tokenKey = 'csrf-token';

  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.token = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, token);
    }
    return token;
  }

  getToken(): string {
    if (!this.token && typeof window !== 'undefined') {
      this.token = sessionStorage.getItem(this.tokenKey);
    }
    if (!this.token) {
      this.token = this.generateToken();
    }
    return this.token;
  }

  validateToken(token: string): boolean {
    return token === this.getToken();
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey);
    }
  }
}

export const csrfToken = new CSRFTokenManager();

// セッション管理
export const sessionManager = {
  // セッションタイムアウト（30分）
  SESSION_TIMEOUT: 30 * 60 * 1000,
  
  updateActivity(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  },

  checkTimeout(): boolean {
    if (typeof window === 'undefined') return false;
    
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return true;
    
    const elapsed = Date.now() - parseInt(lastActivity, 10);
    return elapsed > this.SESSION_TIMEOUT;
  },

  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('token');
      csrfToken.clearToken();
    }
  },
};

// 安全なローカルストレージ操作
export const secureStorage = {
  setItem(key: string, value: any, encrypt = false): void {
    if (typeof window === 'undefined') return;
    
    let data = JSON.stringify(value);
    
    // 簡易暗号化（本番環境では適切な暗号化ライブラリを使用）
    if (encrypt) {
      data = btoa(data);
    }
    
    localStorage.setItem(key, data);
  },

  getItem<T>(key: string, decrypt = false): T | null {
    if (typeof window === 'undefined') return null;
    
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    try {
      let parsed = data;
      
      // 復号化
      if (decrypt) {
        parsed = atob(data);
      }
      
      return JSON.parse(parsed);
    } catch {
      return null;
    }
  },

  removeItem(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },

  clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  },
};

// 入力値の基本的なサニタイゼーション
export const sanitizeInput = (input: string, type: 'text' | 'email' | 'number' = 'text'): string => {
  let sanitized = input.trim();
  
  switch (type) {
    case 'email':
      // メールアドレスの基本的なサニタイゼーション
      sanitized = sanitized.toLowerCase();
      break;
    case 'number':
      // 数値以外を削除
      sanitized = sanitized.replace(/[^0-9.-]/g, '');
      break;
    case 'text':
    default:
      // 制御文字を削除
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
      break;
  }
  
  return sanitized;
};

// SQLインジェクション対策（クライアント側の補助的な対策）
export const escapeSqlString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\0')
    .replace(/\x1a/g, '\\Z');
};

// Content Security Policy ヘッダー生成
export const generateCSPHeader = (nonce: string): string => {
  const policies = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://www.google-analytics.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: https:`,
    `connect-src 'self' https://api.example.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];
  
  return policies.join('; ');
};

// セキュリティヘッダーの設定
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// パスワード強度チェック
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('パスワードは8文字以上にしてください');

  if (password.length >= 12) score++;
  
  if (/[a-z]/.test(password)) score++;
  else feedback.push('小文字を含めてください');
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('大文字を含めてください');
  
  if (/[0-9]/.test(password)) score++;
  else feedback.push('数字を含めてください');
  
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('特殊文字を含めてください');

  // 一般的な弱いパスワードのチェック
  const weakPasswords = ['password', '12345678', 'qwerty', 'admin'];
  if (weakPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('このパスワードは一般的すぎます');
  }

  return { score, feedback };
};

// レート制限
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // 期限切れの試行を削除
    const validAttempts = attempts.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// デフォルトのレート制限インスタンス
export const loginRateLimiter = new RateLimiter(5, 300000); // 5分間に5回まで
export const apiRateLimiter = new RateLimiter(100, 60000); // 1分間に100回まで