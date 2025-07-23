const { PERSONALITY_TYPES, QUESTION_CATEGORIES } = require('../utils/constants');

class DiagnosisEngine {
  constructor() {
    this.threshold = 60; // スコアの閾値（%）
  }

  /**
   * 診断結果を計算
   * @param {Array} answers - 回答データの配列
   * @returns {Object} 診断結果
   */
  calculateResult(answers) {
    // カテゴリー別スコアを計算
    const categoryScores = this.calculateCategoryScores(answers);
    
    // MBTIタイプを判定
    const personalityType = this.determinePersonalityType(categoryScores);
    
    // 強みと課題を特定
    const { strengths, challenges } = this.identifyStrengthsAndChallenges(personalityType);
    
    return {
      personalityType,
      scores: categoryScores,
      strengths,
      challenges
    };
  }

  /**
   * カテゴリー別スコアを計算
   * @param {Array} answers - 回答データの配列
   * @returns {Object} カテゴリー別スコア
   */
  calculateCategoryScores(answers) {
    const categoryAnswers = {
      [QUESTION_CATEGORIES.EXTROVERSION]: [],
      [QUESTION_CATEGORIES.SENSING]: [],
      [QUESTION_CATEGORIES.THINKING]: [],
      [QUESTION_CATEGORIES.JUDGING]: []
    };

    // 回答をカテゴリー別に分類
    answers.forEach(answer => {
      if (categoryAnswers[answer.category]) {
        categoryAnswers[answer.category].push(answer.answer);
      }
    });

    // 各カテゴリーのスコアを計算（パーセンテージ）
    const scores = {};
    Object.keys(categoryAnswers).forEach(category => {
      const answers = categoryAnswers[category];
      if (answers.length > 0) {
        const sum = answers.reduce((acc, val) => acc + val, 0);
        const average = sum / answers.length;
        scores[category] = Math.round((average / 5) * 100);
      } else {
        scores[category] = 50; // デフォルト値
      }
    });

    return scores;
  }

  /**
   * MBTIパーソナリティタイプを判定
   * @param {Object} scores - カテゴリー別スコア
   * @returns {String} パーソナリティタイプ
   */
  determinePersonalityType(scores) {
    let type = '';

    // E/I (外向性/内向性)
    type += scores[QUESTION_CATEGORIES.EXTROVERSION] >= this.threshold ? 'E' : 'I';

    // S/N (感覚/直観)
    type += scores[QUESTION_CATEGORIES.SENSING] >= this.threshold ? 'S' : 'N';

    // T/F (思考/感情)
    type += scores[QUESTION_CATEGORIES.THINKING] >= this.threshold ? 'T' : 'F';

    // J/P (判断/知覚)
    type += scores[QUESTION_CATEGORIES.JUDGING] >= this.threshold ? 'J' : 'P';

    return type;
  }

  /**
   * パーソナリティタイプに基づく強みと課題を特定
   * @param {String} personalityType - MBTIタイプ
   * @returns {Object} 強みと課題
   */
  identifyStrengthsAndChallenges(personalityType) {
    const profiles = {
      'ISTJ': {
        strengths: [
          '計画的で組織的な授業運営',
          '明確な評価基準の設定と公平な評価',
          '基礎から応用への体系的な指導',
          '時間管理と締切の遵守'
        ],
        challenges: [
          '柔軟性に欠ける場合がある',
          '創造的なアプローチへの抵抗',
          '生徒の感情面への配慮不足',
          '変化への適応に時間がかかる'
        ]
      },
      'ISFJ': {
        strengths: [
          '生徒一人ひとりへの細やかな配慮',
          '協力的で温かいクラス環境の構築',
          '実践的で具体的な指導',
          '生徒の成長を忍耐強くサポート'
        ],
        challenges: [
          '自己主張が弱い傾向',
          '革新的な方法への消極性',
          '批判的フィードバックの提供が苦手',
          '自己犠牲的になりがち'
        ]
      },
      'INFJ': {
        strengths: [
          '生徒の可能性を見出す洞察力',
          '創造的で意味のある学習体験の設計',
          '個別のニーズに応じた指導',
          '長期的な成長を見据えた教育'
        ],
        challenges: [
          '理想主義的すぎる場合がある',
          '詳細な事務作業への苦手意識',
          '完璧主義によるストレス',
          '大人数のクラス管理の困難'
        ]
      },
      'INTJ': {
        strengths: [
          '革新的な教育方法の開発',
          '論理的で体系的なカリキュラム設計',
          '高い学習目標の設定と達成',
          '批判的思考力の育成'
        ],
        challenges: [
          '感情的なサポートの不足',
          '柔軟性に欠ける場合がある',
          '生徒との距離感',
          '協働作業への消極性'
        ]
      },
      'ISTP': {
        strengths: [
          '実践的で体験的な学習の提供',
          '問題解決能力の育成',
          '効率的な指導方法',
          '技術的スキルの指導'
        ],
        challenges: [
          '感情表現の少なさ',
          '長期計画の立案が苦手',
          '理論的説明の不足',
          '生徒との感情的つながりの構築'
        ]
      },
      'ISFP': {
        strengths: [
          '生徒の個性を尊重する指導',
          '芸術的・創造的な活動の促進',
          '柔軟で適応的な教育アプローチ',
          '実践的なスキルの指導'
        ],
        challenges: [
          '構造化された指導の不足',
          '批判や対立の回避',
          '長期的な計画性の欠如',
          '大規模なクラス管理'
        ]
      },
      'INFP': {
        strengths: [
          '生徒の内面的成長への深い理解',
          '創造性と個性の育成',
          '情熱的で意味のある学習体験',
          '価値観に基づいた教育'
        ],
        challenges: [
          '客観的評価の困難',
          '組織的な側面への苦手意識',
          '批判に対する過敏性',
          '現実的な制約への対処'
        ]
      },
      'INTP': {
        strengths: [
          '論理的思考と分析力の育成',
          '知的好奇心の刺激',
          '独創的な問題解決方法',
          '概念的理解の促進'
        ],
        challenges: [
          '感情的なニーズへの鈍感さ',
          '実践的応用の軽視',
          '締切や規則への無頓着',
          '対人関係の構築'
        ]
      },
      'ESTP': {
        strengths: [
          '活動的で実践的な授業展開',
          '即興的な対応力',
          '競争的要素を活用した動機付け',
          '現実的な問題解決'
        ],
        challenges: [
          '長期的な計画の不足',
          '理論的内容への関心の低さ',
          '衝動的な決定',
          '感情的な深さの欠如'
        ]
      },
      'ESFP': {
        strengths: [
          '楽しく魅力的な学習環境',
          '生徒との親密な関係構築',
          '実践的で体験的な学習',
          '柔軟で適応的な指導'
        ],
        challenges: [
          '学問的厳密さの不足',
          '長期的な計画性',
          '批判的思考の指導',
          '抽象的概念の説明'
        ]
      },
      'ENFP': {
        strengths: [
          '熱意と創造性あふれる授業',
          '生徒のモチベーション向上',
          '多様な学習方法の活用',
          '個人の成長への深い関心'
        ],
        challenges: [
          '一貫性の欠如',
          '詳細への注意不足',
          '時間管理の問題',
          '現実的制約への対処'
        ]
      },
      'ENTP': {
        strengths: [
          '革新的な教育方法の探求',
          '議論と批判的思考の促進',
          '知的刺激に富んだ授業',
          '柔軟で創造的な問題解決'
        ],
        challenges: [
          'ルーティンワークへの抵抗',
          '感情的配慮の不足',
          '一貫性のある評価',
          '詳細な記録管理'
        ]
      },
      'ESTJ': {
        strengths: [
          '効率的なクラス運営',
          '明確な目標設定と達成',
          'リーダーシップと規律',
          '実践的な成果重視'
        ],
        challenges: [
          '柔軟性の欠如',
          '創造性への理解不足',
          '感情的ニーズへの鈍感さ',
          '個人差への配慮'
        ]
      },
      'ESFJ': {
        strengths: [
          '協力的なクラス環境の構築',
          '生徒の社会性の育成',
          '組織的で構造化された指導',
          '伝統的価値観の伝達'
        ],
        challenges: [
          '革新への抵抗',
          '批判的思考の促進',
          '個人のニーズと集団の調和',
          '変化への適応'
        ]
      },
      'ENFJ': {
        strengths: [
          'カリスマ的なリーダーシップ',
          '生徒の可能性を引き出す',
          '協働学習の促進',
          '情熱的で意味のある教育'
        ],
        challenges: [
          '過度な理想主義',
          '自己犠牲的傾向',
          '批判への過敏性',
          '客観的評価の困難'
        ]
      },
      'ENTJ': {
        strengths: [
          '戦略的な教育計画',
          '高い目標設定と達成',
          'リーダーシップの育成',
          '効率的な学習システム'
        ],
        challenges: [
          '感情的配慮の不足',
          '威圧的になる可能性',
          '個人のペースへの理解',
          '協調性より競争重視'
        ]
      }
    };

    return profiles[personalityType] || {
      strengths: ['診断結果に基づく強みの特定'],
      challenges: ['診断結果に基づく課題の特定']
    };
  }

  /**
   * 推奨される授業スタイルを取得
   * @param {String} personalityType - MBTIタイプ
   * @returns {Array} 推奨スタイルのリスト
   */
  getRecommendedStyles(personalityType) {
    const styleMapping = {
      'ISTJ': ['systematic-instructor', 'structured-facilitator'],
      'ISFJ': ['empathetic-mentor', 'systematic-instructor'],
      'INFJ': ['empathetic-mentor', 'creative-explorer'],
      'INTJ': ['analytical-coach', 'systematic-instructor'],
      'ISTP': ['practical-demonstrator', 'analytical-coach'],
      'ISFP': ['empathetic-mentor', 'creative-explorer'],
      'INFP': ['creative-explorer', 'empathetic-mentor'],
      'INTP': ['analytical-coach', 'creative-explorer'],
      'ESTP': ['dynamic-performer', 'practical-demonstrator'],
      'ESFP': ['dynamic-performer', 'collaborative-organizer'],
      'ENFP': ['creative-explorer', 'dynamic-performer'],
      'ENTP': ['creative-explorer', 'analytical-coach'],
      'ESTJ': ['structured-facilitator', 'systematic-instructor'],
      'ESFJ': ['collaborative-organizer', 'structured-facilitator'],
      'ENFJ': ['collaborative-organizer', 'empathetic-mentor'],
      'ENTJ': ['structured-facilitator', 'analytical-coach']
    };

    return styleMapping[personalityType] || ['structured-facilitator'];
  }

  /**
   * スコアの信頼性を検証
   * @param {Array} answers - 回答データの配列
   * @returns {Object} 信頼性指標
   */
  validateReliability(answers) {
    // 回答の一貫性をチェック
    const consistency = this.checkConsistency(answers);
    
    // 回答時間の妥当性をチェック
    const timeValidity = this.checkTimeValidity(answers);
    
    // 回答パターンの分析
    const patternAnalysis = this.analyzeAnswerPatterns(answers);
    
    return {
      isReliable: consistency.score > 0.7 && timeValidity.isValid,
      consistency,
      timeValidity,
      patternAnalysis
    };
  }

  /**
   * 回答の一貫性をチェック
   * @param {Array} answers - 回答データの配列
   * @returns {Object} 一貫性スコア
   */
  checkConsistency(answers) {
    // カテゴリー内の回答のばらつきを計算
    const categoryVariances = {};
    const categories = Object.values(QUESTION_CATEGORIES);
    
    categories.forEach(category => {
      const categoryAnswers = answers.filter(a => a.category === category);
      if (categoryAnswers.length > 1) {
        const values = categoryAnswers.map(a => a.answer);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        categoryVariances[category] = variance;
      }
    });
    
    // 全体の一貫性スコアを計算（分散が小さいほど一貫性が高い）
    const avgVariance = Object.values(categoryVariances).reduce((sum, v) => sum + v, 0) / Object.values(categoryVariances).length;
    const consistencyScore = Math.max(0, 1 - (avgVariance / 4)); // 最大分散4で正規化
    
    return {
      score: consistencyScore,
      categoryVariances,
      interpretation: consistencyScore > 0.7 ? '高い一貫性' : '低い一貫性'
    };
  }

  /**
   * 回答時間の妥当性をチェック
   * @param {Array} answers - 回答データの配列
   * @returns {Object} 時間の妥当性
   */
  checkTimeValidity(answers) {
    if (!answers.length) return { isValid: false, reason: '回答がありません' };
    
    // 回答間隔を計算
    const intervals = [];
    for (let i = 1; i < answers.length; i++) {
      const interval = new Date(answers[i].timestamp) - new Date(answers[i-1].timestamp);
      intervals.push(interval);
    }
    
    // 平均回答時間（ミリ秒）
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    
    // 妥当性チェック（1秒未満または5分以上は異常）
    const isValid = avgInterval >= 1000 && avgInterval <= 300000;
    
    return {
      isValid,
      averageIntervalSeconds: avgInterval / 1000,
      reason: isValid ? '正常な回答速度' : '回答速度が異常です'
    };
  }

  /**
   * 回答パターンの分析
   * @param {Array} answers - 回答データの配列
   * @returns {Object} パターン分析結果
   */
  analyzeAnswerPatterns(answers) {
    const values = answers.map(a => a.answer);
    
    // 同じ値の連続をカウント
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    for (let i = 1; i < values.length; i++) {
      if (values[i] === values[i-1]) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    
    // 回答の分布
    const distribution = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = values.filter(v => v === i).length;
    }
    
    // 極端な回答の割合
    const extremeAnswers = values.filter(v => v === 1 || v === 5).length;
    const extremeRatio = extremeAnswers / values.length;
    
    return {
      maxConsecutiveSameAnswer: maxConsecutive,
      distribution,
      extremeRatio,
      isNormal: maxConsecutive < 5 && extremeRatio < 0.8
    };
  }
}

module.exports = new DiagnosisEngine();