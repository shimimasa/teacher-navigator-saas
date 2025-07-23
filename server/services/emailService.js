const nodemailer = require('nodemailer');
const { AppError } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../utils/constants');

class EmailService {
  constructor() {
    // 開発環境と本番環境で異なる設定
    if (process.env.NODE_ENV === 'production') {
      // 本番環境のメール設定
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // 開発環境では Ethereal Email を使用（テスト用）
      this.createTestTransporter();
    }
  }

  // テスト用トランスポーターの作成
  async createTestTransporter() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (error) {
      console.error('テスト用メールトランスポーターの作成に失敗:', error);
    }
  }

  // メール送信の基本メソッド
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `教員ナビゲーター <${process.env.EMAIL_USER || 'noreply@teacher-navigator.com'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      const info = await this.transporter.sendMail(mailOptions);

      // 開発環境ではプレビューURLを表示
      if (process.env.NODE_ENV !== 'production') {
        console.log('メッセージ送信: %s', info.messageId);
        console.log('プレビューURL: %s', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('メール送信エラー:', error);
      throw new AppError('メールの送信に失敗しました', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // パスワードリセットメール送信
  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;
    
    const subject = 'パスワードリセットのご案内';
    
    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h1 style="color: #333; text-align: center;">教員ナビゲーター</h1>
          <h2 style="color: #666; text-align: center;">パスワードリセットのご案内</h2>
          
          <div style="background-color: white; padding: 30px; border-radius: 5px; margin-top: 20px;">
            <p style="color: #333; font-size: 16px;">
              ${userName} 様
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              パスワードリセットのリクエストを受け付けました。<br>
              以下のボタンをクリックして、新しいパスワードを設定してください。
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                パスワードをリセットする
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              このリンクは1時間有効です。<br>
              心当たりがない場合は、このメールを無視してください。<br>
              お客様のパスワードは変更されません。
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              ボタンが機能しない場合は、以下のURLをブラウザにコピー＆ペーストしてください：<br>
              <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            © 2025 教員ナビゲーター. All rights reserved.
          </p>
        </div>
      </div>
    `;
    
    const text = `
${userName} 様

パスワードリセットのリクエストを受け付けました。
以下のURLから新しいパスワードを設定してください。

${resetUrl}

このリンクは1時間有効です。
心当たりがない場合は、このメールを無視してください。

教員ナビゲーター
    `;

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  // ウェルカムメール送信
  async sendWelcomeEmail(email, userName) {
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;
    
    const subject = '教員ナビゲーターへようこそ！';
    
    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h1 style="color: #333; text-align: center;">教員ナビゲーター</h1>
          <h2 style="color: #28a745; text-align: center;">ご登録ありがとうございます！</h2>
          
          <div style="background-color: white; padding: 30px; border-radius: 5px; margin-top: 20px;">
            <p style="color: #333; font-size: 16px;">
              ${userName} 様
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              教員ナビゲーターへのご登録、誠にありがとうございます。<br>
              これから、あなたの教育スタイルに合った最適な授業設計をサポートいたします。
            </p>
            
            <h3 style="color: #333; margin-top: 30px;">始め方</h3>
            <ol style="color: #666; font-size: 14px; line-height: 1.8;">
              <li>パーソナリティ診断を受ける</li>
              <li>診断結果に基づいた授業スタイルを確認</li>
              <li>カスタマイズ可能な教材テンプレートを活用</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                ログインして始める
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; line-height: 1.6;">
              ご不明な点がございましたら、お気軽にサポートまでお問い合わせください。
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            © 2025 教員ナビゲーター. All rights reserved.
          </p>
        </div>
      </div>
    `;
    
    const text = `
${userName} 様

教員ナビゲーターへのご登録、誠にありがとうございます。
これから、あなたの教育スタイルに合った最適な授業設計をサポートいたします。

始め方：
1. パーソナリティ診断を受ける
2. 診断結果に基づいた授業スタイルを確認
3. カスタマイズ可能な教材テンプレートを活用

ログインはこちら: ${loginUrl}

ご不明な点がございましたら、お気軽にサポートまでお問い合わせください。

教員ナビゲーター
    `;

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  // アカウント削除確認メール
  async sendAccountDeletionEmail(email, userName) {
    const subject = 'アカウント削除完了のお知らせ';
    
    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h1 style="color: #333; text-align: center;">教員ナビゲーター</h1>
          
          <div style="background-color: white; padding: 30px; border-radius: 5px; margin-top: 20px;">
            <p style="color: #333; font-size: 16px;">
              ${userName} 様
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              アカウントの削除が完了しました。<br>
              これまでご利用いただき、誠にありがとうございました。
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              またのご利用を心よりお待ちしております。
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            © 2025 教員ナビゲーター. All rights reserved.
          </p>
        </div>
      </div>
    `;
    
    const text = `
${userName} 様

アカウントの削除が完了しました。
これまでご利用いただき、誠にありがとうございました。

またのご利用を心よりお待ちしております。

教員ナビゲーター
    `;

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }
}

module.exports = new EmailService();