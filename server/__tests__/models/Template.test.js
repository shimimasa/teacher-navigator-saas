const mongoose = require('mongoose');
const Template = require('../../models/Template');

describe('Template Model', () => {
  beforeAll(async () => {
    // テスト用のMongoDBメモリサーバーに接続
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Template.deleteMany({});
  });

  describe('テンプレートの作成', () => {
    it('有効なデータでテンプレートを作成できること', async () => {
      const templateData = {
        userId: new mongoose.Types.ObjectId(),
        teachingStyleId: new mongoose.Types.ObjectId(),
        diagnosisId: new mongoose.Types.ObjectId(),
        title: 'テスト授業計画',
        subject: '数学',
        gradeLevel: '中学1年',
        duration: 50,
        templateType: 'lesson_plan',
        content: {
          lessonPlan: {
            overview: 'テストの概要',
            objectives: ['目標1', '目標2'],
            activities: [{
              name: '導入',
              duration: 10,
              description: '活動の説明'
            }]
          }
        }
      };

      const template = new Template(templateData);
      const saved = await template.save();

      expect(saved._id).toBeDefined();
      expect(saved.title).toBe(templateData.title);
      expect(saved.status).toBe('draft');
      expect(saved.metadata.version).toBe(1);
    });

    it('必須フィールドがない場合エラーになること', async () => {
      const template = new Template({
        title: 'タイトルのみ'
      });

      await expect(template.save()).rejects.toThrow();
    });

    it('活動時間の合計が授業時間を超える場合エラーになること', async () => {
      const templateData = {
        userId: new mongoose.Types.ObjectId(),
        teachingStyleId: new mongoose.Types.ObjectId(),
        diagnosisId: new mongoose.Types.ObjectId(),
        title: 'テスト授業計画',
        subject: '数学',
        gradeLevel: '中学1年',
        duration: 50,
        templateType: 'lesson_plan',
        content: {
          lessonPlan: {
            activities: [
              { name: '活動1', duration: 30 },
              { name: '活動2', duration: 30 } // 合計60分で50分を超える
            ]
          }
        }
      };

      const template = new Template(templateData);
      await expect(template.save()).rejects.toThrow('活動の合計時間が授業時間を超えています');
    });
  });

  describe('仮想プロパティ', () => {
    it('授業計画の完成状態を正しく判定すること', async () => {
      const template = new Template({
        userId: new mongoose.Types.ObjectId(),
        teachingStyleId: new mongoose.Types.ObjectId(),
        diagnosisId: new mongoose.Types.ObjectId(),
        title: 'テスト',
        subject: '数学',
        gradeLevel: '中学1年',
        duration: 50,
        templateType: 'lesson_plan',
        content: {
          lessonPlan: {
            overview: '概要あり',
            objectives: ['目標1'],
            activities: [{ name: '活動1', duration: 10 }]
          }
        }
      });

      expect(template.isComplete).toBe(true);

      template.content.lessonPlan.overview = '';
      expect(template.isComplete).toBe(false);
    });

    it('ワークシートの完成状態を正しく判定すること', async () => {
      const template = new Template({
        userId: new mongoose.Types.ObjectId(),
        teachingStyleId: new mongoose.Types.ObjectId(),
        diagnosisId: new mongoose.Types.ObjectId(),
        title: 'テスト',
        subject: '数学',
        gradeLevel: '中学1年',
        duration: 50,
        templateType: 'worksheet',
        content: {
          worksheet: {
            instructions: '指示',
            exercises: [{ question: '問題1', points: 10 }]
          }
        }
      });

      expect(template.isComplete).toBe(true);

      template.content.worksheet.exercises = [];
      expect(template.isComplete).toBe(false);
    });
  });

  describe('インスタンスメソッド', () => {
    let template;

    beforeEach(async () => {
      template = await Template.create({
        userId: new mongoose.Types.ObjectId(),
        teachingStyleId: new mongoose.Types.ObjectId(),
        diagnosisId: new mongoose.Types.ObjectId(),
        title: 'テストテンプレート',
        subject: '数学',
        gradeLevel: '中学1年',
        duration: 50,
        templateType: 'lesson_plan'
      });
    });

    it('getSummaryが正しい要約を返すこと', () => {
      const summary = template.getSummary();

      expect(summary.id).toEqual(template._id);
      expect(summary.title).toBe(template.title);
      expect(summary.isComplete).toBeDefined();
      expect(summary.createdAt).toEqual(template.createdAt);
    });

    it('incrementViewCountが閲覧数を増やすこと', async () => {
      const initialCount = template.usageStats.viewCount;
      await template.incrementViewCount();

      const updated = await Template.findById(template._id);
      expect(updated.usageStats.viewCount).toBe(initialCount + 1);
      expect(updated.usageStats.lastUsed).toBeDefined();
    });

    it('addGeneratedFileがファイル情報を追加すること', async () => {
      await template.addGeneratedFile('pdf', '/path/to/file.pdf', 1024);

      const updated = await Template.findById(template._id);
      expect(updated.metadata.generatedFiles).toHaveLength(1);
      expect(updated.metadata.generatedFiles[0].format).toBe('pdf');
      expect(updated.metadata.generatedFiles[0].size).toBe(1024);
    });

    it('updateVersionがバージョンを更新すること', async () => {
      const initialVersion = template.metadata.version;
      const initialModified = template.metadata.lastModified;

      await new Promise(resolve => setTimeout(resolve, 10)); // 時間差を作る
      await template.updateVersion();

      const updated = await Template.findById(template._id);
      expect(updated.metadata.version).toBe(initialVersion + 1);
      expect(updated.metadata.lastModified.getTime()).toBeGreaterThan(initialModified.getTime());
    });
  });

  describe('静的メソッド', () => {
    let userId;
    let templates;

    beforeEach(async () => {
      userId = new mongoose.Types.ObjectId();
      const teachingStyleId = new mongoose.Types.ObjectId();
      const diagnosisId = new mongoose.Types.ObjectId();

      templates = await Template.create([
        {
          userId,
          teachingStyleId,
          diagnosisId,
          title: 'テンプレート1',
          subject: '数学',
          gradeLevel: '中学1年',
          duration: 50,
          templateType: 'lesson_plan',
          status: 'completed',
          metadata: {
            shareSettings: { isPublic: true },
            tags: ['数学', '代数']
          },
          usageStats: {
            downloadCount: 100,
            viewCount: 500
          }
        },
        {
          userId,
          teachingStyleId,
          diagnosisId,
          title: 'テンプレート2',
          subject: '英語',
          gradeLevel: '中学2年',
          duration: 50,
          templateType: 'worksheet',
          status: 'draft'
        },
        {
          userId: new mongoose.Types.ObjectId(), // 別のユーザー
          teachingStyleId,
          diagnosisId,
          title: 'テンプレート3',
          subject: '数学',
          gradeLevel: '中学1年',
          duration: 50,
          templateType: 'lesson_plan',
          status: 'completed',
          metadata: {
            shareSettings: { isPublic: true }
          }
        }
      ]);
    });

    it('findByUserがユーザーのテンプレートを返すこと', async () => {
      const results = await Template.findByUser(userId);
      
      expect(results).toHaveLength(2);
      expect(results.every(t => t.userId.equals(userId))).toBe(true);
    });

    it('findByUserがステータスでフィルタリングできること', async () => {
      const results = await Template.findByUser(userId, { status: 'completed' });
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('completed');
    });

    it('findPublicTemplatesが公開テンプレートを返すこと', async () => {
      const results = await Template.findPublicTemplates();
      
      expect(results).toHaveLength(2);
      expect(results.every(t => t.metadata.shareSettings.isPublic)).toBe(true);
      expect(results.every(t => t.status === 'completed')).toBe(true);
    });

    it('findPublicTemplatesがフィルタリングできること', async () => {
      const results = await Template.findPublicTemplates({
        subject: '数学',
        tags: ['代数']
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].subject).toBe('数学');
    });

    it('getPopularTemplatesが人気順で返すこと', async () => {
      const results = await Template.getPopularTemplates(2);
      
      expect(results).toHaveLength(2);
      expect(results[0].usageStats.downloadCount).toBeGreaterThanOrEqual(
        results[1].usageStats.downloadCount
      );
    });

    it('searchTemplatesが検索結果を返すこと', async () => {
      const results = await Template.searchTemplates('数学', userId);
      
      expect(results).toHaveLength(2); // 自分の1つ + 公開の1つ
      expect(results.some(t => t.subject === '数学')).toBe(true);
    });
  });

  describe('ワークシートの合計点数計算', () => {
    it('保存時に合計点数が自動計算されること', async () => {
      const template = new Template({
        userId: new mongoose.Types.ObjectId(),
        teachingStyleId: new mongoose.Types.ObjectId(),
        diagnosisId: new mongoose.Types.ObjectId(),
        title: 'ワークシート',
        subject: '数学',
        gradeLevel: '中学1年',
        duration: 50,
        templateType: 'worksheet',
        content: {
          worksheet: {
            exercises: [
              { question: '問題1', points: 10 },
              { question: '問題2', points: 20 },
              { question: '問題3', points: 30 }
            ]
          }
        }
      });

      await template.save();
      expect(template.content.worksheet.totalPoints).toBe(60);
    });
  });
});