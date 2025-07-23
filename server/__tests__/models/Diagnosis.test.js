const mongoose = require('mongoose');
const Diagnosis = require('../../models/Diagnosis');
const User = require('../../models/User');
const TeachingStyle = require('../../models/TeachingStyle');

describe('Diagnosis Model Test', () => {
  let testUser;
  let testStyle;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/teacher-navigator-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // テスト用ユーザーを作成
    testUser = await User.create({
      email: 'diagtest@example.com',
      password: 'Test1234',
      profile: { name: 'テストユーザー' }
    });

    // テスト用授業スタイルを作成
    testStyle = await TeachingStyle.create({
      name: 'test-style',
      displayName: 'テストスタイル',
      description: 'テスト用の授業スタイル',
      personalityTypes: ['INTJ'],
      characteristics: ['特徴1', '特徴2'],
      methods: [{
        name: 'テストメソッド',
        description: 'テスト用のメソッド',
        examples: ['例1']
      }]
    });
  });

  afterEach(async () => {
    await Diagnosis.deleteMany({ userId: testUser._id });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TeachingStyle.deleteMany({});
    await Diagnosis.deleteMany({});
    await mongoose.connection.close();
  });

  it('should create a diagnosis successfully', async () => {
    const diagnosisData = {
      userId: testUser._id,
      questions: [
        {
          questionId: 'E1',
          category: 'extroversion',
          answer: 4
        },
        {
          questionId: 'S1',
          category: 'sensing',
          answer: 3
        }
      ],
      result: {
        personalityType: 'INTJ',
        scores: {
          extroversion: 70,
          sensing: 60,
          thinking: 75,
          judging: 80
        },
        strengths: ['分析力', '戦略的思考'],
        challenges: ['感情面の配慮'],
        recommendedStyles: [testStyle._id]
      },
      sessionData: {
        startTime: new Date(Date.now() - 20 * 60 * 1000),
        completionTime: new Date(),
        duration: 1200,
        deviceInfo: {
          userAgent: 'Test Browser',
          platform: 'Test'
        }
      },
      status: 'completed'
    };

    const diagnosis = await Diagnosis.create(diagnosisData);

    expect(diagnosis.userId.toString()).toBe(testUser._id.toString());
    expect(diagnosis.result.personalityType).toBe('INTJ');
    expect(diagnosis.status).toBe('completed');
    expect(diagnosis.completedAt).toBeDefined();
  });

  it('should calculate progress percentage correctly', async () => {
    const diagnosis = await Diagnosis.create({
      userId: testUser._id,
      questions: Array(20).fill(null).map((_, i) => ({
        questionId: `Q${i}`,
        category: 'extroversion',
        answer: 3
      })),
      result: {
        personalityType: 'INTJ',
        scores: {
          extroversion: 50,
          sensing: 50,
          thinking: 50,
          judging: 50
        }
      },
      sessionData: {
        startTime: new Date(),
        completionTime: new Date(),
        duration: 0
      }
    });

    expect(diagnosis.progressPercentage).toBe(50); // 20/40 * 100
  });

  it('should get result summary correctly', async () => {
    const diagnosis = await Diagnosis.create({
      userId: testUser._id,
      questions: [{
        questionId: 'E1',
        category: 'extroversion',
        answer: 5
      }],
      result: {
        personalityType: 'INTJ',
        scores: {
          extroversion: 80,
          sensing: 60,
          thinking: 85,
          judging: 90
        },
        strengths: ['革新的', '論理的'],
        challenges: ['柔軟性']
      },
      sessionData: {
        startTime: new Date(),
        completionTime: new Date(),
        duration: 600
      },
      status: 'completed'
    });

    const summary = diagnosis.getResultSummary();
    
    expect(summary.personalityType).toBe('INTJ');
    expect(summary.typeDescription).toContain('革新的');
    expect(summary.strengths).toContain('革新的');
    expect(summary.challenges).toContain('柔軟性');
  });

  it('should calculate category scores', async () => {
    const diagnosis = new Diagnosis({
      userId: testUser._id,
      questions: [
        { questionId: 'E1', category: 'extroversion', answer: 5 },
        { questionId: 'E2', category: 'extroversion', answer: 4 },
        { questionId: 'S1', category: 'sensing', answer: 2 },
        { questionId: 'S2', category: 'sensing', answer: 3 }
      ],
      sessionData: {
        startTime: new Date(),
        completionTime: new Date(),
        duration: 0
      }
    });

    const scores = diagnosis.calculateCategoryScores();
    
    expect(scores.extroversion).toBe(90); // (4.5/5) * 100
    expect(scores.sensing).toBe(50); // (2.5/5) * 100
  });

  it('should validate required fields', async () => {
    const invalidDiagnosis = new Diagnosis({
      // userIdが不足
      questions: [{
        questionId: 'E1',
        category: 'extroversion',
        answer: 3
      }]
    });

    await expect(invalidDiagnosis.save()).rejects.toThrow(/ユーザーID/);
  });

  it('should get user diagnosis history', async () => {
    // 複数の診断を作成
    const diagnoses = [];
    for (let i = 0; i < 3; i++) {
      const diagnosis = await Diagnosis.create({
        userId: testUser._id,
        questions: [{
          questionId: 'E1',
          category: 'extroversion',
          answer: 3
        }],
        result: {
          personalityType: 'INTJ',
          scores: {
            extroversion: 50 + i * 10,
            sensing: 50,
            thinking: 50,
            judging: 50
          }
        },
        sessionData: {
          startTime: new Date(),
          completionTime: new Date(),
          duration: 600
        },
        status: 'completed',
        completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // i日前
      });
      diagnoses.push(diagnosis);
    }

    const history = await Diagnosis.getUserDiagnosisHistory(testUser._id, 2);
    
    expect(history).toHaveLength(2);
    expect(history[0].result.personalityType).toBe('INTJ');
    expect(history[0].completedAt).toBeDefined();
  });

  it('should update completion time when status changes to completed', async () => {
    const diagnosis = await Diagnosis.create({
      userId: testUser._id,
      questions: [{
        questionId: 'E1',
        category: 'extroversion',
        answer: 3
      }],
      result: {
        personalityType: 'INTJ',
        scores: {
          extroversion: 60,
          sensing: 60,
          thinking: 60,
          judging: 60
        }
      },
      sessionData: {
        startTime: new Date(Date.now() - 10 * 60 * 1000),
        completionTime: new Date(),
        duration: 0
      },
      status: 'in_progress'
    });

    expect(diagnosis.completedAt).toBeUndefined();

    // ステータスを完了に変更
    diagnosis.status = 'completed';
    await diagnosis.save();

    expect(diagnosis.completedAt).toBeDefined();
    expect(diagnosis.sessionData.duration).toBeGreaterThan(0);
  });

  it('should add and retrieve feedback', async () => {
    const diagnosis = await Diagnosis.create({
      userId: testUser._id,
      questions: [{
        questionId: 'E1',
        category: 'extroversion',
        answer: 3
      }],
      result: {
        personalityType: 'INTJ',
        scores: {
          extroversion: 60,
          sensing: 60,
          thinking: 60,
          judging: 60
        }
      },
      sessionData: {
        startTime: new Date(),
        completionTime: new Date(),
        duration: 600
      },
      status: 'completed'
    });

    // フィードバックを追加
    diagnosis.feedback = {
      rating: 5,
      comment: '非常に参考になりました',
      submittedAt: new Date()
    };
    await diagnosis.save();

    const retrieved = await Diagnosis.findById(diagnosis._id);
    expect(retrieved.feedback.rating).toBe(5);
    expect(retrieved.feedback.comment).toBe('非常に参考になりました');
  });
});