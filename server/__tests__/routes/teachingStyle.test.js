const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const teachingStyleRoutes = require('../../routes/teachingStyle');
const { protect } = require('../../middleware/auth');
const TeachingStyle = require('../../models/TeachingStyle');
const StyleRecommenderService = require('../../services/styleRecommender');

// モックの設定
jest.mock('../../middleware/auth');
jest.mock('../../models/TeachingStyle');
jest.mock('../../services/styleRecommender');

// Expressアプリケーションの設定
const app = express();
app.use(express.json());
app.use('/api/teaching-styles', teachingStyleRoutes);

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message
    }
  });
});

describe('Teaching Style Routes', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      profile: { name: 'Test User' }
    };

    // 認証ミドルウェアのモック
    protect.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });
  });

  describe('GET /api/teaching-styles', () => {
    const mockStyles = [
      {
        _id: '1',
        name: 'structured-facilitator',
        displayName: '構造化ファシリテーター型',
        compatibility: {
          subjects: ['数学', '理科'],
          personalityTypes: ['INTJ', 'ISTJ']
        }
      },
      {
        _id: '2',
        name: 'creative-explorer',
        displayName: '創造的探求者型',
        compatibility: {
          subjects: ['美術', '音楽'],
          personalityTypes: ['ENTP', 'ENFP']
        }
      }
    ];

    it('全ての授業スタイルを取得できること', async () => {
      TeachingStyle.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockStyles)
            })
          })
        })
      });
      TeachingStyle.countDocuments.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/teaching-styles')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.styles).toHaveLength(2);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('教科でフィルタリングできること', async () => {
      TeachingStyle.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue([mockStyles[0]])
            })
          })
        })
      });
      TeachingStyle.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/teaching-styles?subject=数学')
        .expect(200);

      expect(TeachingStyle.find).toHaveBeenCalledWith({
        'compatibility.subjects': '数学'
      });
    });

    it('ページネーションが動作すること', async () => {
      TeachingStyle.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockStyles.slice(0, 1))
            })
          })
        })
      });
      TeachingStyle.countDocuments.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/teaching-styles?page=2&limit=1')
        .expect(200);

      expect(res.body.data.pagination.page).toBe(2);
      expect(res.body.data.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/teaching-styles/recommendations/:diagnosisId', () => {
    const mockRecommendations = [
      {
        _id: '1',
        name: 'analytical-coach',
        displayName: '分析的コーチ型',
        recommendationScore: 85,
        matchingReasons: ['INTJタイプに特に適したスタイルです']
      }
    ];

    it('診断結果に基づく推奨を取得できること', async () => {
      StyleRecommenderService.recommendByDiagnosisId.mockResolvedValue(mockRecommendations);

      const res = await request(app)
        .get('/api/teaching-styles/recommendations/507f1f77bcf86cd799439011')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toEqual(mockRecommendations);
      expect(StyleRecommenderService.recommendByDiagnosisId).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          userId: mockUser._id
        })
      );
    });

    it('認証なしでアクセスできないこと', async () => {
      protect.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, error: { message: '認証が必要です' } });
      });

      await request(app)
        .get('/api/teaching-styles/recommendations/507f1f77bcf86cd799439011')
        .expect(401);
    });

    it('無効な診断IDでエラーを返すこと', async () => {
      await request(app)
        .get('/api/teaching-styles/recommendations/invalid-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('GET /api/teaching-styles/recommendations/personality/:personalityType', () => {
    const mockRecommendations = [
      {
        _id: '1',
        name: 'structured-facilitator',
        recommendationScore: 90,
        matchingReasons: ['INTJタイプに特に適したスタイルです']
      }
    ];

    it('パーソナリティタイプ別推奨を取得できること', async () => {
      StyleRecommenderService.recommendByPersonalityType.mockResolvedValue(mockRecommendations);

      const res = await request(app)
        .get('/api/teaching-styles/recommendations/personality/intj')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.personalityType).toBe('INTJ');
      expect(StyleRecommenderService.recommendByPersonalityType).toHaveBeenCalledWith(
        'INTJ',
        expect.any(Object)
      );
    });
  });

  describe('POST /api/teaching-styles/compare', () => {
    const mockComparison = {
      comparison: [
        { styleId: '1', recommendationScore: 85 },
        { styleId: '2', recommendationScore: 70 }
      ],
      bestMatch: { styleId: '1', recommendationScore: 85 },
      analysis: {
        summary: '構造化ファシリテーター型が最も推奨されます',
        recommendations: []
      }
    };

    it('スタイル比較ができること', async () => {
      StyleRecommenderService.compareStyles.mockResolvedValue(mockComparison);

      const res = await request(app)
        .post('/api/teaching-styles/compare')
        .set('Authorization', 'Bearer valid-token')
        .send({
          styleIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
          personalityType: 'INTJ'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockComparison);
    });

    it('無効なリクエストでエラーを返すこと', async () => {
      const res = await request(app)
        .post('/api/teaching-styles/compare')
        .set('Authorization', 'Bearer valid-token')
        .send({
          styleIds: ['1'], // 少なすぎる
          personalityType: 'INVALID'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/teaching-styles/:id', () => {
    const mockStyle = {
      _id: '507f1f77bcf86cd799439011',
      name: 'structured-facilitator',
      displayName: '構造化ファシリテーター型',
      description: '明確な枠組みで主体的学習を促進'
    };

    it('特定のスタイルを取得できること', async () => {
      TeachingStyle.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockStyle)
      });

      const res = await request(app)
        .get('/api/teaching-styles/507f1f77bcf86cd799439011')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockStyle);
    });

    it('存在しないスタイルで404を返すこと', async () => {
      TeachingStyle.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .get('/api/teaching-styles/507f1f77bcf86cd799439011')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('授業スタイルが見つかりません');
    });
  });

  describe('POST /api/teaching-styles/:id/feedback', () => {
    const mockStyle = {
      _id: '507f1f77bcf86cd799439011',
      feedback: [],
      usageStats: {
        averageRating: 0,
        totalFeedback: 0,
        adoptionRate: 0
      },
      save: jest.fn()
    };

    it('フィードバックを送信できること', async () => {
      TeachingStyle.findById.mockResolvedValue(mockStyle);
      mockStyle.save.mockResolvedValue(mockStyle);

      const res = await request(app)
        .post('/api/teaching-styles/507f1f77bcf86cd799439011/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({
          rating: 5,
          effectiveness: 'very_effective',
          comment: '非常に効果的でした'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('フィードバックを送信しました');
      expect(mockStyle.save).toHaveBeenCalled();
    });

    it('無効な評価でエラーを返すこと', async () => {
      await request(app)
        .post('/api/teaching-styles/507f1f77bcf86cd799439011/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({
          rating: 6, // 無効
          effectiveness: 'very_effective'
        })
        .expect(400);
    });
  });

  describe('GET /api/teaching-styles/stats/popular', () => {
    const mockPopularStyles = [
      {
        name: 'structured-facilitator',
        displayName: '構造化ファシリテーター型',
        usageStats: {
          averageRating: 4.8,
          adoptionRate: 0.85
        }
      }
    ];

    it('人気のスタイルを取得できること', async () => {
      TeachingStyle.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockPopularStyles)
          })
        })
      });

      const res = await request(app)
        .get('/api/teaching-styles/stats/popular')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.styles).toEqual(mockPopularStyles);
    });
  });

  describe('GET /api/teaching-styles/stats/by-personality', () => {
    const mockStyles = [
      {
        compatibility: { personalityTypes: ['INTJ', 'ISTJ'] },
        usageStats: { averageRating: 4.5, adoptionRate: 0.8 }
      },
      {
        compatibility: { personalityTypes: ['INTJ'] },
        usageStats: { averageRating: 4.3, adoptionRate: 0.7 }
      }
    ];

    it('パーソナリティタイプ別統計を取得できること', async () => {
      TeachingStyle.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockStyles)
      });

      const res = await request(app)
        .get('/api/teaching-styles/stats/by-personality')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.INTJ).toBeDefined();
      expect(res.body.data.INTJ.count).toBe(2);
    });
  });
});