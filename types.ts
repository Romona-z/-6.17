export interface StrategyDefinition {
  id: string;
  num?: string;
  name: string;
  concept: string;
  reason?: string;
  how?: string[];
  example?: string;
  tip?: string;
  badgeColor?: string;
  bgGradient?: string;
  isEnabled?: boolean;
  isCustom?: boolean;
}

export type TagCategory = '沟通与信息障碍' | '决策与逻辑失序' | '人际与态度' | '管理能力缺失' | '职业操守与情绪' | '生理信号标签' | '即时行动标签';

export interface TagDefinition {
  id: string;
  category: TagCategory;
  name: string;
  description: string;
}

export interface ResearchSubject {
  id: string;
  alias: string;
  role: string;
  context?: string;
  createdAt: number;
  status?: 'under_study' | 'completed';
}

export type EvaluationType = '健康的适应' | '危险的麻木' | '中性观察';

export interface StructuredReaction {
  // Module 1: Initial Response
  emotions: { name: string; score: number }[];
  physicalSignals: string[];
  immediateThoughts: string[];
  actionTaken: string | string[];
  
  // Module 2: Evolution Path
  turningPoint?: string;
  appliedStrategies: string[];
  
  // Module 3: Final State
  finalMindsetLabel?: string;
  shiftEvaluation?: EvaluationType;
  survivalRule?: string;
  
  customNotes?: string;
}

export interface WorkLog {
  id: string;
  subjectId: string;
  subjectAlias?: string;
  subjectRole?: string;
  date: string;
  fact: string;
  reaction: string; // Legacy stringified version
  structuredReaction: StructuredReaction;
  tags: string[];
  aiQuestions?: string[];
  userResponseToAi?: string;
  timestamp: number;
}

export interface AnalysisSummary {
  topTags: { tag: string; count: number }[];
  topEmotions: { emotion: string; count: number }[];
  correlations: { tagA: string; tagB: string; count: number }[];
  aiInsights: string;
  suggestedQuestions: string[];
}

export interface ReflectionSnapshot {
  timestamp: number;
  content: string;
}

export interface SubjectReflection {
  id: string; // matches subjectId
  subjectId: string;
  content: string;
  updatedAt: number;
  snapshots?: ReflectionSnapshot[];
}

// --- Life Selector v2 Types ---

export interface Dimension {
  id: string;
  name: string;
  weight: number; // 1-5
  description?: string;
}

export interface ProCon {
  id: string;
  text: string;
  score: number;
  dimensionId?: string;
}

export interface Option {
  id: string;
  title: string;
  pros: ProCon[];
  cons: ProCon[];
}

export interface ChoiceState {
  problem: string;
  options: Option[];
  dimensions: Dimension[];
}

export enum Step {
  PROBLEM = 0,
  OPTIONS = 1,
  ANALYSIS = 2,
  DIMENSIONS = 3,
  LINKING = 4,
  SCORING = 5,
  RESULT = 6
}
