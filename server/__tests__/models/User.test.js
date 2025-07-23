const mongoose = require('mongoose');
const User = require('../../models/User');

describe('User Model Test', () => {
  // テスト用のデータベース接続
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/teacher-navigator-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  // 各テスト後にデータをクリーンアップ
  afterEach(async () => {
    await User.deleteMany({});
  });

  // テスト終了後に接続を閉じる
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // 正常なユーザー作成のテスト
  it('should create a user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234',
      profile: {
        name: 'テストユーザー',
        school: 'テスト学校',
        subjects: ['数学', '理科'],
        experience: 5
      }
    };

    const user = await User.create(userData);

    expect(user.email).toBe('test@example.com');
    expect(user.profile.name).toBe('テストユーザー');
    expect(user.password).not.toBe('Test1234'); // パスワードがハッシュ化されている
    expect(user.role).toBe('teacher'); // デフォルトロール
    expect(user.isActive).toBe(true); // デフォルトでアクティブ
  });

  // バリデーションエラーのテスト
  it('should fail to create a user without required fields', async () => {
    const userData = {
      email: 'test@example.com'
      // パスワードとprofile.nameが不足
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  // メールアドレスの形式バリデーション
  it('should validate email format', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'Test1234',
      profile: {
        name: 'テストユーザー'
      }
    };

    await expect(User.create(userData)).rejects.toThrow(/有効なメールアドレス/);
  });

  // パスワードの最小長バリデーション
  it('should validate password minimum length', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'short',
      profile: {
        name: 'テストユーザー'
      }
    };

    await expect(User.create(userData)).rejects.toThrow(/8文字以上/);
  });

  // パスワード比較メソッドのテスト
  it('should compare password correctly', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234',
      profile: {
        name: 'テストユーザー'
      }
    };

    const user = await User.create(userData);
    
    // パスワードを含むユーザーを再取得
    const userWithPassword = await User.findById(user._id).select('+password');
    
    // 正しいパスワード
    const isMatch = await userWithPassword.comparePassword('Test1234');
    expect(isMatch).toBe(true);
    
    // 間違ったパスワード
    const isNotMatch = await userWithPassword.comparePassword('Wrong1234');
    expect(isNotMatch).toBe(false);
  });

  // JWTペイロード生成のテスト
  it('should generate JWT payload correctly', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234',
      profile: {
        name: 'テストユーザー'
      }
    };

    const user = await User.create(userData);
    const payload = user.getJWTPayload();

    expect(payload).toHaveProperty('id');
    expect(payload.email).toBe('test@example.com');
    expect(payload.role).toBe('teacher');
    expect(payload.name).toBe('テストユーザー');
  });

  // 公開プロフィール取得のテスト
  it('should get public profile without sensitive data', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234',
      profile: {
        name: 'テストユーザー'
      }
    };

    const user = await User.create(userData);
    const publicProfile = user.getPublicProfile();

    expect(publicProfile).toHaveProperty('id');
    expect(publicProfile).toHaveProperty('email');
    expect(publicProfile).toHaveProperty('profile');
    expect(publicProfile).not.toHaveProperty('password');
  });

  // パスワードリセットトークン生成のテスト
  it('should generate password reset token', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234',
      profile: {
        name: 'テストユーザー'
      }
    };

    const user = await User.create(userData);
    const resetToken = user.generatePasswordResetToken();

    expect(resetToken).toBeTruthy();
    expect(user.resetPasswordToken).toBeTruthy();
    expect(user.resetPasswordExpire).toBeInstanceOf(Date);
    expect(user.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
  });

  // 重複メールアドレスのテスト
  it('should not allow duplicate email addresses', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234',
      profile: {
        name: 'テストユーザー1'
      }
    };

    await User.create(userData);

    const duplicateUserData = {
      email: 'test@example.com',
      password: 'Test5678',
      profile: {
        name: 'テストユーザー2'
      }
    };

    await expect(User.create(duplicateUserData)).rejects.toThrow();
  });

  // JSONレスポンスのカスタマイズテスト
  it('should exclude sensitive fields in JSON response', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test1234',
      profile: {
        name: 'テストユーザー'
      }
    };

    const user = await User.create(userData);
    const json = user.toJSON();

    expect(json).not.toHaveProperty('password');
    expect(json).not.toHaveProperty('resetPasswordToken');
    expect(json).not.toHaveProperty('resetPasswordExpire');
    expect(json).not.toHaveProperty('__v');
  });
});