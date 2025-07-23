const StyleRecommenderService = require('../../services/styleRecommender');
const TeachingStyle = require('../../models/TeachingStyle');
const Diagnosis = require('../../models/Diagnosis');
const { AppError } = require('../../middleware/errorHandler');
const mongoose = require('mongoose');

// モックの設定
jest.mock('../../models/TeachingStyle');
jest.mock('../../models/Diagnosis');

describe('StyleRecommenderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recommendByPersonalityType', () => {
    const mockStyles = [
      {
        _id: '1',
        name: 'structured-facilitator',
        displayName: '構造化ファシリテーター型',
        characteristics: ['structured', 'organized', 'clear'],
        methods: ['step-by-step', 'framework-based'],
        compatibility: {
          personalityTypes: ['INTJ', 'ISTJ'],
          subjects: ['数学', '理科'],
          recommendationScore: 85
        },
        usageStats: {
          averageRating: 4.5,
          adoptionRate: 0.75
        },
        toObject: function() { return this; }
      },
      {
        _id: '2',
        name: 'creative-explorer',
        displayName: '創造的探求者型',
        characteristics: ['creative', 'flexible', 'innovative'],
        methods: ['discovery-based', 'project-based'],
        compatibility: {
          personalityTypes: ['ENTP', 'ENFP'],
          subjects: ['美術', '音楽'],
          recommendationScore: 80
        },
        usageStats: {
          averageRating: 4.3,
          adoptionRate: 0.65
        },
        toObject: function() { return this; }
      }
    ];

    it('推奨スタイルを正しく返すこと', async () => {
      TeachingStyle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockStyles)
        })
      });

      const result = await StyleRecommenderService.recommendByPersonalityType('INTJ');

      expect(TeachingStyle.find).toHaveBeenCalledWith({
        'compatibility.personalityTypes': 'INTJ'
      });
      expect(result).toHaveLength(2);
      expect(result[0].recommendationScore).toBeDefined();
      expect(result[0].matchingReasons).toBeDefined();
    });

    it('教科でフィルタリングできること', async () => {
      TeachingStyle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockStyles[0]])
        })
      });

      await StyleRecommenderService.recommendByPersonalityType('INTJ', { subject: '数学' });

      expect(TeachingStyle.find).toHaveBeenCalledWith({
        'compatibility.personalityTypes': 'INTJ',
        'compatibility.subjects': '数学'
      });
    });

    it('無効なパーソナリティタイプでエラーを投げること', async () => {
      await expect(
        StyleRecommenderService.recommendByPersonalityType('INVALID')
      ).rejects.toThrow(AppError);
    });

    it('推奨スコアを正しく計算すること', async () => {
      TeachingStyle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockStyles)
        })
      });

      const result = await StyleRecommenderService.recommendByPersonalityType('INTJ');
      
      // INTJに適したスタイルが高スコア
      expect(result[0].name).toBe('structured-facilitator');
      expect(result[0].recommendationScore).toBeGreaterThan(50);
    });

    it('マッチング理由を生成すること', async () => {
      TeachingStyle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockStyles[0]])
        })
      });

      const result = await StyleRecommenderService.recommendByPersonalityType('INTJ');
      
      expect(result[0].matchingReasons).toContain('INTJタイプに特に適したスタイルです');
      expect(result[0].matchingReasons.length).toBeGreaterThan(0);
    });
  });

  describe('recommendByDiagnosisId', () => {
    const mockDiagnosis = {
      _id: new mongoose.Types.ObjectId(),
      result: {
        personalityType: 'INTJ',
        scores: {
          extroversion: 30,
          sensing: 40,
          thinking: 75,
          judging: 80
        }
      }
    };

    it('診断結果に基づいて推奨を返すこと', async () => {
      Diagnosis.findById.mockResolvedValue(mockDiagnosis);
      
      const mockStyles = [{
        name: 'analytical-coach',
        displayName: '分析的コーチ型',
        characteristics: ['analytical', 'logical', 'structured'],
        methods: ['data-driven', 'evidence-based'],
        compatibility: {
          personalityTypes: ['INTJ', 'INTP'],
          subjects: ['数学', '科学']
        },
        matchingReasons: ['INTJタイプに特に適したスタイルです'],
        recommendationScore: 80,
        toObject: function() { return this; }
      }];

      TeachingStyle.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockStyles)
        })
      });

      const result = await StyleRecommenderService.recommendByDiagnosisId(
        mockDiagnosis._id.toString()
      );

      expect(Diagnosis.findById).toHaveBeenCalledWith(mockDiagnosis._id.toString());
      expect(result).toBeDefined();
      expect(result[0].matchingReasons).toContain('論理的思考力を活かした分析的な指導が可能です');
    });

    it('診断が見つからない場合エラーを投げること', async () => {
      Diagnosis.findById.mockResolvedValue(null);

      await expect(
        StyleRecommenderService.recommendByDiagnosisId('invalid-id')
      ).rejects.toThrow('診断結果が見つかりません');
    });

    it('診断が未完了の場合エラーを投げること', async () => {
      Diagnosis.findById.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        result: null
      });

      await expect(
        StyleRecommenderService.recommendByDiagnosisId('test-id')
      ).rejects.toThrow('診断が完了していません');
    });
  });

  describe('compareStyles', () => {
    const mockStyles = [
      {
        _id: '1',
        name: 'structured-facilitator',
        displayName: '構造化ファシリテーター型',
        characteristics: ['structured', 'organized', 'clear'],
        compatibility: {
          personalityTypes: ['INTJ', 'ISTJ'],
          subjects: ['数学', '理科']
        }
      },
      {
        _id: '2',
        name: 'creative-explorer',
        displayName: '創造的探求者型',
        characteristics: ['creative', 'flexible', 'innovative'],
        compatibility: {
          personalityTypes: ['ENTP', 'ENFP'],
          subjects: ['美術', '音楽']
        }
      }
    ];

    it('スタイルを比較して結果を返すこと', async () => {
      TeachingStyle.find.mockResolvedValue(mockStyles);

      const result = await StyleRecommenderService.compareStyles(['1', '2'], 'INTJ');

      expect(result.comparison).toHaveLength(2);
      expect(result.bestMatch).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.summary).toBeDefined();
      expect(result.analysis.recommendations).toBeDefined();
    });

    it('スタイルが見つからない場合エラーを投げること', async () => {
      TeachingStyle.find.mockResolvedValue([mockStyles[0]]);

      await expect(
        StyleRecommenderService.compareStyles(['1', '2', '3'], 'INTJ')
      ).rejects.toThrow('一部のスタイルが見つかりません');
    });

    it('スコア差に基づいて適切な分析を生成すること', async () => {
      TeachingStyle.find.mockResolvedValue(mockStyles);

      const result = await StyleRecommenderService.compareStyles(['1', '2'], 'INTJ');

      // INTJには構造化ファシリテーター型が適している
      expect(result.bestMatch.name).toBe('structured-facilitator');
      expect(result.analysis.summary).toContain('構造化ファシリテーター型');
    });
  });

  describe('プライベートメソッド', () => {
    it('calculateRecommendationScoreが正しく動作すること', () => {
      const style = {
        characteristics: ['analytical', 'structured', 'logical'],
        methods: ['data-driven', 'systematic'],
        compatibility: {
          personalityTypes: ['INTJ'],
          subjects: ['数学']
        },
        usageStats: {
          averageRating: 4.6,
          adoptionRate: 0.8
        }
      };

      const score = StyleRecommenderService.calculateRecommendationScore(
        style,
        'INTJ',
        { subject: '数学' }
      );

      expect(score).toBeGreaterThan(80); // 高いマッチングスコア
      expect(score).toBeLessThanOrEqual(100);
    });

    it('generateMatchingReasonsが適切な理由を生成すること', () => {
      const style = {
        characteristics: ['分析力', '戦略的思考'],
        compatibility: {
          personalityTypes: ['INTJ']
        },
        benefits: ['感情面の配慮を改善'],
        usageStats: {
          averageRating: 4.7
        }
      };

      const reasons = StyleRecommenderService.generateMatchingReasons(style, 'INTJ');

      expect(reasons).toContain('INTJタイプに特に適したスタイルです');
      expect(reasons).toContain('あなたの強み（分析力、戦略的思考）を活かせます');
      expect(reasons).toContain('多くの教員から高い評価を得ています');
    });
  });
});