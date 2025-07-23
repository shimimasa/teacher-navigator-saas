const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

class AuthService {
  // ユーザー登録
  async register(userData) {
    const { email, password, name, school, subjects, experience } = userData;

    // メールアドレスの重複チェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.USER_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    // ユーザー作成
    const user = await User.create({
      email,
      password,
      profile: {
        name,
        school,
        subjects,
        experience
      }
    });

    // トークン生成
    const token = generateToken(user.getJWTPayload());

    // 最終ログイン時刻を更新
    user.lastLogin = new Date();
    await user.save();

    return {
      token,
      user: user.getPublicProfile()
    };
  }

  // ログイン
  async login(email, password) {
    // ユーザーを取得（パスワードフィールドを含む）
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // アカウントが無効化されている場合
    if (!user.isActive) {
      throw new AppError('アカウントが無効化されています', HTTP_STATUS.UNAUTHORIZED);
    }

    // パスワードを検証
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // トークン生成
    const token = generateToken(user.getJWTPayload());

    // 最終ログイン時刻を更新
    user.lastLogin = new Date();
    await user.save();

    return {
      token,
      user: user.getPublicProfile()
    };
  }

  // パスワードリセットリクエスト
  async requestPasswordReset(email) {
    const user = await User.findOne({ email });

    if (!user) {
      // セキュリティのため、ユーザーが存在しない場合でも成功レスポンスを返す
      return {
        message: 'パスワードリセットのメールを送信しました（登録されている場合）'
      };
    }

    // リセットトークンを生成
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: メール送信機能を実装
    // 開発環境ではコンソールにトークンを出力
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset token:', resetToken);
    }

    return {
      message: 'パスワードリセットのメールを送信しました（登録されている場合）',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    };
  }

  // パスワードリセット実行
  async resetPassword(email, token, newPassword) {
    const user = await User.findOne({
      email,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('無効または期限切れのリセットトークンです', HTTP_STATUS.BAD_REQUEST);
    }

    // トークンを検証
    const bcrypt = require('bcrypt');
    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);

    if (!isTokenValid) {
      throw new AppError('無効または期限切れのリセットトークンです', HTTP_STATUS.BAD_REQUEST);
    }

    // パスワードを更新
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // 新しいトークンを生成
    const authToken = generateToken(user.getJWTPayload());

    return {
      token: authToken,
      user: user.getPublicProfile()
    };
  }

  // プロフィール更新
  async updateProfile(userId, updateData) {
    const { name, school, subjects, experience } = updateData;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'profile.name': name,
          'profile.school': school,
          'profile.subjects': subjects,
          'profile.experience': experience
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return user.getPublicProfile();
  }

  // パスワード変更
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // 現在のパスワードを検証
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      throw new AppError('現在のパスワードが正しくありません', HTTP_STATUS.UNAUTHORIZED);
    }

    // 新しいパスワードを設定
    user.password = newPassword;
    await user.save();

    return {
      message: 'パスワードが正常に変更されました'
    };
  }

  // アカウント削除（無効化）
  async deleteAccount(userId, password) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // パスワードを検証
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // アカウントを無効化（物理削除ではなく論理削除）
    user.isActive = false;
    await user.save();

    return {
      message: 'アカウントが正常に削除されました'
    };
  }
}

module.exports = new AuthService();