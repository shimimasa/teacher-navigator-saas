# 教員ナビゲーター診断SaaS

教員のパーソナリティを診断し、最適な授業スタイルを提案する革新的なWebサービスです。科学的根拠に基づいた診断により、教員一人ひとりの個性と強みを活かした効果的な授業設計をサポートします。

## 🌟 主な機能

### 📊 パーソナリティ診断
- 教育に特化した診断質問システム
- 段階的な質問提示で負担を軽減
- 診断結果の視覚的表示
- 診断履歴の保存と比較

### 🎯 授業スタイル提案
- パーソナリティに基づく最適なスタイル推奨
- 複数スタイルの優先度付き提案
- 教科・学年別のカスタマイズ
- 詳細な実践方法の解説

### 📝 教材テンプレート生成
- 授業計画テンプレートの自動生成
- ワークシート・評価基準の作成
- カスタマイズ可能な編集機能
- PDF/Word形式でのダウンロード

### 📈 分析・レポート機能
- 診断結果の推移グラフ
- 教材使用状況の追跡
- 個人成長レポートの生成
- 6ヶ月間の活動サマリー

## 🛠 技術スタック

### バックエンド
- **Node.js 18** + **Express.js** - サーバーサイドフレームワーク
- **MongoDB** - NoSQLデータベース
- **Mongoose** - MongoDB ODM
- **JWT** - 認証システム
- **PDFKit** - PDF生成
- **Nodemailer** - メール送信

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Material-UI** - UIコンポーネント
- **React Router** - ルーティング
- **Axios** - HTTP通信
- **Chart.js** - グラフ表示

### インフラ・DevOps
- **Docker** - コンテナ化
- **GitHub Actions** - CI/CD
- **Nginx** - リバースプロキシ
- **Redis** - セッション管理（オプション）

## 📋 必要な環境

- Node.js 18以上
- MongoDB 6.0以上
- Docker & Docker Compose（推奨）

## 🚀 セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/teacher-navigator-saas.git
cd teacher-navigator-saas
```

### 2. 環境変数の設定

#### バックエンド設定
```bash
cd server
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

#### フロントエンド設定
```bash
cd ../client
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

### 3. Dockerを使用する場合（推奨）
```bash
# プロジェクトルートで実行
docker-compose up -d
```

### 4. ローカル開発環境の場合

#### MongoDBの起動
```bash
# Dockerを使用する場合
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# または、ローカルにインストールされたMongoDBを起動
```

#### バックエンドの起動
```bash
cd server
npm install
npm run dev
```

#### フロントエンドの起動
```bash
cd client
npm install
npm start
```

### 5. 初期データの投入
```bash
cd server
npm run seed
```

## 🔧 開発

### 開発サーバーの起動
```bash
# バックエンド（ポート5000）
cd server && npm run dev

# フロントエンド（ポート3000）
cd client && npm start
```

### テストの実行
```bash
# バックエンドテスト
cd server && npm test

# フロントエンドテスト
cd client && npm test
```

### コードチェック
```bash
# バックエンド
cd server && npm run lint

# フロントエンド
cd client && npm run lint
```

## 📦 ビルド

### Docker イメージのビルド
```bash
# バックエンド
docker build -t teacher-navigator-backend ./server

# フロントエンド
docker build -t teacher-navigator-frontend ./client
```

### プロダクションビルド
```bash
# フロントエンドのビルド
cd client && npm run build

# バックエンドは直接実行
cd server && npm start
```

## 🚀 デプロイ

### GitHub Actionsを使用した自動デプロイ

1. GitHub Secretsの設定:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - その他必要な環境変数

2. ブランチへのプッシュ:
   - `develop` → 開発環境へ自動デプロイ
   - `main` → 本番環境へ自動デプロイ

### 手動デプロイ
```bash
# Dockerイメージのプッシュ
docker push yourusername/teacher-navigator-backend:latest
docker push yourusername/teacher-navigator-frontend:latest

# サーバーでの実行
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 プロジェクト構造

```
teacher-navigator-saas/
├── client/                 # フロントエンドアプリケーション
│   ├── public/            # 静的ファイル
│   ├── src/               # ソースコード
│   │   ├── components/    # UIコンポーネント
│   │   ├── pages/         # ページコンポーネント
│   │   ├── services/      # API通信
│   │   ├── hooks/         # カスタムフック
│   │   ├── types/         # TypeScript型定義
│   │   └── utils/         # ユーティリティ
│   └── package.json
├── server/                 # バックエンドアプリケーション
│   ├── models/            # Mongooseモデル
│   ├── routes/            # APIルート
│   ├── middleware/        # Express ミドルウェア
│   ├── services/          # ビジネスロジック
│   ├── utils/             # ユーティリティ
│   └── package.json
├── docker-compose.yml      # Docker構成
└── README.md              # このファイル
```

## 🔒 セキュリティ

- JWT認証による安全なユーザー管理
- bcryptによるパスワードハッシュ化
- CORS設定による不正アクセス防止
- レート制限による過負荷防止
- 入力値検証とサニタイゼーション
- HTTPS通信の強制（本番環境）

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！詳細は[CONTRIBUTING.md](CONTRIBUTING.md)をご覧ください。

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 📞 サポート

- Issue: [GitHub Issues](https://github.com/yourusername/teacher-navigator-saas/issues)
- Email: support@example.com
- Documentation: [Wiki](https://github.com/yourusername/teacher-navigator-saas/wiki)

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトを使用しています：
- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Material-UI](https://mui.com/)

---

Made with ❤️ for educators