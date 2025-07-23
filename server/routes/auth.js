const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { protect, rateLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateProfileUpdate,
  validatePasswordChange,
  validateAccountDeletion
} = require('../middleware/validation');

// レート制限の設定
const loginLimiter = rateLimit(5, 15 * 60 * 1000); // 15分間に5回まで
const registerLimiter = rateLimit(3, 60 * 60 * 1000); // 1時間に3回まで

/**
 * @route   POST /api/auth/register
 * @desc    ユーザー登録
 * @access  Public
 */
router.post('/register', 
  registerLimiter,
  validateRegister, 
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      message: 'ユーザー登録が完了しました',
      data: result
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    ログイン
 * @access  Public
 */
router.post('/login', 
  loginLimiter,
  validateLogin, 
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      message: 'ログインに成功しました',
      data: result
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    ログアウト
 * @access  Private
 */
router.post('/logout', 
  protect, 
  asyncHandler(async (req, res) => {
    // クライアント側でトークンを削除することでログアウトを実現
    // 必要に応じてサーバー側でトークンのブラックリスト管理も可能
    
    res.json({
      success: true,
      message: 'ログアウトしました'
    });
  })
);

/**
 * @route   POST /api/auth/reset-password/request
 * @desc    パスワードリセット要求
 * @access  Public
 */
router.post('/reset-password/request', 
  validatePasswordResetRequest, 
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    
    res.json({
      success: true,
      message: result.message,
      ...(process.env.NODE_ENV === 'development' && { resetToken: result.resetToken })
    });
  })
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    パスワードリセット実行
 * @access  Public
 */
router.post('/reset-password', 
  validatePasswordReset, 
  asyncHandler(async (req, res) => {
    const { email, token, newPassword } = req.body;
    const result = await authService.resetPassword(email, token, newPassword);
    
    res.json({
      success: true,
      message: 'パスワードがリセットされました',
      data: result
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    現在のユーザー情報取得
 * @access  Private
 */
router.get('/me', 
  protect, 
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  })
);

/**
 * @route   PUT /api/auth/profile
 * @desc    プロフィール更新
 * @access  Private
 */
router.put('/profile', 
  protect, 
  validateProfileUpdate, 
  asyncHandler(async (req, res) => {
    const updatedUser = await authService.updateProfile(req.user._id, req.body);
    
    res.json({
      success: true,
      message: 'プロフィールを更新しました',
      data: {
        user: updatedUser
      }
    });
  })
);

/**
 * @route   PUT /api/auth/password
 * @desc    パスワード変更
 * @access  Private
 */
router.put('/password', 
  protect, 
  validatePasswordChange, 
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user._id, 
      currentPassword, 
      newPassword
    );
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route   DELETE /api/auth/account
 * @desc    アカウント削除（無効化）
 * @access  Private
 */
router.delete('/account', 
  protect, 
  validateAccountDeletion, 
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const result = await authService.deleteAccount(req.user._id, password);
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route   GET /api/auth/verify
 * @desc    トークン検証（ヘルスチェック用）
 * @access  Private
 */
router.get('/verify', 
  protect, 
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'トークンは有効です',
      data: {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role
      }
    });
  })
);

module.exports = router;