const express = require('express');
const router = express.Router();
const diagnosisService = require('../services/diagnosisService');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateAnswer, 
  validateFeedback,
  validateDiagnosisId 
} = require('../middleware/diagnosisValidation');

/**
 * @route   GET /api/diagnosis/questions
 * @desc    診断質問を取得
 * @access  Public
 */
router.get('/questions', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const questions = await diagnosisService.getQuestions(category);
  
  res.json({
    success: true,
    data: questions
  });
}));

/**
 * @route   POST /api/diagnosis/start
 * @desc    診断セッションを開始
 * @access  Private
 */
router.post('/start', protect, asyncHandler(async (req, res) => {
  const deviceInfo = {
    userAgent: req.headers['user-agent'],
    platform: req.body.platform || 'web'
  };
  
  const session = await diagnosisService.startDiagnosis(req.user._id, deviceInfo);
  
  res.status(201).json({
    success: true,
    message: '診断を開始しました',
    data: session
  });
}));

/**
 * @route   PUT /api/diagnosis/:id/answer
 * @desc    回答を保存
 * @access  Private
 */
router.put('/:id/answer', 
  protect, 
  validateDiagnosisId,
  validateAnswer, 
  asyncHandler(async (req, res) => {
    const { questionId, answer, category } = req.body;
    
    const result = await diagnosisService.saveAnswer(
      req.params.id,
      req.user._id,
      { questionId, answer, category }
    );
    
    res.json({
      success: true,
      message: '回答を保存しました',
      data: result
    });
  })
);

/**
 * @route   POST /api/diagnosis/:id/submit
 * @desc    診断を完了して結果を取得
 * @access  Private
 */
router.post('/:id/submit', 
  protect, 
  validateDiagnosisId,
  asyncHandler(async (req, res) => {
    const result = await diagnosisService.submitDiagnosis(
      req.params.id,
      req.user._id
    );
    
    res.json({
      success: true,
      message: '診断が完了しました',
      data: result
    });
  })
);

/**
 * @route   GET /api/diagnosis/:id
 * @desc    診断結果を取得
 * @access  Private
 */
router.get('/:id', 
  protect, 
  validateDiagnosisId,
  asyncHandler(async (req, res) => {
    const result = await diagnosisService.getDiagnosisResult(
      req.params.id,
      req.user._id
    );
    
    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * @route   GET /api/diagnosis/history
 * @desc    診断履歴を取得
 * @access  Private
 */
router.get('/history', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, includeAbandoned = false } = req.query;
  
  const history = await diagnosisService.getDiagnosisHistory(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    includeAbandoned: includeAbandoned === 'true'
  });
  
  res.json({
    success: true,
    data: history
  });
}));

/**
 * @route   POST /api/diagnosis/:id/feedback
 * @desc    診断へのフィードバックを送信
 * @access  Private
 */
router.post('/:id/feedback', 
  protect, 
  validateDiagnosisId,
  validateFeedback, 
  asyncHandler(async (req, res) => {
    const result = await diagnosisService.submitFeedback(
      req.params.id,
      req.user._id,
      req.body
    );
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route   GET /api/diagnosis/stats
 * @desc    診断統計を取得
 * @access  Private
 */
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const stats = await diagnosisService.getDiagnosisStats(req.user._id);
  
  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router;