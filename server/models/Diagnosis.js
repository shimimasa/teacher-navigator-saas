const mongoose = require('mongoose');
const { PERSONALITY_TYPES, QUESTION_CATEGORIES } = require('../utils/constants');

const diagnosisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ユーザーIDは必須です'],
    index: true
  },
  questions: [{
    questionId: {
      type: String,
      required: [true, '質問IDは必須です']
    },
    category: {
      type: String,
      enum: Object.values(QUESTION_CATEGORIES),
      required: [true, 'カテゴリーは必須です']
    },
    answer: {
      type: Number,
      required: [true, '回答は必須です'],
      min: [1, '回答は1以上で入力してください'],
      max: [5, '回答は5以下で入力してください']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  result: {
    personalityType: {
      type: String,
      enum: Object.values(PERSONALITY_TYPES),
      required: [true, 'パーソナリティタイプは必須です']
    },
    scores: {
      extroversion: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      sensing: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      thinking: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      judging: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    },
    strengths: [{
      type: String,
      trim: true
    }],
    challenges: [{
      type: String,
      trim: true
    }],
    recommendedStyles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeachingStyle'
    }]
  },
  sessionData: {
    startTime: {
      type: Date,
      required: true
    },
    completionTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // 所要時間（秒）
      required: true
    },
    deviceInfo: {
      userAgent: String,
      platform: String
    }
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'フィードバックは500文字以内で入力してください']
    },
    submittedAt: Date
  },
  completedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// インデックスの設定
diagnosisSchema.index({ userId: 1, createdAt: -1 });
diagnosisSchema.index({ 'result.personalityType': 1 });
diagnosisSchema.index({ status: 1 });

// 仮想フィールド：完了した診断かどうか
diagnosisSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// 仮想フィールド：診断の進捗率
diagnosisSchema.virtual('progressPercentage').get(function() {
  if (!this.questions || this.questions.length === 0) return 0;
  // 想定される質問数（設定により変更可能）
  const totalQuestions = 40;
  return Math.min(Math.round((this.questions.length / totalQuestions) * 100), 100);
});

// メソッド：診断結果のサマリーを取得
diagnosisSchema.methods.getResultSummary = function() {
  if (!this.result) return null;
  
  return {
    personalityType: this.result.personalityType,
    typeDescription: this.getPersonalityTypeDescription(),
    scores: this.result.scores,
    strengths: this.result.strengths,
    challenges: this.result.challenges,
    completedAt: this.completedAt
  };
};

// メソッド：パーソナリティタイプの説明を取得
diagnosisSchema.methods.getPersonalityTypeDescription = function() {
  const descriptions = {
    'ISTJ': '実直で責任感が強く、体系的な指導を得意とする教師',
    'ISFJ': '思いやりがあり、生徒一人ひとりに寄り添う教師',
    'INFJ': '洞察力があり、生徒の可能性を引き出す教師',
    'INTJ': '戦略的で、長期的な視点で教育を設計する教師',
    'ISTP': '実践的で、体験学習を重視する教師',
    'ISFP': '柔軟で、生徒の個性を尊重する教師',
    'INFP': '理想主義的で、生徒の内面的成長を促す教師',
    'INTP': '論理的で、批判的思考を育てる教師',
    'ESTP': '行動的で、アクティブラーニングを実践する教師',
    'ESFP': '明るく、楽しい学習環境を作る教師',
    'ENFP': '熱意があり、生徒のモチベーションを高める教師',
    'ENTP': '革新的で、新しい教育方法を探求する教師',
    'ESTJ': 'リーダーシップがあり、明確な目標を設定する教師',
    'ESFJ': '協調的で、クラスの和を大切にする教師',
    'ENFJ': 'カリスマ的で、生徒を鼓舞する教師',
    'ENTJ': '指導力があり、高い成果を追求する教師'
  };
  
  return descriptions[this.result.personalityType] || 'パーソナリティタイプの説明';
};

// メソッド：カテゴリー別のスコアを計算
diagnosisSchema.methods.calculateCategoryScores = function() {
  const categoryScores = {
    [QUESTION_CATEGORIES.EXTROVERSION]: [],
    [QUESTION_CATEGORIES.SENSING]: [],
    [QUESTION_CATEGORIES.THINKING]: [],
    [QUESTION_CATEGORIES.JUDGING]: []
  };
  
  this.questions.forEach(question => {
    if (categoryScores[question.category]) {
      categoryScores[question.category].push(question.answer);
    }
  });
  
  const scores = {};
  Object.keys(categoryScores).forEach(category => {
    const answers = categoryScores[category];
    if (answers.length > 0) {
      const average = answers.reduce((sum, val) => sum + val, 0) / answers.length;
      scores[category] = Math.round((average / 5) * 100);
    } else {
      scores[category] = 50; // デフォルト値
    }
  });
  
  return scores;
};

// スタティックメソッド：ユーザーの診断履歴を取得
diagnosisSchema.statics.getUserDiagnosisHistory = async function(userId, limit = 10) {
  return await this.find({ 
    userId, 
    status: 'completed' 
  })
  .sort({ completedAt: -1 })
  .limit(limit)
  .select('result.personalityType completedAt sessionData.duration')
  .lean();
};

// スタティックメソッド：パーソナリティタイプ別の統計を取得
diagnosisSchema.statics.getPersonalityTypeStats = async function() {
  return await this.aggregate([
    { $match: { status: 'completed' } },
    { $group: {
      _id: '$result.personalityType',
      count: { $sum: 1 },
      avgDuration: { $avg: '$sessionData.duration' }
    }},
    { $sort: { count: -1 } }
  ]);
};

// ミドルウェア：診断完了時の処理
diagnosisSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    this.completedAt = new Date();
    this.sessionData.completionTime = new Date();
    this.sessionData.duration = Math.round(
      (this.sessionData.completionTime - this.sessionData.startTime) / 1000
    );
  }
  next();
});

// JSONレスポンスのカスタマイズ
diagnosisSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Diagnosis = mongoose.model('Diagnosis', diagnosisSchema);

module.exports = Diagnosis;