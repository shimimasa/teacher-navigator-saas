const jwt = require('jsonwebtoken');
const { 
  generateToken, 
  verifyToken, 
  protect, 
  authorize, 
  rateLimit 
} = require('../../middleware/auth');
const User = require('../../models/User');
const { HTTP_STATUS } = require('../../utils/constants');

// モックの設定
jest.mock('../../models/User');

describe('Auth Middleware Test', () => {
  let req, res, next;

  beforeEach(() => {
    // リクエスト、レスポンス、nextのモック
    req = {
      headers: {},
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // 環境変数の設定
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRE = '7d';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Generation and Verification', () => {
    it('should generate a valid token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should verify a valid token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe('123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid-token');
      }).toThrow();
    });
  });

  describe('Protect Middleware', () => {
    it('should call next() for valid token', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        isActive: true
      };
      
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const token = generateToken({ id: '123' });
      req.headers.authorization = `Bearer ${token}`;

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 for missing token', async () => {
      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_STATUS.UNAUTHORIZED
        })
      );
    });

    it('should return 401 for invalid token format', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_STATUS.UNAUTHORIZED
        })
      );
    });

    it('should return 401 for expired token', async () => {
      // 期限切れトークンをシミュレート
      const expiredToken = jwt.sign(
        { id: '123' },
        process.env.JWT_SECRET,
        { expiresIn: '-1d' }
      );
      req.headers.authorization = `Bearer ${expiredToken}`;

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          message: expect.stringContaining('期限')
        })
      );
    });

    it('should return 401 for non-existent user', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const token = generateToken({ id: '123' });
      req.headers.authorization = `Bearer ${token}`;

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_STATUS.UNAUTHORIZED
        })
      );
    });

    it('should return 401 for inactive user', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        isActive: false
      };
      
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const token = generateToken({ id: '123' });
      req.headers.authorization = `Bearer ${token}`;

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          message: expect.stringContaining('無効化')
        })
      );
    });
  });

  describe('Authorize Middleware', () => {
    it('should call next() for authorized role', () => {
      req.user = { role: 'admin' };
      
      const middleware = authorize('admin', 'teacher');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 for unauthorized role', () => {
      req.user = { role: 'teacher' };
      
      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_STATUS.FORBIDDEN
        })
      );
    });

    it('should return 401 if no user', () => {
      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_STATUS.UNAUTHORIZED
        })
      );
    });
  });

  describe('Rate Limit Middleware', () => {
    it('should allow requests within limit', () => {
      const middleware = rateLimit(5, 60000);
      
      // 5回のリクエストを実行
      for (let i = 0; i < 5; i++) {
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
        next.mockClear();
      }
    });

    it('should block requests exceeding limit', () => {
      const middleware = rateLimit(2, 60000);
      
      // 最初の2回は成功
      middleware(req, res, next);
      middleware(req, res, next);
      
      // 3回目はブロック
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('制限')
          })
        })
      );
    });
  });
});