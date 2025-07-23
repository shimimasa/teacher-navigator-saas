const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./utils/database');

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションの初期化
const app = express();

// データベース接続
connectDB();

// ミドルウェアの設定
app.use(helmet()); // セキュリティヘッダーの設定
app.use(cors()); // CORS設定
app.use(express.json()); // JSONパーサー
app.use(express.urlencoded({ extended: true })); // URLエンコードパーサー

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({ 
    message: '教員ナビゲーター診断SaaS API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      diagnosis: '/api/diagnosis',
      teachingStyles: '/api/teaching-styles',
      templates: '/api/templates',
      analytics: '/api/analytics'
    }
  });
});

// APIルートの設定
app.use('/api/auth', require('./routes/auth'));
app.use('/api/diagnosis', require('./routes/diagnosis'));
app.use('/api/teaching-styles', require('./routes/teachingStyle'));
app.use('/api/templates', require('./routes/template'));
// app.use('/api/analytics', require('./routes/analytics'));

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(err.stack);
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'エンドポイントが見つかりません'
    }
  });
});

// サーバーの起動
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
});