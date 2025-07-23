const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateTemplateGeneration,
  validateTemplateUpdate,
  validateTemplateQuery,
  validateTemplateDuplicate
} = require('../middleware/templateValidation');
const Template = require('../models/Template');
const TemplateGeneratorService = require('../services/templateGenerator');
const pdfGenerator = require('../services/pdfGenerator');
const { AppError } = require('../middleware/errorHandler');

/**
 * @route   POST /api/templates/generate
 * @desc    診断結果と授業スタイルからテンプレートを生成
 * @access  Private
 */
router.post('/generate',
  protect,
  validateTemplateGeneration,
  asyncHandler(async (req, res) => {
    const params = {
      userId: req.user._id,
      ...req.body
    };

    // テンプレートを生成
    const template = await TemplateGeneratorService.generateTemplate(params);
    
    // 保存
    await template.save();

    res.status(201).json({
      success: true,
      message: 'テンプレートを生成しました',
      data: {
        template: template.getSummary(),
        templateId: template._id
      }
    });
  })
);

/**
 * @route   GET /api/templates
 * @desc    ユーザーのテンプレート一覧を取得
 * @access  Private
 */
router.get('/',
  protect,
  validateTemplateQuery,
  asyncHandler(async (req, res) => {
    const { 
      status, 
      templateType, 
      subject, 
      gradeLevel,
      page = 1, 
      limit = 20 
    } = req.query;

    const options = {
      status,
      templateType,
      limit: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    };

    // フィルター条件を追加
    const query = { userId: req.user._id };
    if (subject) query.subject = subject;
    if (gradeLevel) query.gradeLevel = gradeLevel;

    const templates = await Template.findByUser(req.user._id, options);
    const total = await Template.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        templates: templates.map(t => t.getSummary()),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/templates/public
 * @desc    公開テンプレートを検索
 * @access  Public
 */
router.get('/public',
  validateTemplateQuery,
  asyncHandler(async (req, res) => {
    const {
      subject,
      gradeLevel,
      templateType,
      tags,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      subject,
      gradeLevel,
      templateType,
      tags: tags ? tags.split(',') : undefined,
      limit: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    };

    const templates = await Template.findPublicTemplates(filters);
    
    // 総数を取得（ページネーション用）
    const countQuery = { 
      'metadata.shareSettings.isPublic': true, 
      status: 'completed' 
    };
    if (subject) countQuery.subject = subject;
    if (gradeLevel) countQuery.gradeLevel = gradeLevel;
    if (templateType) countQuery.templateType = templateType;
    
    const total = await Template.countDocuments(countQuery);

    res.status(200).json({
      success: true,
      data: {
        templates: templates.map(t => ({
          ...t.getSummary(),
          author: t.userId.profile?.name || '匿名',
          teachingStyle: t.teachingStyleId.displayName
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/templates/popular
 * @desc    人気のテンプレートを取得
 * @access  Public
 */
router.get('/popular',
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const templates = await Template.getPopularTemplates(Number(limit));

    res.status(200).json({
      success: true,
      data: templates
    });
  })
);

/**
 * @route   GET /api/templates/search
 * @desc    テンプレートを検索
 * @access  Private
 */
router.get('/search',
  protect,
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      throw new AppError('検索キーワードは2文字以上入力してください', 400);
    }

    const templates = await Template.searchTemplates(q, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        templates: templates.map(t => t.getSummary()),
        query: q,
        count: templates.length
      }
    });
  })
);

/**
 * @route   GET /api/templates/:id
 * @desc    特定のテンプレートを取得
 * @access  Private/Public (権限による)
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const template = await Template.findById(req.params.id)
      .populate('teachingStyleId', 'name displayName')
      .populate('userId', 'profile.name');

    if (!template) {
      throw new AppError('テンプレートが見つかりません', 404);
    }

    // アクセス権限チェック
    const isOwner = req.user && template.userId._id.toString() === req.user._id.toString();
    const isPublic = template.metadata.shareSettings.isPublic;
    const hasAccess = isOwner || isPublic;

    if (!hasAccess) {
      throw new AppError('このテンプレートへのアクセス権限がありません', 403);
    }

    // 閲覧数を増やす（所有者以外）
    if (!isOwner) {
      await template.incrementViewCount();
    }

    res.status(200).json({
      success: true,
      data: {
        template: isOwner ? template : template.getPublicView(),
        permissions: {
          canEdit: isOwner,
          canDownload: true,
          canDuplicate: true
        }
      }
    });
  })
);

/**
 * @route   PUT /api/templates/:id
 * @desc    テンプレートを更新
 * @access  Private (所有者のみ)
 */
router.put('/:id',
  protect,
  validateTemplateUpdate,
  asyncHandler(async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (!template) {
      throw new AppError('テンプレートが見つかりません', 404);
    }

    if (template.userId.toString() !== req.user._id.toString()) {
      throw new AppError('このテンプレートを編集する権限がありません', 403);
    }

    // 更新可能なフィールドのみ更新
    const updateableFields = [
      'title', 'subject', 'gradeLevel', 'duration',
      'content', 'customizations', 'metadata.tags',
      'metadata.shareSettings', 'status'
    ];

    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field.includes('.')) {
          // ネストされたフィールドの処理
          const [parent, child] = field.split('.');
          if (!template[parent]) template[parent] = {};
          template[parent][child] = req.body[field];
        } else {
          template[field] = req.body[field];
        }
      }
    });

    // バージョンを更新
    await template.updateVersion();

    res.status(200).json({
      success: true,
      message: 'テンプレートを更新しました',
      data: {
        template: template.getSummary(),
        version: template.metadata.version
      }
    });
  })
);

/**
 * @route   DELETE /api/templates/:id
 * @desc    テンプレートを削除（アーカイブ）
 * @access  Private (所有者のみ)
 */
router.delete('/:id',
  protect,
  asyncHandler(async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (!template) {
      throw new AppError('テンプレートが見つかりません', 404);
    }

    if (template.userId.toString() !== req.user._id.toString()) {
      throw new AppError('このテンプレートを削除する権限がありません', 403);
    }

    // 物理削除ではなくアーカイブ
    template.status = 'archived';
    await template.save();

    res.status(200).json({
      success: true,
      message: 'テンプレートをアーカイブしました'
    });
  })
);

/**
 * @route   POST /api/templates/:id/duplicate
 * @desc    テンプレートを複製
 * @access  Private
 */
router.post('/:id/duplicate',
  protect,
  validateTemplateDuplicate,
  asyncHandler(async (req, res) => {
    const { title, modifications = {} } = req.body;

    const newTemplate = await TemplateGeneratorService.duplicateTemplate(
      req.params.id,
      req.user._id,
      {
        title,
        ...modifications
      }
    );

    res.status(201).json({
      success: true,
      message: 'テンプレートを複製しました',
      data: {
        template: newTemplate.getSummary(),
        templateId: newTemplate._id
      }
    });
  })
);

/**
 * @route   GET /api/templates/:id/download
 * @desc    テンプレートをPDFでダウンロード
 * @access  Private/Public (権限による)
 */
router.get('/:id/download',
  asyncHandler(async (req, res) => {
    const template = await Template.findById(req.params.id)
      .populate('teachingStyleId')
      .populate('diagnosisId');

    if (!template) {
      throw new AppError('テンプレートが見つかりません', 404);
    }

    // アクセス権限チェック
    const isOwner = req.user && template.userId.toString() === req.user._id.toString();
    const isPublic = template.metadata.shareSettings.isPublic;

    if (!isOwner && !isPublic) {
      throw new AppError('このテンプレートをダウンロードする権限がありません', 403);
    }

    // PDF生成
    const pdfData = await pdfGenerator.generateFromTemplate(template);

    // ダウンロード数を増やす
    await template.incrementDownloadCount();

    // ファイル情報を保存（所有者の場合）
    if (isOwner) {
      await template.addGeneratedFile('pdf', pdfData.url, pdfData.size);
    }

    res.status(200).json({
      success: true,
      data: {
        url: pdfData.url,
        filename: pdfData.filename,
        size: pdfData.size
      }
    });
  })
);

/**
 * @route   POST /api/templates/:id/preview
 * @desc    テンプレートのプレビューを生成
 * @access  Private (所有者のみ)
 */
router.post('/:id/preview',
  protect,
  asyncHandler(async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (!template) {
      throw new AppError('テンプレートが見つかりません', 404);
    }

    if (template.userId.toString() !== req.user._id.toString()) {
      throw new AppError('このテンプレートのプレビューを生成する権限がありません', 403);
    }

    // プレビューPDFを生成（メモリ内）
    const previewBuffer = await pdfGenerator.generatePreview(template);

    // Base64エンコード
    const base64 = previewBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    res.status(200).json({
      success: true,
      data: {
        preview: dataUrl,
        size: previewBuffer.length
      }
    });
  })
);

/**
 * @route   POST /api/templates/:id/share
 * @desc    テンプレートの共有設定を更新
 * @access  Private (所有者のみ)
 */
router.post('/:id/share',
  protect,
  asyncHandler(async (req, res) => {
    const { isPublic, sharedWith = [] } = req.body;
    
    const template = await Template.findById(req.params.id);

    if (!template) {
      throw new AppError('テンプレートが見つかりません', 404);
    }

    if (template.userId.toString() !== req.user._id.toString()) {
      throw new AppError('このテンプレートの共有設定を変更する権限がありません', 403);
    }

    // 共有設定を更新
    template.metadata.shareSettings.isPublic = isPublic;
    
    if (sharedWith.length > 0) {
      template.metadata.shareSettings.sharedWith = sharedWith.map(share => ({
        userId: share.userId,
        permission: share.permission || 'view'
      }));
    }

    await template.save();

    res.status(200).json({
      success: true,
      message: '共有設定を更新しました',
      data: {
        shareSettings: template.metadata.shareSettings
      }
    });
  })
);

/**
 * @route   POST /api/templates/:id/feedback
 * @desc    テンプレートへのフィードバックを送信
 * @access  Private
 */
router.post('/:id/feedback',
  protect,
  asyncHandler(async (req, res) => {
    const { rating, effectiveness, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError('評価は1〜5の整数で入力してください', 400);
    }

    const template = await Template.findById(req.params.id);

    if (!template) {
      throw new AppError('テンプレートが見つかりません', 404);
    }

    // フィードバックを追加
    template.usageStats.feedback.push({
      userId: req.user._id,
      rating,
      comment
    });

    // 効果性評価を更新（あれば）
    if (effectiveness) {
      Object.keys(effectiveness).forEach(key => {
        if (template.usageStats.effectiveness[key] !== undefined) {
          // 平均を計算
          const currentValue = template.usageStats.effectiveness[key] || 0;
          const feedbackCount = template.usageStats.feedback.length;
          template.usageStats.effectiveness[key] = 
            (currentValue * (feedbackCount - 1) + effectiveness[key]) / feedbackCount;
        }
      });
    }

    await template.save();

    res.status(201).json({
      success: true,
      message: 'フィードバックを送信しました'
    });
  })
);

module.exports = router;