const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateStyleRecommendation,
  validateStyleComparison,
  validateStyleFeedback
} = require('../middleware/teachingStyleValidation');
const TeachingStyle = require('../models/TeachingStyle');
const StyleRecommenderService = require('../services/styleRecommender');
const { AppError } = require('../middleware/errorHandler');

/**
 * @route   GET /api/teaching-styles
 * @desc    全ての授業スタイルを取得
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const { subject, personalityType, limit = 10, page = 1 } = req.query;
  
  let query = {};
  
  if (subject) {
    query['compatibility.subjects'] = subject;
  }
  
  if (personalityType) {
    query['compatibility.personalityTypes'] = personalityType;
  }

  const skip = (page - 1) * limit;

  const styles = await TeachingStyle.find(query)
    .select('-__v')
    .limit(Number(limit))
    .skip(skip)
    .sort('displayName');

  const total = await TeachingStyle.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      styles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

/**
 * @route   GET /api/teaching-styles/recommendations/:diagnosisId
 * @desc    診断結果に基づく授業スタイルの推奨
 * @access  Private
 */
router.get('/recommendations/:diagnosisId',
  protect,
  validateStyleRecommendation,
  asyncHandler(async (req, res) => {
    const { diagnosisId } = req.params;
    const { subject, gradeLevel, limit = 5 } = req.query;

    const recommendations = await StyleRecommenderService.recommendByDiagnosisId(
      diagnosisId,
      {
        subject,
        gradeLevel,
        limit: Number(limit),
        userId: req.user._id // 権限確認用
      }
    );

    res.status(200).json({
      success: true,
      data: {
        diagnosisId,
        recommendations,
        filters: {
          subject,
          gradeLevel
        }
      }
    });
  })
);

/**
 * @route   GET /api/teaching-styles/recommendations/personality/:personalityType
 * @desc    パーソナリティタイプに基づく授業スタイルの推奨
 * @access  Public
 */
router.get('/recommendations/personality/:personalityType',
  asyncHandler(async (req, res) => {
    const { personalityType } = req.params;
    const { subject, gradeLevel, limit = 5 } = req.query;

    const recommendations = await StyleRecommenderService.recommendByPersonalityType(
      personalityType.toUpperCase(),
      {
        subject,
        gradeLevel,
        limit: Number(limit)
      }
    );

    res.status(200).json({
      success: true,
      data: {
        personalityType: personalityType.toUpperCase(),
        recommendations,
        filters: {
          subject,
          gradeLevel
        }
      }
    });
  })
);

/**
 * @route   POST /api/teaching-styles/compare
 * @desc    複数の授業スタイルを比較
 * @access  Private
 */
router.post('/compare',
  protect,
  validateStyleComparison,
  asyncHandler(async (req, res) => {
    const { styleIds, personalityType } = req.body;

    const comparison = await StyleRecommenderService.compareStyles(
      styleIds,
      personalityType.toUpperCase()
    );

    res.status(200).json({
      success: true,
      data: comparison
    });
  })
);

/**
 * @route   GET /api/teaching-styles/:id
 * @desc    特定の授業スタイルの詳細を取得
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const style = await TeachingStyle.findById(req.params.id)
    .select('-__v');

  if (!style) {
    throw new AppError('授業スタイルが見つかりません', 404);
  }

  res.status(200).json({
    success: true,
    data: style
  });
}));

/**
 * @route   POST /api/teaching-styles/:id/feedback
 * @desc    授業スタイルへのフィードバック送信
 * @access  Private
 */
router.post('/:id/feedback',
  protect,
  validateStyleFeedback,
  asyncHandler(async (req, res) => {
    const { rating, effectiveness, comment } = req.body;
    const styleId = req.params.id;

    const style = await TeachingStyle.findById(styleId);
    if (!style) {
      throw new AppError('授業スタイルが見つかりません', 404);
    }

    // フィードバックデータの追加
    if (!style.feedback) {
      style.feedback = [];
    }

    style.feedback.push({
      userId: req.user._id,
      rating,
      effectiveness,
      comment,
      createdAt: new Date()
    });

    // 使用統計の更新
    const allRatings = style.feedback.map(f => f.rating);
    style.usageStats.averageRating = 
      allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
    style.usageStats.totalFeedback = style.feedback.length;

    // 採用率の更新（4以上の評価を採用とみなす）
    const adoptions = style.feedback.filter(f => f.rating >= 4).length;
    style.usageStats.adoptionRate = adoptions / style.feedback.length;

    await style.save();

    res.status(201).json({
      success: true,
      message: 'フィードバックを送信しました',
      data: {
        styleId,
        feedback: {
          rating,
          effectiveness,
          comment
        },
        updatedStats: style.usageStats
      }
    });
  })
);

/**
 * @route   GET /api/teaching-styles/popular
 * @desc    人気の授業スタイルを取得
 * @access  Public
 */
router.get('/stats/popular', asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const popularStyles = await TeachingStyle.find()
    .select('name displayName usageStats compatibility')
    .sort('-usageStats.averageRating -usageStats.adoptionRate')
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    data: {
      styles: popularStyles,
      criteria: 'averageRating and adoptionRate'
    }
  });
}));

/**
 * @route   GET /api/teaching-styles/stats/by-personality
 * @desc    パーソナリティタイプ別の統計を取得
 * @access  Public
 */
router.get('/stats/by-personality', asyncHandler(async (req, res) => {
  const stats = {};
  
  // 全スタイルを取得
  const allStyles = await TeachingStyle.find()
    .select('compatibility.personalityTypes usageStats');

  // パーソナリティタイプ別に集計
  for (const style of allStyles) {
    for (const pType of style.compatibility.personalityTypes) {
      if (!stats[pType]) {
        stats[pType] = {
          count: 0,
          totalRating: 0,
          avgAdoptionRate: 0
        };
      }
      stats[pType].count++;
      stats[pType].totalRating += style.usageStats.averageRating || 0;
      stats[pType].avgAdoptionRate += style.usageStats.adoptionRate || 0;
    }
  }

  // 平均値を計算
  Object.keys(stats).forEach(pType => {
    if (stats[pType].count > 0) {
      stats[pType].avgRating = stats[pType].totalRating / stats[pType].count;
      stats[pType].avgAdoptionRate = stats[pType].avgAdoptionRate / stats[pType].count;
      delete stats[pType].totalRating;
    }
  });

  res.status(200).json({
    success: true,
    data: stats
  });
}));

module.exports = router;