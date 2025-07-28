# コントリビューションガイド

教員ナビゲーター診断SaaSプロジェクトへの貢献をありがとうございます！このガイドでは、プロジェクトへの貢献方法について説明します。

## 📋 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [コーディング規約](#コーディング規約)
- [ブランチ戦略](#ブランチ戦略)
- [コミットメッセージ](#コミットメッセージ)
- [プルリクエスト](#プルリクエスト)
- [テスト](#テスト)
- [ドキュメント](#ドキュメント)
- [Issue の報告](#issue-の報告)

## 🛠 開発環境のセットアップ

1. リポジトリをフォークし、ローカルにクローンします
```bash
git clone https://github.com/yourusername/teacher-navigator-saas.git
cd teacher-navigator-saas
```

2. 上流リポジトリを追加します
```bash
git remote add upstream https://github.com/original/teacher-navigator-saas.git
```

3. 依存関係をインストールします
```bash
# バックエンド
cd server && npm install

# フロントエンド
cd ../client && npm install
```

4. 環境変数を設定します
```bash
# バックエンド
cd server && cp .env.example .env

# フロントエンド
cd ../client && cp .env.example .env
```

## 📝 コーディング規約

### JavaScript/TypeScript

#### 一般的なルール
- ES6+の機能を積極的に使用する
- `var`の使用は避け、`const`と`let`を使用する
- セミコロンを使用する
- インデントは2スペース
- 文字列は原則シングルクォートを使用（JSX内はダブルクォート）

#### 命名規則
```javascript
// 変数名・関数名: camelCase
const userProfile = {};
function getUserData() {}

// クラス名・コンポーネント名: PascalCase
class UserManager {}
function UserProfile() {}

// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// ファイル名
// - コンポーネント: PascalCase (例: UserProfile.tsx)
// - その他: camelCase (例: userService.js)
```

#### コード例
```javascript
// Good
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Bad
var calculate_total = function(items) {
  var sum = 0;
  for(var i = 0; i < items.length; i++) {
    sum += items[i].price;
  }
  return sum;
}
```

### React/TypeScript

#### コンポーネント
```typescript
// 関数コンポーネントを使用
interface Props {
  title: string;
  isActive?: boolean;
}

const Header: React.FC<Props> = ({ title, isActive = false }) => {
  return (
    <header className={isActive ? 'active' : ''}>
      <h1>{title}</h1>
    </header>
  );
};

export default Header;
```

#### Hooks
```typescript
// カスタムフックは use で始める
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // 認証ロジック
  }, []);
  
  return { user, login, logout };
};
```

### CSS/スタイリング
- Material-UIのスタイリングシステムを使用
- カスタムスタイルは`makeStyles`または`styled`を使用
- グローバルスタイルは最小限に

## 🌲 ブランチ戦略

### ブランチ構成
- `main` - 本番環境用ブランチ
- `develop` - 開発用ブランチ
- `feature/*` - 新機能開発
- `bugfix/*` - バグ修正
- `hotfix/*` - 緊急修正
- `release/*` - リリース準備

### ブランチ命名例
```bash
feature/user-authentication
bugfix/fix-login-error
hotfix/security-patch
release/v1.2.0
```

### ワークフロー
1. `develop`から新しいブランチを作成
2. 変更を実装
3. `develop`にプルリクエストを作成
4. コードレビュー後にマージ

## 💬 コミットメッセージ

### フォーマット
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正や機能追加を伴わないコード変更
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

### 例
```bash
feat(auth): implement JWT authentication

- Add login endpoint
- Add token validation middleware
- Add user session management

Closes #123
```

## 🔀 プルリクエスト

### プルリクエストを作成する前に

1. 最新の`develop`ブランチを取り込む
```bash
git checkout develop
git pull upstream develop
git checkout your-branch
git rebase develop
```

2. テストを実行し、すべてパスすることを確認
```bash
npm test
```

3. コードスタイルをチェック
```bash
npm run lint
```

### プルリクエストテンプレート

```markdown
## 概要
変更の概要を記載してください。

## 変更内容
- [ ] 機能A を実装
- [ ] バグB を修正
- [ ] テストを追加

## 関連Issue
Closes #

## テスト方法
1. 手順1
2. 手順2

## スクリーンショット（UIの変更がある場合）

## チェックリスト
- [ ] コードがプロジェクトのスタイルガイドに従っている
- [ ] セルフレビューを実施した
- [ ] 適切なテストを追加した
- [ ] ドキュメントを更新した
```

### レビュープロセス

1. 最低1人のレビュアーの承認が必要
2. CIがすべてパスしている
3. コンフリクトが解決されている
4. レビューコメントに対応している

## 🧪 テスト

### テストの書き方

#### バックエンド（Jest）
```javascript
describe('AuthService', () => {
  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password');
      expect(result).toHaveProperty('token');
      expect(result.token).toMatch(/^Bearer /);
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        authService.login('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

#### フロントエンド（React Testing Library）
```typescript
describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'ログイン' }));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

### テストカバレッジ

- 新しいコードは80%以上のカバレッジを目指す
- 重要なビジネスロジックは100%カバー
- E2Eテストで主要なユーザーフローをカバー

## 📚 ドキュメント

### コード内ドキュメント

```javascript
/**
 * ユーザーの診断結果を計算する
 * @param {Array<Answer>} answers - ユーザーの回答リスト
 * @param {DiagnosisConfig} config - 診断設定
 * @returns {DiagnosisResult} 診断結果
 * @throws {ValidationError} 回答が不正な場合
 */
function calculateDiagnosisResult(answers, config) {
  // 実装
}
```

### APIドキュメント
- 新しいエンドポイントは`API.md`に追加
- Swagger/OpenAPIスペックの更新（実装予定）

### ユーザードキュメント
- 新機能はユーザーガイドに追加
- スクリーンショットを含める

## 🐛 Issue の報告

### バグ報告テンプレート

```markdown
## バグの概要
バグの簡潔な説明

## 再現手順
1. '...'にアクセス
2. '...'をクリック
3. '...'までスクロール
4. エラーが発生

## 期待される動作
正常な場合の動作

## 実際の動作
現在の動作

## スクリーンショット
可能であれば添付

## 環境
- OS: [例: macOS 12.0]
- ブラウザ: [例: Chrome 96]
- Node.js: [例: 18.0.0]
```

### 機能リクエストテンプレート

```markdown
## 機能の概要
提案する機能の説明

## 解決したい問題
この機能で解決される問題

## 提案する解決策
どのように実装するか

## 代替案
他の解決方法

## 追加情報
参考リンクなど
```

## 🤝 行動規範

- 建設的で礼儀正しいコミュニケーション
- 多様性を尊重し、包括的な環境を維持
- 他者の意見を尊重
- 個人攻撃やハラスメントは禁止

## 📧 質問・サポート

- 一般的な質問: [Discussions](https://github.com/yourusername/teacher-navigator-saas/discussions)
- バグ報告: [Issues](https://github.com/yourusername/teacher-navigator-saas/issues)
- セキュリティ問題: security@example.com （公開Issueにしない）

---

貢献していただきありがとうございます！ 🎉