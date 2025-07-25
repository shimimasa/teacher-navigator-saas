# ユーザー実行タスク一覧

このドキュメントは、教員ナビゲーター診断SaaSの開発において、Claude Codeでは自動化できず、ユーザーが手動で実行する必要がある作業をまとめたものです。

## 📋 タスク概要

ユーザーが手動で行う必要がある作業は、主に以下の8つのカテゴリに分類されます：

1. 開発環境構築・初期設定
2. Docker環境設定（MongoDB）
3. データベース設定とデータ投入
4. 環境変数設定
5. メール送信設定
6. PDF生成環境設定
7. テスト・検証作業
8. デプロイメント・運用設定

---

## 1. 開発環境構築・初期設定

### 1.1 Node.jsとnpmのインストール
- **作業内容**: Node.js（v18以上推奨）とnpmのインストール
- **確認コマンド**:
  ```bash
  node --version
  npm --version
  ```
- **理由**: Node.js/Express/Reactプロジェクトの実行に必要

### 1.2 Dockerのインストール
- **作業内容**: Docker DesktopまたはDocker Engineのインストール
- **確認コマンド**:
  ```bash
  docker --version
  docker-compose --version
  ```
- **理由**: MongoDBコンテナの実行に必要
- **参考URL**: https://docs.docker.com/get-docker/

### 1.3 Git初期化とバージョン管理
- **作業内容**: Gitリポジトリの初期化
- **実行コマンド**:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  ```

### 1.4 プロジェクト構造の確認
- **作業内容**: サーバー（server/）とクライアント（client/）ディレクトリ構造の確認
- **構造**:
  ```
  teacher-navigator-saas/
  ├── server/       # バックエンド
  ├── client/       # フロントエンド
  └── docker-compose.yml
  ```

---

## 2. Docker環境設定（MongoDB）

### 2.1 docker-compose.ymlの作成・確認
- **作業内容**: MongoDBコンテナ設定の確認
- **設定例**:
  ```yaml
  version: '3.8'
  services:
    mongodb:
      image: mongo:6.0
      container_name: teacher_navigator_db
      ports:
        - "27017:27017"
      environment:
        MONGO_INITDB_DATABASE: teacher_navigator
      volumes:
        - mongodb_data:/data/db
  volumes:
    mongodb_data:
  ```

### 2.2 MongoDBコンテナの起動
- **実行コマンド**:
  ```bash
  docker-compose up -d
  ```
- **確認コマンド**:
  ```bash
  docker ps
  docker logs teacher_navigator_db
  ```

### 2.3 MongoDB接続確認
- **作業内容**: MongoDB Compassや mongo shellでの接続確認
- **接続URL**: `mongodb://localhost:27017/teacher_navigator`

---

## 3. データベース設定とデータ投入

### 3.1 初期データの準備
- **作業内容**: 診断質問と授業スタイルデータの準備
- **必要なデータ**:
  - `diagnosisQuestions.json`: 診断質問（教育に特化した心理測定）
  - `teachingStyles.json`: 授業スタイルデータ
- **データ形式例**:
  ```json
  // diagnosisQuestions.json
  {
    "questions": [
      {
        "id": "q1",
        "text": "授業の計画を立てるとき、あなたは...",
        "options": [
          { "value": 1, "text": "詳細な計画を事前に準備する" },
          { "value": 2, "text": "大まかな流れを決めて柔軟に対応する" }
        ],
        "dimension": "judging"
      }
    ]
  }
  ```

### 3.2 シードデータの投入
- **実行コマンド**:
  ```bash
  cd server
  npm run seed
  ```
- **確認事項**: 診断質問と授業スタイルが正しくDBに登録されているか

### 3.3 データベースインデックスの設定
- **推奨インデックス**:
  - users.email (unique)
  - diagnoses.userId
  - templates.userId
- **理由**: クエリパフォーマンスの最適化

---

## 4. 環境変数設定

### 4.1 バックエンド環境変数（.env）
- **作業内容**: `server/.env.example`をコピーして設定
- **実行コマンド**:
  ```bash
  cd server
  cp .env.example .env
  ```
- **設定内容**:
  ```env
  # サーバー設定
  PORT=5000
  NODE_ENV=development
  
  # データベース
  MONGODB_URI=mongodb://localhost:27017/teacher_navigator
  
  # JWT設定
  JWT_SECRET=your-super-secret-jwt-key-here  # 32文字以上のランダム文字列
  JWT_EXPIRE=30d
  
  # メール設定（オプション）
  EMAIL_FROM=noreply@your-domain.com
  EMAIL_SERVICE=gmail
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASS=your-app-specific-password  # Gmailの場合はアプリパスワード
  
  # CORS設定（本番環境）
  CLIENT_URL=http://localhost:3000  # 本番: https://your-domain.com
  ```

### 4.2 フロントエンド環境変数
- **開発環境**: package.jsonのproxyで自動設定済み
- **本番環境**: 
  ```env
  REACT_APP_API_URL=https://api.your-domain.com
  ```

### 4.3 JWT秘密鍵の生成
- **推奨方法**:
  ```bash
  # ランダムな秘密鍵生成
  openssl rand -base64 32
  ```
- **重要**: 本番環境では必ず強力な秘密鍵を使用

---

## 5. メール送信設定

### 5.1 Gmail設定（推奨）
- **作業内容**: Gmailアプリパスワードの取得
- **手順**:
  1. Googleアカウントの2段階認証を有効化
  2. アプリパスワードを生成
  3. 生成されたパスワードを.envに設定
- **参考URL**: https://support.google.com/accounts/answer/185833

### 5.2 その他のメールサービス
- **選択肢**:
  - SendGrid（本番環境推奨）
  - AWS SES
  - Mailgun
- **注意**: 各サービスのAPI設定が必要

### 5.3 メールテンプレートの作成
- **必要なテンプレート**:
  - ウェルカムメール
  - パスワードリセット
  - 診断完了通知
- **保存場所**: `server/templates/emails/`

---

## 6. PDF生成環境設定

### 6.1 PDFKit依存関係
- **作業内容**: システムフォントの確認
- **必要なフォント**: 日本語フォント（IPAフォント等）
- **インストール例（Ubuntu/Debian）**:
  ```bash
  sudo apt-get install fonts-ipafont
  ```

### 6.2 フォント設定
- **作業内容**: PDFKitで使用する日本語フォントの設定
- **設定場所**: `server/services/pdfGenerator.js`
- **注意**: ライセンスフリーのフォントを使用

### 6.3 PDF生成テスト
- **確認項目**:
  - 日本語が正しく表示されるか
  - レイアウトが崩れていないか
  - ファイルサイズが適切か（1MB以下推奨）

---

## 7. テスト・検証作業

### 7.1 ローカル環境での動作確認
- **起動手順**:
  ```bash
  # ターミナル1: バックエンド
  cd server
  npm run dev
  
  # ターミナル2: フロントエンド
  cd client
  npm start
  ```
- **アクセスURL**: http://localhost:3000

### 7.2 機能テスト
- **確認項目**:
  - ユーザー登録・ログイン
  - 診断フロー（質問→結果→推奨）
  - テンプレート生成・PDF出力
  - データ永続性（再ログイン後のデータ確認）

### 7.3 パフォーマンステスト
- **測定項目**:
  - API応答時間（目標: 3秒以内）
  - 同時接続テスト（目標: 100ユーザー）
- **ツール**: Apache Bench、Artillery

### 7.4 セキュリティテスト
- **確認項目**:
  - パスワードハッシュ化
  - JWT有効期限
  - 入力値検証
  - XSS/CSRF対策

### 7.5 ブラウザ互換性
- **対象ブラウザ**:
  - Chrome（最新版）
  - Firefox（最新版）
  - Safari（最新版）
  - Edge（最新版）
- **確認項目**: レイアウト、機能動作、レスポンシブ対応

---

## 8. デプロイメント・運用設定

### 8.1 本番データベース設定
- **選択肢**:
  - MongoDB Atlas（推奨）
  - AWS DocumentDB
  - 自己管理MongoDB
- **設定項目**:
  - レプリカセット
  - 自動バックアップ
  - 接続制限（IPホワイトリスト）

### 8.2 ホスティング環境
- **バックエンド選択肢**:
  - Heroku
  - AWS EC2/ECS
  - Google Cloud Run
  - DigitalOcean App Platform
- **フロントエンド選択肢**:
  - Vercel（推奨）
  - Netlify
  - AWS S3 + CloudFront

### 8.3 CI/CDパイプライン
- **GitHub Actions設定例**:
  ```yaml
  name: Deploy
  on:
    push:
      branches: [main]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: npm test
    deploy:
      needs: test
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: npm run build
        - run: npm run deploy
  ```

### 8.4 SSL/HTTPS設定
- **作業内容**: SSL証明書の取得と設定
- **選択肢**:
  - Let's Encrypt（無料）
  - 有料SSL証明書
- **設定場所**: ロードバランサーまたはWebサーバー

### 8.5 監視・ログ設定
- **監視項目**:
  - サーバー稼働率
  - API応答時間
  - エラー率
  - データベース接続
- **推奨ツール**:
  - New Relic
  - Datadog
  - CloudWatch（AWS）

### 8.6 バックアップ戦略
- **バックアップ対象**:
  - MongoDBデータ
  - アップロードファイル
  - 環境設定
- **頻度**: 日次バックアップ（30日保持）
- **リストアテスト**: 月1回実施

---

## 📝 実行順序の推奨

### Phase 1: 開発環境構築（1日）
1. 開発環境構築（セクション1）
2. Docker環境設定（セクション2）
3. 環境変数設定（セクション4）

### Phase 2: データとサービス設定（1-2日）
1. データベース設定（セクション3）
2. メール送信設定（セクション5）
3. PDF生成環境（セクション6）

### Phase 3: 開発・テスト（2-3週間）
1. 開発作業（Claude Codeと並行）
2. 各種テスト実施（セクション7）

### Phase 4: 本番環境準備（3-5日）
1. 本番データベース設定（セクション8.1）
2. ホスティング環境構築（セクション8.2-8.4）
3. 監視・運用体制整備（セクション8.5-8.6）

---

## 🔄 継続的な作業

- データベースメンテナンス
- セキュリティアップデート
- ユーザーフィードバックの収集と反映
- 診断質問・授業スタイルの更新
- パフォーマンス監視と最適化

---

## 📌 重要な注意事項

1. **環境変数管理**: .envファイルは絶対にGitにコミットしない
2. **JWT秘密鍵**: 本番環境では必ず強力な鍵を使用
3. **データバックアップ**: 定期的なバックアップとリストアテスト
4. **スケーラビリティ**: 将来の成長を見据えた設計
5. **教育データの保護**: 個人情報とプライバシーの適切な管理

---

このドキュメントは、プロジェクトの進行に応じて更新される可能性があります。
最終更新日: 2025-07-25