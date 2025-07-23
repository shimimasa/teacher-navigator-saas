const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// セキュリティミドルウェアの設定
const setupSecurity = (app) => {
  // Helmet.jsによるセキュリティヘッダーの設定
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.google-analytics.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }));

  // CORS設定
  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
      
      // 開発環境では全てのオリジンを許可
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
  };
  app.use(cors(corsOptions));

  // MongoDBインジェクション対策
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized ${key} in request ${req.originalUrl}`);
    },
  }));

  // XSS対策
  app.use(xss());

  // HTTPパラメータ汚染対策
  app.use(hpp({
    whitelist: ['sort', 'fields', 'page', 'limit'], // 複数値を許可するパラメータ
  }));

  // レート制限の設定
  const createRateLimiter = (options) => {
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // デフォルト: 15分
      max: options.max || 100, // デフォルト: 100リクエスト
      message: options.message || 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        console.error(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          error: 'Too Many Requests',
          message: options.message || 'リクエストが多すぎます。しばらくしてからお試しください。',
          retryAfter: Math.round(options.windowMs / 1000),
        });
      },
      skip: (req) => {
        // 管理者は制限をスキップ
        return req.user?.role === 'admin';
      },
    });
  };

  // 一般的なAPI用レート制限
  const generalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 100リクエスト
    message: '一般的なAPIリクエストの制限に達しました。',
  });

  // 認証関連のレート制限（より厳しい）
  const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15分
    max: 5, // 5リクエスト
    message: '認証リクエストの制限に達しました。',
    skipSuccessfulRequests: true, // 成功したリクエストはカウントしない
  });

  // アップロード用のレート制限
  const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1時間
    max: 10, // 10アップロード
    message: 'アップロードの制限に達しました。',
  });

  // レポート生成用のレート制限
  const reportLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1時間
    max: 20, // 20レポート
    message: 'レポート生成の制限に達しました。',
  });

  return {
    generalLimiter,
    authLimiter,
    uploadLimiter,
    reportLimiter,
  };
};

// IPアドレスのホワイトリスト/ブラックリスト
const ipFilter = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // ブラックリストチェック
  const blacklist = process.env.IP_BLACKLIST?.split(',') || [];
  if (blacklist.includes(clientIp)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied',
    });
  }

  // ホワイトリスト（設定されている場合のみ）
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied',
    });
  }

  next();
};

// リクエストサイズ制限
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    const maxBytes = parseSize(maxSize);

    if (contentLength && parseInt(contentLength) > maxBytes) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'リクエストサイズが大きすぎます',
      });
    }

    next();
  };
};

// サイズ文字列をバイトに変換
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // デフォルト10MB

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * units[unit]);
};

// セキュリティログ
const securityLogger = (req, res, next) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
  };

  // 疑わしいリクエストのパターンを検出
  const suspiciousPatterns = [
    /\.\.\//g, // ディレクトリトラバーサル
    /<script/gi, // XSS
    /union.*select/gi, // SQLインジェクション
    /\' or \'/gi, // SQLインジェクション
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.originalUrl) || 
    pattern.test(JSON.stringify(req.body)) ||
    pattern.test(JSON.stringify(req.query))
  );

  if (isSuspicious) {
    log.alert = 'SUSPICIOUS_REQUEST';
    console.error('Security Alert:', log);
  }

  next();
};

// CSRFトークン生成と検証
const csrfProtection = {
  generateToken: (req, res, next) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
  },

  verifyToken: (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'セキュリティトークンが無効です',
      });
    }

    next();
  },
};

// ファイルアップロードのセキュリティ
const fileUploadSecurity = {
  // 許可するファイルタイプ
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],

  // ファイルタイプの検証
  validateFileType: (file) => {
    return fileUploadSecurity.allowedMimeTypes.includes(file.mimetype);
  },

  // ファイルサイズの検証
  validateFileSize: (file, maxSize = 5 * 1024 * 1024) => { // デフォルト5MB
    return file.size <= maxSize;
  },

  // ファイル名のサニタイゼーション
  sanitizeFilename: (filename) => {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  },
};

module.exports = {
  setupSecurity,
  ipFilter,
  requestSizeLimiter,
  securityLogger,
  csrfProtection,
  fileUploadSecurity,
};