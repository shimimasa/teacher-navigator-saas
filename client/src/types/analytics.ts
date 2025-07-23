export interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  totalDiagnoses: number;
  completedDiagnoses: number;
  totalTemplates: number;
  publicTemplates: number;
  averageEffectiveness: number;
  averageSatisfaction: number;
}

export interface UserActivity {
  date: Date;
  activeUsers: number;
  newUsers: number;
  diagnoses: number;
  templatesCreated: number;
  templatesUsed: number;
}

export interface DiagnosisStatistics {
  personalityTypeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  averageScores: {
    category: string;
    score: number;
  }[];
  completionRate: number;
  averageCompletionTime: number;
  reliabilityRate: number;
}

export interface TeachingStyleUsage {
  styleId: string;
  styleName: string;
  category: string;
  usageCount: number;
  averageRating: number;
  effectiveness: number;
  satisfaction: number;
  templates: number;
}

export interface TemplateStatistics {
  totalTemplates: number;
  publicTemplates: number;
  privateTemplates: number;
  templatesByType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  templatesBySubject: {
    subject: string;
    count: number;
  }[];
  averageRating: number;
  totalDownloads: number;
  totalLikes: number;
}

export interface UserGrowth {
  userId: string;
  userName: string;
  joinDate: Date;
  diagnosesCompleted: number;
  templatesCreated: number;
  templatesShared: number;
  averageEffectiveness: number;
  improvementRate: number;
  lastActive: Date;
}

export interface AnalyticsTimeRange {
  startDate: Date;
  endDate: Date;
  period: 'day' | 'week' | 'month' | 'year' | 'custom';
}

export interface AnalyticsFilter {
  timeRange: AnalyticsTimeRange;
  userType?: 'all' | 'active' | 'new';
  subject?: string[];
  gradeLevel?: string[];
  personalityType?: string[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface HeatmapData {
  day: number;
  hour: number;
  value: number;
}

export interface GrowthMetrics {
  period: string;
  diagnoses: number;
  templates: number;
  effectiveness: number;
  satisfaction: number;
  growth: number;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'summary' | 'detailed' | 'growth' | 'usage';
  timeRange: AnalyticsTimeRange;
  filters: AnalyticsFilter;
  data: any;
  createdAt: Date;
  format: 'pdf' | 'excel' | 'csv';
}

export const CHART_COLORS = {
  primary: '#3498db',
  secondary: '#2ecc71',
  tertiary: '#e74c3c',
  quaternary: '#f39c12',
  quinary: '#9b59b6',
  senary: '#1abc9c',
  background: 'rgba(52, 152, 219, 0.1)',
};

export const TIME_RANGES = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '今週' },
  { value: 'month', label: '今月' },
  { value: 'quarter', label: '四半期' },
  { value: 'year', label: '今年' },
  { value: 'custom', label: 'カスタム' },
];

export const REPORT_TYPES = [
  { 
    value: 'summary', 
    label: 'サマリーレポート',
    description: '全体的な概要と主要指標'
  },
  { 
    value: 'detailed', 
    label: '詳細レポート',
    description: '詳細な分析とグラフ'
  },
  { 
    value: 'growth', 
    label: '成長レポート',
    description: '個人の成長と改善度'
  },
  { 
    value: 'usage', 
    label: '使用状況レポート',
    description: 'システム利用状況の分析'
  },
];