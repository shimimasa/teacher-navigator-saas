const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');

// テスト用のデータベース接続
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost/teacher-navigator-test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// 各テスト前にデータベースをクリーンアップ
beforeEach(async () => {
  await User.deleteMany({});
});

// テスト後にデータベース接続を閉じる
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
        school: 'Test School',
        subjects: ['math', 'science'],
        grades: ['grade7', 'grade8'],
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user).not.toHaveProperty('password');
      
      // トークンが有効であることを確認
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(response.body.user._id);
    });

    it('should not register user with existing email', async () => {
      // 既存のユーザーを作成
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: await bcrypt.hash('password123', 10),
        school: 'Test School',
      });

      const newUser = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'StrongP@ssw0rd',
        school: 'Test School',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(400);

      expect(response.body.message).toContain('既に登録されています');
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        email: 'test@example.com',
        // name と password が欠けている
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should validate email format', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'StrongP@ssw0rd',
        school: 'Test School',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('有効なメールアドレス'),
        })
      );
    });

    it('should validate password strength', async () => {
      const weakPasswordUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
        school: 'Test School',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: expect.stringContaining('8文字以上'),
        })
      );
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;
    const password = 'StrongP@ssw0rd';

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash(password, 10),
        school: 'Test School',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user._id).toBe(testUser._id.toString());
    });

    it('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: password,
        })
        .expect(401);

      expect(response.body.message).toContain('認証情報が無効です');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('認証情報が無効です');
    });

    it('should track failed login attempts', async () => {
      // 複数回の失敗したログイン試行
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
          .expect(401);
      }

      // ユーザーの失敗回数を確認
      const user = await User.findById(testUser._id);
      expect(user.loginAttempts).toBe(3);
    });

    it('should reset login attempts on successful login', async () => {
      // 失敗したログイン試行
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      // 成功したログイン
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: password,
        })
        .expect(200);

      // ログイン試行がリセットされていることを確認
      const user = await User.findById(testUser._id);
      expect(user.loginAttempts).toBe(0);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        school: 'Test School',
      });

      authToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(testUser._id.toString());
      expect(response.body.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toContain('認証が必要です');
    });

    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('無効なトークン');
    });

    it('should not get user with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // 既に期限切れ
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toContain('トークンの有効期限が切れています');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        school: 'Test School',
      });

      authToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should update user profile', async () => {
      const updates = {
        name: 'Updated User',
        school: 'Updated School',
        subjects: ['math', 'english'],
        grades: ['grade9'],
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.school).toBe(updates.school);
      expect(response.body.subjects).toEqual(updates.subjects);
      expect(response.body.grades).toEqual(updates.grades);
    });

    it('should not update email to existing email', async () => {
      // 別のユーザーを作成
      await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
        school: 'Test School',
      });

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'another@example.com' })
        .expect(400);

      expect(response.body.message).toContain('既に使用されています');
    });

    it('should update password with current password verification', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'NewStr0ngP@ssword',
        })
        .expect(200);

      // 新しいパスワードでログインできることを確認
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewStr0ngP@ssword',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should not update password without current password', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newPassword: 'NewStr0ngP@ssword',
        })
        .expect(400);

      expect(response.body.message).toContain('現在のパスワードが必要です');
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        school: 'Test School',
      });

      authToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('ログアウトしました');
    });

    it('should invalidate token after logout', async () => {
      // ログアウト
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 同じトークンでアクセスしてみる
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.message).toContain('トークンが無効化されています');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser;
    let authToken;
    let refreshToken;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        school: 'Test School',
      });

      authToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      refreshToken = jwt.sign(
        { id: testUser._id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      
      // 新しいトークンが有効であることを確認
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
    });

    it('should not refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.message).toContain('無効なリフレッシュトークン');
    });
  });
});