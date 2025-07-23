const Diagnosis = require('../models/Diagnosis');
const TeachingStyle = require('../models/TeachingStyle');
const diagnosisEngine = require('./diagnosisEngine');
const questionsData = require('../data/diagnosisQuestions.json');
const { AppError } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../utils/constants');

class DiagnosisService {
  /**
   * 診断質問を取得
   * @param {String} category - 特定カテゴリーの質問のみ取得（オプション）
   * @returns {Object} 質問データ
   */
  async getQuestions(category = null) {
    try {
      let questions = questionsData.questions;
      
      // カテゴリーでフィルタリング
      if (category) {
        questions = questions.filter(q => q.category === category);
      }
      
      // 質問をシャッフル（オプション）
      // questions = this.shuffleArray(questions);
      
      return {
        questions,
        totalQuestions: questions.length,
        categories: [...new Set(questions.map(q => q.category))],
        scoring: questionsData.scoring
      };
    } catch (error) {
      throw new AppError('質問データの取得に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 診断セッションを開始
   * @param {String} userId - ユーザーID
   * @param {Object} deviceInfo - デバイス情報
   * @returns {Object} 新しい診断セッション
   */
  async startDiagnosis(userId, deviceInfo = {}) {
    try {
      // 既存の未完了診断をチェック
      const incompleteDiagnosis = await Diagnosis.findOne({
        userId,
        status: 'in_progress'
      });
      
      if (incompleteDiagnosis) {
        // 既存のセッションを放棄済みに変更
        incompleteDiagnosis.status = 'abandoned';
        await incompleteDiagnosis.save();
      }
      
      // 新しい診断セッションを作成
      const diagnosis = await Diagnosis.create({
        userId,
        questions: [],
        sessionData: {
          startTime: new Date(),
          completionTime: new Date(),
          duration: 0,
          deviceInfo
        },
        status: 'in_progress'
      });
      
      return {
        diagnosisId: diagnosis._id,
        status: diagnosis.status,
        startTime: diagnosis.sessionData.startTime
      };
    } catch (error) {
      throw new AppError('診断の開始に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 回答を保存
   * @param {String} diagnosisId - 診断ID
   * @param {String} userId - ユーザーID
   * @param {Object} answerData - 回答データ
   * @returns {Object} 更新された診断
   */
  async saveAnswer(diagnosisId, userId, answerData) {
    try {
      const diagnosis = await Diagnosis.findOne({
        _id: diagnosisId,
        userId,
        status: 'in_progress'
      });
      
      if (!diagnosis) {
        throw new AppError('診断セッションが見つかりません', HTTP_STATUS.NOT_FOUND);
      }
      
      const { questionId, answer, category } = answerData;
      
      // 既存の回答を更新または新規追加
      const existingAnswerIndex = diagnosis.questions.findIndex(
        q => q.questionId === questionId
      );
      
      if (existingAnswerIndex >= 0) {
        // 既存の回答を更新
        diagnosis.questions[existingAnswerIndex] = {
          questionId,
          category,
          answer,
          timestamp: new Date()
        };
      } else {
        // 新しい回答を追加
        diagnosis.questions.push({
          questionId,
          category,
          answer,
          timestamp: new Date()
        });
      }
      
      await diagnosis.save();
      
      return {
        diagnosisId: diagnosis._id,
        answeredQuestions: diagnosis.questions.length,
        progressPercentage: diagnosis.progressPercentage
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('回答の保存に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 診断を完了して結果を計算
   * @param {String} diagnosisId - 診断ID
   * @param {String} userId - ユーザーID
   * @returns {Object} 診断結果
   */
  async submitDiagnosis(diagnosisId, userId) {
    try {
      const diagnosis = await Diagnosis.findOne({
        _id: diagnosisId,
        userId,
        status: 'in_progress'
      });
      
      if (!diagnosis) {
        throw new AppError('診断セッションが見つかりません', HTTP_STATUS.NOT_FOUND);
      }
      
      // 最小回答数のチェック（各カテゴリー最低5問）
      const categoryCount = {};
      diagnosis.questions.forEach(q => {
        categoryCount[q.category] = (categoryCount[q.category] || 0) + 1;
      });
      
      const minQuestionsPerCategory = 5;
      const insufficientCategories = Object.keys(categoryCount).filter(
        cat => categoryCount[cat] < minQuestionsPerCategory
      );
      
      if (insufficientCategories.length > 0 || Object.keys(categoryCount).length < 4) {
        throw new AppError(
          '各カテゴリーで最低5問以上回答する必要があります',
          HTTP_STATUS.BAD_REQUEST
        );
      }
      
      // 診断結果を計算
      const result = diagnosisEngine.calculateResult(diagnosis.questions);
      
      // 推奨スタイルを取得
      const recommendedStyleNames = diagnosisEngine.getRecommendedStyles(result.personalityType);
      const recommendedStyles = await TeachingStyle.find({
        name: { $in: recommendedStyleNames },
        isActive: true
      }).select('_id name displayName description characteristics');
      
      // 診断結果を保存
      diagnosis.result = {
        ...result,
        recommendedStyles: recommendedStyles.map(s => s._id)
      };
      diagnosis.status = 'completed';
      diagnosis.sessionData.completionTime = new Date();
      
      // 信頼性チェック
      const reliability = diagnosisEngine.validateReliability(diagnosis.questions);
      
      await diagnosis.save();
      
      // 推奨スタイルの詳細情報を含めて返す
      return {
        diagnosisId: diagnosis._id,
        result: {
          personalityType: result.personalityType,
          typeDescription: diagnosis.getPersonalityTypeDescription(),
          scores: result.scores,
          strengths: result.strengths,
          challenges: result.challenges,
          recommendedStyles: recommendedStyles.map(style => ({
            id: style._id,
            name: style.name,
            displayName: style.displayName,
            description: style.description,
            characteristics: style.characteristics.slice(0, 3)
          }))
        },
        reliability,
        completedAt: diagnosis.completedAt,
        duration: diagnosis.sessionData.duration
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('診断の完了処理に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 診断結果を取得
   * @param {String} diagnosisId - 診断ID
   * @param {String} userId - ユーザーID
   * @returns {Object} 診断結果
   */
  async getDiagnosisResult(diagnosisId, userId) {
    try {
      const diagnosis = await Diagnosis.findOne({
        _id: diagnosisId,
        userId
      }).populate('result.recommendedStyles', 'name displayName description characteristics');
      
      if (!diagnosis) {
        throw new AppError('診断結果が見つかりません', HTTP_STATUS.NOT_FOUND);
      }
      
      if (diagnosis.status !== 'completed') {
        throw new AppError('この診断はまだ完了していません', HTTP_STATUS.BAD_REQUEST);
      }
      
      return {
        diagnosisId: diagnosis._id,
        result: diagnosis.getResultSummary(),
        recommendedStyles: diagnosis.result.recommendedStyles,
        completedAt: diagnosis.completedAt,
        duration: diagnosis.sessionData.duration
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('診断結果の取得に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 診断履歴を取得
   * @param {String} userId - ユーザーID
   * @param {Object} options - ページネーションオプション
   * @returns {Object} 診断履歴
   */
  async getDiagnosisHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 10, includeAbandoned = false } = options;
      const skip = (page - 1) * limit;
      
      const query = {
        userId,
        status: includeAbandoned ? { $in: ['completed', 'abandoned'] } : 'completed'
      };
      
      const [diagnoses, total] = await Promise.all([
        Diagnosis.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('result.personalityType completedAt sessionData.duration status createdAt')
          .lean(),
        Diagnosis.countDocuments(query)
      ]);
      
      return {
        diagnoses: diagnoses.map(d => ({
          id: d._id,
          personalityType: d.result?.personalityType,
          completedAt: d.completedAt,
          createdAt: d.createdAt,
          duration: d.sessionData?.duration,
          status: d.status
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new AppError('診断履歴の取得に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * フィードバックを送信
   * @param {String} diagnosisId - 診断ID
   * @param {String} userId - ユーザーID
   * @param {Object} feedbackData - フィードバックデータ
   * @returns {Object} 更新結果
   */
  async submitFeedback(diagnosisId, userId, feedbackData) {
    try {
      const diagnosis = await Diagnosis.findOne({
        _id: diagnosisId,
        userId,
        status: 'completed'
      });
      
      if (!diagnosis) {
        throw new AppError('診断結果が見つかりません', HTTP_STATUS.NOT_FOUND);
      }
      
      if (diagnosis.feedback?.submittedAt) {
        throw new AppError('既にフィードバックを送信済みです', HTTP_STATUS.BAD_REQUEST);
      }
      
      diagnosis.feedback = {
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        submittedAt: new Date()
      };
      
      await diagnosis.save();
      
      // 推奨されたスタイルの評価を更新
      if (feedbackData.styleRatings) {
        for (const styleId of diagnosis.result.recommendedStyles) {
          const rating = feedbackData.styleRatings[styleId];
          if (rating) {
            const style = await TeachingStyle.findById(styleId);
            if (style) {
              await style.updateRating(rating);
            }
          }
        }
      }
      
      return {
        message: 'フィードバックを受け付けました。ありがとうございます。'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('フィードバックの送信に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 診断統計を取得
   * @param {String} userId - ユーザーID
   * @returns {Object} 統計情報
   */
  async getDiagnosisStats(userId) {
    try {
      const diagnoses = await Diagnosis.find({
        userId,
        status: 'completed'
      }).select('result.personalityType completedAt');
      
      if (diagnoses.length === 0) {
        return {
          totalDiagnoses: 0,
          personalityTypes: [],
          lastDiagnosis: null
        };
      }
      
      // パーソナリティタイプの分布
      const typeCount = {};
      diagnoses.forEach(d => {
        const type = d.result.personalityType;
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      
      const personalityTypes = Object.entries(typeCount).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / diagnoses.length) * 100)
      }));
      
      return {
        totalDiagnoses: diagnoses.length,
        personalityTypes: personalityTypes.sort((a, b) => b.count - a.count),
        lastDiagnosis: diagnoses[0].completedAt,
        mostCommonType: personalityTypes[0]?.type
      };
    } catch (error) {
      throw new AppError('統計情報の取得に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 配列をシャッフル（Fisher-Yates）
   * @private
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = new DiagnosisService();