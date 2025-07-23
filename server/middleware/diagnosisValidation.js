const { body, param, validationResult } = require('express-validator');
const { HTTP_STATUS, QUESTION_CATEGORIES } = require('../utils/constants');

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

// 診断IDのバリデーション
const validateDiagnosisId = [
  param('id')
    .isMongoId()
    .withMessage('無効な診断IDです'),
  handleValidationErrors
];

// 回答のバリデーション
const validateAnswer = [
  body('questionId')
    .notEmpty()
    .withMessage('質問IDは必須です')
    .isString()
    .withMessage('質問IDは文字列である必要があります')
    .matches(/^[A-Z]\d+$/)
    .withMessage('質問IDの形式が正しくありません'),
  
  body('answer')
    .notEmpty()
    .withMessage('回答は必須です')
    .isInt({ min: 1, max: 5 })
    .withMessage('回答は1〜5の整数である必要があります'),
  
  body('category')
    .notEmpty()
    .withMessage('カテゴリーは必須です')
    .isIn(Object.values(QUESTION_CATEGORIES))
    .withMessage('無効なカテゴリーです'),
  
  handleValidationErrors
];

// フィードバックのバリデーション
const validateFeedback = [
  body('rating')
    .notEmpty()
    .withMessage('評価は必須です')
    .isInt({ min: 1, max: 5 })
    .withMessage('評価は1〜5の整数である必要があります'),
  
  body('comment')
    .optional()
    .isString()
    .withMessage('コメントは文字列である必要があります')
    .isLength({ max: 500 })
    .withMessage('コメントは500文字以内で入力してください'),
  
  body('styleRatings')
    .optional()
    .isObject()
    .withMessage('スタイル評価はオブジェクト形式である必要があります')
    .custom((value) => {
      // 各評価が1-5の範囲内かチェック
      for (const [styleId, rating] of Object.entries(value)) {
        if (!styleId.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error('無効なスタイルIDが含まれています');
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          throw new Error('スタイル評価は1〜5の整数である必要があります');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// 診断履歴クエリのバリデーション
const validateHistoryQuery = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数である必要があります'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('取得件数は1〜100の整数である必要があります'),
  
  body('includeAbandoned')
    .optional()
    .isBoolean()
    .withMessage('includeAbandonedはブール値である必要があります'),
  
  handleValidationErrors
];

// 質問取得クエリのバリデーション
const validateQuestionsQuery = [
  body('category')
    .optional()
    .isIn(Object.values(QUESTION_CATEGORIES))
    .withMessage('無効なカテゴリーです'),
  
  handleValidationErrors
];

module.exports = {
  validateDiagnosisId,
  validateAnswer,
  validateFeedback,
  validateHistoryQuery,
  validateQuestionsQuery,
  handleValidationErrors
};