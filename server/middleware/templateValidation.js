const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

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

// テンプレート生成のバリデーション
const validateTemplateGeneration = [
  body('diagnosisId')
    .notEmpty().withMessage('診断IDは必須です')
    .isMongoId().withMessage('無効な診断ID形式です'),
  
  body('teachingStyleId')
    .notEmpty().withMessage('授業スタイルIDは必須です')
    .isMongoId().withMessage('無効な授業スタイルID形式です'),
  
  body('title')
    .notEmpty().withMessage('タイトルは必須です')
    .isString().withMessage('タイトルは文字列で入力してください')
    .isLength({ min: 1, max: 200 }).withMessage('タイトルは1〜200文字で入力してください')
    .trim(),
  
  body('subject')
    .notEmpty().withMessage('教科は必須です')
    .isString().withMessage('教科は文字列で入力してください')
    .trim(),
  
  body('gradeLevel')
    .notEmpty().withMessage('学年は必須です')
    .isString().withMessage('学年は文字列で入力してください')
    .trim(),
  
  body('duration')
    .notEmpty().withMessage('授業時間は必須です')
    .isInt({ min: 10, max: 300 }).withMessage('授業時間は10〜300分の範囲で入力してください'),
  
  body('templateType')
    .optional()
    .isIn(['lesson_plan', 'worksheet', 'assessment', 'comprehensive'])
    .withMessage('無効なテンプレートタイプです'),
  
  body('customizations')
    .optional()
    .isObject().withMessage('カスタマイズ設定はオブジェクトで指定してください'),
  
  body('customizations.fontSize')
    .optional()
    .isIn(['small', 'medium', 'large'])
    .withMessage('無効なフォントサイズです'),
  
  body('customizations.colorScheme')
    .optional()
    .isIn(['default', 'high_contrast', 'colorful', 'minimal'])
    .withMessage('無効な配色スキームです'),
  
  body('customizations.language')
    .optional()
    .isIn(['ja', 'en', 'simple_ja'])
    .withMessage('無効な言語設定です'),
  
  handleValidationErrors
];

// テンプレート更新のバリデーション
const validateTemplateUpdate = [
  body('title')
    .optional()
    .isString().withMessage('タイトルは文字列で入力してください')
    .isLength({ min: 1, max: 200 }).withMessage('タイトルは1〜200文字で入力してください')
    .trim(),
  
  body('subject')
    .optional()
    .isString().withMessage('教科は文字列で入力してください')
    .trim(),
  
  body('gradeLevel')
    .optional()
    .isString().withMessage('学年は文字列で入力してください')
    .trim(),
  
  body('duration')
    .optional()
    .isInt({ min: 10, max: 300 }).withMessage('授業時間は10〜300分の範囲で入力してください'),
  
  body('content')
    .optional()
    .isObject().withMessage('コンテンツはオブジェクトで指定してください'),
  
  body('content.lessonPlan.activities')
    .optional()
    .isArray().withMessage('活動は配列で指定してください')
    .custom((activities, { req }) => {
      // 活動時間の合計チェック
      if (activities && req.body.duration) {
        const totalDuration = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
        if (totalDuration > req.body.duration) {
          throw new Error('活動の合計時間が授業時間を超えています');
        }
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['draft', 'completed', 'archived'])
    .withMessage('無効なステータスです'),
  
  body('metadata.tags')
    .optional()
    .isArray().withMessage('タグは配列で指定してください')
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error('タグは最大10個まで設定できます');
      }
      return true;
    }),
  
  body('metadata.shareSettings.isPublic')
    .optional()
    .isBoolean().withMessage('公開設定は真偽値で指定してください'),
  
  handleValidationErrors
];

// クエリパラメータのバリデーション
const validateTemplateQuery = [
  query('status')
    .optional()
    .isIn(['draft', 'completed', 'archived'])
    .withMessage('無効なステータスです'),
  
  query('templateType')
    .optional()
    .isIn(['lesson_plan', 'worksheet', 'assessment', 'comprehensive'])
    .withMessage('無効なテンプレートタイプです'),
  
  query('subject')
    .optional()
    .isString().withMessage('教科は文字列で指定してください')
    .trim(),
  
  query('gradeLevel')
    .optional()
    .isString().withMessage('学年は文字列で指定してください')
    .trim(),
  
  query('tags')
    .optional()
    .isString().withMessage('タグは文字列で指定してください'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('取得件数は1〜100の範囲で指定してください'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('ページ番号は1以上の整数で指定してください'),
  
  handleValidationErrors
];

// テンプレート複製のバリデーション
const validateTemplateDuplicate = [
  body('title')
    .notEmpty().withMessage('新しいタイトルは必須です')
    .isString().withMessage('タイトルは文字列で入力してください')
    .isLength({ min: 1, max: 200 }).withMessage('タイトルは1〜200文字で入力してください')
    .trim(),
  
  body('modifications')
    .optional()
    .isObject().withMessage('変更内容はオブジェクトで指定してください'),
  
  body('modifications.subject')
    .optional()
    .isString().withMessage('教科は文字列で入力してください')
    .trim(),
  
  body('modifications.gradeLevel')
    .optional()
    .isString().withMessage('学年は文字列で入力してください')
    .trim(),
  
  handleValidationErrors
];

// フィードバックのバリデーション
const validateTemplateFeedback = [
  body('rating')
    .notEmpty().withMessage('評価は必須です')
    .isInt({ min: 1, max: 5 }).withMessage('評価は1〜5の整数で入力してください'),
  
  body('comment')
    .optional()
    .isString().withMessage('コメントは文字列で入力してください')
    .isLength({ max: 500 }).withMessage('コメントは500文字以内で入力してください')
    .trim()
    .escape(), // XSS対策
  
  body('effectiveness')
    .optional()
    .isObject().withMessage('効果性評価はオブジェクトで指定してください'),
  
  body('effectiveness.studentEngagement')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('生徒の参加度は1〜5の整数で入力してください'),
  
  body('effectiveness.learningOutcomes')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('学習成果は1〜5の整数で入力してください'),
  
  body('effectiveness.timeManagement')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('時間管理は1〜5の整数で入力してください'),
  
  body('effectiveness.overallSuccess')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('全体的な成功度は1〜5の整数で入力してください'),
  
  handleValidationErrors
];

// 共有設定のバリデーション
const validateShareSettings = [
  body('isPublic')
    .notEmpty().withMessage('公開設定は必須です')
    .isBoolean().withMessage('公開設定は真偽値で指定してください'),
  
  body('sharedWith')
    .optional()
    .isArray().withMessage('共有先は配列で指定してください')
    .custom((sharedWith) => {
      if (sharedWith && sharedWith.length > 50) {
        throw new Error('共有先は最大50人まで設定できます');
      }
      
      // 各共有先の形式をチェック
      for (const share of sharedWith) {
        if (!share.userId || !mongoose.Types.ObjectId.isValid(share.userId)) {
          throw new Error('無効なユーザーIDが含まれています');
        }
        if (share.permission && !['view', 'edit'].includes(share.permission)) {
          throw new Error('無効な権限設定が含まれています');
        }
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// テンプレートIDのバリデーション
const validateTemplateId = [
  param('id')
    .notEmpty().withMessage('テンプレートIDは必須です')
    .isMongoId().withMessage('無効なテンプレートID形式です'),
  
  handleValidationErrors
];

module.exports = {
  validateTemplateGeneration,
  validateTemplateUpdate,
  validateTemplateQuery,
  validateTemplateDuplicate,
  validateTemplateFeedback,
  validateShareSettings,
  validateTemplateId
};