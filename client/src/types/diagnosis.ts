// 診断質問の型定義
export interface DiagnosisQuestion {
  id: string;
  category: 'extroversion' | 'sensing' | 'thinking' | 'judging';
  question: string;
  categoryName: string;
}

// 診断回答の型定義
export interface DiagnosisAnswer {
  questionId: string;
  value: number; // 1-5
  timestamp: Date;
}

// 診断セッションの型定義
export interface DiagnosisSession {
  _id: string;
  userId: string;
  answers: DiagnosisAnswer[];
  status: 'in_progress' | 'completed' | 'abandoned';
  sessionInfo: {
    startTime: Date;
    endTime?: Date;
    deviceInfo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 診断結果の型定義
export interface DiagnosisResult {
  personalityType: string; // MBTI型（例: INTJ）
  typeDescription: string;
  scores: {
    extroversion: number;
    sensing: number;
    thinking: number;
    judging: number;
  };
  strengths: string[];
  challenges: string[];
  recommendedStyles?: RecommendedStyle[];
}

// 推奨スタイルの型定義
export interface RecommendedStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  recommendationScore?: number;
  matchingReasons?: string[];
}

// 診断履歴の型定義
export interface DiagnosisHistory {
  _id: string;
  result: DiagnosisResult;
  completedAt: string;
  answeredQuestions: number;
  reliability: {
    isReliable: boolean;
    consistency?: {
      score: number;
      hasReversalIssues?: boolean;
      hasPatternIssues?: boolean;
    };
  };
}

// 診断統計の型定義
export interface DiagnosisStats {
  totalDiagnoses: number;
  averageCompletionTime: number;
  mostCommonType: string;
  typeDistribution: Record<string, number>;
}

// カテゴリー情報
export const DIAGNOSIS_CATEGORIES = {
  extroversion: {
    name: '外向性・内向性',
    description: '他者との関わり方やエネルギーの源泉',
    highLabel: '外向的',
    lowLabel: '内向的',
  },
  sensing: {
    name: '感覚・直感',
    description: '情報の収集と処理の仕方',
    highLabel: '感覚的',
    lowLabel: '直感的',
  },
  thinking: {
    name: '思考・感情',
    description: '意思決定の基準',
    highLabel: '思考的',
    lowLabel: '感情的',
  },
  judging: {
    name: '判断・知覚',
    description: '外界への対処法',
    highLabel: '判断的',
    lowLabel: '知覚的',
  },
} as const;

// 診断の進捗状態
export interface DiagnosisProgress {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  categoryProgress: {
    extroversion: number;
    sensing: number;
    thinking: number;
    judging: number;
  };
  canSubmit: boolean;
}