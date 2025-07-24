# CLAUDE.md

このプロジェクトで作業する際は、要件書（requirements.md）、設計書（design.md）、タスクリスト（tasks.md）を参照し、実装の一貫性を保つようにしてください。

## 📋 実装ログ管理ルール
- **保存先**: `_docs/` ディレクトリ
- **ファイル名**: `yyyy-mm-dd_機能名.md` 形式
- **起動時動作**: AIは起動時に `_docs/` 内の実装ログを自動的に読み込み、プロジェクトの経緯を把握する

## 🤖 AI運用6原則

### 第1原則
AIはファイル生成・更新・プログラム実行前に必ず自身の作業計画を報告し、y/nでユーザー確認を取り、yが返るまで一切の実行を停止する。

### 第2原則
AIは迂回や別アプローチを勝手に行わず、最初の計画が失敗したら次の計画の確認を取る。

### 第3原則
AIはツールであり決定権は常にユーザーにある。ユーザーの提案が非効率・非合理的でも最適化せず、指示された通りに実行する。

### 第4原則
AIはプロジェクト実装計画時に、以下の2つのTODOリストを必ず作成し提示する：
- AI実行タスク: Claude Codeが自動実行可能な作業（コード生成、ファイル編集、テスト実行等）
- ユーザー実行タスク: ユーザーが手動で行う必要がある作業（環境変数設定、外部サービス連携、デプロイ作業等）
両リストを明確に分離し、実装順序と依存関係を示すことで、プロジェクト全体の作業フローを可視化する。

### 第5原則
AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

### 第6原則
AIは全てのチャットの冒頭にこの6原則を逐語的に必ず画面出力してから対応する。

## ビルドおよび開発コマンド

### セットアップ
```bash
# プロジェクトルートで
docker-compose up -d  # MongoDB起動

# バックエンドセットアップ
cd server
npm install
cp .env.example .env  # 環境変数設定
npm run seed  # 初期データ投入

# フロントエンドセットアップ
cd ../client
npm install
```

### 開発
```bash
# バックエンド開発サーバー
cd server
npm run dev  # http://localhost:5000

# フロントエンド開発サーバー
cd client
npm start  # http://localhost:3000
```

### ビルド
```bash
# フロントエンドビルド
cd client
npm run build

# バックエンドは本番環境で直接実行
cd server
npm start
```

### テスト
```bash
# バックエンドテスト
cd server
npm test  # 全テスト実行
npm run test:watch  # ウォッチモード
npm run test:coverage  # カバレッジ付き

# フロントエンドテスト
cd client
npm test  # テスト実行
```

## アーキテクチャ概要

### コアシステム
- **バックエンド**: Express + MongoDB + Mongoose
- **フロントエンド**: React + TypeScript + Material-UI
- **認証**: JWT（JSON Web Token）
- **データベース**: MongoDB（Dockerコンテナ）
- **メール送信**: Nodemailer
- **PDF生成**: PDFKit

### データフロー
1. **プレゼンテーション層**: React コンポーネント
2. **API層**: Express RESTful API
3. **ビジネスロジック層**: サービス関数
4. **データアクセス層**: Mongoose ODM
5. **データベース層**: MongoDB

### 主要ディレクトリ

#### バックエンド（server/）
- `models/`: Mongooseスキーマ定義
  - User.js: ユーザーモデル
  - Diagnosis.js: 診断モデル
  - TeachingStyle.js: 授業スタイルモデル
  - Template.js: テンプレートモデル
- `routes/`: APIエンドポイント
  - auth.js: 認証関連
  - diagnosis.js: 診断関連
  - teachingStyle.js: 授業スタイル関連
  - template.js: テンプレート関連
- `middleware/`: Express ミドルウェア
  - auth.js: JWT認証
  - validation.js: リクエスト検証
  - errorHandler.js: エラー処理
  - security.js: セキュリティ設定
- `services/`: ビジネスロジック
  - diagnosisEngine.js: 診断ロジック
  - styleRecommender.js: スタイル推奨エンジン
  - pdfGenerator.js: PDF生成
  - emailService.js: メール送信
  - templateGenerator.js: テンプレート生成
- `data/`: 静的データ
  - diagnosisQuestions.json: 診断質問
  - teachingStyles.json: 授業スタイルデータ
- `utils/`: ユーティリティ
  - database.js: DB接続
  - constants.js: 定数定義
  - seeder.js: 初期データ投入

#### フロントエンド（client/）
- `src/components/`: UIコンポーネント
  - Common/: 共通コンポーネント
  - Diagnosis/: 診断関連
  - TeachingStyle/: 授業スタイル関連
  - Template/: テンプレート関連
  - Analytics/: 分析ダッシュボード
  - Layout/: レイアウト
  - PrivateRoute/: 認証ルート
- `src/pages/`: ページコンポーネント
  - Login/: ログイン
  - Register/: 登録
  - Home/: ホーム
  - Diagnosis/: 診断ウィザード・結果
  - TeachingStyles/: スタイル一覧・詳細
  - Templates/: テンプレート管理
  - Analytics/: 分析・レポート
- `src/services/`: API通信
  - api.ts: Axios設定
  - auth.ts: 認証API
  - diagnosis.ts: 診断API
  - teachingStyle.ts: スタイルAPI
  - template.ts: テンプレートAPI
  - analytics.ts: 分析API
- `src/contexts/`: React Context
  - AuthContext.tsx: 認証状態管理
- `src/hooks/`: カスタムフック
  - useDebounce.ts: デバウンス
  - useError.ts: エラー処理
  - useForm.ts: フォーム管理
  - useInfiniteScroll.ts: 無限スクロール
  - useLoading.ts: ローディング状態
  - usePermission.ts: 権限チェック
- `src/types/`: TypeScript型定義
  - auth.ts: 認証関連
  - diagnosis.ts: 診断関連
  - teachingStyle.ts: スタイル関連
  - template.ts: テンプレート関連
  - analytics.ts: 分析関連
- `src/utils/`: ユーティリティ
  - validation.ts: バリデーション
  - security.ts: セキュリティ
  - performance.ts: パフォーマンス最適化

## 重要な開発上の注意点

### 環境変数

#### バックエンド（.env）
```
# サーバー設定
PORT=5000
NODE_ENV=development

# データベース
MONGODB_URI=mongodb://localhost:27017/teacher_navigator

# JWT設定
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=30d

# メール設定（任意）
EMAIL_FROM=noreply@example.com
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### フロントエンド
- 開発時はpackage.jsonのproxyでバックエンドへ自動転送
- 本番環境では`REACT_APP_API_URL`を設定

### セキュリティ
- JWT認証（30日有効期限）
- パスワードはbcryptでハッシュ化
- Helmet.jsでセキュリティヘッダー設定
- CORS設定（本番環境で要調整）
- 入力検証（express-validator）
- XSS対策（DOMPurify使用推奨）

### パフォーマンス最適化
- React.lazy() による遅延読み込み
- 仮想リスト（大量データ表示時）
- デバウンス（検索・入力処理）
- エラーバウンダリ実装
- メモ化（React.memo, useMemo）

## 一般的な開発タスク

### 新しいAPIエンドポイントの追加
1. `server/routes/`に新しいルートファイルを作成
2. 必要なミドルウェアを適用（認証、検証等）
3. `server/server.js`でルートを登録
4. 対応するテストケースを作成
5. フロントエンドのサービスファイルを更新

### 新しいページの追加
1. `client/src/pages/`に新しいページコンポーネント作成
2. 必要なコンポーネントを`components/`に作成
3. ルーティングを`App.tsx`に追加
4. 必要に応じて認証保護（PrivateRoute）を適用
5. 対応するTypeScript型を定義

### 診断質問の追加・修正
1. `server/data/diagnosisQuestions.json`を編集
2. 診断ロジックを`diagnosisEngine.js`で調整
3. フロントエンドの表示を確認
4. 初期データを再投入（`npm run seed`）

### 授業スタイルの追加
1. `server/data/teachingStyles.json`に追加
2. スタイル推奨ロジックを更新
3. フロントエンドの表示コンポーネントを確認
4. 関連するテストを更新

## 実装済み機能
- ✅ ユーザー認証（登録、ログイン、パスワードリセット）
- ✅ 診断システム（質問管理、結果算出、履歴保存）
- ✅ 授業スタイル管理（CRUD、検索、フィルタリング）
- ✅ スタイル推奨エンジン（AIベース）
- ✅ テンプレート管理（作成、編集、共有、エクスポート）
- ✅ PDF生成機能（診断結果、テンプレート）
- ✅ 分析ダッシュボード（統計、グラフ、レポート）
- ✅ レスポンシブデザイン（モバイル対応）
- ✅ セキュリティ実装（認証、認可、入力検証）
- ✅ テスト基盤（Jest、Supertest）

## 次の実装予定
- メール通知機能の完全実装
- ソーシャルログイン（Google、Microsoft）
- 多言語対応
- リアルタイム通知
- 高度な分析機能

## トラブルシューティング

### よくある問題
1. **MongoDBに接続できない**
   - `docker-compose up -d`でコンテナ起動確認
   - ポート27017が使用可能か確認

2. **CORSエラー**
   - 開発時はproxyが正しく設定されているか確認
   - 本番環境ではCORS設定を適切に更新

3. **JWT認証エラー**
   - JWT_SECRETが設定されているか確認
   - トークンの有効期限を確認

4. **ビルドエラー（TypeScript）**
   - 型定義ファイルが最新か確認
   - `npm install`で依存関係を再インストール