const TeachingStyle = require('../models/TeachingStyle');
const Diagnosis = require('../models/Diagnosis');
const { AppError } = require('../middleware/errorHandler');
const { PERSONALITY_TYPES } = require('../utils/constants');

class StyleRecommenderService {
  /**
   * パーソナリティタイプに基づいて授業スタイルを推奨
   * @param {String} personalityType - MBTI型（例: INTJ）
   * @param {Object} options - フィルターオプション
   * @returns {Array} 推奨スタイルリスト
   */
  static async recommendByPersonalityType(personalityType, options = {}) {
    if (!personalityType || !PERSONALITY_TYPES[personalityType]) {
      throw new AppError('無効なパーソナリティタイプです', 400);
    }

    const { subject, gradeLevel, limit = 5 } = options;

    // 基本的な推奨スタイルを取得
    let query = { 'compatibility.personalityTypes': personalityType };
    
    if (subject) {
      query['compatibility.subjects'] = subject;
    }

    const styles = await TeachingStyle.find(query)
      .sort('-compatibility.recommendationScore')
      .limit(limit);

    // 推奨スコアを計算して付与
    const recommendedStyles = styles.map(style => {
      const score = this.calculateRecommendationScore(
        style,
        personalityType,
        { subject, gradeLevel }
      );
      
      return {
        ...style.toObject(),
        recommendationScore: score,
        matchingReasons: this.generateMatchingReasons(style, personalityType)
      };
    });

    // スコア順にソート
    return recommendedStyles.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * 診断結果に基づいて授業スタイルを推奨
   * @param {String} diagnosisId - 診断ID
   * @param {Object} options - フィルターオプション
   * @returns {Array} 推奨スタイルリスト
   */
  static async recommendByDiagnosisId(diagnosisId, options = {}) {
    const diagnosis = await Diagnosis.findById(diagnosisId);
    
    if (!diagnosis) {
      throw new AppError('診断結果が見つかりません', 404);
    }

    if (!diagnosis.result || !diagnosis.result.personalityType) {
      throw new AppError('診断が完了していません', 400);
    }

    // パーソナリティタイプに基づく推奨
    const styles = await this.recommendByPersonalityType(
      diagnosis.result.personalityType,
      options
    );

    // 診断スコアを考慮した詳細な推奨
    return this.enhanceRecommendationsWithDiagnosisData(styles, diagnosis);
  }

  /**
   * 推奨スコアを計算
   * @private
   */
  static calculateRecommendationScore(style, personalityType, options = {}) {
    let score = 0;

    // 基本的な互換性スコア
    const compatibility = style.compatibility;
    if (compatibility.personalityTypes.includes(personalityType)) {
      score += 50; // 基本マッチ
    }

    // パーソナリティタイプの特性とスタイルの特徴の一致度
    const typeInfo = PERSONALITY_TYPES[personalityType];
    if (typeInfo) {
      // 強みとの一致
      const strengthMatch = style.characteristics.filter(char => 
        typeInfo.strengths.some(strength => 
          char.toLowerCase().includes(strength.toLowerCase())
        )
      ).length;
      score += strengthMatch * 10;

      // 教授法との相性
      if (typeInfo.preferredMethods) {
        const methodMatch = style.methods.filter(method =>
          typeInfo.preferredMethods.some(preferred =>
            method.toLowerCase().includes(preferred.toLowerCase())
          )
        ).length;
        score += methodMatch * 15;
      }
    }

    // 教科の一致
    if (options.subject && compatibility.subjects.includes(options.subject)) {
      score += 20;
    }

    // 使用統計に基づくスコア調整
    if (style.usageStats) {
      // 平均評価
      if (style.usageStats.averageRating >= 4.5) {
        score += 15;
      } else if (style.usageStats.averageRating >= 4.0) {
        score += 10;
      }

      // 採用率
      if (style.usageStats.adoptionRate > 0.7) {
        score += 10;
      }
    }

    return Math.min(score, 100); // 最大100点
  }

  /**
   * マッチング理由を生成
   * @private
   */
  static generateMatchingReasons(style, personalityType) {
    const reasons = [];
    const typeInfo = PERSONALITY_TYPES[personalityType];

    if (!typeInfo) return reasons;

    // パーソナリティタイプとの直接的な相性
    if (style.compatibility.personalityTypes.includes(personalityType)) {
      reasons.push(`${personalityType}タイプに特に適したスタイルです`);
    }

    // 強みとの一致
    const matchingStrengths = typeInfo.strengths.filter(strength =>
      style.characteristics.some(char =>
        char.toLowerCase().includes(strength.toLowerCase())
      )
    );
    
    if (matchingStrengths.length > 0) {
      reasons.push(`あなたの強み（${matchingStrengths.join('、')}）を活かせます`);
    }

    // 課題への対応
    if (typeInfo.challenges) {
      const addressedChallenges = typeInfo.challenges.filter(challenge =>
        style.benefits.some(benefit =>
          benefit.toLowerCase().includes(challenge.toLowerCase())
        )
      );
      
      if (addressedChallenges.length > 0) {
        reasons.push(`課題（${addressedChallenges.join('、')}）の改善に役立ちます`);
      }
    }

    // 高評価
    if (style.usageStats && style.usageStats.averageRating >= 4.5) {
      reasons.push('多くの教員から高い評価を得ています');
    }

    return reasons;
  }

  /**
   * 診断データで推奨を強化
   * @private
   */
  static enhanceRecommendationsWithDiagnosisData(styles, diagnosis) {
    const { scores } = diagnosis.result;
    
    return styles.map(style => {
      const enhanced = { ...style };
      
      // 各スコアに基づく追加の推奨理由
      const additionalReasons = [];
      
      // 外向性スコアに基づく推奨
      if (scores.extroversion > 60 && style.characteristics.includes('interactive')) {
        additionalReasons.push('高い外向性を活かした対話的な授業が可能です');
        enhanced.recommendationScore += 5;
      }
      
      // 思考性スコアに基づく推奨
      if (scores.thinking > 60 && style.characteristics.includes('analytical')) {
        additionalReasons.push('論理的思考力を活かした分析的な指導が可能です');
        enhanced.recommendationScore += 5;
      }
      
      // 感覚性スコアに基づく推奨
      if (scores.sensing > 60 && style.characteristics.includes('practical')) {
        additionalReasons.push('実践的で具体的な指導アプローチに適しています');
        enhanced.recommendationScore += 5;
      }
      
      // 判断性スコアに基づく推奨
      if (scores.judging > 60 && style.characteristics.includes('structured')) {
        additionalReasons.push('計画的で構造化された授業運営が可能です');
        enhanced.recommendationScore += 5;
      }
      
      enhanced.matchingReasons = [
        ...enhanced.matchingReasons,
        ...additionalReasons
      ];
      
      return enhanced;
    });
  }

  /**
   * 複数のスタイルを比較
   * @param {Array} styleIds - 比較するスタイルIDの配列
   * @param {String} personalityType - パーソナリティタイプ
   * @returns {Object} 比較結果
   */
  static async compareStyles(styleIds, personalityType) {
    const styles = await TeachingStyle.find({ _id: { $in: styleIds } });
    
    if (styles.length !== styleIds.length) {
      throw new AppError('一部のスタイルが見つかりません', 404);
    }

    const comparison = styles.map(style => {
      const score = this.calculateRecommendationScore(style, personalityType);
      const reasons = this.generateMatchingReasons(style, personalityType);
      
      return {
        styleId: style._id,
        name: style.name,
        displayName: style.displayName,
        recommendationScore: score,
        matchingReasons: reasons,
        strengths: style.characteristics.slice(0, 3),
        bestFor: style.compatibility.subjects.slice(0, 3)
      };
    });

    // スコア順にソート
    comparison.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return {
      comparison,
      bestMatch: comparison[0],
      analysis: this.generateComparisonAnalysis(comparison, personalityType)
    };
  }

  /**
   * 比較分析を生成
   * @private
   */
  static generateComparisonAnalysis(comparison, personalityType) {
    const analysis = {
      summary: '',
      recommendations: []
    };

    const bestMatch = comparison[0];
    const scoreDifference = comparison[0].recommendationScore - comparison[comparison.length - 1].recommendationScore;

    if (scoreDifference < 10) {
      analysis.summary = 'すべてのスタイルがあなたのパーソナリティタイプに適しています。状況や目的に応じて使い分けることをお勧めします。';
    } else if (scoreDifference < 20) {
      analysis.summary = `${bestMatch.displayName}が最も推奨されますが、他のスタイルも十分に効果的です。`;
    } else {
      analysis.summary = `${bestMatch.displayName}があなたのパーソナリティタイプに最も適しています。`;
    }

    // 具体的な推奨事項
    comparison.forEach((style, index) => {
      if (index < 3) { // 上位3つ
        analysis.recommendations.push({
          style: style.displayName,
          when: this.generateUsageSuggestion(style, personalityType),
          benefit: style.matchingReasons[0] || '効果的な授業運営が可能です'
        });
      }
    });

    return analysis;
  }

  /**
   * 使用場面の提案を生成
   * @private
   */
  static generateUsageSuggestion(style, personalityType) {
    const suggestions = {
      'structured-facilitator': '新しい概念を体系的に教える際',
      'creative-explorer': '生徒の創造性を引き出したい時',
      'systematic-instructor': '基礎知識を確実に定着させたい時',
      'empathetic-mentor': '個別の学習支援が必要な場面',
      'dynamic-demonstrator': '生徒の興味を引きつけたい時',
      'analytical-coach': 'データに基づいた指導を行う際',
      'collaborative-organizer': 'グループ学習を促進したい時',
      'practical-demonstrator': '実践的なスキルを教える際'
    };

    return suggestions[style.name] || '様々な学習場面';
  }
}

module.exports = StyleRecommenderService;