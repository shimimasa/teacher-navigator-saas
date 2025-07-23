const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { PERSONALITY_TYPES } = require('../utils/constants');

// バリデーションエラーのハンドリング
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'バリデーションエラー',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      }
    });
  }
  next();
};

// 授業スタイル推奨のバリデーション
const validateStyleRecommendation = [
  param('diagnosisId')
    .notEmpty().withMessage('診断IDは必須です')
    .isMongoId().withMessage('無効な診断ID形式です'),
  
  query('subject')
    .optional()
    .isString().withMessage('教科は文字列で指定してください')
    .trim(),
  
  query('gradeLevel')
    .optional()
    .isString().withMessage('学年は文字列で指定してください')
    .trim(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('取得件数は1〜10の範囲で指定してください'),
  
  handleValidationErrors
];

// スタイル比較のバリデーション
const validateStyleComparison = [
  body('styleIds')
    .notEmpty().withMessage('比較するスタイルIDが必要です')
    .isArray({ min: 2, max: 5 }).withMessage('2〜5個のスタイルを指定してください')
    .custom((value) => {
      return value.every(id => mongoose.Types.ObjectId.isValid(id));
    }).withMessage('無効なスタイルID形式が含まれています'),
  
  body('personalityType')
    .notEmpty().withMessage('パーソナリティタイプは必須です')
    .toUpperCase()
    .custom((value) => {
      return Object.keys(PERSONALITY_TYPES).includes(value);
    }).withMessage('無効なパーソナリティタイプです'),
  
  handleValidationErrors
];

// フィードバックのバリデーション
const validateStyleFeedback = [
  body('rating')
    .notEmpty().withMessage('評価は必須です')
    .isInt({ min: 1, max: 5 }).withMessage('評価は1〜5の整数で指定してください'),
  
  body('effectiveness')
    .notEmpty().withMessage('効果性評価は必須です')
    .isIn(['very_effective', 'effective', 'neutral', 'ineffective', 'very_ineffective'])
    .withMessage('無効な効果性評価です'),
  
  body('comment')
    .optional()
    .isString().withMessage('コメントは文字列で入力してください')
    .isLength({ max: 500 }).withMessage('コメントは500文字以内で入力してください')
    .trim()
    .escape(), // XSS対策
  
  handleValidationErrors
];

// クエリパラメータのバリデーション
const validateQueryParams = [
  query('subject')
    .optional()
    .isString().withMessage('教科は文字列で指定してください')
    .trim(),
  
  query('personalityType')
    .optional()
    .toUpperCase()
    .custom((value) => {
      return Object.keys(PERSONALITY_TYPES).includes(value);
    }).withMessage('無効なパーソナリティタイプです'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('取得件数は1〜50の範囲で指定してください'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('ページ番号は1以上の整数で指定してください'),
  
  handleValidationErrors
];

// パーソナリティタイプパラメータのバリデーション
const validatePersonalityTypeParam = [
  param('personalityType')
    .notEmpty().withMessage('パーソナリティタイプは必須です')
    .toUpperCase()
    .custom((value) => {
      return Object.keys(PERSONALITY_TYPES).includes(value);
    }).withMessage('無効なパーソナリティタイプです'),
  
  handleValidationErrors
];

// スタイルIDパラメータのバリデーション
const validateStyleIdParam = [
  param('id')
    .notEmpty().withMessage('スタイルIDは必須です')
    .isMongoId().withMessage('無効なスタイルID形式です'),
  
  handleValidationErrors
];

module.exports = {
  validateStyleRecommendation,
  validateStyleComparison,
  validateStyleFeedback,
  validateQueryParams,
  validatePersonalityTypeParam,
  validateStyleIdParam
};