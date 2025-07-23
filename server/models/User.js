const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { USER_ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'メールアドレスは必須です'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      '有効なメールアドレスを入力してください'
    ]
  },
  password: {
    type: String,
    required: [true, 'パスワードは必須です'],
    minlength: [8, 'パスワードは8文字以上で設定してください'],
    select: false
  },
  profile: {
    name: {
      type: String,
      required: [true, '名前は必須です'],
      trim: true,
      maxlength: [50, '名前は50文字以内で入力してください']
    },
    school: {
      type: String,
      trim: true,
      maxlength: [100, '学校名は100文字以内で入力してください']
    },
    subjects: [{
      type: String,
      trim: true
    }],
    experience: {
      type: Number,
      min: [0, '経験年数は0以上で入力してください'],
      max: [50, '経験年数は50以下で入力してください']
    }
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.TEACHER
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// インデックスの設定
userSchema.index({ email: 1 });
userSchema.index({ 'profile.school': 1 });
userSchema.index({ createdAt: -1 });

// パスワードハッシュ化のミドルウェア
userSchema.pre('save', async function(next) {
  // パスワードが変更されていない場合はスキップ
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // ソルトラウンド数は10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// パスワード比較メソッド
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('パスワードの比較中にエラーが発生しました');
  }
};

// JWTペイロード生成メソッド
userSchema.methods.getJWTPayload = function() {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    name: this.profile.name
  };
};

// 公開プロフィール取得メソッド
userSchema.methods.getPublicProfile = function() {
  const { _id, email, profile, role, createdAt, lastLogin } = this;
  return {
    id: _id,
    email,
    profile,
    role,
    createdAt,
    lastLogin
  };
};

// パスワードリセットトークン生成メソッド
userSchema.methods.generatePasswordResetToken = function() {
  // 簡易的なトークン生成（本番環境ではcryptoモジュールを使用推奨）
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  
  // トークンをハッシュ化して保存
  this.resetPasswordToken = bcrypt.hashSync(resetToken, 10);
  
  // 有効期限を1時間後に設定
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  
  return resetToken;
};

// 仮想フィールド：フルネーム
userSchema.virtual('fullName').get(function() {
  return this.profile.name;
});

// JSONレスポンスのカスタマイズ
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;