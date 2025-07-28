# API ドキュメント

教員ナビゲーター診断SaaS REST API の仕様書です。

## 基本情報

### ベースURL
```
開発環境: http://localhost:5000/api
本番環境: https://api.yourdomain.com/api
```

### 認証
- JWT (JSON Web Token) を使用
- `Authorization` ヘッダーに `Bearer <token>` 形式で送信
- トークン有効期限: 30日間

### リクエスト/レスポンス形式
- Content-Type: `application/json`
- 文字エンコーディング: UTF-8
- 日時形式: ISO 8601 (例: `2025-01-28T10:00:00Z`)

### 共通レスポンス形式
```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2025-01-28T10:00:00Z"
}
```

### エラーレスポンス形式
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "認証に失敗しました",
    "details": {}
  },
  "timestamp": "2025-01-28T10:00:00Z"
}
```

## 認証 API

### ユーザー登録
新規ユーザーアカウントを作成します。

**エンドポイント**
```
POST /api/auth/register
```

**リクエスト**
```json
{
  "email": "teacher@example.com",
  "password": "SecurePassword123!",
  "profile": {
    "name": "山田太郎",
    "school": "〇〇小学校",
    "subjects": ["国語", "算数"],
    "experience": 5
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "teacher@example.com",
      "profile": {
        "name": "山田太郎",
        "school": "〇〇小学校",
        "subjects": ["国語", "算数"],
        "experience": 5
      }
    },
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "ユーザー登録が完了しました"
}
```

### ログイン
既存ユーザーでログインします。

**エンドポイント**
```
POST /api/auth/login
```

**リクエスト**
```json
{
  "email": "teacher@example.com",
  "password": "SecurePassword123!"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "teacher@example.com",
      "profile": {
        "name": "山田太郎"
      }
    },
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "ログインに成功しました"
}
```

### 現在のユーザー取得
認証済みユーザーの情報を取得します。

**エンドポイント**
```
GET /api/auth/me
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "teacher@example.com",
      "profile": {
        "name": "山田太郎",
        "school": "〇〇小学校",
        "subjects": ["国語", "算数"],
        "experience": 5
      },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-28T10:00:00Z"
    }
  }
}
```

### パスワードリセット
パスワードリセット用のメールを送信します。

**エンドポイント**
```
POST /api/auth/reset-password
```

**リクエスト**
```json
{
  "email": "teacher@example.com"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "パスワードリセット用のメールを送信しました"
}
```

## 診断 API

### 診断質問取得
診断用の質問リストを取得します。

**エンドポイント**
```
GET /api/diagnosis/questions
```

**クエリパラメータ**
- `category` (optional): 質問カテゴリー
- `limit` (optional): 取得する質問数

**レスポンス**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q1",
        "category": "personality",
        "text": "授業中、生徒からの予期せぬ質問にどう対応しますか？",
        "options": [
          {
            "value": 1,
            "text": "すぐに答えを提供する"
          },
          {
            "value": 2,
            "text": "一緒に考えてみようと提案する"
          },
          {
            "value": 3,
            "text": "後で調べて回答すると伝える"
          },
          {
            "value": 4,
            "text": "他の生徒に意見を求める"
          }
        ]
      }
    ],
    "totalQuestions": 20,
    "estimatedTime": "10分"
  }
}
```

### 診断結果送信
ユーザーの回答を送信し、診断結果を取得します。

**エンドポイント**
```
POST /api/diagnosis/submit
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**リクエスト**
```json
{
  "answers": [
    {
      "questionId": "q1",
      "answer": 2
    },
    {
      "questionId": "q2",
      "answer": 4
    }
  ],
  "metadata": {
    "completionTime": 480,
    "device": "desktop"
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "diagnosisId": "507f1f77bcf86cd799439012",
    "result": {
      "personalityType": "ENFJ",
      "scores": {
        "extroversion": 75,
        "sensing": 40,
        "thinking": 35,
        "judging": 60
      },
      "strengths": [
        "生徒との共感的なコミュニケーション",
        "協調的な学習環境の構築",
        "個別のニーズへの対応力"
      ],
      "challenges": [
        "批判的なフィードバックの提供",
        "時間管理の効率化"
      ],
      "recommendedStyles": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
    }
  }
}
```

### 診断履歴取得
ユーザーの過去の診断結果を取得します。

**エンドポイント**
```
GET /api/diagnosis/history
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**クエリパラメータ**
- `page` (optional): ページ番号（デフォルト: 1）
- `limit` (optional): 1ページあたりの件数（デフォルト: 20）
- `sort` (optional): ソート順（`-createdAt` | `createdAt`）

**レスポンス**
```json
{
  "success": true,
  "data": {
    "diagnoses": [
      {
        "id": "507f1f77bcf86cd799439012",
        "personalityType": "ENFJ",
        "completedAt": "2025-01-28T10:00:00Z",
        "summary": {
          "strengths": 3,
          "challenges": 2
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### 診断結果詳細取得
特定の診断結果の詳細を取得します。

**エンドポイント**
```
GET /api/diagnosis/results/:id
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "diagnosis": {
      "id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "questions": [
        {
          "questionId": "q1",
          "answer": 2,
          "timestamp": "2025-01-28T10:00:00Z"
        }
      ],
      "result": {
        "personalityType": "ENFJ",
        "scores": {
          "extroversion": 75,
          "sensing": 40,
          "thinking": 35,
          "judging": 60
        },
        "strengths": ["..."],
        "challenges": ["..."]
      },
      "completedAt": "2025-01-28T10:05:00Z",
      "createdAt": "2025-01-28T10:00:00Z"
    }
  }
}
```

## 授業スタイル API

### スタイル推奨取得
診断結果に基づく推奨授業スタイルを取得します。

**エンドポイント**
```
GET /api/teaching-styles/recommendations/:diagnosisId
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**クエリパラメータ**
- `subject` (optional): 教科でフィルタリング
- `gradeLevel` (optional): 学年でフィルタリング

**レスポンス**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "協働学習型授業",
        "matchScore": 95,
        "description": "生徒同士の対話と協力を重視した授業スタイル",
        "characteristics": [
          "グループワークを中心とした活動",
          "生徒の主体的な参加を促進",
          "相互学習による理解の深化"
        ],
        "methods": [
          "ジグソー法",
          "ピア・ラーニング",
          "プロジェクトベース学習"
        ],
        "bestFor": {
          "subjects": ["国語", "社会", "総合"],
          "grades": ["小学校高学年", "中学校"]
        }
      }
    ],
    "totalRecommendations": 3
  }
}
```

### スタイル詳細取得
特定の授業スタイルの詳細情報を取得します。

**エンドポイント**
```
GET /api/teaching-styles/:id
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "style": {
      "id": "507f1f77bcf86cd799439013",
      "name": "協働学習型授業",
      "description": "生徒同士の対話と協力を重視した授業スタイル",
      "characteristics": ["..."],
      "methods": ["..."],
      "subjects": ["国語", "社会", "総合"],
      "examples": [
        {
          "title": "国語科での実践例",
          "description": "物語の読解をグループで行う活動",
          "steps": ["..."]
        }
      ],
      "resources": [
        {
          "type": "book",
          "title": "協働学習の理論と実践",
          "url": "https://example.com/book1"
        }
      ],
      "relatedStyles": ["507f1f77bcf86cd799439014"]
    }
  }
}
```

### スタイル一覧取得
利用可能な授業スタイルの一覧を取得します。

**エンドポイント**
```
GET /api/teaching-styles
```

**クエリパラメータ**
- `search` (optional): キーワード検索
- `subjects` (optional): 教科でフィルタリング（カンマ区切り）
- `page` (optional): ページ番号
- `limit` (optional): 1ページあたりの件数

**レスポンス**
```json
{
  "success": true,
  "data": {
    "styles": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "協働学習型授業",
        "description": "生徒同士の対話と協力を重視した授業スタイル",
        "subjects": ["国語", "社会", "総合"],
        "popularity": 85
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

## テンプレート API

### テンプレート生成
授業スタイルに基づくテンプレートを生成します。

**エンドポイント**
```
POST /api/templates/generate
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**リクエスト**
```json
{
  "teachingStyleId": "507f1f77bcf86cd799439013",
  "subject": "国語",
  "gradeLevel": "小学5年生",
  "unit": "物語の読解",
  "duration": 45,
  "objectives": [
    "登場人物の心情を理解する",
    "物語の構成を把握する"
  ]
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "507f1f77bcf86cd799439015",
      "title": "協働学習で学ぶ物語の読解",
      "subject": "国語",
      "gradeLevel": "小学5年生",
      "content": {
        "lessonPlan": "1. 導入（5分）\n   - 本時の目標確認...",
        "objectives": [
          "登場人物の心情を理解する",
          "物語の構成を把握する"
        ],
        "activities": [
          {
            "name": "グループ読解活動",
            "duration": 20,
            "description": "4人グループで物語を読み、感想を共有",
            "materials": ["教科書", "ワークシート"]
          }
        ],
        "materials": ["教科書", "ワークシート", "付箋"],
        "assessment": {
          "criteria": ["心情理解の深さ", "発表の内容"],
          "methods": ["観察", "ワークシート評価"]
        }
      },
      "createdAt": "2025-01-28T10:00:00Z"
    }
  }
}
```

### テンプレート更新
既存のテンプレートを編集します。

**エンドポイント**
```
PUT /api/templates/:id
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**リクエスト**
```json
{
  "title": "協働学習で深める物語の読解",
  "content": {
    "activities": [
      {
        "name": "ペア読解活動",
        "duration": 25,
        "description": "ペアで物語を読み、感想を共有",
        "materials": ["教科書", "ワークシート", "タブレット"]
      }
    ]
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "507f1f77bcf86cd799439015",
      "title": "協働学習で深める物語の読解",
      "updatedAt": "2025-01-28T11:00:00Z"
    }
  },
  "message": "テンプレートを更新しました"
}
```

### テンプレート一覧取得
ユーザーが作成したテンプレートの一覧を取得します。

**エンドポイント**
```
GET /api/templates
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**クエリパラメータ**
- `subject` (optional): 教科でフィルタリング
- `gradeLevel` (optional): 学年でフィルタリング
- `teachingStyleId` (optional): 授業スタイルでフィルタリング
- `search` (optional): キーワード検索
- `sort` (optional): ソート順

**レスポンス**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "507f1f77bcf86cd799439015",
        "title": "協働学習で深める物語の読解",
        "subject": "国語",
        "gradeLevel": "小学5年生",
        "teachingStyle": {
          "id": "507f1f77bcf86cd799439013",
          "name": "協働学習型授業"
        },
        "createdAt": "2025-01-28T10:00:00Z",
        "updatedAt": "2025-01-28T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

### テンプレートダウンロード
テンプレートをPDFまたはWord形式でダウンロードします。

**エンドポイント**
```
GET /api/templates/:id/download
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**クエリパラメータ**
- `format`: ダウンロード形式（`pdf` | `docx`）

**レスポンス**
- Content-Type: `application/pdf` または `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- ファイルのバイナリデータ

## 分析 API

### ダッシュボードデータ取得
ユーザーのダッシュボード用データを取得します。

**エンドポイント**
```
GET /api/analytics/dashboard
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDiagnoses": 5,
      "totalTemplates": 23,
      "favoriteStyle": {
        "id": "507f1f77bcf86cd799439013",
        "name": "協働学習型授業",
        "usageCount": 15
      },
      "lastActivity": "2025-01-28T10:00:00Z"
    },
    "recentActivities": [
      {
        "type": "diagnosis",
        "description": "診断を完了しました",
        "timestamp": "2025-01-28T10:00:00Z"
      },
      {
        "type": "template",
        "description": "テンプレート「協働学習で深める物語の読解」を作成",
        "timestamp": "2025-01-28T09:00:00Z"
      }
    ],
    "growthMetrics": {
      "diagnosisProgress": [
        {
          "date": "2025-01-01",
          "scores": {
            "extroversion": 70,
            "sensing": 45
          }
        }
      ]
    }
  }
}
```

### 進捗データ取得
診断結果の推移データを取得します。

**エンドポイント**
```
GET /api/analytics/progress
```

**ヘッダー**
```
Authorization: Bearer <token>
```

**クエリパラメータ**
- `from`: 開始日（ISO 8601形式）
- `to`: 終了日（ISO 8601形式）
- `metric`: 取得する指標（`all` | `personality` | `usage`）

**レスポンス**
```json
{
  "success": true,
  "data": {
    "progress": {
      "personality": [
        {
          "date": "2025-01-01T00:00:00Z",
          "scores": {
            "extroversion": 70,
            "sensing": 45,
            "thinking": 40,
            "judging": 55
          }
        }
      ],
      "styleUsage": [
        {
          "styleId": "507f1f77bcf86cd799439013",
          "styleName": "協働学習型授業",
          "usage": [
            {
              "date": "2025-01-01",
              "count": 3
            }
          ]
        }
      ],
      "templateCreation": {
        "total": 23,
        "byMonth": [
          {
            "month": "2025-01",
            "count": 5
          }
        ]
      }
    }
  }
}
```

## エラーコード

### 認証関連
- `AUTH_001`: 認証に失敗しました
- `AUTH_002`: トークンが無効です
- `AUTH_003`: トークンの有効期限が切れています
- `AUTH_004`: 権限が不足しています
- `AUTH_005`: ユーザーが見つかりません

### バリデーション関連
- `VAL_001`: 必須項目が入力されていません
- `VAL_002`: メールアドレスの形式が正しくありません
- `VAL_003`: パスワードが要件を満たしていません
- `VAL_004`: 入力値が範囲外です

### リソース関連
- `RES_001`: リソースが見つかりません
- `RES_002`: リソースへのアクセス権限がありません
- `RES_003`: リソースの作成に失敗しました
- `RES_004`: リソースの更新に失敗しました
- `RES_005`: リソースの削除に失敗しました

### サーバー関連
- `SRV_001`: サーバーエラーが発生しました
- `SRV_002`: データベース接続エラー
- `SRV_003`: 外部サービスとの通信エラー
- `SRV_004`: リクエストがタイムアウトしました

### レート制限
- `RATE_001`: リクエスト制限を超えました

## 使用例

### cURL
```bash
# ログイン
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"password123"}'

# 診断質問取得（認証あり）
curl -X GET https://api.yourdomain.com/api/diagnosis/questions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript (Axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.yourdomain.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ログイン
async function login(email, password) {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token } = response.data.data;
    
    // トークンを保存
    localStorage.setItem('token', token);
    
    // 以降のリクエストにトークンを設定
    api.defaults.headers.common['Authorization'] = token;
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response.data);
    throw error;
  }
}

// 診断結果送信
async function submitDiagnosis(answers) {
  try {
    const response = await api.post('/diagnosis/submit', { answers });
    return response.data;
  } catch (error) {
    console.error('Diagnosis submission failed:', error.response.data);
    throw error;
  }
}
```

### TypeScript
```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

interface User {
  id: string;
  email: string;
  profile: {
    name: string;
    school?: string;
    subjects?: string[];
    experience?: number;
  };
}

class TeacherNavigatorAPI {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data: LoginResponse = await response.json();
    this.token = data.data.token;
    return data;
  }

  private getAuthHeaders(): HeadersInit {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token,
    };
  }
}
```

## レート制限

APIには以下のレート制限が適用されます：

- 一般エンドポイント: 15分あたり100リクエスト
- 認証エンドポイント: 15分あたり5リクエスト
- ファイルアップロード: 1時間あたり10リクエスト
- レポート生成: 1時間あたり20リクエスト

レート制限を超えた場合は、HTTPステータス429が返され、`Retry-After`ヘッダーに次のリクエストまでの待機時間（秒）が含まれます。

## バージョニング

現在のAPIバージョンは `v1` です。将来的にバージョンが変更される場合は、URLに含まれる予定です：
```
https://api.yourdomain.com/api/v2/...
```

## お問い合わせ

API に関する質問や問題がある場合は、以下にお問い合わせください：

- 技術サポート: api-support@example.com
- バグ報告: [GitHub Issues](https://github.com/yourusername/teacher-navigator-saas/issues)
- 機能リクエスト: [GitHub Discussions](https://github.com/yourusername/teacher-navigator-saas/discussions)