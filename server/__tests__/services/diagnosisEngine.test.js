const diagnosisEngine = require('../../services/diagnosisEngine');

describe('DiagnosisEngine Service Test', () => {
  describe('calculateResult', () => {
    it('should calculate INTJ personality type correctly', () => {
      const answers = [
        // 内向的 (I)
        { questionId: 'E1', category: 'extroversion', answer: 2 },
        { questionId: 'E2', category: 'extroversion', answer: 2 },
        { questionId: 'E3', category: 'extroversion', answer: 1 },
        // 直観的 (N)
        { questionId: 'S1', category: 'sensing', answer: 2 },
        { questionId: 'S2', category: 'sensing', answer: 2 },
        { questionId: 'S3', category: 'sensing', answer: 1 },
        // 思考的 (T)
        { questionId: 'T1', category: 'thinking', answer: 5 },
        { questionId: 'T2', category: 'thinking', answer: 4 },
        { questionId: 'T3', category: 'thinking', answer: 5 },
        // 判断的 (J)
        { questionId: 'J1', category: 'judging', answer: 5 },
        { questionId: 'J2', category: 'judging', answer: 4 },
        { questionId: 'J3', category: 'judging', answer: 5 }
      ];

      const result = diagnosisEngine.calculateResult(answers);

      expect(result.personalityType).toBe('INTJ');
      expect(result.scores.extroversion).toBeLessThan(60);
      expect(result.scores.sensing).toBeLessThan(60);
      expect(result.scores.thinking).toBeGreaterThanOrEqual(60);
      expect(result.scores.judging).toBeGreaterThanOrEqual(60);
      expect(result.strengths).toContain('革新的な教育方法の開発');
      expect(result.challenges).toContain('感情的なサポートの不足');
    });

    it('should calculate ESFP personality type correctly', () => {
      const answers = [
        // 外向的 (E)
        { questionId: 'E1', category: 'extroversion', answer: 5 },
        { questionId: 'E2', category: 'extroversion', answer: 4 },
        // 感覚的 (S)
        { questionId: 'S1', category: 'sensing', answer: 5 },
        { questionId: 'S2', category: 'sensing', answer: 4 },
        // 感情的 (F)
        { questionId: 'T1', category: 'thinking', answer: 2 },
        { questionId: 'T2', category: 'thinking', answer: 1 },
        // 知覚的 (P)
        { questionId: 'J1', category: 'judging', answer: 2 },
        { questionId: 'J2', category: 'judging', answer: 2 }
      ];

      const result = diagnosisEngine.calculateResult(answers);

      expect(result.personalityType).toBe('ESFP');
      expect(result.scores.extroversion).toBeGreaterThanOrEqual(60);
      expect(result.scores.sensing).toBeGreaterThanOrEqual(60);
      expect(result.scores.thinking).toBeLessThan(60);
      expect(result.scores.judging).toBeLessThan(60);
    });
  });

  describe('calculateCategoryScores', () => {
    it('should calculate scores correctly for each category', () => {
      const answers = [
        { category: 'extroversion', answer: 5 },
        { category: 'extroversion', answer: 4 },
        { category: 'extroversion', answer: 3 },
        { category: 'sensing', answer: 1 },
        { category: 'sensing', answer: 2 }
      ];

      const scores = diagnosisEngine.calculateCategoryScores(answers);

      expect(scores.extroversion).toBe(80); // (4/5) * 100
      expect(scores.sensing).toBe(30); // (1.5/5) * 100
      expect(scores.thinking).toBe(50); // デフォルト値
      expect(scores.judging).toBe(50); // デフォルト値
    });

    it('should handle empty answers', () => {
      const scores = diagnosisEngine.calculateCategoryScores([]);
      
      expect(scores.extroversion).toBe(50);
      expect(scores.sensing).toBe(50);
      expect(scores.thinking).toBe(50);
      expect(scores.judging).toBe(50);
    });
  });

  describe('getRecommendedStyles', () => {
    it('should return correct styles for INTJ', () => {
      const styles = diagnosisEngine.getRecommendedStyles('INTJ');
      
      expect(styles).toContain('analytical-coach');
      expect(styles).toContain('systematic-instructor');
      expect(styles.length).toBe(2);
    });

    it('should return correct styles for ENFP', () => {
      const styles = diagnosisEngine.getRecommendedStyles('ENFP');
      
      expect(styles).toContain('creative-explorer');
      expect(styles).toContain('dynamic-performer');
    });

    it('should return default style for unknown type', () => {
      const styles = diagnosisEngine.getRecommendedStyles('XXXX');
      
      expect(styles).toContain('structured-facilitator');
      expect(styles.length).toBe(1);
    });
  });

  describe('validateReliability', () => {
    it('should validate consistent answers as reliable', () => {
      const answers = [
        { category: 'extroversion', answer: 4, timestamp: new Date() },
        { category: 'extroversion', answer: 4, timestamp: new Date(Date.now() + 5000) },
        { category: 'extroversion', answer: 5, timestamp: new Date(Date.now() + 10000) },
        { category: 'sensing', answer: 3, timestamp: new Date(Date.now() + 15000) },
        { category: 'sensing', answer: 3, timestamp: new Date(Date.now() + 20000) }
      ];

      const reliability = diagnosisEngine.validateReliability(answers);
      
      expect(reliability.isReliable).toBe(true);
      expect(reliability.consistency.score).toBeGreaterThan(0.7);
      expect(reliability.timeValidity.isValid).toBe(true);
    });

    it('should detect pattern of same consecutive answers', () => {
      const answers = Array(10).fill(null).map((_, i) => ({
        category: 'extroversion',
        answer: 3, // すべて同じ回答
        timestamp: new Date(Date.now() + i * 5000)
      }));

      const reliability = diagnosisEngine.validateReliability(answers);
      
      expect(reliability.patternAnalysis.maxConsecutiveSameAnswer).toBe(10);
      expect(reliability.patternAnalysis.isNormal).toBe(false);
    });

    it('should detect too fast answering', () => {
      const answers = Array(5).fill(null).map((_, i) => ({
        category: 'extroversion',
        answer: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(Date.now() + i * 500) // 0.5秒間隔
      }));

      const reliability = diagnosisEngine.validateReliability(answers);
      
      expect(reliability.timeValidity.isValid).toBe(false);
      expect(reliability.timeValidity.reason).toContain('異常');
    });
  });

  describe('checkConsistency', () => {
    it('should calculate high consistency for similar answers', () => {
      const answers = [
        { category: 'extroversion', answer: 4 },
        { category: 'extroversion', answer: 4 },
        { category: 'extroversion', answer: 5 },
        { category: 'extroversion', answer: 4 }
      ];

      const consistency = diagnosisEngine.checkConsistency(answers);
      
      expect(consistency.score).toBeGreaterThan(0.7);
      expect(consistency.interpretation).toBe('高い一貫性');
    });

    it('should calculate low consistency for varied answers', () => {
      const answers = [
        { category: 'extroversion', answer: 1 },
        { category: 'extroversion', answer: 5 },
        { category: 'extroversion', answer: 1 },
        { category: 'extroversion', answer: 5 }
      ];

      const consistency = diagnosisEngine.checkConsistency(answers);
      
      expect(consistency.score).toBeLessThan(0.7);
      expect(consistency.interpretation).toBe('低い一貫性');
    });
  });

  describe('analyzeAnswerPatterns', () => {
    it('should detect extreme answer patterns', () => {
      const answers = [
        { answer: 1 },
        { answer: 5 },
        { answer: 1 },
        { answer: 5 },
        { answer: 1 }
      ];

      const analysis = diagnosisEngine.analyzeAnswerPatterns(answers);
      
      expect(analysis.extremeRatio).toBe(1.0);
      expect(analysis.isNormal).toBe(false);
    });

    it('should detect normal distribution', () => {
      const answers = [
        { answer: 2 },
        { answer: 3 },
        { answer: 4 },
        { answer: 3 },
        { answer: 3 },
        { answer: 4 }
      ];

      const analysis = diagnosisEngine.analyzeAnswerPatterns(answers);
      
      expect(analysis.extremeRatio).toBe(0);
      expect(analysis.isNormal).toBe(true);
      expect(analysis.distribution['3']).toBe(3);
    });
  });
});