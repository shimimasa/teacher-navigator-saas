import { useState, useCallback } from 'react';

interface UseFormProps<T> {
  initialValues: T;
  validate?: (values: T) => Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<T>;
  loading: boolean;
  handleChange: (name: keyof T, value: any) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldError: (name: keyof T, error: string) => void;
  clearErrors: () => void;
  reset: () => void;
}

/**
 * フォーム管理用のカスタムフック
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormProps<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(false);

  // 値の変更ハンドラー
  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // フィールドのエラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  // フォーム送信ハンドラー
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // バリデーション実行
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(values);
    } catch (error) {
      // エラーは呼び出し元で処理
      throw error;
    } finally {
      setLoading(false);
    }
  }, [values, validate, onSubmit]);

  // 特定フィールドのエラー設定
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error as any }));
  }, []);

  // エラーのクリア
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // フォームのリセット
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLoading(false);
  }, [initialValues]);

  return {
    values,
    errors,
    loading,
    handleChange,
    handleSubmit,
    setFieldError,
    clearErrors,
    reset,
  };
}