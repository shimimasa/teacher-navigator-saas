const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');
const { generateToken } = require('../../middleware/auth');

describe('Auth Routes Integration Test', () => {
  let server;

  // テスト用サーバーの起動
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/teacher-navigator-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    server = app.listen(5001);
  });

  // 各テスト後にデータをクリーンアップ
  afterEach(async () => {
    await User.deleteMany({});
  });

  // テスト終了後にサーバーと接続を閉じる
  afterAll(async () => {
    await server.close();
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'テストユーザー',
        school: 'テスト学校',
        subjects: ['数学', '理科'],
        experience: 5
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test1234',
        name: 'テストユーザー'
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('有効なメールアドレス')
          })
        ])
      );
    });

    it('should fail with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'テストユーザー'
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password'
          })
        ])
      );
    });

    it('should fail with duplicate email', async () => {
      // 最初のユーザーを作成
      await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        profile: { name: 'テストユーザー1' }
      });

      const userData = {
        email: 'test@example.com',
        password: 'Test5678',
        name: 'テストユーザー2'
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('既に登録されています');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // テスト用ユーザーを作成
      await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        profile: { name: 'テストユーザー' }
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail with invalid password', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('認証情報が無効');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('認証情報が無効');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      // テスト用ユーザーを作成
      user = await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        profile: { name: 'テストユーザー' }
      });
      token = generateToken(user.getJWTPayload());
    });

    it('should get current user with valid token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('トークン');
    });

    it('should fail with invalid token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('無効');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        profile: { 
          name: 'テストユーザー',
          school: '旧学校名'
        }
      });
      token = generateToken(user.getJWTPayload());
    });

    it('should update profile successfully', async () => {
      const updateData = {
        name: '更新されたユーザー',
        school: '新学校名',
        subjects: ['英語', '国語'],
        experience: 10
      };

      const response = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.profile.name).toBe('更新されたユーザー');
      expect(response.body.data.user.profile.school).toBe('新学校名');
      expect(response.body.data.user.profile.subjects).toEqual(['英語', '国語']);
    });
  });

  describe('PUT /api/auth/password', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        profile: { name: 'テストユーザー' }
      });
      token = generateToken(user.getJWTPayload());
    });

    it('should change password successfully', async () => {
      const response = await request(server)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Test1234',
          newPassword: 'NewTest5678'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('変更されました');

      // 新しいパスワードでログインできることを確認
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewTest5678'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(server)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewTest5678'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('現在のパスワードが正しくありません');
    });
  });

  describe('POST /api/auth/reset-password/request', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        profile: { name: 'テストユーザー' }
      });
    });

    it('should request password reset successfully', async () => {
      const response = await request(server)
        .post('/api/auth/reset-password/request')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('メールを送信しました');
      
      // 開発環境ではリセットトークンが返される
      if (process.env.NODE_ENV === 'development') {
        expect(response.body).toHaveProperty('resetToken');
      }
    });

    it('should return success even for non-existent email', async () => {
      const response = await request(server)
        .post('/api/auth/reset-password/request')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('メールを送信しました');
    });
  });

  describe('DELETE /api/auth/account', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        profile: { name: 'テストユーザー' }
      });
      token = generateToken(user.getJWTPayload());
    });

    it('should delete account successfully', async () => {
      const response = await request(server)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Test1234' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('削除されました');

      // アカウントが無効化されていることを確認
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isActive).toBe(false);
    });

    it('should fail with incorrect password', async () => {
      const response = await request(server)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'WrongPassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('認証情報が無効');
    });
  });
});