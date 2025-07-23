const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');
const Diagnosis = require('../../models/Diagnosis');
const TeachingStyle = require('../../models/TeachingStyle');
const { generateToken } = require('../../middleware/auth');

describe('Diagnosis Routes Integration Test', () => {
  let server;
  let testUser;
  let token;
  let testStyles;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/teacher-navigator-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    server = app.listen(5002);

    // テストユーザーを作成
    testUser = await User.create({
      email: 'diagtest@example.com',
      password: 'Test1234',
      profile: { name: 'テストユーザー' }
    });
    token = generateToken(testUser.getJWTPayload());

    // テスト用授業スタイルを作成
    testStyles = await TeachingStyle.insertMany([
      {
        name: 'analytical-coach',
        displayName: '分析的コーチ型',
        description: 'テスト用スタイル1',
        personalityTypes: ['INTJ', 'INTP'],
        characteristics: ['特徴1'],
        methods: [{
          name: 'メソッド1',
          description: '説明1',
          examples: ['例1']
        }]
      },
      {
        name: 'systematic-instructor',
        displayName: '体系的指導者型',
        description: 'テスト用スタイル2',
        personalityTypes: ['INTJ', 'ISTJ'],
        characteristics: ['特徴2'],
        methods: [{
          name: 'メソッド2',
          description: '説明2',
          examples: ['例2']
        }]
      }
    ]);
  });

  afterEach(async () => {
    await Diagnosis.deleteMany({ userId: testUser._id });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Diagnosis.deleteMany({});
    await TeachingStyle.deleteMany({});
    await server.close();
    await mongoose.connection.close();
  });

  describe('GET /api/diagnosis/questions', () => {
    it('should get all diagnosis questions', async () => {
      const response = await request(server)
        .get('/api/diagnosis/questions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toBeInstanceOf(Array);
      expect(response.body.data.questions.length).toBeGreaterThan(0);
      expect(response.body.data.totalQuestions).toBe(response.body.data.questions.length);
      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.scoring).toBeDefined();
    });

    it('should filter questions by category', async () => {
      const response = await request(server)
        .get('/api/diagnosis/questions?category=extroversion')
        .expect(200);

      expect(response.body.success).toBe(true);
      const questions = response.body.data.questions;
      expect(questions.every(q => q.category === 'extroversion')).toBe(true);
    });
  });

  describe('POST /api/diagnosis/start', () => {
    it('should start a new diagnosis session', async () => {
      const response = await request(server)
        .post('/api/diagnosis/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ platform: 'web' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.diagnosisId).toBeDefined();
      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.data.startTime).toBeDefined();
    });

    it('should abandon previous incomplete diagnosis', async () => {
      // 最初の診断を開始
      const firstResponse = await request(server)
        .post('/api/diagnosis/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ platform: 'web' })
        .expect(201);

      const firstDiagnosisId = firstResponse.body.data.diagnosisId;

      // 2つ目の診断を開始
      await request(server)
        .post('/api/diagnosis/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ platform: 'web' })
        .expect(201);

      // 最初の診断が放棄されたことを確認
      const abandonedDiagnosis = await Diagnosis.findById(firstDiagnosisId);
      expect(abandonedDiagnosis.status).toBe('abandoned');
    });

    it('should fail without authentication', async () => {
      const response = await request(server)
        .post('/api/diagnosis/start')
        .send({ platform: 'web' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/diagnosis/:id/answer', () => {
    let diagnosisId;

    beforeEach(async () => {
      // 診断セッションを開始
      const diagnosis = await Diagnosis.create({
        userId: testUser._id,
        questions: [],
        sessionData: {
          startTime: new Date(),
          completionTime: new Date(),
          duration: 0,
          deviceInfo: { platform: 'test' }
        },
        status: 'in_progress'
      });
      diagnosisId = diagnosis._id;
    });

    it('should save an answer successfully', async () => {
      const response = await request(server)
        .put(`/api/diagnosis/${diagnosisId}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: 'E1',
          answer: 4,
          category: 'extroversion'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.answeredQuestions).toBe(1);
      expect(response.body.data.progressPercentage).toBeDefined();
    });

    it('should update existing answer', async () => {
      // 最初の回答
      await request(server)
        .put(`/api/diagnosis/${diagnosisId}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: 'E1',
          answer: 3,
          category: 'extroversion'
        })
        .expect(200);

      // 同じ質問に別の回答
      const response = await request(server)
        .put(`/api/diagnosis/${diagnosisId}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: 'E1',
          answer: 5,
          category: 'extroversion'
        })
        .expect(200);

      expect(response.body.data.answeredQuestions).toBe(1); // 質問数は増えない

      // データベースで確認
      const diagnosis = await Diagnosis.findById(diagnosisId);
      expect(diagnosis.questions[0].answer).toBe(5);
    });

    it('should fail with invalid answer value', async () => {
      const response = await request(server)
        .put(`/api/diagnosis/${diagnosisId}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: 'E1',
          answer: 6, // 無効な値
          category: 'extroversion'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'answer',
            message: expect.stringContaining('1〜5')
          })
        ])
      );
    });

    it('should fail with invalid diagnosis ID', async () => {
      const response = await request(server)
        .put('/api/diagnosis/invalid-id/answer')
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: 'E1',
          answer: 4,
          category: 'extroversion'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/diagnosis/:id/submit', () => {
    let diagnosisId;

    beforeEach(async () => {
      // 十分な回答を含む診断を作成
      const diagnosis = await Diagnosis.create({
        userId: testUser._id,
        questions: [
          // 各カテゴリー5問ずつ
          ...Array(5).fill(null).map((_, i) => ({
            questionId: `E${i+1}`,
            category: 'extroversion',
            answer: 3,
            timestamp: new Date()
          })),
          ...Array(5).fill(null).map((_, i) => ({
            questionId: `S${i+1}`,
            category: 'sensing',
            answer: 2,
            timestamp: new Date()
          })),
          ...Array(5).fill(null).map((_, i) => ({
            questionId: `T${i+1}`,
            category: 'thinking',
            answer: 4,
            timestamp: new Date()
          })),
          ...Array(5).fill(null).map((_, i) => ({
            questionId: `J${i+1}`,
            category: 'judging',
            answer: 5,
            timestamp: new Date()
          }))
        ],
        sessionData: {
          startTime: new Date(Date.now() - 20 * 60 * 1000),
          completionTime: new Date(),
          duration: 0,
          deviceInfo: { platform: 'test' }
        },
        status: 'in_progress'
      });
      diagnosisId = diagnosis._id;
    });

    it('should complete diagnosis and calculate result', async () => {
      const response = await request(server)
        .post(`/api/diagnosis/${diagnosisId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.result).toBeDefined();
      expect(response.body.data.result.personalityType).toMatch(/^[EI][SN][TF][JP]$/);
      expect(response.body.data.result.scores).toBeDefined();
      expect(response.body.data.result.strengths).toBeInstanceOf(Array);
      expect(response.body.data.result.challenges).toBeInstanceOf(Array);
      expect(response.body.data.result.recommendedStyles).toBeInstanceOf(Array);
      expect(response.body.data.reliability).toBeDefined();
    });

    it('should fail with insufficient answers', async () => {
      // 不十分な回答の診断を作成
      const insufficientDiagnosis = await Diagnosis.create({
        userId: testUser._id,
        questions: [
          { questionId: 'E1', category: 'extroversion', answer: 3 },
          { questionId: 'E2', category: 'extroversion', answer: 3 }
        ],
        sessionData: {
          startTime: new Date(),
          completionTime: new Date(),
          duration: 0
        },
        status: 'in_progress'
      });

      const response = await request(server)
        .post(`/api/diagnosis/${insufficientDiagnosis._id}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('最低5問以上');
    });
  });

  describe('GET /api/diagnosis/:id', () => {
    let completedDiagnosisId;

    beforeEach(async () => {
      // 完了した診断を作成
      const diagnosis = await Diagnosis.create({
        userId: testUser._id,
        questions: Array(20).fill(null).map((_, i) => ({
          questionId: `Q${i}`,
          category: ['extroversion', 'sensing', 'thinking', 'judging'][i % 4],
          answer: 3
        })),
        result: {
          personalityType: 'INTJ',
          scores: {
            extroversion: 40,
            sensing: 40,
            thinking: 70,
            judging: 80
          },
          strengths: ['分析力'],
          challenges: ['感情配慮'],
          recommendedStyles: testStyles.map(s => s._id)
        },
        sessionData: {
          startTime: new Date(),
          completionTime: new Date(),
          duration: 1200
        },
        status: 'completed',
        completedAt: new Date()
      });
      completedDiagnosisId = diagnosis._id;
    });

    it('should get diagnosis result', async () => {
      const response = await request(server)
        .get(`/api/diagnosis/${completedDiagnosisId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.result.personalityType).toBe('INTJ');
      expect(response.body.data.recommendedStyles).toBeInstanceOf(Array);
      expect(response.body.data.completedAt).toBeDefined();
    });

    it('should fail for incomplete diagnosis', async () => {
      const incompleteDiagnosis = await Diagnosis.create({
        userId: testUser._id,
        questions: [],
        sessionData: {
          startTime: new Date(),
          completionTime: new Date(),
          duration: 0
        },
        status: 'in_progress'
      });

      const response = await request(server)
        .get(`/api/diagnosis/${incompleteDiagnosis._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('完了していません');
    });
  });

  describe('GET /api/diagnosis/history', () => {
    beforeEach(async () => {
      // 複数の診断履歴を作成
      const diagnoses = [];
      for (let i = 0; i < 3; i++) {
        diagnoses.push({
          userId: testUser._id,
          questions: [{ questionId: 'E1', category: 'extroversion', answer: 3 }],
          result: {
            personalityType: ['INTJ', 'ENFP', 'ISTP'][i],
            scores: { extroversion: 50, sensing: 50, thinking: 50, judging: 50 }
          },
          sessionData: {
            startTime: new Date(),
            completionTime: new Date(),
            duration: 600
          },
          status: 'completed',
          completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        });
      }
      await Diagnosis.insertMany(diagnoses);
    });

    it('should get diagnosis history', async () => {
      const response = await request(server)
        .get('/api/diagnosis/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.diagnoses).toBeInstanceOf(Array);
      expect(response.body.data.diagnoses.length).toBe(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(server)
        .get('/api/diagnosis/history?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.diagnoses.length).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });
  });

  describe('POST /api/diagnosis/:id/feedback', () => {
    let completedDiagnosisId;

    beforeEach(async () => {
      const diagnosis = await Diagnosis.create({
        userId: testUser._id,
        questions: [{ questionId: 'E1', category: 'extroversion', answer: 3 }],
        result: {
          personalityType: 'INTJ',
          scores: { extroversion: 50, sensing: 50, thinking: 50, judging: 50 },
          recommendedStyles: testStyles.map(s => s._id)
        },
        sessionData: {
          startTime: new Date(),
          completionTime: new Date(),
          duration: 600
        },
        status: 'completed',
        completedAt: new Date()
      });
      completedDiagnosisId = diagnosis._id;
    });

    it('should submit feedback successfully', async () => {
      const styleRatings = {};
      testStyles.forEach(style => {
        styleRatings[style._id] = 4;
      });

      const response = await request(server)
        .post(`/api/diagnosis/${completedDiagnosisId}/feedback`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: '非常に参考になりました',
          styleRatings
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('フィードバック');
    });

    it('should fail for duplicate feedback', async () => {
      // 最初のフィードバック
      await request(server)
        .post(`/api/diagnosis/${completedDiagnosisId}/feedback`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          comment: '良かったです'
        })
        .expect(200);

      // 2回目のフィードバック
      const response = await request(server)
        .post(`/api/diagnosis/${completedDiagnosisId}/feedback`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 4,
          comment: '修正します'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('送信済み');
    });
  });

  describe('GET /api/diagnosis/stats', () => {
    it('should get diagnosis statistics', async () => {
      // 診断データを作成
      await Diagnosis.create({
        userId: testUser._id,
        questions: [{ questionId: 'E1', category: 'extroversion', answer: 3 }],
        result: { 
          personalityType: 'INTJ',
          scores: { extroversion: 50, sensing: 50, thinking: 50, judging: 50 }
        },
        sessionData: {
          startTime: new Date(),
          completionTime: new Date(),
          duration: 600
        },
        status: 'completed',
        completedAt: new Date()
      });

      const response = await request(server)
        .get('/api/diagnosis/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalDiagnoses).toBe(1);
      expect(response.body.data.personalityTypes).toBeInstanceOf(Array);
      expect(response.body.data.mostCommonType).toBe('INTJ');
    });
  });
});