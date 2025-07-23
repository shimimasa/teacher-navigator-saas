const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdirp = require('mkdirp');

class PDFGeneratorService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/pdfs');
    this.fonts = {
      japanese: path.join(__dirname, '../assets/fonts/NotoSansJP-Regular.ttf'),
      bold: path.join(__dirname, '../assets/fonts/NotoSansJP-Bold.ttf')
    };
    this.colors = {
      primary: '#2c3e50',
      secondary: '#3498db',
      accent: '#e74c3c',
      text: '#333333',
      lightGray: '#ecf0f1',
      mediumGray: '#95a5a6'
    };
  }

  /**
   * テンプレートからPDFを生成
   * @param {Object} template - テンプレートデータ
   * @param {Object} options - 生成オプション
   * @returns {Object} { filename, filepath, size }
   */
  async generateFromTemplate(template, options = {}) {
    await mkdirp(this.uploadDir);
    
    const filename = `${template._id}_${Date.now()}.pdf`;
    const filepath = path.join(this.uploadDir, filename);
    
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: template.title,
        Author: 'Teacher Navigator SaaS',
        Subject: template.subject,
        Keywords: template.metadata.tags.join(', ')
      }
    });

    // ストリームの設定
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    try {
      // カスタマイズ設定の適用
      this.applyCustomizations(doc, template.customizations);

      // ヘッダーの生成
      this.generateHeader(doc, template);

      // コンテンツの生成（テンプレートタイプに応じて）
      switch (template.templateType) {
        case 'lesson_plan':
          await this.generateLessonPlan(doc, template);
          break;
        case 'worksheet':
          await this.generateWorksheet(doc, template);
          break;
        case 'assessment':
          await this.generateAssessment(doc, template);
          break;
        case 'comprehensive':
          await this.generateComprehensive(doc, template);
          break;
      }

      // フッターの生成
      this.generateFooter(doc, template);

      // PDFの完成
      doc.end();

      // ストリームの完了を待つ
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // ファイルサイズの取得
      const stats = await promisify(fs.stat)(filepath);

      return {
        filename,
        filepath,
        size: stats.size,
        url: `/uploads/pdfs/${filename}`
      };
    } catch (error) {
      // エラー時はファイルを削除
      if (fs.existsSync(filepath)) {
        await promisify(fs.unlink)(filepath);
      }
      throw error;
    }
  }

  /**
   * カスタマイズ設定を適用
   * @private
   */
  applyCustomizations(doc, customizations) {
    // フォントサイズの設定
    const fontSizes = {
      small: { title: 16, heading: 14, body: 10 },
      medium: { title: 20, heading: 16, body: 12 },
      large: { title: 24, heading: 18, body: 14 }
    };
    
    this.fontSize = fontSizes[customizations.fontSize || 'medium'];
  }

  /**
   * ヘッダーを生成
   * @private
   */
  generateHeader(doc, template) {
    // タイトル
    doc.fontSize(this.fontSize.title)
       .fillColor(this.colors.primary)
       .text(template.title, { align: 'center' });
    
    doc.moveDown(0.5);
    
    // 基本情報
    doc.fontSize(this.fontSize.body)
       .fillColor(this.colors.text);
    
    const info = [
      `教科: ${template.subject}`,
      `学年: ${template.gradeLevel}`,
      `時間: ${template.duration}分`
    ];
    
    doc.text(info.join(' | '), { align: 'center' });
    
    // 区切り線
    doc.moveDown();
    doc.strokeColor(this.colors.lightGray)
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke();
    
    doc.moveDown();
  }

  /**
   * 授業計画を生成
   * @private
   */
  async generateLessonPlan(doc, template) {
    const lessonPlan = template.content.lessonPlan;
    
    // 概要
    if (lessonPlan.overview) {
      this.addSection(doc, '授業の概要', lessonPlan.overview);
    }
    
    // 学習目標
    if (lessonPlan.objectives.length > 0) {
      this.addSection(doc, '学習目標');
      lessonPlan.objectives.forEach((objective, index) => {
        doc.fontSize(this.fontSize.body)
           .fillColor(this.colors.text)
           .text(`${index + 1}. ${objective}`, { indent: 20 });
      });
      doc.moveDown();
    }
    
    // 必要な教材
    if (lessonPlan.materials.length > 0) {
      this.addSection(doc, '必要な教材');
      
      lessonPlan.materials.forEach(material => {
        let materialText = `• ${material.name}`;
        if (material.quantity) materialText += ` (${material.quantity})`;
        if (material.notes) materialText += ` - ${material.notes}`;
        
        doc.fontSize(this.fontSize.body)
           .fillColor(this.colors.text)
           .text(materialText, { indent: 20 });
      });
      doc.moveDown();
    }
    
    // 授業の流れ
    if (lessonPlan.activities.length > 0) {
      this.addSection(doc, '授業の流れ');
      
      lessonPlan.activities.forEach((activity, index) => {
        // 活動のヘッダー
        doc.fontSize(this.fontSize.body)
           .fillColor(this.colors.secondary)
           .text(`${index + 1}. ${activity.name} (${activity.duration}分)`, { underline: true });
        
        doc.moveDown(0.5);
        
        // 活動の詳細
        const details = [];
        if (activity.description) details.push(`内容: ${activity.description}`);
        if (activity.teachingMethod) details.push(`指導方法: ${activity.teachingMethod}`);
        if (activity.studentActivity) details.push(`生徒の活動: ${activity.studentActivity}`);
        if (activity.assessment) details.push(`評価: ${activity.assessment}`);
        
        details.forEach(detail => {
          doc.fontSize(this.fontSize.body - 1)
             .fillColor(this.colors.text)
             .text(detail, { indent: 30 });
        });
        
        doc.moveDown();
      });
    }
    
    // 宿題
    if (lessonPlan.homework && lessonPlan.homework.description) {
      this.addSection(doc, '宿題');
      doc.fontSize(this.fontSize.body)
         .fillColor(this.colors.text)
         .text(lessonPlan.homework.description, { indent: 20 });
      
      if (lessonPlan.homework.estimatedTime) {
        doc.text(`予想所要時間: ${lessonPlan.homework.estimatedTime}分`, { indent: 20 });
      }
    }
  }

  /**
   * ワークシートを生成
   * @private
   */
  async generateWorksheet(doc, template) {
    const worksheet = template.content.worksheet;
    
    // 指示
    if (worksheet.instructions) {
      this.addSection(doc, '指示', worksheet.instructions);
    }
    
    // 問題
    if (worksheet.exercises.length > 0) {
      this.addSection(doc, '問題');
      
      worksheet.exercises.forEach((exercise, index) => {
        // 問題番号と配点
        let header = `問${exercise.questionNumber || index + 1}`;
        if (exercise.points) header += ` (${exercise.points}点)`;
        
        doc.fontSize(this.fontSize.body)
           .fillColor(this.colors.primary)
           .text(header, { underline: true });
        
        doc.moveDown(0.5);
        
        // 問題文
        doc.fontSize(this.fontSize.body)
           .fillColor(this.colors.text)
           .text(exercise.question, { indent: 20 });
        
        // ヒント（あれば）
        if (exercise.hints && exercise.hints.length > 0) {
          doc.moveDown(0.5);
          doc.fontSize(this.fontSize.body - 1)
             .fillColor(this.colors.mediumGray)
             .text('ヒント:', { indent: 20 });
          
          exercise.hints.forEach(hint => {
            doc.text(`• ${hint}`, { indent: 30 });
          });
        }
        
        // 回答スペース
        this.addAnswerSpace(doc, exercise.questionType);
        
        doc.moveDown();
      });
      
      // 合計点
      if (worksheet.totalPoints) {
        doc.fontSize(this.fontSize.body)
           .fillColor(this.colors.primary)
           .text(`合計: ${worksheet.totalPoints}点`, { align: 'right' });
      }
    }
  }

  /**
   * 評価基準を生成
   * @private
   */
  async generateAssessment(doc, template) {
    const assessment = template.content.assessment;
    
    // 評価タイプ
    if (assessment.type) {
      const typeLabels = {
        formative: '形成的評価',
        summative: '総括的評価',
        diagnostic: '診断的評価',
        peer: '相互評価',
        self: '自己評価'
      };
      
      this.addSection(doc, '評価タイプ', typeLabels[assessment.type] || assessment.type);
    }
    
    // 評価基準
    if (assessment.criteria.length > 0) {
      this.addSection(doc, '評価基準');
      
      assessment.criteria.forEach((criterion, index) => {
        // 基準名と配分
        doc.fontSize(this.fontSize.body)
           .fillColor(this.colors.secondary)
           .text(`${index + 1}. ${criterion.name} (${criterion.weight}%)`, { underline: true });
        
        doc.moveDown(0.5);
        
        // 説明
        if (criterion.description) {
          doc.fontSize(this.fontSize.body - 1)
             .fillColor(this.colors.text)
             .text(criterion.description, { indent: 20 });
        }
        
        // レベル
        if (criterion.levels && criterion.levels.length > 0) {
          doc.moveDown(0.5);
          
          // テーブル形式でレベルを表示
          const tableTop = doc.y;
          const colWidth = 120;
          
          criterion.levels.forEach((level, i) => {
            const x = 70 + (i * colWidth);
            
            // レベル名
            doc.fontSize(this.fontSize.body - 1)
               .fillColor(this.colors.primary)
               .text(level.level, x, tableTop);
            
            // スコア
            doc.fontSize(this.fontSize.body - 2)
               .fillColor(this.colors.text)
               .text(`${level.score}点`, x, tableTop + 15);
            
            // 説明
            if (level.description) {
              doc.fontSize(this.fontSize.body - 2)
                 .text(level.description, x, tableTop + 30, {
                   width: colWidth - 10,
                   height: 60,
                   ellipsis: true
                 });
            }
          });
          
          doc.y = tableTop + 100;
        }
        
        doc.moveDown();
      });
    }
    
    // ルーブリック
    if (assessment.rubric) {
      this.addSection(doc, 'ルーブリック', assessment.rubric);
    }
    
    // フィードバックガイドライン
    if (assessment.feedbackGuidelines) {
      this.addSection(doc, 'フィードバックガイドライン', assessment.feedbackGuidelines);
    }
  }

  /**
   * 総合テンプレートを生成
   * @private
   */
  async generateComprehensive(doc, template) {
    // 各セクションを順番に生成
    await this.generateLessonPlan(doc, template);
    
    if (doc.y > 700) doc.addPage();
    doc.moveDown(2);
    
    await this.generateWorksheet(doc, template);
    
    if (doc.y > 700) doc.addPage();
    doc.moveDown(2);
    
    await this.generateAssessment(doc, template);
  }

  /**
   * セクションを追加
   * @private
   */
  addSection(doc, title, content = null) {
    doc.fontSize(this.fontSize.heading)
       .fillColor(this.colors.primary)
       .text(title);
    
    doc.moveDown(0.5);
    
    if (content) {
      doc.fontSize(this.fontSize.body)
         .fillColor(this.colors.text)
         .text(content, { indent: 20 });
      
      doc.moveDown();
    }
  }

  /**
   * 回答スペースを追加
   * @private
   */
  addAnswerSpace(doc, questionType) {
    doc.moveDown(0.5);
    
    switch (questionType) {
      case 'multiple_choice':
        // 選択肢用のスペース
        for (let i = 0; i < 4; i++) {
          doc.fontSize(this.fontSize.body)
             .fillColor(this.colors.lightGray)
             .text('○ _________________', { indent: 30 });
        }
        break;
        
      case 'short_answer':
        // 短い回答用の線
        doc.strokeColor(this.colors.lightGray)
           .lineWidth(0.5);
        
        for (let i = 0; i < 2; i++) {
          doc.moveTo(70, doc.y + 10)
             .lineTo(500, doc.y + 10)
             .stroke();
          doc.moveDown(1.5);
        }
        break;
        
      case 'essay':
      case 'creative':
        // 長い回答用のスペース
        doc.rect(70, doc.y, 450, 100)
           .strokeColor(this.colors.lightGray)
           .lineWidth(0.5)
           .stroke();
        doc.y += 110;
        break;
        
      case 'problem_solving':
        // 計算スペース
        doc.rect(70, doc.y, 450, 150)
           .strokeColor(this.colors.lightGray)
           .lineWidth(0.5)
           .stroke();
        doc.y += 160;
        break;
    }
  }

  /**
   * フッターを生成
   * @private
   */
  generateFooter(doc, template) {
    const pages = doc.bufferedPageRange();
    
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      
      // ページ番号
      doc.fontSize(10)
         .fillColor(this.colors.mediumGray)
         .text(
           `${i + 1} / ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
      
      // 作成日
      doc.fontSize(8)
         .text(
           `作成日: ${new Date().toLocaleDateString('ja-JP')}`,
           50,
           doc.page.height - 35,
           { align: 'left' }
         );
      
      // ロゴまたはサービス名
      doc.text(
        'Teacher Navigator SaaS',
        50,
        doc.page.height - 35,
        { align: 'right' }
      );
    }
  }

  /**
   * PDFファイルを削除
   * @param {String} filename - ファイル名
   */
  async deleteFile(filename) {
    const filepath = path.join(this.uploadDir, filename);
    
    if (fs.existsSync(filepath)) {
      await promisify(fs.unlink)(filepath);
    }
  }

  /**
   * 一時的なプレビューPDFを生成
   * @param {Object} templateData - テンプレートデータ（保存前）
   * @returns {Buffer} PDFバッファ
   */
  async generatePreview(templateData) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // 簡易版のPDF生成
    this.generateHeader(doc, templateData);
    
    doc.fontSize(14)
       .fillColor(this.colors.primary)
       .text('プレビュー', { align: 'center' });
    
    doc.moveDown();
    
    doc.fontSize(12)
       .fillColor(this.colors.text)
       .text('これはプレビュー版です。実際のPDFとは異なる場合があります。');

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }
}

module.exports = new PDFGeneratorService();