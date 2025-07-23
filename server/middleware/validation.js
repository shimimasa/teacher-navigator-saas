const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');
const { HTTP_STATUS } = require('../utils/constants');

// バリデーションエラーハンドリング
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      error: {
        message: 'バリデーションエラー',
        details: errorMessages
      }
    });
  }
  
  next();
};

// ユーザー登録バリデーション
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('パスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('パスワードは大文字、小文字、数字を含む必要があります'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('名前は必須です')
    .isLength({ max: 50 })
    .withMessage('名前は50文字以内で入力してください'),
  
  body('school')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('学校名は100文字以内で入力してください'),
  
  body('subjects')
    .optional()
    .isArray()
    .withMessage('教科は配列形式で指定してください'),
  
  body('subjects.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('教科名は50文字以内で入力してください'),
  
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('経験年数は0〜50の整数で入力してください'),
  
  handleValidationErrors
];

// ログインバリデーション
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('パスワードを入力してください'),
  
  handleValidationErrors
];

// パスワードリセットリクエストバリデーション
const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  
  handleValidationErrors
];

// パスワードリセット実行バリデーション
const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  
  body('token')
    .notEmpty()
    .withMessage('リセットトークンは必須です'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('パスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('パスワードは大文字、小文字、数字を含む必要があります'),
  
  handleValidationErrors
];

// プロフィール更新バリデーション
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('名前は空にできません')
    .isLength({ max: 50 })
    .withMessage('名前は50文字以内で入力してください'),
  
  body('school')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('学校名は100文字以内で入力してください'),
  
  body('subjects')
    .optional()
    .isArray()
    .withMessage('教科は配列形式で指定してください'),
  
  body('subjects.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('教科名は50文字以内で入力してください'),
  
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('経験年数は0〜50の整数で入力してください'),
  
  handleValidationErrors
];

// パスワード変更バリデーション
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('現在のパスワードを入力してください'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('新しいパスワードは8文字以上で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('パスワードは大文字、小文字、数字を含む必要があります')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('新しいパスワードは現在のパスワードと異なる必要があります'),
  
  handleValidationErrors
];

// アカウント削除バリデーション
const validateAccountDeletion = [
  body('password')
    .notEmpty()
    .withMessage('パスワードを入力してください'),
  
  handleValidationErrors
];

// 汎用的なObjectIdバリデーション
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: '無効なIDフォーマットです'
        }
      });
    }
    
    next();
  };
};

// サニタイズヘルパー関数
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // HTMLタグを除去
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateProfileUpdate,
  validatePasswordChange,
  validateAccountDeletion,
  validateObjectId,
  sanitizeInput,
  handleValidationErrors
};