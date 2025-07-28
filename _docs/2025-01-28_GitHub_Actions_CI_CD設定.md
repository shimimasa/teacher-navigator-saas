# 2025-01-28 GitHub Actions CI/CD設定

## 実施内容

### GitHub Actions CI/CDパイプラインの構築

本番環境へのデプロイを自動化するため、GitHub ActionsによるCI/CDパイプラインを構築しました。

#### .github/workflows/ci.yml

包括的なCI/CDワークフローを作成しました：

1. **トリガー設定**
   - mainブランチとdevelopブランチへのpush時
   - Pull Request作成時
   
2. **ジョブ構成**

##### 1. Lint & Type Check
- バックエンドとフロントエンドのリント実行
- TypeScriptの型チェック
- コード品質の維持

##### 2. Backend Tests
- MongoDB/Redisサービスコンテナを使用
- ユニットテストと統合テスト
- カバレッジレポートの生成
- Codecovへのアップロード

##### 3. Frontend Tests
- Reactコンポーネントのテスト
- テストカバレッジの測定
- CI環境での実行最適化

##### 4. E2E Tests
- Playwrightによるエンドツーエンドテスト
- 実際のサーバー環境での動作確認
- テスト結果のアーティファクト保存

##### 5. Security Scan
- Trivyによる脆弱性スキャン
- npm auditによる依存関係チェック
- セキュリティレポートの生成

##### 6. Build Docker Images
- マルチステージビルド
- キャッシュの活用
- タグ付けとプッシュ

##### 7. Deploy to Development
- developブランチからの自動デプロイ
- 環境変数の管理
- Slack通知

##### 8. Deploy to Production
- mainブランチからの自動デプロイ
- スモークテストの実行
- リリース作成
- Slack通知

##### 9. Cleanup
- 古いDockerイメージの削除
- テストデータのクリーンアップ

#### .github/workflows/.env.test

CI/CD環境用のテスト環境変数ファイルを作成しました。セキュアでない値のみを含み、実際のシークレットはGitHub Secretsで管理します。

#### Dockerファイルの作成

##### server/Dockerfile
- マルチステージビルドで最適化
- 非rootユーザーでの実行
- ヘルスチェックの実装
- シグナルハンドリング（dumb-init）

##### client/Dockerfile
- ビルドステージでの最適化
- Nginxでの静的ファイル配信
- セキュリティヘッダーの設定
- gzip圧縮の有効化

##### client/nginx.conf
- パフォーマンス最適化設定
- セキュリティヘッダー
- React SPAのルーティング対応
- APIプロキシ設定
- キャッシュ戦略

## 技術的な選択と理由

### CI/CDパイプライン設計

1. **並列実行**
   - テストジョブの並列化で時間短縮
   - 依存関係の明確化

2. **段階的デプロイ**
   - develop → 開発環境
   - main → 本番環境
   - 環境ごとの承認プロセス

3. **セキュリティ重視**
   - 脆弱性スキャンの自動化
   - セキュリティレポートの生成
   - シークレット管理

4. **観測可能性**
   - Slack通知
   - アーティファクト保存
   - リリース管理

### Docker最適化

1. **マルチステージビルド**
   - ビルド時の依存関係を本番イメージから除外
   - イメージサイズの削減

2. **セキュリティ**
   - 非rootユーザーでの実行
   - 最小権限の原則

3. **ヘルスチェック**
   - コンテナの健全性監視
   - 自動復旧の実現

## 必要なGitHub Secrets

以下のシークレットをGitHubリポジトリに設定する必要があります：

### 必須
- `DOCKER_USERNAME`: Docker Hubユーザー名
- `DOCKER_PASSWORD`: Docker Hubパスワード

### オプション（デプロイ用）
- `DEV_SSH_USER`: 開発サーバーSSHユーザー
- `DEV_SSH_HOST`: 開発サーバーホスト
- `PROD_SSH_USER`: 本番サーバーSSHユーザー
- `PROD_SSH_HOST`: 本番サーバーホスト
- `SLACK_WEBHOOK`: Slack通知用Webhook URL

### 環境別設定
- 各環境のAPI Keys
- データベース接続情報
- 外部サービスの認証情報

## 次のステップ

### 即座に実行可能
1. プロジェクトREADMEの作成
2. APIドキュメントの生成
3. デプロイスクリプトの作成

### ユーザー実行タスク
1. GitHubリポジトリの作成
2. GitHub Secretsの設定
3. Docker Hubアカウントの設定
4. 初回のコミットとプッシュ
5. CI/CDパイプラインの動作確認

## 完了状況
- ✅ .github/workflows/ci.yml の作成
- ✅ テスト用環境変数ファイルの作成
- ✅ Dockerファイルの作成（server/client）
- ✅ Nginx設定ファイルの作成

GitHub Actions CI/CD設定が完了しました。これにより、コードの品質保証と自動デプロイが可能になります。