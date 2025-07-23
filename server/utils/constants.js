// 定数定義ファイル

// HTTPステータスコード
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// エラーメッセージ
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '認証情報が無効です',
  USER_NOT_FOUND: 'ユーザーが見つかりません',
  USER_ALREADY_EXISTS: 'このメールアドレスは既に登録されています',
  INVALID_TOKEN: 'トークンが無効です',
  TOKEN_EXPIRED: 'トークンの有効期限が切れています',
  PERMISSION_DENIED: 'この操作を実行する権限がありません',
  VALIDATION_ERROR: '入力値が不正です',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  DATABASE_ERROR: 'データベースエラーが発生しました'
};

// パーソナリティタイプ
const PERSONALITY_TYPES = {
  ISTJ: 'ISTJ',
  ISFJ: 'ISFJ',
  INFJ: 'INFJ',
  INTJ: 'INTJ',
  ISTP: 'ISTP',
  ISFP: 'ISFP',
  INFP: 'INFP',
  INTP: 'INTP',
  ESTP: 'ESTP',
  ESFP: 'ESFP',
  ENFP: 'ENFP',
  ENTP: 'ENTP',
  ESTJ: 'ESTJ',
  ESFJ: 'ESFJ',
  ENFJ: 'ENFJ',
  ENTJ: 'ENTJ'
};

// 診断質問のカテゴリー
const QUESTION_CATEGORIES = {
  EXTROVERSION: 'extroversion',
  SENSING: 'sensing',
  THINKING: 'thinking',
  JUDGING: 'judging'
};

// テンプレートタイプ
const TEMPLATE_TYPES = {
  LESSON_PLAN: 'lesson_plan',
  WORKSHEET: 'worksheet',
  ASSESSMENT: 'assessment',
  ACTIVITY: 'activity'
};

// ユーザーロール
const USER_ROLES = {
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// 定数のエクスポート
module.exports = {
  HTTP_STATUS,
  ERROR_MESSAGES,
  PERSONALITY_TYPES,
  QUESTION_CATEGORIES,
  TEMPLATE_TYPES,
  USER_ROLES
};