const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  teachingStyleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeachingStyle',
    required: true
  },
  diagnosisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diagnosis',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  gradeLevel: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // 授業時間（分）
    required: true,
    min: 10,
    max: 300
  },
  templateType: {
    type: String,
    enum: ['lesson_plan', 'worksheet', 'assessment', 'comprehensive'],
    default: 'lesson_plan'
  },
  content: {
    // 授業計画
    lessonPlan: {
      overview: String,
      objectives: [{
        type: String,
        trim: true
      }],
      materials: [{
        name: String,
        quantity: String,
        notes: String
      }],
      activities: [{
        name: String,
        duration: Number, // 分
        description: String,
        teachingMethod: String,
        studentActivity: String,
        assessment: String
      }],
      homework: {
        description: String,
        estimatedTime: Number // 分
      }
    },
    
    // ワークシート
    worksheet: {
      instructions: String,
      exercises: [{
        questionNumber: Number,
        questionType: {
          type: String,
          enum: ['multiple_choice', 'short_answer', 'essay', 'problem_solving', 'creative']
        },
        question: String,
        hints: [String],
        answerKey: String,
        points: Number
      }],
      totalPoints: Number
    },
    
    // 評価基準
    assessment: {
      type: {
        type: String,
        enum: ['formative', 'summative', 'diagnostic', 'peer', 'self']
      },
      criteria: [{
        name: String,
        description: String,
        weight: Number, // パーセンテージ
        levels: [{
          level: String, // 優、良、可、不可 など
          score: Number,
          description: String
        }]
      }],
      rubric: String,
      feedbackGuidelines: String
    }
  },
  
  // カスタマイズ設定
  customizations: {
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    colorScheme: {
      type: String,
      enum: ['default', 'high_contrast', 'colorful', 'minimal'],
      default: 'default'
    },
    includeImages: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['ja', 'en', 'simple_ja'],
      default: 'ja'
    },
    specialNeeds: {
      visualImpairment: Boolean,
      hearingImpairment: Boolean,
      learningDifficulties: Boolean,
      additionalNotes: String
    }
  },
  
  // メタデータ
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    generatedFiles: [{
      format: {
        type: String,
        enum: ['pdf', 'docx', 'html']
      },
      url: String,
      size: Number, // bytes
      generatedAt: Date
    }],
    tags: [String],
    shareSettings: {
      isPublic: {
        type: Boolean,
        default: false
      },
      sharedWith: [{
        userId: mongoose.Schema.Types.ObjectId,
        permission: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view'
        }
      }]
    }
  },
  
  // 使用統計
  usageStats: {
    viewCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    feedback: [{
      userId: mongoose.Schema.Types.ObjectId,
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    effectiveness: {
      studentEngagement: Number, // 1-5
      learningOutcomes: Number, // 1-5
      timeManagement: Number, // 1-5
      overallSuccess: Number // 1-5
    }
  },
  
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// インデックス
templateSchema.index({ userId: 1, createdAt: -1 });
templateSchema.index({ teachingStyleId: 1 });
templateSchema.index({ subject: 1, gradeLevel: 1 });
templateSchema.index({ 'metadata.tags': 1 });
templateSchema.index({ status: 1 });

// 仮想プロパティ
templateSchema.virtual('isComplete').get(function() {
  const content = this.content;
  switch(this.templateType) {
    case 'lesson_plan':
      return !!(
        content.lessonPlan.overview &&
        content.lessonPlan.objectives.length > 0 &&
        content.lessonPlan.activities.length > 0
      );
    case 'worksheet':
      return !!(
        content.worksheet.instructions &&
        content.worksheet.exercises.length > 0
      );
    case 'assessment':
      return !!(
        content.assessment.type &&
        content.assessment.criteria.length > 0
      );
    case 'comprehensive':
      return !!(
        content.lessonPlan.overview &&
        content.worksheet.exercises.length > 0 &&
        content.assessment.criteria.length > 0
      );
    default:
      return false;
  }
});

// メソッド
templateSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    subject: this.subject,
    gradeLevel: this.gradeLevel,
    duration: this.duration,
    templateType: this.templateType,
    status: this.status,
    isComplete: this.isComplete,
    createdAt: this.createdAt,
    lastModified: this.metadata.lastModified
  };
};

templateSchema.methods.getPublicView = function() {
  return {
    title: this.title,
    subject: this.subject,
    gradeLevel: this.gradeLevel,
    duration: this.duration,
    templateType: this.templateType,
    content: this.content,
    tags: this.metadata.tags
  };
};

templateSchema.methods.incrementViewCount = function() {
  this.usageStats.viewCount += 1;
  this.usageStats.lastUsed = new Date();
  return this.save();
};

templateSchema.methods.incrementDownloadCount = function() {
  this.usageStats.downloadCount += 1;
  return this.save();
};

templateSchema.methods.addGeneratedFile = function(format, url, size) {
  this.metadata.generatedFiles.push({
    format,
    url,
    size,
    generatedAt: new Date()
  });
  return this.save();
};

templateSchema.methods.updateVersion = function() {
  this.metadata.version += 1;
  this.metadata.lastModified = new Date();
  return this.save();
};

// 静的メソッド
templateSchema.statics.findByUser = function(userId, options = {}) {
  const { status, templateType, limit = 20, skip = 0 } = options;
  
  let query = { userId };
  if (status) query.status = status;
  if (templateType) query.templateType = templateType;
  
  return this.find(query)
    .sort('-createdAt')
    .limit(limit)
    .skip(skip)
    .populate('teachingStyleId', 'name displayName')
    .select('-content.worksheet.exercises.answerKey'); // 答えは除外
};

templateSchema.statics.findPublicTemplates = function(filters = {}) {
  const { subject, gradeLevel, templateType, tags, limit = 20, skip = 0 } = filters;
  
  let query = { 'metadata.shareSettings.isPublic': true, status: 'completed' };
  
  if (subject) query.subject = subject;
  if (gradeLevel) query.gradeLevel = gradeLevel;
  if (templateType) query.templateType = templateType;
  if (tags && tags.length > 0) {
    query['metadata.tags'] = { $in: tags };
  }
  
  return this.find(query)
    .sort('-usageStats.downloadCount -usageStats.viewCount')
    .limit(limit)
    .skip(skip)
    .populate('userId', 'profile.name')
    .populate('teachingStyleId', 'name displayName')
    .select('-content.worksheet.exercises.answerKey');
};

templateSchema.statics.getPopularTemplates = function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort('-usageStats.downloadCount -usageStats.viewCount')
    .limit(limit)
    .select('title subject gradeLevel templateType usageStats');
};

templateSchema.statics.searchTemplates = function(searchTerm, userId) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return this.find({
    $and: [
      {
        $or: [
          { userId: userId },
          { 'metadata.shareSettings.isPublic': true }
        ]
      },
      {
        $or: [
          { title: searchRegex },
          { subject: searchRegex },
          { 'metadata.tags': searchRegex }
        ]
      }
    ]
  })
  .populate('teachingStyleId', 'name displayName')
  .select('-content.worksheet.exercises.answerKey');
};

// ミドルウェア
templateSchema.pre('save', function(next) {
  // 合計ポイントの自動計算（ワークシート）
  if (this.templateType === 'worksheet' && this.content.worksheet.exercises.length > 0) {
    this.content.worksheet.totalPoints = this.content.worksheet.exercises.reduce(
      (sum, exercise) => sum + (exercise.points || 0), 0
    );
  }
  
  // 活動の合計時間が授業時間を超えないかチェック
  if (this.content.lessonPlan.activities.length > 0) {
    const totalActivityTime = this.content.lessonPlan.activities.reduce(
      (sum, activity) => sum + (activity.duration || 0), 0
    );
    
    if (totalActivityTime > this.duration) {
      return next(new Error('活動の合計時間が授業時間を超えています'));
    }
  }
  
  next();
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;