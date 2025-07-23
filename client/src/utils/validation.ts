// バリデーションルールのタイプ定義
export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 基本的なバリデーター
export const validators = {
  // 必須チェック
  required: (message = '必須項目です'): ValidationRule => ({
    test: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  // 最小文字数
  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length >= min,
    message: message || `${min}文字以上入力してください`,
  }),

  // 最大文字数
  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length <= max,
    message: message || `${max}文字以下で入力してください`,
  }),

  // 文字数範囲
  lengthBetween: (min: number, max: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length >= min && value.length <= max,
    message: message || `${min}文字以上${max}文字以下で入力してください`,
  }),

  // メールアドレス
  email: (message = '有効なメールアドレスを入力してください'): ValidationRule => ({
    test: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  // 電話番号（日本）
  phoneNumber: (message = '有効な電話番号を入力してください'): ValidationRule => ({
    test: (value: string) => {
      const phoneRegex = /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/;
      return phoneRegex.test(value.replace(/[^\d-]/g, ''));
    },
    message,
  }),

  // URL
  url: (message = '有効なURLを入力してください'): ValidationRule => ({
    test: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  // 数値
  numeric: (message = '数値を入力してください'): ValidationRule => ({
    test: (value: any) => !isNaN(value) && !isNaN(parseFloat(value)),
    message,
  }),

  // 整数
  integer: (message = '整数を入力してください'): ValidationRule => ({
    test: (value: any) => Number.isInteger(Number(value)),
    message,
  }),

  // 数値範囲
  between: (min: number, max: number, message?: string): ValidationRule => ({
    test: (value: number) => value >= min && value <= max,
    message: message || `${min}から${max}の間の値を入力してください`,
  }),

  // 最小値
  min: (min: number, message?: string): ValidationRule => ({
    test: (value: number) => value >= min,
    message: message || `${min}以上の値を入力してください`,
  }),

  // 最大値
  max: (max: number, message?: string): ValidationRule => ({
    test: (value: number) => value <= max,
    message: message || `${max}以下の値を入力してください`,
  }),

  // 正規表現
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    test: (value: string) => regex.test(value),
    message,
  }),

  // カスタムバリデーター
  custom: (testFn: (value: any) => boolean, message: string): ValidationRule => ({
    test: testFn,
    message,
  }),

  // 日付
  date: (message = '有効な日付を入力してください'): ValidationRule => ({
    test: (value: string) => !isNaN(Date.parse(value)),
    message,
  }),

  // 未来の日付
  futureDate: (message = '未来の日付を入力してください'): ValidationRule => ({
    test: (value: string) => new Date(value) > new Date(),
    message,
  }),

  // 過去の日付
  pastDate: (message = '過去の日付を入力してください'): ValidationRule => ({
    test: (value: string) => new Date(value) < new Date(),
    message,
  }),

  // パスワード強度
  strongPassword: (message = 'パスワードは8文字以上で、大文字・小文字・数字・特殊文字を含む必要があります'): ValidationRule => ({
    test: (value: string) => {
      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecialChar = /[^a-zA-Z0-9]/.test(value);
      return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    },
    message,
  }),

  // 同じ値
  same: (otherValue: any, message = '値が一致しません'): ValidationRule => ({
    test: (value: any) => value === otherValue,
    message,
  }),

  // 配列の最小長
  minItems: (min: number, message?: string): ValidationRule => ({
    test: (value: any[]) => Array.isArray(value) && value.length >= min,
    message: message || `${min}個以上選択してください`,
  }),

  // 配列の最大長
  maxItems: (max: number, message?: string): ValidationRule => ({
    test: (value: any[]) => Array.isArray(value) && value.length <= max,
    message: message || `${max}個以下で選択してください`,
  }),

  // ファイルサイズ
  maxFileSize: (maxSizeInBytes: number, message?: string): ValidationRule => ({
    test: (file: File) => file.size <= maxSizeInBytes,
    message: message || `ファイルサイズは${Math.round(maxSizeInBytes / 1024 / 1024)}MB以下にしてください`,
  }),

  // ファイルタイプ
  fileType: (allowedTypes: string[], message?: string): ValidationRule => ({
    test: (file: File) => allowedTypes.includes(file.type),
    message: message || `許可されたファイル形式: ${allowedTypes.join(', ')}`,
  }),

  // 英数字
  alphanumeric: (message = '英数字のみ入力可能です'): ValidationRule => ({
    test: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
    message,
  }),

  // ひらがな
  hiragana: (message = 'ひらがなのみ入力可能です'): ValidationRule => ({
    test: (value: string) => /^[ぁ-ん]+$/.test(value),
    message,
  }),

  // カタカナ
  katakana: (message = 'カタカナのみ入力可能です'): ValidationRule => ({
    test: (value: string) => /^[ァ-ヶー]+$/.test(value),
    message,
  }),

  // 日本語
  japanese: (message = '日本語のみ入力可能です'): ValidationRule => ({
    test: (value: string) => /^[ぁ-んァ-ヶー一-龯]+$/.test(value),
    message,
  }),
};

// バリデーション実行関数
export const validate = (value: any, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// フォームバリデーション
export interface FormValidationRules {
  [fieldName: string]: ValidationRule[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: {
    [fieldName: string]: string[];
  };
}

export const validateForm = (
  formData: Record<string, any>,
  rules: FormValidationRules
): FormValidationResult => {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const fieldValue = formData[fieldName];
    const result = validate(fieldValue, fieldRules);
    
    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// サニタイゼーション関数
export const sanitizers = {
  // 文字列のトリム
  trim: (value: string): string => value.trim(),

  // 小文字変換
  toLowerCase: (value: string): string => value.toLowerCase(),

  // 大文字変換
  toUpperCase: (value: string): string => value.toUpperCase(),

  // 数値変換
  toNumber: (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  },

  // 整数変換
  toInteger: (value: any): number => {
    return parseInt(value, 10) || 0;
  },

  // 真偽値変換
  toBoolean: (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return !!value;
  },

  // HTMLエスケープ
  escapeHtml: (value: string): string => {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  },

  // 特殊文字削除
  removeSpecialChars: (value: string): string => {
    return value.replace(/[^a-zA-Z0-9\s]/g, '');
  },

  // 空白文字の正規化
  normalizeSpaces: (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
  },

  // 全角数字を半角に変換
  toHalfWidthNumbers: (value: string): string => {
    return value.replace(/[０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  },

  // 全角英字を半角に変換
  toHalfWidthAlpha: (value: string): string => {
    return value.replace(/[Ａ-Ｚａ-ｚ]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  },
};

// よく使うバリデーションの組み合わせ
export const commonValidations = {
  username: [
    validators.required('ユーザー名は必須です'),
    validators.minLength(3, 'ユーザー名は3文字以上で入力してください'),
    validators.maxLength(20, 'ユーザー名は20文字以下で入力してください'),
    validators.alphanumeric('ユーザー名は英数字のみ使用可能です'),
  ],

  email: [
    validators.required('メールアドレスは必須です'),
    validators.email(),
  ],

  password: [
    validators.required('パスワードは必須です'),
    validators.strongPassword(),
  ],

  name: [
    validators.required('名前は必須です'),
    validators.maxLength(50, '名前は50文字以下で入力してください'),
  ],

  phoneNumber: [
    validators.required('電話番号は必須です'),
    validators.phoneNumber(),
  ],

  url: [
    validators.required('URLは必須です'),
    validators.url(),
  ],

  comment: [
    validators.maxLength(500, 'コメントは500文字以下で入力してください'),
  ],
};