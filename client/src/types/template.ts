export interface Template {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  description: string;
  type: 'lesson_plan' | 'worksheet' | 'assessment';
  teachingStyleId: string;
  teachingStyleName?: string;
  diagnosisId?: string;
  subject: string;
  gradeLevel: string;
  duration: number; // 分
  objectives: string[];
  materials: string[];
  content: {
    introduction?: string;
    mainActivity?: string;
    conclusion?: string;
    homework?: string;
    notes?: string;
    sections?: TemplateSection[];
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  tags: string[];
  isPublic: boolean;
  isTemplate: boolean;
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  likes?: number;
  downloads?: number;
  rating?: number;
  ratingCount?: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  content: string;
  duration?: number;
  order: number;
  type?: 'text' | 'activity' | 'assessment' | 'discussion';
}

export interface TemplateFilter {
  type?: string[];
  subject?: string[];
  gradeLevel?: string[];
  teachingStyleId?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  userId?: string;
  search?: string;
  tags?: string[];
}

export interface PaginatedTemplates {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateFormData {
  title: string;
  description: string;
  type: 'lesson_plan' | 'worksheet' | 'assessment';
  teachingStyleId: string;
  subject: string;
  gradeLevel: string;
  duration: number;
  objectives: string[];
  materials: string[];
  content: {
    introduction: string;
    mainActivity: string;
    conclusion: string;
    homework?: string;
    notes?: string;
  };
  tags: string[];
  isPublic: boolean;
}

export const TEMPLATE_TYPES = {
  lesson_plan: {
    label: '授業計画',
    description: '授業の流れを詳細に記載',
    icon: 'description',
    color: '#3498db',
  },
  worksheet: {
    label: 'ワークシート',
    description: '生徒配布用の学習教材',
    icon: 'assignment',
    color: '#2ecc71',
  },
  assessment: {
    label: '評価基準',
    description: '学習評価のルーブリック',
    icon: 'grading',
    color: '#e74c3c',
  },
};

export const TEMPLATE_SUBJECTS = [
  { value: 'japanese', label: '国語' },
  { value: 'math', label: '数学' },
  { value: 'science', label: '理科' },
  { value: 'social', label: '社会' },
  { value: 'english', label: '英語' },
  { value: 'pe', label: '体育' },
  { value: 'art', label: '美術' },
  { value: 'music', label: '音楽' },
  { value: 'technology', label: '技術' },
  { value: 'homeeconomics', label: '家庭科' },
  { value: 'other', label: 'その他' },
];

export const TEMPLATE_GRADE_LEVELS = [
  { value: 'elementary_1-2', label: '小学1-2年' },
  { value: 'elementary_3-4', label: '小学3-4年' },
  { value: 'elementary_5-6', label: '小学5-6年' },
  { value: 'junior_high_1', label: '中学1年' },
  { value: 'junior_high_2', label: '中学2年' },
  { value: 'junior_high_3', label: '中学3年' },
  { value: 'high_school_1', label: '高校1年' },
  { value: 'high_school_2', label: '高校2年' },
  { value: 'high_school_3', label: '高校3年' },
];

export const POPULAR_TAGS = [
  'アクティブラーニング',
  'ICT活用',
  'グループワーク',
  '探究学習',
  '協働学習',
  '個別最適化',
  'プロジェクト学習',
  '反転授業',
  'ディスカッション',
  '実験・実習',
];