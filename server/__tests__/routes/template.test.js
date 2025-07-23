const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const templateRoutes = require('../../routes/template');
const { protect } = require('../../middleware/auth');
const Template = require('../../models/Template');
const TemplateGeneratorService = require('../../services/templateGenerator');
const pdfGenerator = require('../../services/pdfGenerator');

// モックの設定
jest.mock('../../middleware/auth');
jest.mock('../../models/Template');
jest.mock('../../services/templateGenerator');
jest.mock('../../services/pdfGenerator');

// Expressアプリケーションの設定
const app = express();
app.use(express.json());
app.use('/api/templates', templateRoutes);

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message
    }
  });
});

describe('Template Routes', () => {
  let mockUser;
  let mockTemplate;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      profile: { name: 'Test User' }
    };

    mockTemplate = {
      _id: new mongoose.Types.ObjectId(),
      userId: mockUser._id,
      title: 'テスト授業計画',
      subject: '数学',
      gradeLevel: '中学1年',
      duration: 50,
      templateType: 'lesson_plan',
      status: 'draft',
      metadata: {
        version: 1,
        shareSettings: { isPublic: false }
      },
      getSummary: jest.fn().mockReturnValue({
        id: this._id,
        title: 'テスト授業計画',
        subject: '数学',
        gradeLevel: '中学1年',
        status: 'draft'
      }),
      getPublicView: jest.fn().mockReturnValue({
        title: 'テスト授業計画',
        subject: '数学',
        gradeLevel: '中学1年'
      }),
      incrementViewCount: jest.fn(),
      incrementDownloadCount: jest.fn(),
      addGeneratedFile: jest.fn(),
      updateVersion: jest.fn(),
      save: jest.fn().mockResolvedValue(true)
    };

    // 認証ミドルウェアのモック
    protect.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });
  });

  describe('POST /api/templates/generate', () => {
    it('テンプレートを生成できること', async () => {
      const generatedTemplate = { ...mockTemplate, save: jest.fn() };
      TemplateGeneratorService.generateTemplate.mockResolvedValue(generatedTemplate);

      const res = await request(app)
        .post('/api/templates/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          diagnosisId: new mongoose.Types.ObjectId().toString(),
          teachingStyleId: new mongoose.Types.ObjectId().toString(),
          title: '新しい授業計画',
          subject: '数学',
          gradeLevel: '中学1年',
          duration: 50,
          templateType: 'lesson_plan'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('テンプレートを生成しました');
      expect(TemplateGeneratorService.generateTemplate).toHaveBeenCalled();
      expect(generatedTemplate.save).toHaveBeenCalled();
    });

    it('無効なデータでエラーを返すこと', async () => {
      const res = await request(app)
        .post('/api/templates/generate')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: '新しい授業計画'
          // 必須フィールドが不足
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('バリデーションエラー');
    });
  });

  describe('GET /api/templates', () => {
    it('ユーザーのテンプレート一覧を取得できること', async () => {
      Template.findByUser.mockResolvedValue([mockTemplate]);
      Template.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/templates')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.templates).toHaveLength(1);
      expect(res.body.data.pagination).toBeDefined();
      expect(Template.findByUser).toHaveBeenCalledWith(mockUser._id, expect.any(Object));
    });

    it('フィルタリングが動作すること', async () => {
      Template.findByUser.mockResolvedValue([mockTemplate]);
      Template.countDocuments.mockResolvedValue(1);

      await request(app)
        .get('/api/templates?status=draft&subject=数学')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Template.findByUser).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining({ status: 'draft' })
      );
    });
  });

  describe('GET /api/templates/public', () => {
    it('公開テンプレートを取得できること', async () => {
      const publicTemplate = {
        ...mockTemplate,
        userId: { profile: { name: '他のユーザー' } },
        teachingStyleId: { displayName: '構造化ファシリテーター型' },
        metadata: { shareSettings: { isPublic: true } }
      };

      Template.findPublicTemplates.mockResolvedValue([publicTemplate]);
      Template.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/templates/public')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.templates).toHaveLength(1);
      expect(Template.findPublicTemplates).toHaveBeenCalled();
    });
  });

  describe('GET /api/templates/:id', () => {
    it('自分のテンプレートを取得できること', async () => {
      Template.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTemplate)
        })
      });

      const res = await request(app)
        .get(`/api/templates/${mockTemplate._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.template).toBeDefined();
      expect(res.body.data.permissions.canEdit).toBe(true);
    });

    it('公開テンプレートを取得できること', async () => {
      const publicTemplate = {
        ...mockTemplate,
        userId: { _id: new mongoose.Types.ObjectId() }, // 別のユーザー
        metadata: { shareSettings: { isPublic: true } }
      };

      Template.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(publicTemplate)
        })
      });

      const res = await request(app)
        .get(`/api/templates/${publicTemplate._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(publicTemplate.incrementViewCount).toHaveBeenCalled();
    });

    it('アクセス権限がない場合エラーを返すこと', async () => {
      const privateTemplate = {
        ...mockTemplate,
        userId: { _id: new mongoose.Types.ObjectId() }, // 別のユーザー
        metadata: { shareSettings: { isPublic: false } }
      };

      Template.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(privateTemplate)
        })
      });

      const res = await request(app)
        .get(`/api/templates/${privateTemplate._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(res.body.error.message).toBe('このテンプレートへのアクセス権限がありません');
    });
  });

  describe('PUT /api/templates/:id', () => {
    it('自分のテンプレートを更新できること', async () => {
      Template.findById.mockResolvedValue(mockTemplate);

      const res = await request(app)
        .put(`/api/templates/${mockTemplate._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: '更新された授業計画',
          duration: 60
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('テンプレートを更新しました');
      expect(mockTemplate.updateVersion).toHaveBeenCalled();
    });

    it('他人のテンプレートを更新できないこと', async () => {
      const otherUserTemplate = {
        ...mockTemplate,
        userId: new mongoose.Types.ObjectId()
      };

      Template.findById.mockResolvedValue(otherUserTemplate);

      const res = await request(app)
        .put(`/api/templates/${otherUserTemplate._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ title: '更新' })
        .expect(403);

      expect(res.body.error.message).toBe('このテンプレートを編集する権限がありません');
    });
  });

  describe('DELETE /api/templates/:id', () => {
    it('自分のテンプレートをアーカイブできること', async () => {
      Template.findById.mockResolvedValue(mockTemplate);

      const res = await request(app)
        .delete(`/api/templates/${mockTemplate._id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('テンプレートをアーカイブしました');
      expect(mockTemplate.status).toBe('archived');
      expect(mockTemplate.save).toHaveBeenCalled();
    });
  });

  describe('POST /api/templates/:id/duplicate', () => {
    it('テンプレートを複製できること', async () => {
      const newTemplate = { ...mockTemplate, _id: new mongoose.Types.ObjectId() };
      TemplateGeneratorService.duplicateTemplate.mockResolvedValue(newTemplate);

      const res = await request(app)
        .post(`/api/templates/${mockTemplate._id}/duplicate`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: '複製されたテンプレート'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('テンプレートを複製しました');
      expect(TemplateGeneratorService.duplicateTemplate).toHaveBeenCalledWith(
        mockTemplate._id.toString(),
        mockUser._id,
        expect.objectContaining({ title: '複製されたテンプレート' })
      );
    });
  });

  describe('GET /api/templates/:id/download', () => {
    it('PDFをダウンロードできること', async () => {
      Template.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTemplate)
        })
      });

      const pdfData = {
        url: '/uploads/pdfs/test.pdf',
        filename: 'test.pdf',
        size: 1024
      };
      pdfGenerator.generateFromTemplate.mockResolvedValue(pdfData);

      const res = await request(app)
        .get(`/api/templates/${mockTemplate._id}/download`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(pdfData);
      expect(mockTemplate.incrementDownloadCount).toHaveBeenCalled();
      expect(mockTemplate.addGeneratedFile).toHaveBeenCalled();
    });
  });

  describe('POST /api/templates/:id/preview', () => {
    it('プレビューを生成できること', async () => {
      Template.findById.mockResolvedValue(mockTemplate);
      
      const previewBuffer = Buffer.from('PDF content');
      pdfGenerator.generatePreview.mockResolvedValue(previewBuffer);

      const res = await request(app)
        .post(`/api/templates/${mockTemplate._id}/preview`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.preview).toContain('data:application/pdf;base64,');
      expect(res.body.data.size).toBe(previewBuffer.length);
    });
  });

  describe('POST /api/templates/:id/share', () => {
    it('共有設定を更新できること', async () => {
      Template.findById.mockResolvedValue(mockTemplate);

      const res = await request(app)
        .post(`/api/templates/${mockTemplate._id}/share`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          isPublic: true,
          sharedWith: [{
            userId: new mongoose.Types.ObjectId().toString(),
            permission: 'view'
          }]
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('共有設定を更新しました');
      expect(mockTemplate.metadata.shareSettings.isPublic).toBe(true);
      expect(mockTemplate.save).toHaveBeenCalled();
    });
  });

  describe('POST /api/templates/:id/feedback', () => {
    it('フィードバックを送信できること', async () => {
      Template.findById.mockResolvedValue({
        ...mockTemplate,
        usageStats: {
          feedback: [],
          effectiveness: {
            studentEngagement: 0,
            learningOutcomes: 0,
            timeManagement: 0,
            overallSuccess: 0
          }
        }
      });

      const res = await request(app)
        .post(`/api/templates/${mockTemplate._id}/feedback`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          rating: 5,
          comment: 'とても良いテンプレートです',
          effectiveness: {
            studentEngagement: 5,
            learningOutcomes: 4
          }
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('フィードバックを送信しました');
    });
  });

  describe('GET /api/templates/search', () => {
    it('テンプレートを検索できること', async () => {
      Template.searchTemplates.mockResolvedValue([mockTemplate]);

      const res = await request(app)
        .get('/api/templates/search?q=数学')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.templates).toHaveLength(1);
      expect(res.body.data.query).toBe('数学');
      expect(Template.searchTemplates).toHaveBeenCalledWith('数学', mockUser._id);
    });

    it('短すぎる検索キーワードでエラーを返すこと', async () => {
      const res = await request(app)
        .get('/api/templates/search?q=a')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(res.body.error.message).toBe('検索キーワードは2文字以上入力してください');
    });
  });
});