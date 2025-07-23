const mongoose = require('mongoose');
const { PERSONALITY_TYPES } = require('../utils/constants');

const teachingStyleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'スタイル名は必須です'],
    unique: true,
    trim: true,
    maxlength: [100, 'スタイル名は100文字以内で入力してください']
  },
  displayName: {
    type: String,
    required: [true, '表示名は必須です'],
    trim: true,
    maxlength: [100, '表示名は100文字以内で入力してください']
  },
  description: {
    type: String,
    required: [true, '説明は必須です'],
    maxlength: [1000, '説明は1000文字以内で入力してください']
  },
  personalityTypes: [{
    type: String,
    enum: Object.values(PERSONALITY_TYPES),
    required: true
  }],
  characteristics: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [200, '特徴は200文字以内で入力してください']
  }],
  strengths: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [200, '強みは200文字以内で入力してください']
  }],
  methods: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    examples: [String]
  }],
  subjects: [{
    type: String,
    trim: true
  }],
  gradeLevel: {
    elementary: {
      type: Boolean,
      default: false
    },
    juniorHigh: {
      type: Boolean,
      default: false
    },
    highSchool: {
      type: Boolean,
      default: false
    }
  },
  examples: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    subject: String,
    gradeLevel: String
  }],
  resources: [{
    type: {
      type: String,
      enum: ['book', 'website', 'video', 'article', 'tool'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  tips: [{
    category: {
      type: String,
      enum: ['preparation', 'execution', 'assessment', 'classroom_management'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
  }],
  compatibility: {
    highCompatibility: [{
      personalityType: {
        type: String,
        enum: Object.values(PERSONALITY_TYPES)
      },
      reason: String
    }],
    considerations: [{
      personalityType: {
        type: String,
        enum: Object.values(PERSONALITY_TYPES)
      },
      advice: String
    }]
  },
  metrics: {
    effectivenessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    preparationTime: {
      type: String,
      enum: ['minimal', 'moderate', 'extensive'],
      default: 'moderate'
    },
    studentEngagement: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'high'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    viewCount: {
      type: Number,
      default: 0
    },
    usageCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// インデックスの設定
teachingStyleSchema.index({ name: 1 });
teachingStyleSchema.index({ personalityTypes: 1 });
teachingStyleSchema.index({ subjects: 1 });
teachingStyleSchema.index({ tags: 1 });
teachingStyleSchema.index({ isActive: 1 });

// 仮想フィールド：評価スコア
teachingStyleSchema.virtual('popularityScore').get(function() {
  const viewWeight = 0.3;
  const usageWeight = 0.4;
  const ratingWeight = 0.3;
  
  const normalizedViews = Math.min(this.metadata.viewCount / 1000, 1) * 100;
  const normalizedUsage = Math.min(this.metadata.usageCount / 500, 1) * 100;
  const normalizedRating = (this.metadata.averageRating / 5) * 100;
  
  return Math.round(
    normalizedViews * viewWeight + 
    normalizedUsage * usageWeight + 
    normalizedRating * ratingWeight
  );
});

// メソッド：スタイルの概要を取得
teachingStyleSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    displayName: this.displayName,
    description: this.description,
    personalityTypes: this.personalityTypes,
    characteristics: this.characteristics.slice(0, 3),
    metrics: this.metrics,
    tags: this.tags
  };
};

// メソッド：特定の教科・学年に対する推奨度を計算
teachingStyleSchema.methods.getRecommendationScore = function(subject, gradeLevel) {
  let score = this.metrics.effectivenessScore;
  
  // 教科の一致度
  if (this.subjects.includes(subject)) {
    score += 10;
  }
  
  // 学年の一致度
  if (gradeLevel === 'elementary' && this.gradeLevel.elementary) score += 5;
  if (gradeLevel === 'juniorHigh' && this.gradeLevel.juniorHigh) score += 5;
  if (gradeLevel === 'highSchool' && this.gradeLevel.highSchool) score += 5;
  
  return Math.min(score, 100);
};

// メソッド：使用回数をインクリメント
teachingStyleSchema.methods.incrementUsage = async function() {
  this.metadata.usageCount += 1;
  return await this.save();
};

// メソッド：閲覧回数をインクリメント
teachingStyleSchema.methods.incrementView = async function() {
  this.metadata.viewCount += 1;
  return await this.save();
};

// メソッド：評価を更新
teachingStyleSchema.methods.updateRating = async function(newRating) {
  const currentTotal = this.metadata.averageRating * this.metadata.ratingCount;
  this.metadata.ratingCount += 1;
  this.metadata.averageRating = (currentTotal + newRating) / this.metadata.ratingCount;
  return await this.save();
};

// スタティックメソッド：パーソナリティタイプに基づくスタイルを取得
teachingStyleSchema.statics.findByPersonalityType = async function(personalityType, limit = 5) {
  return await this.find({
    personalityTypes: personalityType,
    isActive: true
  })
  .sort({ 'metrics.effectivenessScore': -1 })
  .limit(limit)
  .select('name displayName description characteristics metrics tags');
};

// スタティックメソッド：人気のスタイルを取得
teachingStyleSchema.statics.getPopularStyles = async function(limit = 10) {
  return await this.find({ isActive: true })
    .sort({ 'metadata.usageCount': -1, 'metadata.averageRating': -1 })
    .limit(limit)
    .select('name displayName description metrics metadata tags');
};

// スタティックメソッド：タグによる検索
teachingStyleSchema.statics.findByTags = async function(tags, limit = 20) {
  return await this.find({
    tags: { $in: tags },
    isActive: true
  })
  .sort({ 'metadata.averageRating': -1 })
  .limit(limit);
};

// JSONレスポンスのカスタマイズ
teachingStyleSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const TeachingStyle = mongoose.model('TeachingStyle', teachingStyleSchema);

module.exports = TeachingStyle;