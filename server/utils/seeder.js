const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TeachingStyle = require('../models/TeachingStyle');
const teachingStylesData = require('../data/teachingStyles.json');
const connectDB = require('./database');

// 環境変数の読み込み
dotenv.config();

/**
 * 授業スタイルデータをデータベースに投入
 */
async function seedTeachingStyles() {
  try {
    // 既存のデータを削除
    await TeachingStyle.deleteMany({});
    console.log('既存の授業スタイルデータを削除しました');

    // 新しいデータを挿入
    const styles = teachingStylesData.styles;
    const insertedStyles = await TeachingStyle.insertMany(styles);
    console.log(`${insertedStyles.length}件の授業スタイルデータを投入しました`);

    return insertedStyles;
  } catch (error) {
    console.error('授業スタイルデータの投入に失敗しました:', error);
    throw error;
  }
}

/**
 * サンプル診断データを生成（開発用）
 */
async function generateSampleDiagnoses() {
  const User = require('../models/User');
  const Diagnosis = require('../models/Diagnosis');
  const diagnosisEngine = require('../services/diagnosisEngine');
  const questionsData = require('../data/diagnosisQuestions.json');

  try {
    // テストユーザーを作成
    const testUser = await User.findOne({ email: 'test@example.com' }) || 
      await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        profile: {
          name: 'テストユーザー',
          school: 'テスト学校',
          subjects: ['数学', '理科'],
          experience: 5
        }
      });

    console.log('テストユーザーを準備しました');

    // サンプル診断データを生成
    const sampleAnswers = questionsData.questions.map(question => ({
      questionId: question.id,
      category: question.category,
      answer: Math.floor(Math.random() * 5) + 1, // 1-5のランダムな回答
      timestamp: new Date()
    }));

    // 診断結果を計算
    const result = diagnosisEngine.calculateResult(sampleAnswers);
    const recommendedStyles = diagnosisEngine.getRecommendedStyles(result.personalityType);

    // 推奨スタイルのObjectIdを取得
    const styleIds = await TeachingStyle.find({
      name: { $in: recommendedStyles }
    }).select('_id');

    // 診断データを作成
    const diagnosis = await Diagnosis.create({
      userId: testUser._id,
      questions: sampleAnswers,
      result: {
        ...result,
        recommendedStyles: styleIds.map(s => s._id)
      },
      sessionData: {
        startTime: new Date(Date.now() - 20 * 60 * 1000), // 20分前
        completionTime: new Date(),
        duration: 1200, // 20分
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Test Browser)',
          platform: 'Test Platform'
        }
      },
      status: 'completed',
      completedAt: new Date()
    });

    console.log('サンプル診断データを作成しました:', {
      personalityType: result.personalityType,
      scores: result.scores
    });

    return diagnosis;
  } catch (error) {
    console.error('サンプル診断データの生成に失敗しました:', error);
    throw error;
  }
}

/**
 * メインのシーダー関数
 */
async function runSeeder() {
  try {
    // データベースに接続
    await connectDB();
    console.log('データベースに接続しました');

    // 引数を確認
    const args = process.argv.slice(2);
    const shouldSeedAll = args.includes('--all');
    const shouldSeedStyles = args.includes('--styles') || shouldSeedAll;
    const shouldGenerateSamples = args.includes('--samples') || shouldSeedAll;

    if (!shouldSeedStyles && !shouldGenerateSamples) {
      console.log(`
使用方法:
  npm run seed -- --styles     授業スタイルデータを投入
  npm run seed -- --samples    サンプル診断データを生成
  npm run seed -- --all        すべてのデータを投入
      `);
      process.exit(0);
    }

    // データ投入実行
    if (shouldSeedStyles) {
      await seedTeachingStyles();
    }

    if (shouldGenerateSamples) {
      await generateSampleDiagnoses();
    }

    console.log('シーダーの実行が完了しました');
    process.exit(0);
  } catch (error) {
    console.error('シーダーの実行に失敗しました:', error);
    process.exit(1);
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  runSeeder();
}

module.exports = {
  seedTeachingStyles,
  generateSampleDiagnoses
};