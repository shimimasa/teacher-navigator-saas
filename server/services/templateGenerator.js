const Template = require('../models/Template');
const TeachingStyle = require('../models/TeachingStyle');
const Diagnosis = require('../models/Diagnosis');
const { AppError } = require('../middleware/errorHandler');

class TemplateGeneratorService {
  /**
   * 診断結果と授業スタイルに基づいてテンプレートを生成
   * @param {Object} params - 生成パラメータ
   * @returns {Object} 生成されたテンプレート
   */
  static async generateTemplate(params) {
    const {
      userId,
      diagnosisId,
      teachingStyleId,
      title,
      subject,
      gradeLevel,
      duration,
      templateType = 'lesson_plan',
      customizations = {}
    } = params;

    // 診断結果の取得
    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis || diagnosis.userId.toString() !== userId.toString()) {
      throw new AppError('診断結果が見つかりません', 404);
    }

    // 授業スタイルの取得
    const teachingStyle = await TeachingStyle.findById(teachingStyleId);
    if (!teachingStyle) {
      throw new AppError('授業スタイルが見つかりません', 404);
    }

    // テンプレートの基本構造を作成
    const template = new Template({
      userId,
      teachingStyleId,
      diagnosisId,
      title,
      subject,
      gradeLevel,
      duration,
      templateType,
      customizations: {
        ...this.getDefaultCustomizations(),
        ...customizations
      },
      metadata: {
        tags: this.generateTags(subject, gradeLevel, teachingStyle.name)
      }
    });

    // テンプレートタイプに応じてコンテンツを生成
    switch (templateType) {
      case 'lesson_plan':
        template.content.lessonPlan = await this.generateLessonPlanContent(
          teachingStyle,
          diagnosis.result,
          { subject, gradeLevel, duration }
        );
        break;
      case 'worksheet':
        template.content.worksheet = await this.generateWorksheetContent(
          teachingStyle,
          { subject, gradeLevel }
        );
        break;
      case 'assessment':
        template.content.assessment = await this.generateAssessmentContent(
          teachingStyle,
          { subject, gradeLevel }
        );
        break;
      case 'comprehensive':
        template.content.lessonPlan = await this.generateLessonPlanContent(
          teachingStyle,
          diagnosis.result,
          { subject, gradeLevel, duration }
        );
        template.content.worksheet = await this.generateWorksheetContent(
          teachingStyle,
          { subject, gradeLevel }
        );
        template.content.assessment = await this.generateAssessmentContent(
          teachingStyle,
          { subject, gradeLevel }
        );
        break;
    }

    return template;
  }

  /**
   * 授業計画コンテンツを生成
   * @private
   */
  static async generateLessonPlanContent(teachingStyle, diagnosisResult, options) {
    const { subject, gradeLevel, duration } = options;
    const personalityType = diagnosisResult.personalityType;

    // 授業スタイルに基づいた活動を生成
    const activities = this.generateActivities(
      teachingStyle,
      duration,
      personalityType
    );

    return {
      overview: this.generateOverview(teachingStyle, subject, gradeLevel),
      objectives: this.generateObjectives(subject, gradeLevel, teachingStyle),
      materials: this.generateMaterials(teachingStyle, subject, activities),
      activities,
      homework: this.generateHomework(subject, gradeLevel, teachingStyle)
    };
  }

  /**
   * ワークシートコンテンツを生成
   * @private
   */
  static async generateWorksheetContent(teachingStyle, options) {
    const { subject, gradeLevel } = options;

    return {
      instructions: this.generateWorksheetInstructions(teachingStyle),
      exercises: this.generateExercises(subject, gradeLevel, teachingStyle),
      totalPoints: 0 // モデルのpre saveで自動計算される
    };
  }

  /**
   * 評価基準コンテンツを生成
   * @private
   */
  static async generateAssessmentContent(teachingStyle, options) {
    const { subject, gradeLevel } = options;

    return {
      type: this.determineAssessmentType(teachingStyle),
      criteria: this.generateAssessmentCriteria(teachingStyle, subject),
      rubric: this.generateRubric(teachingStyle),
      feedbackGuidelines: this.generateFeedbackGuidelines(teachingStyle)
    };
  }

  /**
   * 授業の概要を生成
   * @private
   */
  static generateOverview(teachingStyle, subject, gradeLevel) {
    const templates = {
      'structured-facilitator': `本授業では、${subject}の基本概念を体系的に学習します。明確な枠組みに沿って、生徒が主体的に学習できるよう段階的な指導を行います。`,
      'creative-explorer': `${subject}の学習を通じて、生徒の創造性と探究心を育てます。自由な発想と実験的なアプローチで、新しい発見を促します。`,
      'systematic-instructor': `${gradeLevel}の${subject}において必要な知識を、順序立てて確実に習得します。基礎から応用まで、着実なステップで学習を進めます。`,
      'empathetic-mentor': `生徒一人ひとりの理解度に配慮しながら、${subject}の学習をサポートします。個別のニーズに応じた指導を心がけます。`,
      'dynamic-demonstrator': `エネルギッシュな実演と対話を通じて、${subject}の魅力を伝えます。生徒の興味を引き出し、積極的な参加を促します。`,
      'analytical-coach': `データと論理に基づいて${subject}を学習します。批判的思考力を養いながら、深い理解を目指します。`,
      'collaborative-organizer': `グループワークと協働学習を中心に、${subject}の理解を深めます。学習コミュニティの形成を通じて、相互学習を促進します。`,
      'practical-demonstrator': `実践的な活動を通じて、${subject}の実用的なスキルを身につけます。体験型学習で、即戦力となる知識を習得します。`
    };

    return templates[teachingStyle.name] || `${gradeLevel}の${subject}を効果的に学習します。`;
  }

  /**
   * 学習目標を生成
   * @private
   */
  static generateObjectives(subject, gradeLevel, teachingStyle) {
    const baseObjectives = [
      `${subject}の基本概念を理解する`,
      `学習内容を実生活に関連付けて考える`,
      `批判的思考力を養う`
    ];

    // スタイル特有の目標を追加
    const styleSpecificObjectives = {
      'structured-facilitator': ['体系的な知識構造を構築する'],
      'creative-explorer': ['創造的な問題解決能力を育成する'],
      'systematic-instructor': ['段階的に知識を積み上げる'],
      'empathetic-mentor': ['個人の成長を促進する'],
      'dynamic-demonstrator': ['学習への興味・関心を高める'],
      'analytical-coach': ['データ分析能力を向上させる'],
      'collaborative-organizer': ['協働スキルを発展させる'],
      'practical-demonstrator': ['実践的なスキルを習得する']
    };

    const specificObjectives = styleSpecificObjectives[teachingStyle.name] || [];
    
    return [...baseObjectives, ...specificObjectives];
  }

  /**
   * 必要な教材を生成
   * @private
   */
  static generateMaterials(teachingStyle, subject, activities) {
    const baseMaterials = [
      { name: '教科書', quantity: '生徒数分', notes: `${subject}の指定教科書` },
      { name: 'ワークシート', quantity: '生徒数分', notes: '本テンプレート付属' }
    ];

    // スタイル特有の教材
    const styleMaterials = {
      'creative-explorer': [
        { name: '画用紙・色鉛筆', quantity: '各グループ分', notes: '創作活動用' }
      ],
      'practical-demonstrator': [
        { name: '実験・実習用具', quantity: '適量', notes: '実践活動に必要' }
      ],
      'collaborative-organizer': [
        { name: '付箋・模造紙', quantity: '各グループ分', notes: 'グループワーク用' }
      ],
      'analytical-coach': [
        { name: 'データ資料', quantity: '生徒数分', notes: '分析課題用' }
      ]
    };

    const additionalMaterials = styleMaterials[teachingStyle.name] || [];

    return [...baseMaterials, ...additionalMaterials];
  }

  /**
   * 授業活動を生成
   * @private
   */
  static generateActivities(teachingStyle, totalDuration, personalityType) {
    const activityTemplates = {
      'structured-facilitator': [
        {
          name: '導入：本日の学習目標の確認',
          duration: Math.floor(totalDuration * 0.1),
          description: '本日の学習内容と目標を明確に提示',
          teachingMethod: '構造化された説明',
          studentActivity: '目標の理解と質問',
          assessment: '理解度の確認質問'
        },
        {
          name: '展開1：基本概念の説明',
          duration: Math.floor(totalDuration * 0.25),
          description: '段階的に基本概念を解説',
          teachingMethod: 'スライドと板書を使った体系的説明',
          studentActivity: 'ノートテイキングと質問',
          assessment: '確認問題への取り組み'
        },
        {
          name: '展開2：演習と実践',
          duration: Math.floor(totalDuration * 0.35),
          description: '学んだ内容を実践的に応用',
          teachingMethod: '個別指導とグループサポート',
          studentActivity: '問題演習とディスカッション',
          assessment: '演習の進捗確認'
        },
        {
          name: '展開3：発展的学習',
          duration: Math.floor(totalDuration * 0.2),
          description: '応用問題への挑戦',
          teachingMethod: 'ファシリテーション',
          studentActivity: '発展問題への取り組み',
          assessment: '思考過程の観察'
        },
        {
          name: 'まとめ：振り返りと次回予告',
          duration: Math.floor(totalDuration * 0.1),
          description: '学習内容の整理と定着',
          teachingMethod: '要点の整理',
          studentActivity: '振り返りシートの記入',
          assessment: '自己評価'
        }
      ],
      'creative-explorer': [
        {
          name: '導入：創造的な問いかけ',
          duration: Math.floor(totalDuration * 0.15),
          description: '興味を引く問いかけで授業開始',
          teachingMethod: 'オープンエンドな質問',
          studentActivity: 'ブレインストーミング',
          assessment: 'アイデアの多様性'
        },
        {
          name: '展開1：探究活動',
          duration: Math.floor(totalDuration * 0.4),
          description: '自由な探究と実験',
          teachingMethod: '最小限の介入',
          studentActivity: '実験・創作活動',
          assessment: '探究プロセスの観察'
        },
        {
          name: '展開2：共有と発展',
          duration: Math.floor(totalDuration * 0.3),
          description: '発見の共有と議論',
          teachingMethod: 'ファシリテーション',
          studentActivity: 'プレゼンテーション',
          assessment: '創造性と独自性'
        },
        {
          name: 'まとめ：新たな問いの発見',
          duration: Math.floor(totalDuration * 0.15),
          description: '次の探究への橋渡し',
          teachingMethod: '振り返りの促進',
          studentActivity: '新しい問いの設定',
          assessment: '探究意欲'
        }
      ]
      // 他のスタイルも同様に定義...
    };

    const defaultActivities = [
      {
        name: '導入',
        duration: Math.floor(totalDuration * 0.15),
        description: '本日の学習内容の導入',
        teachingMethod: '講義形式',
        studentActivity: '聴講とメモ',
        assessment: '理解度確認'
      },
      {
        name: '展開',
        duration: Math.floor(totalDuration * 0.6),
        description: 'メインの学習活動',
        teachingMethod: '対話的指導',
        studentActivity: '演習と実践',
        assessment: '形成的評価'
      },
      {
        name: 'まとめ',
        duration: Math.floor(totalDuration * 0.25),
        description: '学習内容のまとめ',
        teachingMethod: '振り返り指導',
        studentActivity: '振り返りと質問',
        assessment: '総括的評価'
      }
    ];

    return activityTemplates[teachingStyle.name] || defaultActivities;
  }

  /**
   * 宿題を生成
   * @private
   */
  static generateHomework(subject, gradeLevel, teachingStyle) {
    const homeworkTemplates = {
      'structured-facilitator': {
        description: `本日学習した内容の復習問題（教科書p.○○-○○）を解き、要点をノートにまとめる。`,
        estimatedTime: 30
      },
      'creative-explorer': {
        description: `今日の学習内容に関連する独自の研究テーマを設定し、調査計画を立てる。`,
        estimatedTime: 45
      },
      'practical-demonstrator': {
        description: `学習した技能を実生活で応用し、その結果をレポートにまとめる。`,
        estimatedTime: 40
      }
      // 他のスタイルも同様...
    };

    return homeworkTemplates[teachingStyle.name] || {
      description: `本日の学習内容を復習し、練習問題に取り組む。`,
      estimatedTime: 30
    };
  }

  /**
   * ワークシートの指示を生成
   * @private
   */
  static generateWorksheetInstructions(teachingStyle) {
    const instructions = {
      'structured-facilitator': '以下の問題に順番に取り組みましょう。各問題は前の問題の理解を基に作られています。',
      'creative-explorer': '自由な発想で問題に取り組みましょう。正解は一つとは限りません。',
      'analytical-coach': '各問題について、答えだけでなく理由も明確に説明してください。'
    };

    return instructions[teachingStyle.name] || '以下の問題に取り組みましょう。';
  }

  /**
   * 練習問題を生成
   * @private
   */
  static generateExercises(subject, gradeLevel, teachingStyle) {
    // 基本的な問題構成
    const exercises = [
      {
        questionNumber: 1,
        questionType: 'multiple_choice',
        question: `${subject}の基本概念に関する問題`,
        hints: ['教科書の第1章を参照'],
        points: 10
      },
      {
        questionNumber: 2,
        questionType: 'short_answer',
        question: `学習した内容を自分の言葉で説明してください`,
        hints: ['キーワードを使って説明しましょう'],
        points: 20
      },
      {
        questionNumber: 3,
        questionType: 'problem_solving',
        question: `応用問題：実生活での活用例を考えてみましょう`,
        hints: ['身近な例から考えてみましょう'],
        points: 30
      }
    ];

    // スタイルに応じた追加問題
    if (teachingStyle.name === 'creative-explorer') {
      exercises.push({
        questionNumber: 4,
        questionType: 'creative',
        question: '今日学んだことを使って、新しいアイデアを提案してください',
        hints: ['既存の枠にとらわれずに考えましょう'],
        points: 40
      });
    } else if (teachingStyle.name === 'analytical-coach') {
      exercises.push({
        questionNumber: 4,
        questionType: 'essay',
        question: 'データを分析し、結論を導き出してください',
        hints: ['論理的な構成を心がけましょう'],
        points: 40
      });
    }

    return exercises;
  }

  /**
   * 評価タイプを決定
   * @private
   */
  static determineAssessmentType(teachingStyle) {
    const assessmentTypes = {
      'structured-facilitator': 'formative',
      'creative-explorer': 'peer',
      'empathetic-mentor': 'self',
      'analytical-coach': 'summative',
      'collaborative-organizer': 'peer'
    };

    return assessmentTypes[teachingStyle.name] || 'formative';
  }

  /**
   * 評価基準を生成
   * @private
   */
  static generateAssessmentCriteria(teachingStyle, subject) {
    const baseCriteria = [
      {
        name: '知識・理解',
        description: `${subject}の基本概念を理解しているか`,
        weight: 30,
        levels: [
          { level: '優秀', score: 30, description: '深い理解を示している' },
          { level: '良好', score: 22, description: '基本的な理解がある' },
          { level: '可', score: 15, description: '最低限の理解がある' },
          { level: '要改善', score: 0, description: '理解が不十分' }
        ]
      },
      {
        name: '思考・判断',
        description: '学習内容を応用して考えることができるか',
        weight: 40,
        levels: [
          { level: '優秀', score: 40, description: '独創的な思考ができる' },
          { level: '良好', score: 30, description: '論理的に考えられる' },
          { level: '可', score: 20, description: '基本的な思考ができる' },
          { level: '要改善', score: 0, description: '思考力が不足' }
        ]
      }
    ];

    // スタイル特有の基準
    if (teachingStyle.characteristics.includes('creative')) {
      baseCriteria.push({
        name: '創造性・独自性',
        description: '独自の視点やアイデアを示せるか',
        weight: 30,
        levels: [
          { level: '優秀', score: 30, description: '非常に創造的' },
          { level: '良好', score: 22, description: '創造性がある' },
          { level: '可', score: 15, description: 'ある程度の創造性' },
          { level: '要改善', score: 0, description: '創造性が不足' }
        ]
      });
    } else if (teachingStyle.characteristics.includes('collaborative')) {
      baseCriteria.push({
        name: '協働・コミュニケーション',
        description: '他者と効果的に協力できるか',
        weight: 30,
        levels: [
          { level: '優秀', score: 30, description: '優れた協働スキル' },
          { level: '良好', score: 22, description: '良好な協働' },
          { level: '可', score: 15, description: '基本的な協働' },
          { level: '要改善', score: 0, description: '協働が困難' }
        ]
      });
    } else {
      baseCriteria.push({
        name: '技能・表現',
        description: '学習内容を適切に表現できるか',
        weight: 30,
        levels: [
          { level: '優秀', score: 30, description: '優れた表現力' },
          { level: '良好', score: 22, description: '良好な表現' },
          { level: '可', score: 15, description: '基本的な表現' },
          { level: '要改善', score: 0, description: '表現力不足' }
        ]
      });
    }

    return baseCriteria;
  }

  /**
   * ルーブリックを生成
   * @private
   */
  static generateRubric(teachingStyle) {
    return `評価は上記の基準に基づいて行います。各基準の達成度を総合的に判断し、生徒の成長を促す建設的なフィードバックを提供します。${teachingStyle.displayName}の特性を活かし、生徒の個性と強みを重視した評価を心がけます。`;
  }

  /**
   * フィードバックガイドラインを生成
   * @private
   */
  static generateFeedbackGuidelines(teachingStyle) {
    const guidelines = {
      'empathetic-mentor': '個々の生徒の成長を認め、励ましのメッセージを中心に。具体的な改善点は優しく示唆する。',
      'analytical-coach': '具体的なデータと根拠を示しながら、論理的に改善点を指摘。次のステップを明確に提示。',
      'creative-explorer': '創造性と独自性を評価し、さらなる探究を促すような前向きなコメントを提供。',
      'structured-facilitator': '達成度を明確に示し、次の学習目標に向けた具体的なアドバイスを提供。'
    };

    return guidelines[teachingStyle.name] || '生徒の成長を促す建設的なフィードバックを提供しましょう。';
  }

  /**
   * デフォルトのカスタマイズ設定
   * @private
   */
  static getDefaultCustomizations() {
    return {
      fontSize: 'medium',
      colorScheme: 'default',
      includeImages: true,
      language: 'ja',
      specialNeeds: {
        visualImpairment: false,
        hearingImpairment: false,
        learningDifficulties: false
      }
    };
  }

  /**
   * タグを生成
   * @private
   */
  static generateTags(subject, gradeLevel, styleName) {
    const tags = [subject, gradeLevel];
    
    // スタイル関連のタグ
    const styleTagMap = {
      'structured-facilitator': ['構造的', '体系的学習'],
      'creative-explorer': ['創造的', '探究学習'],
      'empathetic-mentor': ['個別指導', '共感的'],
      'analytical-coach': ['分析的', 'データ活用'],
      'collaborative-organizer': ['協働学習', 'グループワーク'],
      'practical-demonstrator': ['実践的', '体験学習']
    };

    const styleTags = styleTagMap[styleName] || [];
    
    return [...tags, ...styleTags];
  }

  /**
   * 既存のテンプレートを複製
   * @param {String} templateId - 複製元のテンプレートID
   * @param {String} userId - 複製先のユーザーID
   * @param {Object} modifications - 変更内容
   * @returns {Object} 新しいテンプレート
   */
  static async duplicateTemplate(templateId, userId, modifications = {}) {
    const originalTemplate = await Template.findById(templateId);
    
    if (!originalTemplate) {
      throw new AppError('テンプレートが見つかりません', 404);
    }

    // 公開テンプレートまたは自分のテンプレートのみ複製可能
    if (!originalTemplate.metadata.shareSettings.isPublic && 
        originalTemplate.userId.toString() !== userId.toString()) {
      throw new AppError('このテンプレートを複製する権限がありません', 403);
    }

    // 新しいテンプレートを作成
    const newTemplate = new Template({
      ...originalTemplate.toObject(),
      _id: undefined,
      userId,
      title: modifications.title || `${originalTemplate.title} (コピー)`,
      status: 'draft',
      createdAt: undefined,
      updatedAt: undefined,
      'metadata.version': 1,
      'metadata.generatedFiles': [],
      'usageStats.viewCount': 0,
      'usageStats.downloadCount': 0,
      'usageStats.feedback': []
    });

    // 変更内容を適用
    Object.assign(newTemplate, modifications);

    return newTemplate.save();
  }
}

module.exports = TemplateGeneratorService;