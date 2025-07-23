export interface TeachingStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'interactive' | 'traditional' | 'experiential' | 'collaborative' | 'inquiry_based' | 'technology_enhanced';
  personalityTypes: string[];
  characteristics: string[];
  strengths: string[];
  challenges: string[];
  teachingMethods: string[];
  assessmentMethods: string[];
  classroomSetup: string;
  timeManagement: {
    planning: number;
    instruction: number;
    activities: number;
    assessment: number;
  };
  studentEngagement: {
    activeParticipation: number;
    groupWork: number;
    individualWork: number;
    discussion: number;
  };
  technologyUse: 'minimal' | 'moderate' | 'extensive';
  subjects: string[];
  gradeLevel: string[];
  rating?: number;
  usageCount?: number;
  feedback?: {
    effectiveness: number;
    satisfaction: number;
    count: number;
  };
}

export interface TeachingStyleFilter {
  category?: string[];
  subjects?: string[];
  gradeLevel?: string[];
  personalityTypes?: string[];
  technologyUse?: string[];
  search?: string;
}

export interface TeachingStyleComparison {
  styleIds: string[];
  criteria: {
    name: string;
    values: (string | number)[];
  }[];
}

export interface TeachingStyleFeedback {
  styleId: string;
  userId: string;
  effectiveness: number;
  satisfaction: number;
  comment?: string;
  date: Date;
}

export interface PaginatedTeachingStyles {
  styles: TeachingStyle[];
  total: number;
  page: number;
  limit: number;
}

export const TEACHING_STYLE_CATEGORIES = {
  interactive: {
    label: 'インタラクティブ型',
    description: '生徒との対話を重視',
    color: '#3498db',
  },
  traditional: {
    label: '伝統的講義型',
    description: '体系的な知識伝達',
    color: '#2c3e50',
  },
  experiential: {
    label: '体験学習型',
    description: '実践を通じた学習',
    color: '#27ae60',
  },
  collaborative: {
    label: '協働学習型',
    description: 'グループワーク中心',
    color: '#e74c3c',
  },
  inquiry_based: {
    label: '探究型',
    description: '問題解決を重視',
    color: '#f39c12',
  },
  technology_enhanced: {
    label: 'テクノロジー活用型',
    description: 'ICTを積極活用',
    color: '#9b59b6',
  },
};

export const SUBJECT_OPTIONS = [
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
];

export const GRADE_LEVEL_OPTIONS = [
  { value: 'elementary_low', label: '小学校低学年' },
  { value: 'elementary_high', label: '小学校高学年' },
  { value: 'junior_high', label: '中学校' },
  { value: 'high_school', label: '高等学校' },
];

export const TECHNOLOGY_USE_OPTIONS = [
  { value: 'minimal', label: '最小限' },
  { value: 'moderate', label: '適度' },
  { value: 'extensive', label: '積極的' },
];