const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('./errorHandler');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

// JWT トークン生成
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

// JWT トークン検証
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
};

// 認証ミドルウェア
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Authorizationヘッダーからトークンを取得
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // トークンが存在しない場合
  if (!token) {
    return next(
      new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
    );
  }

  try {
    // トークンを検証
    const decoded = verifyToken(token);

    // ユーザーを取得（パスワードを除く）
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(
        new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.UNAUTHORIZED)
      );
    }

    // アカウントが無効化されている場合
    if (!user.isActive) {
      return next(
        new AppError('アカウントが無効化されています', HTTP_STATUS.UNAUTHORIZED)
      );
    }

    // リクエストオブジェクトにユーザー情報を追加
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(
        new AppError(ERROR_MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED)
      );
    }
    return next(
      new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
    );
  }
});

// 権限チェックミドルウェア
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(ERROR_MESSAGES.PERMISSION_DENIED, HTTP_STATUS.FORBIDDEN)
      );
    }

    next();
  };
};

// オプショナル認証ミドルウェア（認証は必須ではないが、認証情報があれば取得）
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // エラーが発生してもリクエストは続行
      console.log('Optional auth token verification failed:', error.message);
    }
  }

  next();
});

// レート制限チェック（簡易版）
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = rateLimitMap.get(key);
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        success: false,
        error: {
          message: 'リクエスト数が制限を超えました。しばらくしてから再度お試しください。'
        }
      });
    }
    
    limit.count++;
    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  protect,
  authorize,
  optionalAuth,
  rateLimit
};