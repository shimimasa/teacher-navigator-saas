const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher-navigator', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB接続成功: ${conn.connection.host}`);
    
    // 接続イベントのリスナー
    mongoose.connection.on('error', (err) => {
      console.error('MongoDBエラー:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDBから切断されました');
    });

    // プロセス終了時の処理
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB接続を正常に終了しました');
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB接続エラー:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;