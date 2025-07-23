# 教員ナビゲーター診断SaaS

教員のパーソナリティを診断し、最適な授業スタイルを提案し、具体的な教材テンプレートを提供するWebサービスです。

## 🚀 セットアップ

### 前提条件
- Node.js 18以上
- MongoDB 5.0以上
- npm または yarn

### インストール手順

1. リポジトリのクローン
```bash
git clone [repository-url]
cd teacher-navigator-saas
```

2. バックエンドのセットアップ
```bash
cd server
npm install
cp .env.example .env
# .envファイルを編集して環境変数を設定
```

3. フロントエンドのセットアップ（後で追加予定）
```bash
cd ../client
npm install
```

4. MongoDBの起動
```bash
# ローカルでMongoDBを起動
mongod
```

5. 開発サーバーの起動
```bash
# バックエンド
cd server
npm run dev

# フロントエンド（後で追加予定）
cd client
npm start
```

## 📁 プロジェクト構造

```
teacher-navigator-saas/
├── server/                 # バックエンドサーバー
│   ├── routes/            # APIルート定義
│   ├── models/            # Mongooseモデル
│   ├── services/          # ビジネスロジック
│   ├── middleware/        # Express ミドルウェア
│   ├── utils/             # ユーティリティ関数
│   └── server.js          # サーバーエントリーポイント
├── client/                # フロントエンド（React）
└── _docs/                 # 実装ログ
```

## 🛠️ 技術スタック

- **バックエンド**: Node.js, Express.js, MongoDB (Mongoose)
- **フロントエンド**: React, Material-UI, React Router
- **認証**: JWT, bcrypt
- **その他**: PDFKit (PDF生成), Nodemailer (メール送信)

## 📚 API エンドポイント

- `GET /` - APIルート情報
- `POST /api/auth/register` - ユーザー登録（実装予定）
- `POST /api/auth/login` - ログイン（実装予定）
- `GET /api/diagnosis/questions` - 診断質問取得（実装予定）
- `POST /api/diagnosis/submit` - 診断結果送信（実装予定）

## 🧪 テスト

```bash
# ユニットテスト実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

## 📝 開発ルール

開発時は `CLAUDE.md` に記載されたルールに従ってください。