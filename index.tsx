
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Compass, 
  BookOpen, 
  Briefcase, 
  Award, 
  ChevronRight, 
  History,
  Scale,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  LayoutGrid,
  User,
  Zap,
  PenLine,
  ToggleLeft,
  ToggleRight,
  Check,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Smile,
  Meh,
  Frown,
  Heart,
  Ghost,
  Star,
  Circle,
  Triangle,
  Diamond,
  Hexagon,
  Disc,
  Sparkle,
  BarChart3,
  Calendar,
  Layers,
  Archive,
  ArrowLeft,
  Filter,
  ChevronDown,
  Plus,
  Trash2,
  RefreshCw,
  Settings,
  Bell,
  X,
  Info,
  Users,
  Feather,
  MessageSquare,
  Sprout
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import WorkplaceSurvival from './workplace-survival/WorkplaceSurvival';
import LifeSelector from './components/LifeSelector';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { DEFAULT_TAG_LIBRARY, STRATEGIES_DATABASE } from './constants';

// --- Types ---
type MainTab = 'home' | 'tools' | 'growth';
type ToolType = 'none' | 'selector' | 'workplace';
type DiaryStep = 'word-selection' | 'school-selection' | 'writing';
type GrowthView = 'center' | 'archive' | 'detail' | 'library' | 'methodology';

interface DiaryEntry {
  id: string;
  content: string;
  emotion: string;
  selectedView?: string;
  school?: string;
  aiReflection?: string;
  weather?: string;
  mood?: string;
  date: number;
}

interface Badge { id: string; name: string; description: string; icon: React.ReactNode; unlocked: boolean; }

// --- Morandi Theme (Updated to elegant Lavender-Purple) ---
const MorandiTheme = {
  bg: '#F5F3F7',        // Soothing off-white lavender background
  paper: '#FFFFFF',      // Crisp clean white cards
  ink: '#2D283E',        // Deep Slate Violet ink for excellent text contrast
  blue: '#8A70D6',       // Chic medium-purple (primary branding)
  purple: '#9C82CB',     // Rich light-violet (secondary branding)
  accent: '#EAE5F3',     // Soft lavender tint highlight
  border: '#E8E3F2',     // Extremely subtle lavender border lines
  softBlue: 'rgba(138, 112, 214, 0.08)',
  softPurple: 'rgba(156, 130, 203, 0.1)'
};

const AVATAR_OPTIONS = [
  { id: 'user', iconName: 'User', bg: 'bg-[#EDEBEF]', border: 'border-slate-200', text: 'text-slate-500', nameZh: '初心', nameEn: 'Pioneer' },
  { id: 'compass', iconName: 'Compass', bg: 'bg-[#E6EEF6]', border: 'border-[#4A90E2]/20', text: 'text-[#4A90E2]', nameZh: '探索者', nameEn: 'Explorer' },
  { id: 'feather', iconName: 'Feather', bg: 'bg-[#FAF0F4]', border: 'border-[#DB7093]/20', text: 'text-[#DB7093]', nameZh: '执笔人', nameEn: 'Scribe' },
  { id: 'sprout', iconName: 'Sprout', bg: 'bg-[#EAF5EC]', border: 'border-[#2E7D32]/20', text: 'text-[#2E7D32]', nameZh: '行愿者', nameEn: 'Grower' },
  { id: 'sparkles', iconName: 'Sparkles', bg: 'bg-[#FCF7E5]', border: 'border-[#D4AF37]/20', text: 'text-[#D4AF37]', nameZh: '明思者', nameEn: 'Thinker' },
  { id: 'heart', iconName: 'Heart', bg: 'bg-[#FDF2F2]', border: 'border-[#E53935]/20', text: 'text-[#E53935]', nameZh: '同理心', nameEn: 'Empath' },
];

export interface LevelMilestone {
  level: number;
  requiredExp: number;
  gap: number;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 1, requiredExp: 0, gap: 0, titleZh: '初行者', titleEn: 'Novice Seeker', descZh: '刚刚踏上这条路', descEn: 'Just stepped onto the path' },
  { level: 2, requiredExp: 40, gap: 40, titleZh: '探径人', titleEn: 'Path Finder', descZh: '开始摸索方向', descEn: 'Starting to find the way' },
  { level: 3, requiredExp: 100, gap: 60, titleZh: '拾步者', titleEn: 'Step Collector', descZh: '一步一个脚印地走着', descEn: 'Taking step by step' },
  { level: 4, requiredExp: 180, gap: 80, titleZh: '观风者', titleEn: 'Wind Watcher', descZh: '开始留意路上的风景与风向', descEn: 'Noticing the scenery and winds' },
  { level: 5, requiredExp: 280, gap: 100, titleZh: '循迹者', titleEn: 'Trace Follower', descZh: '开始看见自己的痕迹', descEn: 'Starting to see one\'s own footprints' },
  { level: 6, requiredExp: 400, gap: 120, titleZh: '驻思者', titleEn: 'Reflective Pauser', descZh: '走一段，停一下，回头看看', descEn: 'Walking a bit, pausing to look back' },
  { level: 7, requiredExp: 560, gap: 160, titleZh: '识途者', titleEn: 'Path Knower', descZh: '对这条路越来越熟悉了', descEn: 'Becoming familiar with the track' },
  { level: 8, requiredExp: 760, gap: 200, titleZh: '澄明者', titleEn: 'Clarity Dweller', descZh: '路越走越清晰，心越走越澄澈', descEn: 'Path is clearer, mind is purer' },
  { level: 9, requiredExp: 1060, gap: 300, titleZh: '径上人', titleEn: 'One with the Path', descZh: '走了很久，路已经成了自己的一部分', descEn: 'The path is now a part of yourself' },
];

// --- Hawkins Scale of Consciousness Map ---
export const HAWKINS_MAP: Record<string, number> = {
  '快乐': 540,
  '爱情': 500,
  '自由': 400,
  '亲情': 420,
  '友情': 350,
  '孤独': 150,
  '愤怒': 150,
  '焦虑': 100,
  '悲伤': 75,
  '遗憾': 60
};

export const HAWKINS_LABELS = [
  { level: 710, labelZh: '开悟 700+', labelEn: 'Enlightenment 700+' },
  { level: 600, labelZh: '平和 600', labelEn: 'Peace 600' },
  { level: 540, labelZh: '喜悦 540', labelEn: 'Joy 540' },
  { level: 500, labelZh: '爱 500', labelEn: 'Love 500' },
  { level: 400, labelZh: '理性 400', labelEn: 'Reason 400' },
  { level: 350, labelZh: '接纳 350', labelEn: 'Acceptance 350' },
  { level: 310, labelZh: '意愿 310', labelEn: 'Willingness 310' },
  { level: 250, labelZh: '中性 250', labelEn: 'Neutrality 250' },
  { level: 200, labelZh: '勇气 200', labelEn: 'Courage 200', highlight: true },
  { level: 175, labelZh: '骄傲 175', labelEn: 'Pride 175' },
  { level: 150, labelZh: '愤怒 150', labelEn: 'Anger 150' },
  { level: 100, labelZh: '恐惧 100', labelEn: 'Fear 100' },
  { level: 75, labelZh: '悲伤 75', labelEn: 'Grief 75' },
  { level: 30, labelZh: '内疚 30', labelEn: 'Guilt 30' },
  { level: 20, labelZh: '羞耻 20', labelEn: 'Shame 20' }
];

export const getHawkinsYPercent = (level: number) => {
  const clamped = Math.max(20, Math.min(1000, level));
  if (clamped <= 200) {
    // Map 20 -> 0%, 200 -> 40%
    return ((clamped - 20) / (200 - 20)) * 40;
  } else {
    // Map 200 -> 40%, 1000 -> 100%
    return 40 + ((clamped - 200) / (1000 - 200)) * 60;
  }
};

export const calculateExperienceFromTraces = (
  diaryEntries: any[], 
  schoolStats: Record<string, number>
) => {
  const dailyRecords: Record<string, { diary: number; tools: number }> = {};

  const getDayKey = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Add Diaries
  diaryEntries.forEach(entry => {
    const t = entry.date || Date.now();
    const day = getDayKey(t);
    if (!dailyRecords[day]) dailyRecords[day] = { diary: 0, tools: 0 };
    dailyRecords[day].diary += 1;
  });

  // Load Life Selector logs safely
  try {
    const saved = localStorage.getItem('life_selector_history');
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) {
        list.forEach((item: any) => {
          const t = item.timestamp || Date.now();
          const day = getDayKey(t);
          if (!dailyRecords[day]) dailyRecords[day] = { diary: 0, tools: 0 };
          dailyRecords[day].tools += 1;
        });
      }
    }
  } catch (e) {}

  // Load Workplace Observation logs safely
  try {
    const saved = localStorage.getItem('work_observation_logs');
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) {
        list.forEach((item: any) => {
          const t = item.timestamp || (item.date ? new Date(item.date).getTime() : Date.now());
          const day = getDayKey(t);
          if (!dailyRecords[day]) dailyRecords[day] = { diary: 0, tools: 0 };
          dailyRecords[day].tools += 1;
        });
      }
    }
  } catch (e) {}

  // Sum up daily capped experience
  let baseExp = 0;
  Object.keys(dailyRecords).forEach(day => {
    const record = dailyRecords[day];
    const rawDiaryExp = record.diary * 15;
    const rawToolsExp = record.tools * 10;
    const dayRawExp = rawDiaryExp + rawToolsExp;
    const dayCappedExp = Math.min(100, dayRawExp); // 每日上限 100 经验
    baseExp += dayCappedExp;
  });

  // Achievement bonuses: +30 EXP per unlocked badge
  const diaryCount = diaryEntries.length;
  let selectorCount = 0;
  try {
    const saved = localStorage.getItem('life_selector_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) selectorCount = parsed.length;
    }
  } catch (e) {}

  const hasLongDiary = diaryEntries.some(e => e.content && e.content.length > 100);

  const badgesCount = [
    diaryCount >= 1,
    selectorCount >= 1,
    diaryCount >= 3,
    diaryCount >= 5,
    diaryCount >= 8,
    diaryCount >= 10,
    Object.keys(schoolStats).length >= 3,
    hasLongDiary
  ].filter(Boolean).length;

  const achievementExp = badgesCount * 30; // Achievement bonus (+30 XP per badge)
  const totalExp = baseExp + achievementExp;

  return {
    baseExp,
    achievementExp,
    totalExp,
    unlockedBadgesCount: badgesCount
  };
};

export const getLevelInfo = (totalExp: number, lang: 'zh' | 'en') => {
  let currentMilestone = LEVEL_MILESTONES[0];
  let nextMilestone = LEVEL_MILESTONES[1];

  for (let i = 0; i < LEVEL_MILESTONES.length; i++) {
    if (totalExp >= LEVEL_MILESTONES[i].requiredExp) {
      currentMilestone = LEVEL_MILESTONES[i];
      nextMilestone = LEVEL_MILESTONES[i + 1] || null;
    } else {
      break;
    }
  }

  if (!nextMilestone) {
    return {
      level: 9,
      title: lang === 'zh' ? currentMilestone.titleZh : currentMilestone.titleEn,
      desc: lang === 'zh' ? currentMilestone.descZh : currentMilestone.descEn,
      progressPercent: 100,
      currentExpInLevel: currentMilestone.gap,
      neededExpInLevel: currentMilestone.gap,
      isMaxLevel: true,
      currentExpValue: totalExp,
      nextLevelExpValue: 1060
    };
  }

  const expInThisLevel = totalExp - currentMilestone.requiredExp;
  const levelExpRange = nextMilestone.requiredExp - currentMilestone.requiredExp;
  const progressPercent = Math.round(Math.min(100, Math.max(0, (expInThisLevel / levelExpRange) * 100)));

  return {
    level: currentMilestone.level,
    title: lang === 'zh' ? currentMilestone.titleZh : currentMilestone.titleEn,
    desc: lang === 'zh' ? currentMilestone.descZh : currentMilestone.descEn,
    progressPercent,
    currentExpInLevel: expInThisLevel,
    neededExpInLevel: levelExpRange,
    isMaxLevel: false,
    currentExpValue: totalExp,
    nextLevelExpValue: nextMilestone.requiredExp
  };
};

const getAvatarComponent = (iconName: string, size = 24, className = "") => {
  switch (iconName) {
    case 'User': return <User size={size} className={className} />;
    case 'Compass': return <Compass size={size} className={className} />;
    case 'Feather': return <Feather size={size} className={className} />;
    case 'Sprout': return <Sprout size={size} className={className} />;
    case 'Sparkles': return <Sparkles size={size} className={className} />;
    case 'Heart': return <Heart size={size} className={className} />;
    default: return <User size={size} className={className} />;
  }
};

// --- Data Constants ---
const CORE_WORDS = [
  { word: '快乐', desc: '喜悦与满足', icon: <Sparkle size={20} strokeWidth={1.5} /> },
  { word: '悲伤', desc: '忧愁与失落', icon: <Diamond size={20} strokeWidth={1.5} /> },
  { word: '愤怒', desc: '不满与激动', icon: <Hexagon size={20} strokeWidth={1.5} /> },
  { word: '爱情', desc: '浪漫与心动', icon: <Heart size={20} strokeWidth={1.5} /> },
  { word: '孤独', desc: '独处与沉思', icon: <Circle size={20} strokeWidth={1.5} /> },
  { word: '自由', desc: '解脱与轻松', icon: <Triangle size={20} strokeWidth={1.5} /> },
  { word: '亲情', desc: '温暖与牵挂', icon: <Hexagon size={20} strokeWidth={1.5} fill="currentColor" /> },
  { word: '遗憾', desc: '惋惜与反思', icon: <div className="relative flex items-center justify-center"><Diamond size={20} strokeWidth={1.5} /><Diamond size={8} strokeWidth={1.5} className="absolute" /></div> },
  { word: '焦虑', desc: '担忧与不安', icon: <Disc size={20} strokeWidth={1.5} /> },
  { word: '友情', desc: '陪伴与信任', icon: <Star size={20} strokeWidth={1.5} /> },
];

const PHILOSOPHY_QUOTES: Record<string, Record<string, string>> = {
  '快乐': { Pragmatism: '快乐不是目的，而是高效行动的副产品。', Nihilism: '快乐是虚无荒原上的一抹流光，转瞬即逝，不必执着。', Confucianism: '乐而不淫，哀而不伤，真正的快乐源于内心的中正。', Stoicism: '真正的快乐是对欲望的审视，而非欲望的满足。' },
  '悲伤': { Pragmatism: '悲伤是进化的信号，提醒你需要调整当前的生存策略。', Nihilism: '宇宙并不关心你的痛苦，悲伤只是原子无意义的震动。', Confucianism: '哀而不伤，在丧失中寻找对生命的敬畏与连接。', Stoicism: '你并不为事情本身痛苦，而是为你对它的判断痛苦。' },
  '愤怒': { Pragmatism: '愤怒是低效的能量释放，思考如何利用它驱动改变。', Nihilism: '愤怒是向空无挥拳，最终伤到的只有自己。', Confucianism: '克己复礼，怒而不迁，将激愤转化为修正自我的动力。', Stoicism: '愤怒是理智的临时缺席，它对伤害的反应往往比伤害本身更糟。' },
  '爱情': { Pragmatism: '爱情是两个生命系统的协作与博弈，旨在实现利益最大化。', Nihilism: '两个孤独灵魂的偶然相遇，在虚无中制造了短暂的错觉。', Confucianism: '相敬如宾，将私情升华为家庭秩序与社会责任的一部分。', Stoicism: '爱是理智的延伸，不应成为束缚彼此的锁链。' },
  '孤独': { Pragmatism: '孤独是独立思考的实验场，是创造力最肥沃的土壤。', Nihilism: '人类本质上是孤独的原子，所有的连接都只是自我安慰。', Confucianism: '君子慎独，在无人注视时依然坚守内在的道德秩序。', Stoicism: '孤独并不意味着缺少陪伴，而是灵魂 in 寻找自己的居所。' },
  '自由': { Pragmatism: '自由是拥有更多可行的选择路径。', Nihilism: '既然万物皆无意义，你便拥有了去做任何事的绝对自由。', Confucianism: '自由是随心而动而不逾矩，是在社会契约中的自洽。', Stoicism: '除了你的思想，没有什么能真正拨夺你的自由。' },
  '亲情': { Pragmatism: '亲情是基础的社会保障网络，是长期博弈中的绝对信任。', Nihilism: '基因延续的生物本能，披上了温情的道德外衣。', Confucianism: '父慈子孝，亲情是构建天下大治最底层的伦理基石。', Stoicism: '亲人是你在这个世界的借阅，应当在珍惜的同时随时准备归还。' },
  '遗憾': { Pragmatism: '遗憾是过去决策的反馈，用于修正未来的行为逻辑。', Nihilism: '所有的“如果”都没有意义，因为原本就没有既定的方向。', Confucianism: '省察内心，通过当下的作为弥补过去的失序。', Stoicism: '遗憾是对不可控之事的徒劳执着，应将其葬在过去。' },
  '焦虑': { Pragmatism: '焦虑是预测模型与现实脱节的警报，立即行动是最好的良药。', Nihilism: '焦虑是意识到人生毫无根基后的存在震颤。', Confucianism: '仁者不忧，焦虑源于对个人修养与责任的疏忽。', Stoicism: '你在想象中受的苦，远比现实中多得多。' },
  '友情': { Pragmatism: '友情是志同道合者的资源共享与情感互助。', Nihilism: '在冰冷宇宙中互相取暖的两个偶然生命。', Confucianism: '益者三友，友情是砥砺道德与学问的镜子。', Stoicism: '好朋友是另一个自我，是共同追求智慧的旅伴。' },
};

const QUOTE_EXPLANATIONS: Record<string, { source: string; explanation: string }> = {
  // 快乐 (Happiness)
  '快乐不是目的，而是高效行动的副产品。': {
    source: '威廉·詹姆斯 《心理学原理》',
    explanation: '实用主义认为快乐没法被直接追逐，而是在你满怀热情、积极投入创造性行动和解决现实问题时产生的一种随同状态。'
  },
  '快乐是虚无荒原上的一抹流光，转瞬即逝，不必执着。': {
    source: '让-保罗·萨特 《存在与虚无》',
    explanation: '虚无主义指出生命没有预设的永恒终极幸福，快乐是偶发现身的微光，正视它的易逝，方能在它降临时全然享受，在它退场时安然自若。'
  },
  '乐而不淫，哀而不伤，真正的快乐源于内心的中正。': {
    source: '孔子 《论语·八佾》',
    explanation: '儒家推崇中庸而克制的克己境界，真正的愉悦是远离放纵喧嚣的感官刺激，在群己关系和自我良知中体悟到的温厚与平和。'
  },
  '真正的快乐是对欲望的审视，而非欲望的满足。': {
    source: '塞内卡 《道德书简》',
    explanation: '斯多葛学者指出依凭外界物质的快乐极其易碎脆弱，只有通过严苛理性审析个人的欲念、摆脱其奴役，才能获得无法被外界夺走的内在宁静。'
  },

  // 悲伤 (Sadness)
  '悲伤是进化的信号，提醒你需要调整当前的生存策略。': {
    source: '约翰·杜威 《人类本性与行为》',
    explanation: '实用主义视负面情感为生命的“适应反馈系统”，提醒你的预测模型与眼下情境出现了偏差，急需你以静思校正后续去往的轨道。'
  },
  '宇宙并不关心你的痛苦，悲伤只是原子无意义的震动。': {
    source: '阿尔贝·加缪 《西西弗神话》',
    explanation: '面对无言而冰冷的大自然与广袤宇宙，悲伤没有终极的神圣依靠。看透这一现实反而能帮人剥离自我沉溺的悲情色彩，催生直面荒诞的英勇。'
  },
  '哀而不伤，在丧失中寻找对生命的敬畏与连接。': {
    source: '孔子 《论语》',
    explanation: '儒家讲求真挚而不泛滥的生活美学，悲痛是在面对失去时内心仁爱温情的真实映现，它能唤回我们同天地和过去记忆的深刻连接，进而沉淀责任。'
  },
  '你并不为事情本身痛苦，而是为你对它的判断痛苦。': {
    source: '马可·奥勒留 《沉思录》',
    explanation: '斯多葛主义的核心信条：使你痛苦忧惧的，绝非客观发生的命途事件，而是你内心深处对事件所下的毁灭性评价。收回评价，伤害便不复存在。'
  },

  // 愤怒 (Anger)
  '愤怒是低效的能量释放，思考如何利用它驱动改变。': {
    source: '约翰·杜威 《经验与自然》',
    explanation: '在实用主义看来，任由怒火宣泄只是对精神资源的无效损耗。明智的行者应将愤怒的原始本能视作警信，提炼并转化为重塑不合理现状的驱动能量。'
  },
  '愤怒是向空无挥拳，最终伤到的只有自己。': {
    source: '弗里德里希·尼采 《权力意志》',
    explanation: '虚无主义批判无意义的回击：在一个并无先设善恶、空无一物的冷漠自然界面前，狂怒只是在消耗虚无的自我，唯有超克它，才能重筑内在秩序。'
  },
  '克己复礼，怒而不迁，将激愤转化为修正自我的动力。': {
    source: '《论语·雍也》',
    explanation: '儒家极重中正的涵养境界。面对受挫，绝不把愤恨迁转连累到无辜他者与其余事务（不迁怒），而将其潜心导向内在思量，化作省察自我修养的契机。'
  },
  '愤怒是理智的临时缺席，它对伤害的反应往往比伤害本身更糟。': {
    source: '塞内卡 《论愤怒》',
    explanation: '斯多葛学者严正指出：愤怒是在理智缴械后爆发的无谓疯狂，当它试图去惩罚不公时，它所引发的内心失衡及决策偏差往往在伤害性上远胜原本的冒犯。'
  },

  // 爱情 (Love)
  '爱情是两个生命系统的协作与博弈，旨在实现利益最大化。': {
    source: '威廉·詹姆斯 / 现代实用主义伦理学观点',
    explanation: '实用主义者认为爱不仅是激情的偶遇，也是一套在变幻命运里实现共同抗险、促成个体经验连带生长的深度合作。它的生命力在于彼此成长与现实自洽。'
  },
  '两个孤独灵魂的偶然相遇，在虚无中制造了短暂的错觉。': {
    source: '让-保罗·萨特 《存在与虚无》',
    explanation: '存在主义揭明了他人即是绝对异己，彻底消除隔阂是不存在的幻境。可正是在得知了这种宿命的绝对孤独后，当下的携手才显示出最为纯烈而真挚的浪漫。'
  },
  '相敬如宾，将私情升华为家庭秩序与社会责任的一部分。': {
    source: '《左传·僖公三十遥三十三》',
    explanation: '儒家所向往的爱情之美，重在相敬如宾的笃实与端庄。它提倡将狂野不羁的偶然私情融入长久稳定的礼义轨道、家庭秩序与社会的温暖连带中。'
  },
  '爱是理智的延伸，不应成为束缚彼此的锁链。': {
    source: '马可·奥勒留 / 爱比克泰德思想',
    explanation: '斯多葛主义宣导无执的仁慈与爱。应当真心珍爱眼前人，但要清醒体察万物皆是随借随还的馈赠，不要将其当成精神霸占和失去理智的束缚。'
  },

  // 孤独 (Solitude)
  '孤独是独立思考的实验场，是创造力最肥沃的土壤。': {
    source: '威廉·詹姆斯 《论人类日常经验》',
    explanation: '实用主义认为，撤离喧嚣并不等于消极遁世，而是隔绝噪声，让身心得以独自调试内部的思维工具箱、重组繁杂反馈以备后续爆发。'
  },
  '人类本质上是孤独的原子，所有的连接都只是自我安慰。': {
    source: '阿尔贝·加缪 《西西弗神话》',
    explanation: '荒诞哲学坦诚指明：人是孤独的存在。坦然接受这重生存孤绝，人便能豁免去寻求“救世主”的幻梦，站稳在大地上，全权主宰并亲手缔造自己生命的价值。'
  },
  '君子慎独，在无人注视时依然坚守内在的道德秩序。': {
    source: '《礼记·中庸》 / 《大学》',
    explanation: '儒家修身底蕴的最高显现——慎独。在极隐秘、幽暗、无人约束监督之地，内心良知的明鉴亦不减损分毫，生活作息和坚守皆井然而庄重。'
  },
  '孤独并不意味着缺少陪伴，而是灵魂 in 寻找自己的居所。': {
    source: '爱比克泰德 《金言录》',
    explanation: '斯多葛主义坚信，完美的宁静不必在红尘中搜寻。当人置身于孤独，他实际上是折返回到他那神圣不侵、最为安之若素的“内在城堡”里。'
  },

  // 自由 (Freedom)
  '自由是拥有更多可行的选择路径。': {
    source: '约翰·杜威 《自由与文化》',
    explanation: '实用主义指出空幻的言辞自由毫无落脚点。真正的自由完全是具有实效的实践技能与可用资源的宽阔度，从而让生命有能力实施并推进有益改变。'
  },
  '既然万物皆无意义，你便拥有了去做任何事的绝对自由。': {
    source: '让-保罗·萨特 《存在主义是一种人道主义》',
    explanation: '虚无主义/存在主义打破天命权威：在没有先验枷锁的冰冷世间，你既被赋予了彻底孤立的行事自由，也全权承载了去塑造自我存在轮廓的世界重量。'
  },
  '自由是随心而动而不逾矩，是在社会契约中的自洽。': {
    source: '孔子 《论语·为政》',
    explanation: '儒家的“心性自由”至境——“从心所欲不逾矩”。这不是肆意狂妄的宣泄，而是克己修为、融入社会和天道运行轨迹之后获得的一种极其舒展自洽的从容。'
  },
  '除了你的思想，没有什么能真正拨夺你的自由。': {
    source: '爱比克泰德 《断片集》',
    explanation: '即使身体负枷戴锁、处境困绝，但只要你那做出同意、判断与拒斥的最高理性堡垒不主动向外界低头，在这辽阔的寰宇中，便没有任何事物能染指你的彻底自主。'
  },

  // 亲情 (Family)
  '亲情是基础的社会保障网络，是长期博弈中的绝对信任。': {
    source: '现代实用主义社会伦理研究',
    explanation: '实用主义伦理学看来，亲情是由至亲之人长期深度投资积累而成的共同防空洞。它借由超越市侩算计的无私底色，成为抵抗万变危机时的温润堡垒。'
  },
  '基因延续的生物本能，披上了温情的道德外衣。': {
    source: '弗里德里希·尼采 《人性的，太人性的》',
    explanation: '冷静拆解情绪的表象后，它确实是来自远古基因密码在岁月长河里渴望实现不凡繁衍的生物本构。唯有直面这般真实，爱才不会成为绑架彼此人伦的重负。'
  },
  '父慈子孝，亲情是构建天下大治最底层的伦理基石。': {
    source: '孔子 《论语·学而》',
    explanation: '儒学精髓视亲缘厚谊为天下秩序的引力原点。亲子之爱、手足之温，是一切同情与恻隐的源头。唯有让它温和健康，人际和谐的大厦方能傲立。'
  },
  '亲人是你在这个世界的借阅，应当在珍惜的同时随时准备归还。': {
    source: '爱比克泰德 《手册》',
    explanation: '斯多葛派极其透辟的人生别离哲学：身边至爱并非你的拥有物。相逢时当极尽诚挚倾其所有去珍惜，但在终临辞别前夕时刻胸怀坦荡与释然，毫无半分失控嚎啕。'
  },

  // 遗憾 (Regret)
  '遗憾是过去决策的反馈，用于修正未来的行为逻辑。': {
    source: '约翰·杜威 《经验与教育》',
    explanation: '实用主义断言：自陷自责愧疚纯属内耗。若你审视过去的败绩，可将其视作绝无仅有的调试样本与实证信息。在下回行动的微调中消解过往。'
  },
  '所有的“如果”都没有意义，因为原本就没有既定的方向。': {
    source: '让-保罗·萨特 《存在论》',
    explanation: '虚无主义阐释：所有的懊悔和假设，都是立足于“生命有一条天命坦途但我选错了”这一荒诞叙事上。本来就没有最优走法，每步都是随机涂抹。'
  },
  '省察内心，通过当下的作为弥补过去的失序。': {
    source: '《孟子·公孙丑上》',
    explanation: '儒家勇于正视过失但不后撤，真正的过错是面对过去的残损选择退缩，最佳的修补是振作衣袖，在当下用光明正大的修持行径重新确立内心的端正。'
  },
  '遗憾是对不可控之事的徒劳执着，应将其葬在过去。': {
    source: '塞内卡 《论心灵的安宁》',
    explanation: '斯多葛流派将已定事实判定为无法撤回、无可变动的“绝对不可控属性”。纠缠不放纯属神志错乱，惟有关闭评判，安放当下、珍视此时此地。'
  },

  // 焦虑 (Anxiety)
  '焦虑是预测模型与现实脱节的警报，立即行动是最好的良药。': {
    source: '威廉·詹姆斯 《论意志力量》',
    explanation: '实用主义为焦虑拟出特效处方：焦虑因悬空未落地而生。立刻抛却万重思量转入执行任何一项极其细小、立竿见影的动作，让生命能量重回正轨。'
  },
  '焦虑是意识到人生毫无根基后的存在震颤。': {
    source: '让-保罗·萨特 《存在与虚无》研读',
    explanation: '这是存在主义中的核心概念。我们觉知的深重空虚，其实是源于猛然发现自己并非被预设好运行轨道的机器。你是自己人生的最高导演，也是那副沉重自由的承载人。'
  },
  '仁者不忧，焦虑源于对个人修养与责任的疏忽。': {
    source: '孔子 《论语·子罕》',
    explanation: '儒教提出：行事焦虑和迷乱，乃心有挂碍与修为疏离的表象。若能时刻坦诚修己，切实担负起身边人伦、日常礼义的责任，清心寡欲自然一身浩然。'
  },
  '你在想象中受的苦，远比现实中多得多。': {
    source: '塞内卡 《给卢西里乌斯的致辞》',
    explanation: '斯多葛主义对世俗忧郁的真知灼见：人类一生所设想的万般不幸和危机重重，百分之九十永远不会造访现实。划清凭空想象与现实界限，只守护当前的这一分种。'
  },

  // 友情 (Friendship)
  '友情是志同道合者的资源共享与情感互助。': {
    source: '约翰·杜威 《民主主义与经验哲学》',
    explanation: '实用主义认可友情是在同一段生命探求之路上共同遭遇、相辅相成的合伙关系。真诚的知己能够拓宽各自眼界，在现实世界共抗尘雾。'
  },
  '在冰冷宇宙中互相取暖的两个偶然生命。': {
    source: '阿尔贝·加缪 《西西弗神话及笔记》',
    explanation: '在一场死寂无回音、不知其所以然的寥廓荒漠中，两个机缘巧合发生碰撞且能心照不宣相视一笑的宿命。这就是对抗冰寒宇宙 of 极其自豪的见证，没有多余的附丽。'
  },
  '益者三友，友情是砥砺道德与学问的镜子。': {
    source: '孔子 《论语·季氏》',
    explanation: '儒家赋予朋友最高的社会与德性期许。良友是修身成仁的互鉴明镜，在诚实交流、彼此匡正不妥之中切磋涵养，这在儒家是不容或缺的事实乐章。'
  },
  '好朋友是另一个自我，是共同追求智慧的旅伴。': {
    source: '塞内卡 《道德书简二》',
    explanation: '斯多葛学说断言：真正的友谊建立在理性共同攀登顶峰的历练上。朋友是两个有幸拥有同一睿智目标的行者在山峦不离不弃、共同修德修身的伴侣。'
  }
};

const SCHOOLS = [
  { id: 'Stoicism', name: '斯多葛主义', desc: '内在宁静' },
  { id: 'Pragmatism', name: '实用主义', desc: '行动真理' },
  { id: 'Nihilism', name: '虚无主义', desc: '存在无义' },
  { id: 'Confucianism', name: '儒家思想', desc: '克己复礼' },
];

// --- Custom Hand-Drawn Mood Emojis ---
interface EmojiProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const HappyEmoji: React.FC<EmojiProps> = ({ size = 14, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M 5 9 L 8.5 11 L 5 13" />
    <path d="M 19 9 L 15.5 11 L 19 13" />
    <path d="M 8.5 15.5 Q 12 19 15.5 15.5" />
    <path d="M 2 12.5 L 3.5 11" />
    <path d="M 3.8 13.5 L 5.3 12" />
    <path d="M 22 12.5 L 20.5 11" />
    <path d="M 20.2 13.5 L 18.7 12" />
  </svg>
);

const CuteEmoji: React.FC<EmojiProps> = ({ size = 14, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M 5 6.5 L 9 5" />
    <path d="M 19 6.5 L 15 5" />
    <path d="M 9.5 12.5 Q 10.75 14.5 12 12.5" />
    <path d="M 12 12.5 Q 13.25 14.5 14.5 12.5" />
    <path d="M 3.5 10 L 2.5 13" />
    <path d="M 6 10 L 5 13" />
    <path d="M 18 13 L 17 10" />
    <path d="M 20.5 13 L 19.5 10" />
  </svg>
);

const CryingEmoji: React.FC<EmojiProps> = ({ size = 14, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M 6.5 5.5 Q 8 3.5 9.5 5.5" />
    <path d="M 14.5 5.5 Q 16 3.5 17.5 5.5" />
    <path d="M 5 8.5 C 4 11, 6 14, 5 16.5 C 4 19, 5 19.5, 5 20" />
    <path d="M 7.5 8.5 C 6.5 11, 8.5 14, 7.5 16.5 C 6.5 19, 7.5 19.5, 7.5 20" />
    <path d="M 16.5 8.5 C 15.5 11, 17.5 14, 16.5 16.5 C 15.5 19, 16.5 19.5, 16.5 20" />
    <path d="M 19 8.5 C 18 11, 20 14, 19 16.5 C 18 19, 19 19.5, 19 20" />
    <path d="M 10.5 15.5 Q 12 13 13.5 15.5" />
  </svg>
);

const AngryEmoji: React.FC<EmojiProps> = ({ size = 14, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M 4.5 10.5 L 8.5 12 L 4.5 13.5" />
    <path d="M 15.5 13.5 L 11.5 12 L 15.5 10.5" />
    <path d="M 8.5 16.5 Q 11 13.5 13.5 16.5" />
    <path d="M 16.5 4.5 Q 18 4.5 18 3" />
    <path d="M 18 3 Q 18 4.5 19.5 4.5" />
    <path d="M 19.5 4.5 Q 18 4.5 18 6" />
    <path d="M 18 6 Q 18 4.5 16.5 4.5" />
  </svg>
);

const VoidEmoji: React.FC<EmojiProps> = ({ size = 14, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="5.5" y1="7" x2="9.5" y2="11" />
    <line x1="9.5" y1="7" x2="5.5" y2="11" />
    <line x1="14.5" y1="7" x2="18.5" y2="11" />
    <line x1="18.5" y1="7" x2="14.5" y2="11" />
    <line x1="7" y1="17" x2="17" y2="17" />
  </svg>
);

const WEATHER_OPTIONS = [
  { id: 'sunny', icon: <Sun size={14} /> },
  { id: 'cloudy', icon: <Cloud size={14} /> },
  { id: 'rainy', icon: <CloudRain size={14} /> },
  { id: 'stormy', icon: <CloudLightning size={14} /> },
  { id: 'windy', icon: <Wind size={14} /> },
];

const MOOD_OPTIONS = [
  { id: 'happy', icon: <HappyEmoji size={14} /> },
  { id: 'calm', icon: <CuteEmoji size={14} /> },
  { id: 'sad', icon: <CryingEmoji size={14} /> },
  { id: 'angry', icon: <AngryEmoji size={14} /> },
  { id: 'void', icon: <VoidEmoji size={14} /> },
];

const App: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [activeTool, setActiveTool] = useState<ToolType>('none');

  const [nickname, setNickname] = useState(() => {
    try {
      const saved = localStorage.getItem('user_nickname_v2');
      return saved || '';
    } catch (e) {
      return '';
    }
  });

  const [avatarIndex, setAvatarIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('user_avatar_index_v2');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('user_nickname_v2', nickname);
    } catch (e) {}
  }, [nickname]);

  useEffect(() => {
    try {
      localStorage.setItem('user_avatar_index_v2', avatarIndex.toString());
    } catch (e) {}
  }, [avatarIndex]);

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('philosophical_diary_entries_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [userMoodSelected, setUserMoodSelected] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('user_mood_selected_v2');
      return saved || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (userMoodSelected) {
        localStorage.setItem('user_mood_selected_v2', userMoodSelected);
      } else {
        localStorage.removeItem('user_mood_selected_v2');
      }
    } catch (e) {}
  }, [userMoodSelected]);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showToolSettings, setShowToolSettings] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('system_messages_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: '1',
        title: '认知重构提醒',
        content: '在这个不确定的世界里，唯有你的认知边界能筑起笃定的港湾。',
        time: '10:00',
        unread: true
      },
      {
        id: '2',
        title: '静心思考时刻',
        content: '外界纷扰皆是外在尘埃，回归当下的呼吸，建立你内在的秩序。',
        time: '09:00',
        unread: true
      },
      {
        id: '3',
        title: '智能分析报告',
        content: '你已成功启动了“澄识之径”探索，继续前行，智慧将在记录中不断沉淀。',
        time: '08:30',
        unread: false
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('system_messages_v1', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  const [quickToolIds, setQuickToolIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quick_tool_ids_v2');
      return saved ? JSON.parse(saved) : ['selector', 'workplace'];
    } catch (e) {
      return ['selector', 'workplace'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('quick_tool_ids_v2', JSON.stringify(quickToolIds));
    } catch (e) {}
  }, [quickToolIds]);

  useEffect(() => {
    try {
      localStorage.setItem('philosophical_diary_entries_v2', JSON.stringify(diaryEntries));
    } catch (e) {}
  }, [diaryEntries]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0 });
    }
  }, [activeTab, activeTool]);

  useEffect(() => {
    document.title = lang === 'zh' ? '澄识之径 - 构建内在认知秩序' : 'Path of Clarity - Build Your Inner Cognitive Order';
  }, [lang]);

  const getPhilosophicalInsight = async (content: string, school: string, emotion: string, view: string) => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = lang === 'en'
        ? `You are a sage. The theme the user is reflecting on today is "${emotion}".
           The philosophical perspective is "${view}".
           The user's insights are: "${content}".
           Please give the user a short, profound, and order-building response in English (under 60 words). No preachiness. Output the content directly without prefaces.`
        : `你是一位智者。用户今天思考的主题是“${emotion}”。
      用户认可的哲学视角是：“${view}”。
      用户的感悟：“${content}”。
      请给用户一段简短（80字以内）、透彻且能建立认知秩序的回应。不要说教。直接给出内容，无需前置废话。`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      return response.text;
    } catch (error) { 
      return lang === 'en' ? "Order arises from your reconstruction of the world." : "秩序产生于你对世界的重构。"; 
    }
    finally { setIsAiLoading(false); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return (
        <PhilosophicalDiary 
          entries={diaryEntries} 
          setEntries={setDiaryEntries} 
          getInsight={getPhilosophicalInsight} 
          isLoading={isAiLoading} 
          onTabChange={setActiveTab}
          onSelectTool={setActiveTool}
          quickToolIds={quickToolIds}
          nickname={nickname}
          userMoodSelected={userMoodSelected}
          setUserMoodSelected={setUserMoodSelected}
        />
      );
      case 'tools': 
        if (activeTool === 'selector') return <LifeSelector onBack={() => setActiveTool('none')} />;
        if (activeTool === 'workplace') return <WorkplaceSurvival onBack={() => setActiveTool('none')} />;
        return <Toolbox onSelectTool={setActiveTool} onOpenSettings={() => setShowToolSettings(true)} />;
      case 'growth': return (
        <UserCenter 
          entries={diaryEntries} 
          setEntries={setDiaryEntries} 
          onTabChange={setActiveTab} 
          onSelectTool={(t) => { setActiveTab('tools'); setActiveTool(t); }} 
          nickname={nickname}
          setNickname={setNickname}
          avatarIndex={avatarIndex}
          setAvatarIndex={setAvatarIndex}
          showProfileEdit={showProfileEdit}
          setShowProfileEdit={setShowProfileEdit}
          userMoodSelected={userMoodSelected}
        />
      );
      default: return null;
    }
  };

  const isScrollLocked = activeTool !== 'none' && activeTool !== 'selector';

  return (
    <div className={`flex flex-col font-sans select-none ${isScrollLocked ? 'h-screen overflow-hidden' : 'min-h-screen'}`} style={{ backgroundColor: MorandiTheme.bg, color: MorandiTheme.ink }}>
      {activeTool !== 'workplace' && activeTool !== 'selector' && (
        <header className="p-6 pt-12 flex items-center justify-between border-b border-gray-100 bg-[#FFFFFF]/70 backdrop-blur-md z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: MorandiTheme.blue }}>
              {activeTab === 'home' ? '澄识' : activeTab === 'tools' ? '格物' : '进境'}
            </h1>
            <p className="text-[10px] opacity-40 mt-0.5 uppercase tracking-[0.2em] text-slate-400">
              {activeTab === 'home' ? 'Clarity' : activeTab === 'tools' ? 'Methodology' : 'Progression'}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button 
              onClick={() => setShowMessages(true)} 
              className="relative w-10 h-10 bg-white hover:bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
              title={t('消息中心')}
            >
              <Bell size={18} style={{ color: MorandiTheme.blue }} />
              {messages.some(m => m.unread) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
          </div>
        </header>
      )}
      <main className={`flex-1 ${activeTool === 'none' ? 'overflow-y-auto pb-24' : isScrollLocked ? 'h-full w-full overflow-hidden flex flex-col' : 'w-full flex flex-col'}`}>{renderContent()}</main>
      {activeTool === 'none' && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex items-center justify-around px-4 z-20">
          <NavButton active={activeTab === 'home'} icon={<BookOpen size={24} />} label={t("主页")} onClick={() => setActiveTab('home')} />
          <NavButton active={activeTab === 'tools'} icon={<LayoutGrid size={24} />} label={t("工具")} onClick={() => setActiveTab('tools')} />
          <NavButton active={activeTab === 'growth'} icon={<Award size={24} />} label={t("成长")} onClick={() => setActiveTab('growth')} />
        </nav>
      )}

      {showToolSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 flex flex-col gap-6 text-left animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(to right, ${MorandiTheme.blue}, ${MorandiTheme.purple})` }} />
            
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 tracking-tight font-sans">
                {lang === 'zh' ? '设置快捷工具' : 'Quick Tools Settings'}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                {lang === 'zh' ? '选择在主页展示的两个快捷工具' : 'Choose two quick tools to display on the home screen'}
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'selector', name: '理性决策分析表', desc: '量化利弊破，除决策迷雾', icon: <Scale size={18} /> },
                { id: 'workplace', name: '职场生存研究', desc: '解构互动，沉淀职场法则', icon: <Briefcase size={18} /> },
                { id: 'coming_soon', name: '更多工具，敬请期待', desc: '', icon: <Sparkles size={18} />, disabled: true }
              ].map(opt => {
                const isSelected = quickToolIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;
                      if (isSelected) {
                        if (quickToolIds.length > 1) {
                          setQuickToolIds(quickToolIds.filter(id => id !== opt.id));
                        }
                      } else {
                        if (quickToolIds.length < 2) {
                          setQuickToolIds([...quickToolIds, opt.id]);
                        } else {
                          setQuickToolIds([quickToolIds[1], opt.id]);
                        }
                      }
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                      opt.disabled
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-100'
                        : isSelected 
                          ? 'bg-purple-50/10 border-[#8A70D6] shadow-xs cursor-pointer' 
                          : 'bg-white hover:bg-slate-50 border-slate-100 cursor-pointer'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: opt.disabled ? 'rgba(148, 163, 184, 0.04)' : isSelected ? 'rgba(138, 112, 214, 0.12)' : 'rgba(148, 163, 184, 0.08)',
                        color: opt.disabled ? '#94A3B8' : isSelected ? '#8A70D6' : '#64748B' 
                      }}
                    >
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 tracking-tight font-sans truncate">
                        {t(opt.name)}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-medium truncate">
                        {t(opt.desc)}
                      </p>
                    </div>
                    {!opt.disabled && (
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'border-[#8A70D6] bg-[#8A70D6] text-white' 
                          : 'border-slate-200'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setShowToolSettings(false)} 
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold tracking-widest uppercase transition-all shadow-md active:scale-98 cursor-pointer font-sans text-center"
            >
              {lang === 'zh' ? '保存并关闭' : 'Save & Close'}
            </button>
          </div>
        </div>
      )}

      {showMessages && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 flex flex-col gap-6 text-left animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(to right, ${MorandiTheme.blue}, ${MorandiTheme.purple})` }} />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800 tracking-tight font-sans">
                  {t('消息中心')}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {lang === 'zh' ? '来自先贤与当下的思想回响' : 'Mental echoes from sages and moments'}
                </p>
              </div>
              <button 
                onClick={() => setShowMessages(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] bg-indigo-50/70 text-indigo-500 font-extrabold px-3 py-1 rounded-full font-sans">
                {messages.filter(m => m.unread).length} {lang === 'zh' ? '条未读' : 'unread'}
              </span>
              {messages.some(m => m.unread) && (
                <button 
                  onClick={() => {
                    setMessages(messages.map(m => ({ ...m, unread: false })));
                  }}
                  className="text-[10px] font-extrabold text-slate-400 hover:text-indigo-500 transition-all cursor-pointer font-sans"
                >
                  {t('全部已读')}
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-300 space-y-2">
                  <Bell size={32} className="mx-auto opacity-30" />
                  <p className="text-xs font-semibold">{t('暂无新消息')}</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg.id}
                    onClick={() => {
                      if (msg.unread) {
                        setMessages(messages.map(m => m.id === msg.id ? { ...m, unread: false } : m));
                      }
                    }}
                    className={`p-4 rounded-3xl border transition-all relative cursor-pointer ${
                      msg.unread 
                        ? 'bg-slate-50/60 border-indigo-100 hover:border-indigo-200 shadow-2xs' 
                        : 'bg-white border-slate-100/80 hover:border-slate-200'
                    }`}
                  >
                    {msg.unread && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                    )}
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-sans">{msg.time}</span>
                        <h4 className="font-extrabold text-xs text-slate-800 tracking-tight font-sans">
                          {t(msg.title)}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed font-sans mt-1">
                        {t(msg.content)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => setShowMessages(false)} 
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold tracking-widest uppercase transition-all shadow-md active:scale-98 cursor-pointer font-sans text-center"
            >
              {t('关闭')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${active ? 'scale-110' : 'opacity-30 grayscale'} cursor-pointer`} style={{ color: active ? '#8A70D6' : MorandiTheme.ink }}>
    {icon}<span className="text-[9px] font-bold tracking-tighter uppercase font-sans">{label}</span>
  </button>
);

const PhilosophicalDiary: React.FC<{ 
  entries: DiaryEntry[], 
  setEntries: React.Dispatch<React.SetStateAction<DiaryEntry[]>>,
  getInsight: (c: string, s: string, e: string, v: string) => Promise<string>,
  isLoading: boolean,
  onTabChange?: (tab: MainTab) => void,
  onSelectTool?: (tool: ToolType) => void,
  quickToolIds: string[],
  nickname: string,
  userMoodSelected: string | null,
  setUserMoodSelected: React.Dispatch<React.SetStateAction<string | null>>
}> = ({ entries, setEntries, getInsight, isLoading, onTabChange, onSelectTool, quickToolIds, nickname, userMoodSelected, setUserMoodSelected }) => {
  const { lang, t } = useLanguage();
  const [isDashboard, setIsDashboard] = useState(true);
  const [step, setStep] = useState<DiaryStep>('word-selection');
  const [content, setContent] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [weather, setWeather] = useState('sunny');
  const [mood, setMood] = useState('calm');
  const [enableAiFeedback, setEnableAiFeedback] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [lastReflection, setLastReflection] = useState('');

  // Daily mood selector states for dashboard
  const [showMoodToast, setShowMoodToast] = useState(false);
  const [showClarityIndexInfo, setShowClarityIndexInfo] = useState(false);
  const [globalMoodStats, setGlobalMoodStats] = useState(() => {
    try {
      const saved = localStorage.getItem('global_mood_stats_data_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { great: 154, okay: 92, bad: 23 };
  });

  const handleMoodSelect = (moodType: 'great' | 'okay' | 'bad') => {
    setUserMoodSelected(moodType);
    setShowMoodToast(true);
    setGlobalMoodStats(prev => {
      const updated = { ...prev, [moodType]: prev[moodType] + 1 };
      localStorage.setItem('global_mood_stats_data_v2', JSON.stringify(updated));
      return updated;
    });
    
    // Auto sync weather & mood defaults for writing flow
    if (moodType === 'great') { setMood('happy'); setWeather('sunny'); }
    else if (moodType === 'okay') { setMood('calm'); setWeather('cloudy'); }
    else if (moodType === 'bad') { setMood('sad'); setWeather('rainy'); }

    setTimeout(() => {
      setShowMoodToast(false);
    }, 4500);
  };

  // Calculation of today's timestamps for "此刻的我们"
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const hasDiaryToday = entries.some(entry => {
    return entry.date >= todayStart.getTime() && entry.date <= todayEnd.getTime();
  });

  const getHasSelectorToday = () => {
    try {
      const saved = localStorage.getItem('life_selector_history');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const start = todayStart.getTime();
          const end = todayEnd.getTime();
          return list.some((item: any) => item.timestamp && item.timestamp >= start && item.timestamp <= end);
        }
      }
    } catch (e) {}
    return false;
  };

  const getHasWorkplaceToday = () => {
    try {
      const saved = localStorage.getItem('work_observation_logs');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const start = todayStart.getTime();
          const end = todayEnd.getTime();
          return list.some((item: any) => {
            const time = item.timestamp || (item.date ? new Date(item.date).getTime() : 0);
            return time >= start && time <= end;
          });
        }
      }
    } catch (e) {}
    return false;
  };

  const hasContributedToday = userMoodSelected !== null || hasDiaryToday || getHasSelectorToday() || getHasWorkplaceToday();

  // Compute stats based on contribution
  const baseGreat = 7;
  const baseOkay = 5;
  const baseBad = 2;

  let greatCount = baseGreat;
  let okayCount = baseOkay;
  let badCount = baseBad;

  if (hasContributedToday) {
    if (userMoodSelected === 'great') {
      greatCount += 1;
    } else if (userMoodSelected === 'bad') {
      badCount += 1;
    } else {
      okayCount += 1; // general logging or okay
    }
  }

  const totalUsersToday = greatCount + okayCount + badCount;
  const percentageGreat = totalUsersToday > 0 ? Math.round((greatCount / totalUsersToday) * 100) : 0;
  const percentageOkay = totalUsersToday > 0 ? Math.round((okayCount / totalUsersToday) * 100) : 0;
  const percentageBad = totalUsersToday > 0 ? Math.round((badCount / totalUsersToday) * 100) : 0;

  // Emotional words aggregation
  const todayEmotions = entries
    .filter(entry => entry.date >= todayStart.getTime() && entry.date <= todayEnd.getTime())
    .map(entry => entry.emotion);

  const defaultWordsForToday = ['焦虑', '自由', '孤独'];
  const uniqueWordSetForToday = new Set<string>();
  todayEmotions.forEach(w => { if (w) uniqueWordSetForToday.add(w); });
  defaultWordsForToday.forEach(w => uniqueWordSetForToday.add(w));
  const finalWordsForToday = Array.from(uniqueWordSetForToday).slice(0, 3);
  const wordsDisplay = finalWordsForToday.join('、');

  // Philosophy school aggregation
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const schoolCounts: Record<string, number> = {
    'Stoicism': 3,
    'Pragmatism': 2,
    'Nihilism': 1,
    'Confucianism': 1
  };
  entries.forEach(entry => {
    if (entry.date >= sevenDaysAgo && entry.school) {
      schoolCounts[entry.school] = (schoolCounts[entry.school] || 0) + 1;
    }
  });

  let topSchoolEn = 'Stoicism';
  let maxSchoolCount = 0;
  for (const s in schoolCounts) {
    if (schoolCounts[s] > maxSchoolCount) {
      maxSchoolCount = schoolCounts[s];
      topSchoolEn = s;
    }
  }

  const schoolMap: Record<string, { nameZh: string; nameEn: string; descZh: string; descEn: string }> = {
    'Stoicism': {
      nameZh: '斯多葛主义',
      nameEn: 'Stoicism',
      descZh: '用理智区分可控与不可控——这是斯多葛主义正在教大家的事。',
      descEn: 'Distinguish what is in your control from what is not—this is what Stoicism is teaching everyone.'
    },
    'Pragmatism': {
      nameZh: '实用主义',
      nameEn: 'Pragmatism',
      descZh: '把情绪当作行动的信号，而非终点——这是实用主义正在教大家的事。',
      descEn: 'Treat emotion as a signal for action, not the destination—this is what Pragmatism is teaching everyone.'
    },
    'Nihilism': {
      nameZh: '虚无主义',
      nameEn: 'Nihilism',
      descZh: '既然万物皆无意义，你拥有了绝对自由——这是虚无主义正在教大家的事。',
      descEn: 'Since everything is meaningless, you have absolute freedom—this is what Nihilism is teaching everyone.'
    },
    'Confucianism': {
      nameZh: '儒家',
      nameEn: 'Confucianism',
      descZh: '在群己之间寻找中正与自洽——这是儒家正在教大家的事。',
      descEn: 'Seek balance and self-consistency between self and society—this is what Confucianism is teaching everyone.'
    }
  };

  const topSchoolInfo = schoolMap[topSchoolEn] || schoolMap['Stoicism'];

  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [step, isDashboard]);

  const currentSchool = SCHOOLS.find(s => s.id === selectedSchoolId);
  const currentQuote = selectedWord && selectedSchoolId ? PHILOSOPHY_QUOTES[selectedWord][selectedSchoolId] : '';

  const saveEntry = async () => {
    if (!content.trim() || !selectedWord || !selectedSchoolId) return;
    const view = PHILOSOPHY_QUOTES[selectedWord][selectedSchoolId];
    const schoolObj = SCHOOLS.find(s => s.id === selectedSchoolId);
    
    let reflection = '';
    if (enableAiFeedback) {
      reflection = await getInsight(content, schoolObj?.name || '哲学', selectedWord, view);
    }
    
    setEntries([{ 
      id: Date.now().toString(), 
      content: content.trim(), 
      emotion: selectedWord, 
      selectedView: view, 
      school: schoolObj?.name, 
      aiReflection: reflection || undefined, 
      weather, 
      mood,
      date: Date.now() 
    }, ...entries]);
    
    if (enableAiFeedback && reflection) {
      setLastReflection(reflection);
      setShowAiModal(true);
    }
    resetForm();
    setIsDashboard(true);
  };

  const resetForm = () => {
    setContent('');
    setSelectedSchoolId(null);
    setSelectedWord(null);
    setWeather('sunny');
    setMood('calm');
    setStep('word-selection');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const displayName = nickname.trim() || (lang === 'zh' ? '小明' : 'Ming');
    if (hour >= 5 && hour < 11) {
      return lang === 'zh' ? `早上好，${displayName}` : `Good morning, ${displayName}`;
    }
    if (hour >= 11 && hour < 14) {
      return lang === 'zh' ? `中午好，${displayName}` : `Good noon, ${displayName}`;
    }
    if (hour >= 14 && hour < 18) {
      return lang === 'zh' ? `下午好，${displayName}` : `Good afternoon, ${displayName}`;
    }
    return lang === 'zh' ? `晚上好，${displayName}` : `Good evening, ${displayName}`;
  };

  // Badge unlock indicators based on standard user behavior
  const diaryCount = entries.length;
  const isSevenDayStreak = diaryCount >= 1 || userMoodSelected !== null;
  const isReflectionMaster = diaryCount >= 3;
  const isMoodRecorder = userMoodSelected !== null || entries.length > 0;

  return (
    <div className="w-full">
      {isDashboard ? (
        <div className="p-4 sm:p-6 space-y-7 animate-in fade-in max-w-lg mx-auto w-full pb-16">
        
        {/* Mood Greeting Container */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 flex flex-col gap-5 text-left">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-1.5 font-sans">
              <span>{getGreeting()}</span>
              <span className="animate-pulse">💜</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              {t('你今天感觉如何?')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'great', label: t('很好'), color: '#5B4EB3', activeColor: '#8A70D6', bg: 'rgba(138, 112, 214, 0.08)', emoji: '🟢' },
              { id: 'okay', label: t('一般'), color: '#D97706', activeColor: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)', emoji: '🟡' },
              { id: 'bad', label: t('不好'), color: '#DC2626', activeColor: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', emoji: '🔴' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleMoodSelect(m.id as 'great' | 'okay' | 'bad')}
                className={`py-3.5 px-2 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                  userMoodSelected === m.id 
                    ? 'shadow-md scale-102 border-transparent' 
                    : 'bg-white hover:bg-slate-50 border-slate-150 hover:border-slate-200'
                }`}
                style={{
                  backgroundColor: userMoodSelected === m.id ? m.bg : undefined,
                  borderColor: userMoodSelected === m.id ? m.activeColor : undefined,
                  color: userMoodSelected === m.id ? m.color : '#64748B'
                }}
              >
                <span>{m.emoji}</span>
                <span className="font-sans">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Go Log button underneath options */}
          <div className="pt-1">
            <button 
              onClick={() => { setIsDashboard(false); setStep('word-selection'); }}
              className="w-full text-center py-4 bg-[#8A70D6] hover:bg-[#795fc0] text-white rounded-2xl text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs cursor-pointer font-sans"
            >
              <span>{t('去记录')}</span>
              <ArrowRight size={14} className="transition-transform hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Global Live Selections Toast Banner */}
        {showMoodToast && (
          <div className="bg-[#8A70D6] text-white py-3 px-5 rounded-2xl shadow-lg flex items-center justify-between text-xs animate-in slide-in-from-bottom-5 duration-300 font-sans text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm">🌌</span>
              <span>{lang === 'zh' ? '已记录今日心境，全网共鸣中' : 'Mood logged, resonating with world'}</span>
            </div>
            <span className="opacity-80 italic text-[10px] whitespace-nowrap">
              {userMoodSelected === 'great' ? t('很好') : userMoodSelected === 'okay' ? t('一般') : t('不好')} +1
            </span>
          </div>
        )}

        {/* Philosophy Tools Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase font-sans">{t('快捷工具')}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'selector', name: '理性决策分析表', desc: '量化利弊破，除决策迷雾', icon: <Scale size={20} strokeWidth={2.2} />, color: '#8A70D6', bgColor: 'rgba(138, 112, 214, 0.08)' },
              { id: 'workplace', name: '职场生存研究', desc: '解构互动，沉淀职场法则', icon: <Briefcase size={20} strokeWidth={2.2} />, color: '#9C82CB', bgColor: 'rgba(156, 130, 203, 0.08)' },
              { id: 'coming_soon', name: '更多工具，敬请期待', desc: '', icon: <Sparkles size={20} strokeWidth={2.2} />, color: '#64748B', bgColor: 'rgba(100, 116, 139, 0.08)', disabled: true }
            ].filter(tool => quickToolIds.includes(tool.id)).map(tool => {
              if (tool.disabled) {
                return (
                  <div 
                    key={tool.id}
                    className="bg-white/40 p-5 rounded-3xl border border-dashed border-slate-200 flex flex-col items-start gap-4 transition-all text-left opacity-60"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                      {tool.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 tracking-tight font-sans">
                        {t(tool.name)}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal font-sans">
                        {t(tool.desc)}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <button 
                  key={tool.id}
                  onClick={() => { if (onTabChange && onSelectTool) { onTabChange('tools'); onSelectTool(tool.id as ToolType); } }}
                  className="bg-white p-5 rounded-3xl border border-transparent shadow-xs hover:shadow-md hover:border-slate-100 flex flex-col items-start gap-4 transition-all text-left active:scale-[0.97] cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tool.bgColor, color: tool.color }}>
                    {tool.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-800 tracking-tight font-sans">
                      {t(tool.name)}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-normal font-sans">
                      {t(tool.desc)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* '此刻的我们' Poetic Window Card */}
        <div className="rounded-[40px] p-6 sm:p-8 space-y-6 text-left relative overflow-hidden bg-gradient-to-b from-[#F3F0F6] to-[#FAF8FC]" style={{ border: '1px solid rgba(138, 112, 214, 0.1)' }}>
          
          {/* Header section with Arch Window */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-serif text-slate-800 tracking-tight">
                  {lang === 'zh' ? '此刻的我们' : t('此刻的我们')}
                </h3>
                <span className="text-xl inline-block select-none animate-pulse">💖</span>
                <button 
                  onClick={() => setShowClarityIndexInfo(true)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all cursor-pointer inline-flex items-center justify-center focus:outline-none"
                  title={lang === 'zh' ? '查看指数量化逻辑' : 'View index logic'}
                >
                  <Info size={14} className="opacity-80" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {lang === 'zh' ? '散落的独白，在这汇成同一片天色。' : t('散落的独白，在这汇成同一片天色。')}
              </p>
            </div>

            {/* Elegant Arch Window illustration to the right */}
            <div className="hidden sm:block shrink-0 relative w-28 h-36 rounded-t-full border border-[#CEC5C5]/60 overflow-hidden bg-gradient-to-b from-[#E7D6EB] via-[#FCE4D6] to-[#EAEBEC] shadow-sm select-none">
              {/* Sun in window */}
              <div className="absolute top-8 right-3 w-10 h-10 rounded-full bg-[#F3C4CB] opacity-75 filter blur-[1px]" />
              {/* Soft mountain layers */}
              <div className="absolute bottom-4 left-[-20%] w-[140%] h-10 rounded-[50%] bg-[#E5EDE9]/70" />
              <div className="absolute bottom-0 left-[-20%] w-[140%] h-7 rounded-[50%] bg-[#D2CAD8]/50" />
              {/* Delicate glass candle */}
              <div className="absolute bottom-1 left-4 w-5 h-5 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-t-md bg-white/50 border border-white/70 relative flex items-center justify-center pb-0.5">
                  <div className="w-1 h-1.5 bg-amber-400 rounded-full animate-pulse absolute -top-0.5" style={{ boxShadow: '0 0 4px rgba(251, 191, 36, 0.8)' }} />
                </div>
              </div>
              {/* Minimalist vase branch */}
              <div className="absolute bottom-1 right-3 w-4 h-6">
                <svg viewBox="0 0 20 30" className="w-full h-full text-indigo-900/40">
                  <path d="M 10,30 Q 15,15 12,5" stroke="currentColor" strokeWidth="1" fill="none" />
                  <path d="M 10,23 Q 4,14 6,8" stroke="currentColor" strokeWidth="1" fill="none" />
                  <circle cx="12" cy="5" r="1.2" fill="currentColor" />
                  <circle cx="6" cy="8" r="1.2" fill="currentColor" />
                </svg>
              </div>
              {/* Marble sill plate */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#CEC5C5]" />
            </div>
          </div>

          {!hasContributedToday ? (
            /* locked state */
            <div className="py-8 text-center space-y-3 font-sans border border-dashed border-slate-300/40 rounded-3xl bg-white/40 relative z-10">
              <span className="text-xl">🌙</span>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto px-4 leading-relaxed">
                {lang === 'zh' ? '先等你写下今天的第一笔' : t('先等你写下今天的第一笔')}
              </p>
            </div>
          ) : (
            /* active state */
            <div className="space-y-6 relative z-10">
              
              {/* 1. Translucent user count box */}
              <div className="bg-white/50 backdrop-blur-md rounded-[28px] p-5 sm:p-6 border border-white/70 flex items-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/60 flex items-center justify-center text-[#8A70D6] shrink-0">
                  <Users size={22} strokeWidth={1.8} />
                </div>
                <div className="text-slate-600 font-sans text-sm sm:text-base">
                  {lang === 'zh' ? (
                    <>今天有 <span className="text-2xl font-light text-[#8A70D6] px-1 font-serif">{totalUsersToday}</span> 人在澄识之径</>
                  ) : (
                    <>Today, <span className="text-2xl font-light text-[#8A70D6] px-1 font-serif">{totalUsersToday}</span> people are on the Clarity Path</>
                  )}
                </div>
              </div>

              {/* 2. Emotional States distribution */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-400 shrink-0 select-none text-xs flex items-center justify-center">
                    😊
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-600 tracking-wider font-sans">
                    {lang === 'zh' ? '情绪分布' : 'Emotional States'}
                  </h4>
                </div>

                {totalUsersToday < 3 ? (
                  <p className="text-xs text-slate-400 italic leading-relaxed pl-1">
                    {lang === 'zh' ? '这里刚刚亮起第一盏灯。再过几天，会有更多人加入。' : t('这里刚刚亮起第一盏灯。再过几天，会有更多人加入。')}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:gap-5">
                    {/* 轻盈 */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-rose-200 via-rose-100 to-rose-50/50 border border-white/60 shadow-xs">
                          <Feather className="text-rose-400 opacity-90" size={16} />
                        </div>
                        <div className="text-left font-sans min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{lang === 'zh' ? '轻盈' : 'Lightness'}</div>
                          <div className="text-[10px] sm:text-xs text-rose-500 font-bold whitespace-nowrap mt-0.5">
                            {greatCount}{lang === 'zh' ? '人' : 'p'} <span className="text-slate-400 font-medium">({percentageGreat}%)</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-rose-100/40 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-200 rounded-full transition-all duration-1000" style={{ width: `${percentageGreat}%` }} />
                      </div>
                    </div>

                    {/* 深沉 */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-indigo-100/50 border border-white/60 shadow-xs">
                          <Cloud className="text-indigo-400 opacity-90" size={16} />
                        </div>
                        <div className="text-left font-sans min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{lang === 'zh' ? '深沉' : 'Deepness'}</div>
                          <div className="text-[10px] sm:text-xs text-indigo-500 font-bold whitespace-nowrap mt-0.5">
                            {okayCount}{lang === 'zh' ? '人' : 'p'} <span className="text-slate-400 font-medium">({percentageOkay}%)</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-100/40 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-300 rounded-full transition-all duration-1000" style={{ width: `${percentageOkay}%` }} />
                      </div>
                    </div>

                    {/* 凝重 */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#E3DCD3] via-[#EFECE6]/80 to-[#F6F5F2]/40 border border-white/60 shadow-xs">
                          <CloudRain className="text-amber-700/60 opacity-90" size={16} />
                        </div>
                        <div className="text-left font-sans min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{lang === 'zh' ? '凝重' : 'Heaviness'}</div>
                          <div className="text-[10px] sm:text-xs text-amber-700/80 font-bold whitespace-nowrap mt-0.5">
                            {badCount}{lang === 'zh' ? '人' : 'p'} <span className="text-slate-400 font-medium">({percentageBad}%)</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-amber-100/30 rounded-full overflow-hidden">
                        <div className="h-full bg-[#BFB2A2] rounded-full transition-all duration-1000" style={{ width: `${percentageBad}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Today's top emotional words with customized pills */}
              <div className="flex items-center gap-3 pt-1 text-xs sm:text-sm text-slate-600 font-sans flex-wrap">
                <div className="w-7 h-7 rounded-full bg-[#EDEBEF] flex items-center justify-center text-slate-500 shrink-0">
                  <MessageSquare size={13} />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{lang === 'zh' ? '今天，大家在和' : 'Today, everyone is speaking with'}</span>
                  {finalWordsForToday.map((word, i) => (
                    <span key={i} className="px-3 py-0.5 rounded-lg text-xs sm:text-sm font-serif text-[#6F5E7C] bg-[#F1EFF3] border border-slate-300/10 font-bold tracking-wider shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      {word}
                    </span>
                  ))}
                  <span>{lang === 'zh' ? '对话' : ''}</span>
                </div>
              </div>

              {/* 4. Weekly philosophy school preference */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 font-sans flex-wrap">
                <div className="w-7 h-7 rounded-full bg-[#EAE8E2]/80 flex items-center justify-center text-slate-500 shrink-0">
                  <Sprout size={13} />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{lang === 'zh' ? '本周，更多人选择了' : 'This week, more people chose'}</span>
                  <span className="px-3.5 py-0.5 rounded-lg text-xs sm:text-sm bg-[#F0ECE4] text-[#807259] font-serif font-bold tracking-wider border border-slate-300/15">
                    {lang === 'zh' ? topSchoolInfo.nameZh : topSchoolInfo.nameEn}
                  </span>
                  <span>{lang === 'zh' ? '的视角' : 'perspective'}</span>
                </div>
              </div>

              {/* 5. Poetic philosophical quote board */}
              <div className="bg-[#FAF8FC]/50 p-6 sm:p-7 rounded-[32px] border border-slate-200/35 flex justify-between items-center gap-4 relative overflow-hidden">
                <div className="text-left font-serif space-y-2 pr-2 relative z-10 flex-1">
                  <span className="text-3xl sm:text-4xl text-indigo-300 block font-serif leading-none mt-1 select-none">“</span>
                  <p className="text-[#6F5E7C] font-semibold tracking-wide text-sm sm:text-[15px] leading-relaxed">
                    {lang === 'zh' ? topSchoolInfo.descZh.split('——')[0] : topSchoolInfo.descEn}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                    {lang === 'zh' ? `——这是 ${topSchoolInfo.nameZh} 正在教大家的事。` : `This is what ${topSchoolInfo.nameEn} is teaching everyone.`}
                  </p>
                </div>

                {/* Zen Stack Stones & Sun illustration */}
                <div className="shrink-0 relative w-16 h-16 sm:w-20 sm:h-20 select-none opacity-85 hidden xs:block">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Sun */}
                    <circle cx="65" cy="40" r="15" fill="#F4DDD5" opacity="0.9" />
                    {/* Fine plant leaves */}
                    <path d="M 65,40 Q 75,22 72,12" stroke="#8A70D6" strokeWidth="0.8" fill="none" opacity="0.4" />
                    <path d="M 65,40 Q 82,28 85,20" stroke="#8A70D6" strokeWidth="0.8" fill="none" opacity="0.4" />
                    <circle cx="72" cy="12" r="1" fill="#8A70D6" opacity="0.5" />
                    <circle cx="85" cy="20" r="1" fill="#8A70D6" opacity="0.5" />
                    {/* Balanced stack stones */}
                    <ellipse cx="45" cy="88" rx="18" ry="9" fill="#CDC3BA" />
                    <ellipse cx="44" cy="74" rx="14" ry="7" fill="#DBD3CD" />
                    <ellipse cx="46" cy="62" rx="10" ry="5.5" fill="#E6E0DC" />
                  </svg>
                </div>
              </div>

              {/* Bottom text info */}
              <div className="pt-2 flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400 font-sans tracking-wide leading-relaxed">
                <Sprout size={11} className="text-emerald-500/70" />
                <span>
                  {lang === 'zh' 
                    ? '数据来自今天所有完成了记录的用户。明天醒来，这扇窗会刷新。' 
                    : t('数据来自今天所有完成了记录的用户。明天醒来，这扇窗会刷新。')}
                </span>
              </div>
            </div>
          )}
        </div>



      </div>
      ) : (
      <div className="p-3 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto w-full">
      
      {/* Step 1: Word Selection */}
      {step === 'word-selection' && (
        <section className="animate-in fade-in duration-500 space-y-8 pt-4">
          <div className="flex items-center justify-between px-1 relative h-10">
            <button 
              onClick={() => setIsDashboard(true)} 
              className="absolute left-1 p-2 -ml-2 text-gray-400 hover:text-gray-600 flex items-center gap-1 font-sans text-xs cursor-pointer focus:outline-none z-10"
            >
              <ChevronLeft size={18} />
              <span>{t('返回')}</span>
            </button>
            <div className="w-full text-center">
              <h2 className="text-xl font-bold opacity-75 tracking-tight font-sans leading-none">{t("当下的心境...")}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 px-1">
            {CORE_WORDS.map((item) => (
              <button 
                key={item.word} 
                onClick={() => { setSelectedWord(item.word); setStep('school-selection'); }}
                className="bg-white p-8 rounded-[28px] shadow-sm hover:shadow-xl hover:border-blue-50/50 border border-transparent flex flex-col items-start gap-5 transition-all active:scale-[0.96] text-left min-h-[170px]"
              >
                <div className="opacity-40" style={{ color: MorandiTheme.ink }}>{item.icon}</div>
                <div className="mt-auto space-y-1">
                  <span className="text-lg font-bold opacity-80 block tracking-tight">{t(item.word)}</span>
                  <span className="text-[11px] opacity-30 font-medium block">{t(item.desc)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2: School Selection */}
      {step === 'school-selection' && selectedWord && (
        <section className="animate-in slide-in-from-right-4 duration-500 space-y-8">
          <div className="flex justify-start px-2">
            <button onClick={() => setStep('word-selection')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="flex flex-col items-start space-y-3 px-4 text-left mt-4 mb-8">
            <h3 className="text-lg font-bold opacity-70">{t("哪种智慧能为你拨云见日？")}</h3>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-bold">{t("选择一种与你共鸣的视角")}</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 px-2">
            {SCHOOLS.map(school => (
              <button 
                key={school.id} 
                onClick={() => { setSelectedSchoolId(school.id); setStep('writing'); }}
                className="bg-white p-8 rounded-[36px] border border-transparent shadow-sm hover:shadow-md hover:border-gray-100 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold px-3 py-1 bg-gray-50 rounded-lg" style={{color: MorandiTheme.blue}}>{t(school.name)}</span>
                  <span className="text-[9px] opacity-20 italic font-bold uppercase tracking-widest">{t(school.desc)}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 font-medium">“{t(PHILOSOPHY_QUOTES[selectedWord][school.id])}”</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Writing Page */}
      {step === 'writing' && (
        <section className="animate-in slide-in-from-right-4 duration-500 space-y-6 pb-12">
          <div className="flex justify-start px-2">
            <button onClick={() => setStep('school-selection')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Main Writing Container */}
          <div className="bg-white rounded-[44px] shadow-2xl relative min-h-[620px] border border-gray-50 p-8 md:p-12 flex flex-col space-y-6 overflow-hidden">
            
            {/* Top Row: Left Aligned Icons */}
            <div className="flex flex-col gap-3 pb-2 text-left">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-10 shrink-0">{t("天气")}</span>
                <div className="flex gap-2 sm:gap-3">
                  {WEATHER_OPTIONS.map(opt => (
                    <button 
                      key={opt.id} 
                      onClick={() => setWeather(opt.id)}
                      className={`transition-all duration-300 p-1.5 md:p-2 rounded-xl flex items-center justify-center ${weather === opt.id ? 'bg-gray-50 shadow-sm opacity-100 scale-125' : 'opacity-15 hover:opacity-45'}`}
                      style={{ color: weather === opt.id ? MorandiTheme.blue : 'inherit' }}
                    >
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-10 shrink-0">{t("心情")}</span>
                <div className="flex gap-2 sm:gap-3">
                  {MOOD_OPTIONS.map(opt => (
                    <button 
                      key={opt.id} 
                      onClick={() => setMood(opt.id)}
                      className={`transition-all duration-300 p-1.5 md:p-2 rounded-xl flex items-center justify-center ${mood === opt.id ? 'bg-gray-50 shadow-sm opacity-100 scale-125' : 'opacity-15 hover:opacity-45'}`}
                      style={{ color: mood === opt.id ? MorandiTheme.purple : 'inherit' }}
                    >
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic Info - Left Aligned */}
            <div className="space-y-4">
              <div className="flex items-center justify-start">
                <span className="text-[10px] font-bold px-4 py-1.5 bg-gray-50 rounded-full uppercase tracking-[0.2em]" style={{ color: MorandiTheme.purple }}>
                  {t(selectedWord)} · {t(currentSchool?.name || '')}
                </span>
              </div>
              
              <div className="p-0 border-l-2 pl-4 border-gray-50/50 text-left">
                <p className="text-sm italic opacity-40 leading-relaxed font-serif text-gray-700">
                  “{t(currentQuote || '')}”
                </p>
              </div>
            </div>

            {/* Textarea - Left aligned for natural writing */}
            <textarea 
              className="flex-1 w-full bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:text-gray-400/80 text-gray-700 font-serif text-left pt-2"
              placeholder={t("现在，你在想什么？")}
              autoFocus 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-8 mt-10">
            <div className="flex items-center gap-4 py-2 px-6 rounded-full bg-white/60 border border-white/80 shadow-sm transition-all hover:bg-white/80">
              <div className="flex items-center gap-3">
                <Sparkles size={14} className={enableAiFeedback ? '' : 'grayscale opacity-30'} style={{ color: enableAiFeedback ? MorandiTheme.purple : 'inherit' }} />
                <span className="text-[10px] font-bold opacity-40 tracking-widest uppercase">{t("澄的回响")}</span>
              </div>
              <button 
                onClick={() => setEnableAiFeedback(!enableAiFeedback)} 
                className="transition-colors"
                style={{color: enableAiFeedback ? MorandiTheme.purple : '#D1D5DB'}}
              >
                {enableAiFeedback ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            <button 
              onClick={saveEntry} 
              disabled={isLoading || !content.trim()} 
              className="px-12 py-3.5 rounded-full bg-gray-800 text-white font-bold tracking-[0.3em] shadow-md hover:bg-black active:scale-[0.96] disabled:opacity-20 transition-all flex items-center justify-center gap-3 text-[11px] uppercase animate-in duration-200"
            >
              {isLoading ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white" /> : t("保存现在")}
            </button>
          </div>
        </section>
      )}

      {/* History - Below word selection */}
      </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[44px] p-12 max-w-sm w-full space-y-10 shadow-2xl relative text-center">
             <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(to right, ${MorandiTheme.blue}, ${MorandiTheme.purple})` }} />
             <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto" style={{ color: MorandiTheme.purple }}>
                   <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-bold tracking-tight opacity-70 uppercase tracking-widest text-xs">Path of Clarity</h3>
             </div>
             <p className="text-base leading-relaxed text-gray-600 italic font-serif px-2">“{lastReflection}”</p>
             <button onClick={() => setShowAiModal(false)} className="w-full py-5 bg-gray-800 text-white rounded-[24px] text-[11px] font-bold tracking-[0.4em] uppercase shadow-lg hover:bg-gray-900 transition-all cursor-pointer">Inner Integration</button>
          </div>
        </div>
      )}

      {showClarityIndexInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left flex flex-col gap-6 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(to right, ${MorandiTheme.blue}, ${MorandiTheme.purple})` }} />
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight font-sans">
                {lang === 'zh' ? '关于「此刻的我们」' : 'About "Our Moment"'}
              </h3>
              <button 
                onClick={() => setShowClarityIndexInfo(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans font-medium">
              {lang === 'zh' 
                ? '这里是与自我对话的温暖角落，也是独行灵魂们彼此照见的地方。这不是一个冷冰冰的数据看板，它的存在让你知道，此刻有人和你一样，在这里思考、感受、书写。' 
                : 'A warm corner to converse with yourself, and a place where lone souls illuminate one another. This is not a cold data dashboard; its existence is to let you know that at this very moment, someone is thinking, feeling, and writing just like you.'}
            </p>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase font-sans">
                {lang === 'zh' ? '设计初衷与逻辑说明' : 'Concept & Interaction'}
              </h4>
              
              <div className="space-y-3.5">
                {/* Block 1: Paricipate first */}
                <div className="bg-[#FAF8FC] p-4 rounded-2xl border border-slate-100 flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-400 shrink-0 select-none">
                    <Heart size={15} />
                  </div>
                  <div className="space-y-1 font-sans">
                    <h5 className="font-bold text-xs text-slate-700 tracking-tight">
                      {lang === 'zh' ? '需要先参与才能看' : 'Participate to View'}
                    </h5>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                      {lang === 'zh' 
                        ? '每一个数据，都来自一个真实的人。为今天留下些什么，是在说：我也在这里。' 
                        : 'Every piece of data comes from a real person. Leaving something for today is saying: I am here too.'}
                    </p>
                  </div>
                </div>

                {/* Block 2: Source of Data */}
                <div className="bg-[#FAF8FC] p-4 rounded-2xl border border-slate-100 flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#8A70D6] shrink-0 select-none">
                    <Users size={15} />
                  </div>
                  <div className="space-y-1 font-sans">
                    <h5 className="font-bold text-xs text-slate-700 tracking-tight">
                      {lang === 'zh' ? '数据从哪里来' : 'Where Data Comes From'}
                    </h5>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                      {lang === 'zh' 
                        ? '你看到的每一个数字，都来自记录了今天的用户——他们可能选了首页状态、写了日记、或是使用了工具。没有为今天留下痕迹的人，不会被计入。' 
                        : 'Every number comes from users who left a trace today—whether by selecting a status, journaling, or using our tools. Those who haven\'t contributed won\'t be counted.'}
                    </p>
                  </div>
                </div>

                {/* Block 3: Privacy */}
                <div className="bg-[#FAF8FC] p-4 rounded-2xl border border-slate-100 flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 select-none">
                    <Feather size={14} />
                  </div>
                  <div className="space-y-1 font-sans">
                    <h5 className="font-bold text-xs text-slate-700 tracking-tight">
                      {lang === 'zh' ? '你的隐私' : 'Your Privacy'}
                    </h5>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                      {lang === 'zh' 
                        ? '这里只展示聚合后的整体数据。没人能看到你的行为数据，你的日记内容永远不会出现在这里。' 
                        : 'Only high-level aggregated data is shown. No one can see your individual behaviors, and your private journals will never appear here.'}
                    </p>
                  </div>
                </div>

                {/* Block 4: Data Update */}
                <div className="bg-[#FAF8FC] p-4 rounded-2xl border border-slate-100 flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400 shrink-0 select-none">
                    <RefreshCw size={14} />
                  </div>
                  <div className="space-y-1 font-sans">
                    <h5 className="font-bold text-xs text-slate-700 tracking-tight">
                      {lang === 'zh' ? '数据更新' : 'Data Update'}
                    </h5>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                      {lang === 'zh' 
                        ? '每天凌晨，昨日的数据退场，新的一天重新亮起。你看到的，永远是今天的此刻。' 
                        : 'Every midnight, yesterday\'s data fades away and a new day begins. What you see is always the present moment of today.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowClarityIndexInfo(false)} 
              className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold tracking-widest uppercase transition-all shadow-md active:scale-98 cursor-pointer font-sans text-center mt-2"
            >
              {lang === 'zh' ? '我知道了' : 'Understood'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};


const Toolbox: React.FC<{ onSelectTool: (t: ToolType) => void, onOpenSettings?: () => void }> = ({ onSelectTool, onOpenSettings }) => {
  const { t, lang } = useLanguage();
  const tools = [
    { id: 'selector', name: '理性决策分析表', desc: '量化利弊破，除决策迷雾', icon: <Scale />, color: MorandiTheme.blue },
    { id: 'workplace', name: '职场生存研究', desc: '解构互动，沉淀职场法则', icon: <Briefcase />, color: MorandiTheme.purple }
  ];
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto w-full pb-16">
      {onOpenSettings && (
        <div className="flex justify-end pr-1 mb-2 animate-in fade-in duration-300">
          <button 
            onClick={onOpenSettings}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 font-sans"
          >
            <Settings size={14} className="opacity-80" />
            <span>{lang === 'zh' ? '设置快捷工具' : 'Quick Tools Settings'}</span>
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-5">
        {tools.map(tool => (
          <button key={tool.id} onClick={() => onSelectTool(tool.id as ToolType)} className="flex items-center gap-6 p-8 rounded-[36px] bg-white border border-transparent shadow-sm hover:shadow-lg hover:border-gray-50 text-left transition-all active:scale-[0.98] cursor-pointer">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 font-sans font-bold" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>{React.cloneElement(tool.icon as React.ReactElement, { size: 28 })}</div>
            <div className="flex-1">
              <h4 className="font-bold text-base opacity-80">{t(tool.name)}</h4>
              <p className="text-xs opacity-40 mt-1 font-medium">{t(tool.desc)}</p>
            </div>
            <ChevronRight size={18} className="opacity-10" />
          </button>
        ))}

        {/* Coming Soon Card */}
        <div className="flex items-center gap-6 p-8 rounded-[36px] bg-white/40 border border-dashed border-slate-200 text-left transition-all opacity-85">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-400">
            <Sparkles size={28} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-base text-slate-500">{t('更多工具，敬请期待')}</h4>
          </div>
        </div>
      </div>
    </div>
  );
};




// --- Life Selector Tool (Imported from components/LifeSelector) ---

interface Philosopher {
  name: string;
  intro: string;
  quote: string;
}

interface LibrarySchool {
  id: string;
  name: string;
  englishName: string;
  desc: string;
  slogan: string;
  philosophies: Philosopher[];
  recommendedBooks: { title: string; author: string; description: string; }[];
  principles: string[];
  qa: { question: string; answer: string; }[];
}

const LIBRARY_DATA: LibrarySchool[] = [
  {
    id: 'Stoicism',
    name: '斯多葛主义',
    englishName: 'Stoicism',
    desc: '内在宁静',
    slogan: '控制你所能控制的，接纳你必须承受的，重建内在的绝对理性与安宁。',
    philosophies: [
      {
        name: '塞内卡 (Seneca)',
        intro: '古罗马斯多葛派哲学家、作家。一生起伏跌宕，曾任帝国权臣，在面对生死抉择时展现出超越常人的平静。',
        quote: '我们因想象而承受的痛苦，远多于因现实而承受的痛苦。'
      },
      {
        name: '爱比克泰德 (Epictetus)',
        intro: '奴隶出身的斯多葛派智者，后获得自由。他的教导完全集中于实践伦理，强调即便身体被锁链束缚，理智与意志也始终自由。',
        quote: '伤害你的并非事物本身，而是你对事物的看法。'
      },
      {
        name: '马可·奥勒留 (Marcus Aurelius)',
        intro: '罗马帝国“五贤帝”之末，斯多葛哲学的忠实实践者。他常在帝国战战兢兢的处理军政的深夜自省，记录真实坦诚的心灵手札。',
        quote: '你有力量控制自己的心灵，而不是外界事件。认识到这一点，你就会找到真正的力量。'
      }
    ],
    recommendedBooks: [
      { title: '《沉思录》', author: '马可·奥勒留', description: '罗马皇帝的自省之书，探讨在动荡纷扰中坚守内心的理性、秩序与崇高境界。' },
      { title: '《道德书简》', author: '塞内卡', description: '关于人生智慧的百余篇温情通信，将斯多葛精神熔炼为具体行为指南。' }
    ],
    principles: [
      '控制二分法 (Dichotomy of Control) — 无需为无法支配的外界现象焦虑，只专注于自身可决定的意志、理智与德行。',
      '命运之爱 (Amor Fati) — 欣然接纳命运赐予的一切，不管苦乐皆视为淬炼意志、成就自我的燃料。',
      '预警未来之恶 (Premeditatio Malorum) — 提前设想可能发生的糟糕事件，消除未知的惊惶与恐惧，常保心灵坚韧。'
    ],
    qa: [
      { question: '如何面对难以掌控的突发挫折与变故？', answer: '真正的痛苦并非源于世界发生的事，而是源自你对这件事情的评判。将坏事视为不可改变的客观天气，你只需要调整好内心的帆。' }
    ]
  },
  {
    id: 'Pragmatism',
    name: '实用主义',
    englishName: 'Pragmatism',
    desc: '行动真理',
    slogan: '理念的意义在于改变现实，让每一个具体的行动都开辟出真实的成长。',
    philosophies: [
      {
        name: '威廉·詹姆斯 (William James)',
        intro: '美国哲学家、心理学之父。主张“真理的兑现价值”，认为观念的价值并不在于逻辑本身的自洽，而在于它在实践中能否给人生带来有意义的改善。',
        quote: '改变你心中的世界，你就能改变外面客观的世界。'
      },
      {
        name: '约翰·杜威 (John Dewey)',
        intro: '现代实用主义与教育学集大成者。提倡“学校即社会，教育即生活”，认为思辨本是为克服生命行进中的现实阻碍而生的手段。',
        quote: '人生的终极目的不是知识，而是从无尽的经验生长中发现并重建意义。'
      },
      {
        name: '查尔斯·皮尔士 (Charles Peirce)',
        intro: '实用主义思想的奠基人，逻辑学家、符号学者。提出著名的“皮尔士原则”，认为一个概念的意义完全在于该概念在行动中所能预期产生的现实效果。',
        quote: '思想的唯一作用与终点，是让在不可知中颤栗的意志达成稳固的信念，从而恢复行动活力。'
      }
    ],
    recommendedBooks: [
      { title: '《实用主义》', author: '威廉·詹姆斯', description: '系统阐述实用主义真理观，表明理念的价值在于其对生命活动产生的实际效果与积极改变。' },
      { title: '《民主与教育》', author: '约翰·杜威', description: '探寻经验的连续性与行知合一，强调教育是经验持续改造与生长的过程。' }
    ],
    principles: [
      '效果法则 (Pragmatic Criterion) — 如果一个哲学理念或观点能引导你改善现实、积极高效地行动，它便对你有“真理”意义。',
      '工具主义 (Instrumentalism) — 思想并非用来消极审视自然的镜子，而是人类为解决生存和发展困局而发明的最有用工具。',
      '生命流动性 (Continuity of Experience) — 世界与经验是持续流动演变的，每一个实实在在的行动都在不断开辟并修正未来的现实。'
    ],
    qa: [
      { question: '深受迷茫与思虑过度的内耗折磨时该如何自救？', answer: '停止无休止的纯空想和内耗！现在就挑选一个最小且可操作的切入点去行动。唯有行动能提供实在反馈，并在自我校正中解构内耗。' }
    ]
  },
  {
    id: 'Nihilism',
    name: '虚无主义',
    englishName: 'Nihilism',
    desc: '存在无义',
    slogan: '当世界回归荒诞与无目标，你便获得了为生命自由定义并涂抹色彩的无限权力。',
    philosophies: [
      {
        name: '弗里德里希·尼采 (Friedrich Nietzsche)',
        intro: '宣告“上帝已死”的狂人先哲，虚无主义的开辟者但也同时是最大的超越者。他号召人们超越低维度的精神虚无，成为掌控自身生命的“超人”。',
        quote: '每一个不曾起舞的日子，都是对生命的辜负。'
      },
      {
        name: '让-保罗·萨特 (Jean-Paul Sartre)',
        intro: '存在主义哲学巨擘。宣称“存在先于本质”，人类没有任何现成的本质模板可遵循，唯有用主动的意志、选择和承担去为自己编织身份。',
        quote: '若要存在，人必须自我选择。不选择同样是一种选择。'
      },
      {
        name: '阿尔贝·加缪 (Albert Camus)',
        intro: '诺贝尔文学奖得主，荒诞哲学大师。描绘西西弗斯推石上山的隐喻，指出人面对荒诞世界的最高尊严莫过于理清事实、并怀揣激情热烈生活。',
        quote: '深冬里，我终于领悟到，在我的内心深处，隐藏着一个不可战胜的夏天。'
      }
    ],
    recommendedBooks: [
      { title: '《查拉图斯特拉如是说》', author: '尼采', description: '打破旧偶像和上帝教条的经典诗性宣言，宣告人类在无尽荒原中应当超越自我、自我加冕。' },
      { title: '《存在与虚无》', author: '萨特', description: '存在主义巨著，“存在先于本质”，阐明人类在绝对荒谬中拥有绝对的自由和背负其重担的责任。' }
    ],
    principles: [
      '主动虚无主义 (Active Nihilism) — 废墟是最高自由度的重建工地。打破旧规则束缚，用自我意志去雕琢生命的崭新殿堂。',
      '存在先于本质 (Existence precedes essence) — 人类并无预设的最佳模板、目的或使命。你先存在了，然后通过一生的自由选择去勾勒自己的模样。',
      '荒诞英雄 (Accepting the Absurd) — 明知宿命如西西弗斯推石般荒谬，依然带着饱满的戏谑与激情上山，这种对命运的坦然接受即是最大的胜利。'
    ],
    qa: [
      { question: '既然最终万物皆将寂灭，努力还有何意义？', answer: '鲜花并不会因为终将凋零就不在春天绽放。没有终极意义，意味你不用背负天命枷锁。生命的过程是唯一真实的财富，你有权力去创造并命名属于你的微小意义。' }
    ]
  },
  {
    id: 'Confucianism',
    name: '儒家思想',
    englishName: 'Confucianism',
    desc: '克己复礼',
    slogan: '于群己交往与克己修身中，安放流离的日常，涵养中庸、温润的秩序美学。',
    philosophies: [
      {
        name: '孔子 (Confucius)',
        intro: '华夏先圣，儒家学派开创者。在颠沛流离与礼崩乐坏的时代，奔走呼号、矢志重建温良有情、井然有礼的高贵人间秩序。',
        quote: '仁者不忧，知者不惑，勇者不惧。'
      },
      {
        name: '孟子 (Mencius)',
        intro: '儒家“亚圣”，性善论的倡导者。思想宏大而饱含浩然正气，倡导对内发现恻隐四端、对外推行王道，涵养天地间刚健纯真的良知。',
        quote: '万物皆备于我矣。反身而诚，乐莫大焉。'
      },
      {
        name: '荀子 (Xunzi)',
        intro: '先秦儒家最后的巨擘，持性恶论。提出“天行有常”，主张依靠贤能君子制定礼乐制度，在荒野之上自我构筑伟大的文明秩序。',
        quote: '制天命而用之。'
      }
    ],
    recommendedBooks: [
      { title: '《论语》', author: '孔子弟子及再传弟子', description: '语录体儒学典籍，记录先贤语默、修齐治平之道，展现温柔敦厚、温润而质朴的生活美学。' },
      { title: '《孟子》', author: '孟子', description: '辩才无碍、气势磅礴之作，阐发人性之善，号召涵养内在的浩然之气与恻隐纯真。' }
    ],
    principles: [
      '克己复礼 (Self-cultivation & Order) — 超越膨胀的狭隘私欲，在家庭、社群与天地关系中找到秩序、规矩与从容不迫的优雅位置。',
      '仁民爱物 (Benevolence & Connection) — 以内心最深沉的恻隐同理之心，推己及人、泛爱大众。在与人连接中获取持久的情感温度。',
      '君子慎独 (Integrity in Solitude) — 在无人看见、最隐秘寂静的角落，依然坦坦荡荡坚守内心的道德良知与精神防线。'
    ],
    qa: [
      { question: '如何平衡个人的主观自由与外界人际伦常的拉扯？', answer: '克己与成物并重。己所不欲，勿施于人。在和谐有序的群己关系中安放并历练良知，而非逃避到荒野，此为修身。' }
    ]
  }
];

const UserCenter: React.FC<{ 
  entries: DiaryEntry[], 
  setEntries: React.Dispatch<React.SetStateAction<DiaryEntry[]>>, 
  onTabChange?: (tab: MainTab) => void,
  onSelectTool?: (tool: ToolType) => void,
  nickname: string,
  setNickname: React.Dispatch<React.SetStateAction<string>>,
  avatarIndex: number,
  setAvatarIndex: React.Dispatch<React.SetStateAction<number>>,
  showProfileEdit: boolean,
  setShowProfileEdit: React.Dispatch<React.SetStateAction<boolean>>,
  userMoodSelected: string | null
}> = ({ 
  entries, 
  setEntries, 
  onTabChange, 
  onSelectTool,
  nickname,
  setNickname,
  avatarIndex,
  setAvatarIndex,
  showProfileEdit,
  setShowProfileEdit,
  userMoodSelected
}) => {
  const { lang, t, setLang } = useLanguage();
  const [view, setView] = useState<GrowthView>('center');
  const [previousView, setPreviousView] = useState<GrowthView>('center');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<{type: 'all' | 'school' | 'emotion', value: string | null}>({type: 'all', value: null});
  const [showLevelRules, setShowLevelRules] = useState(false);
  const [showHawkinsInfo, setShowHawkinsInfo] = useState(false);
  const [clickedDot, setClickedDot] = useState<any>(null);

  // States for milestones/badges customization
  const [showcaseBadgeIds, setShowcaseBadgeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('selected_showcase_badges_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 4) {
          return parsed;
        }
      }
    } catch (e) {}
    return ['1', '2', '3', '4'];
  });
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [tempShowcaseBadgeIds, setTempShowcaseBadgeIds] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [view]);

  const navigateTo = (targetView: GrowthView) => {
    setPreviousView(view);
    setView(targetView);
    setClickedDot(null);
  };

  const diaryCount = entries.length;

  const schoolStats = useMemo(() => {
    const stats: Record<string, number> = {};
    entries.forEach(e => {
      if (e.school) stats[e.school] = (stats[e.school] || 0) + 1;
    });
    return stats;
  }, [entries]);

  const expResult = useMemo(() => {
    return calculateExperienceFromTraces(entries, schoolStats);
  }, [entries, schoolStats]);

  const levelInfo = useMemo(() => {
    return getLevelInfo(expResult.totalExp, lang);
  }, [expResult.totalExp, lang]);

  const [distView, setDistView] = useState<'schools' | 'words'>('schools');

  const pastWeekWordsStats = useMemo(() => {
    const baseWordCounts: Record<string, number> = {
      '焦虑': 4,
      '孤独': 3,
      '自由': 3,
      '遗憾': 2,
      '快乐': 2,
      '悲伤': 1,
      '愤怒': 1,
      '爱情': 0,
      '亲情': 0,
      '友情': 0
    };
    const counts = { ...baseWordCounts };
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    entries.forEach(e => {
      if (e.date >= sevenDaysAgo && e.emotion) {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
      }
    });

    const list = Object.entries(counts).map(([word, val]) => ({
      word,
      count: val
    }));

    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 4);
  }, [entries]);

  const hawkinsChartData = useMemo(() => {
    const current = new Date();
    const currentDay = current.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const days: any[] = [];
    const weekdayNamesZh = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weekdayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayStartTs = dayStart.getTime();
      const dayEndTs = dayEnd.getTime();

      const dayEntries = entries
        .filter(e => e.date >= dayStartTs && e.date <= dayEndTs && e.emotion)
        .sort((a, b) => a.date - b.date);

      let hasData = false;
      let mainPoint: any = null;
      const secondaryPoints: any[] = [];

      if (dayEntries.length > 0) {
        hasData = true;
        const mainEntry = dayEntries[dayEntries.length - 1];
        const mainLevel = HAWKINS_MAP[mainEntry.emotion] || 200;
        
        let mainDotColorGroup: 'great' | 'okay' | 'bad' | 'none' = 'none';
        const isToday = d.toDateString() === current.toDateString();
        if (isToday && userMoodSelected) {
          mainDotColorGroup = userMoodSelected as 'great' | 'okay' | 'bad';
        } else {
          if (mainLevel >= 350) mainDotColorGroup = 'great';
          else if (mainLevel >= 200) mainDotColorGroup = 'okay';
          else mainDotColorGroup = 'bad';
        }

        const formatTime = (ts: number) => {
          const dateObj = new Date(ts);
          const hh = String(dateObj.getHours()).padStart(2, '0');
          const mm = String(dateObj.getMinutes()).padStart(2, '0');
          return `${hh}:${mm}`;
        };

        mainPoint = {
          id: mainEntry.id,
          level: mainLevel,
          emotion: mainEntry.emotion,
          emotionDisplay: t(mainEntry.emotion),
          date: mainEntry.date,
          timeStr: formatTime(mainEntry.date),
          dotColorGroup: mainDotColorGroup,
          isMain: true
        };

        for (let j = 0; j < dayEntries.length - 1; j++) {
          const secEntry = dayEntries[j];
          const secLevel = HAWKINS_MAP[secEntry.emotion] || 200;
          let secDotColorGroup: 'great' | 'okay' | 'bad' | 'none' = 'none';
          if (secLevel >= 350) secDotColorGroup = 'great';
          else if (secLevel >= 200) secDotColorGroup = 'okay';
          else secDotColorGroup = 'bad';

          secondaryPoints.push({
            id: secEntry.id,
            level: secLevel,
            emotion: secEntry.emotion,
            emotionDisplay: t(secEntry.emotion),
            date: secEntry.date,
            timeStr: formatTime(secEntry.date),
            dotColorGroup: secDotColorGroup,
            isMain: false
          });
        }
      }

      days.push({
        weekdayName: lang === 'zh' ? weekdayNamesZh[i] : weekdayNamesEn[i],
        dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
        hasData,
        mainPoint,
        secondaryPoints
      });
    }

    return { days };
  }, [entries, userMoodSelected, lang, t]);

  const selectorEntriesLength = useMemo(() => {
    try {
      const saved = localStorage.getItem('life_selector_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch (e) {}
    return 0;
  }, [entries]);

  const hasLongDiary = useMemo(() => {
    return entries.some(e => e.content && e.content.length > 100);
  }, [entries]);

  const badges: Badge[] = useMemo(() => [
    { id: '1', name: t('破晓行者'), description: t('完成第1篇哲学日记'), icon: <Compass />, unlocked: diaryCount >= 1 },
    { id: '2', name: t('理性先锋'), description: t('评估生命决策利弊 1 次'), icon: <Zap />, unlocked: selectorEntriesLength >= 1 },
    { id: '3', name: t('成长之萌'), description: t('累计打卡 3 次哲学日记'), icon: <Sprout />, unlocked: diaryCount >= 3 },
    { id: '4', name: t('深度思辨'), description: t('累计撰写 5 篇哲学日记'), icon: <BookOpen />, unlocked: diaryCount >= 5 },
    { id: '5', name: t('见微知著'), description: t('累计进行 8 次心情探究'), icon: <Heart />, unlocked: diaryCount >= 8 },
    { id: '6', name: t('格物大成'), description: t('累计撰写 10 篇哲学日记'), icon: <Scale />, unlocked: diaryCount >= 10 },
    { id: '7', name: t('思维重构'), description: t('探索过 3 个哲学流派'), icon: <Award />, unlocked: Object.keys(schoolStats).length >= 3 },
    { id: '8', name: t('见字如面'), description: t('随笔字数超过 100 字 1 次'), icon: <Feather />, unlocked: hasLongDiary },
  ], [diaryCount, selectorEntriesLength, schoolStats, hasLongDiary, t]);

  const showcasedBadges = useMemo(() => {
    return showcaseBadgeIds.map(id => badges.find(b => b.id === id)).filter(Boolean) as Badge[];
  }, [showcaseBadgeIds, badges]);

  const filteredEntries = useMemo(() => {
    if (activeFilter.type === 'all') return entries;
    if (activeFilter.type === 'school') return entries.filter(e => e.school === activeFilter.value);
    if (activeFilter.type === 'emotion') return entries.filter(e => e.emotion === activeFilter.value);
    return entries;
  }, [entries, activeFilter]);

  const selectedEntry = entries.find(e => e.id === selectedEntryId);

  // Archive View Component
  const ArchiveView = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4">
      <div className="flex items-center gap-4 px-2">
        <button onClick={() => setView('center')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold opacity-70">{t('日记档案馆')}</h2>
      </div>

      {/* Filter Dropdowns - Replaced horizontal scroll with dropdown menus */}
      <div className="grid grid-cols-2 gap-3 px-2">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <Layers size={14} />
          </div>
          <select 
            value={activeFilter.type === 'school' ? activeFilter.value || '' : ''} 
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') setActiveFilter({type: 'all', value: null});
              else setActiveFilter({type: 'school', value: val});
            }}
            className="w-full appearance-none bg-white border border-gray-100 pl-10 pr-10 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:border-morandi-blue shadow-sm"
            style={{ color: MorandiTheme.ink }}
          >
            <option value="">{t('所有流派')}</option>
            {SCHOOLS.map(s => <option key={s.id} value={s.name}>{t(s.name)}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <Sparkle size={14} />
          </div>
          <select 
            value={activeFilter.type === 'emotion' ? activeFilter.value || '' : ''} 
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') setActiveFilter({type: 'all', value: null});
              else setActiveFilter({type: 'emotion', value: val});
            }}
            className="w-full appearance-none bg-white border border-gray-100 pl-10 pr-10 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:border-morandi-purple shadow-sm"
            style={{ color: MorandiTheme.ink }}
          >
            <option value="">{t('所有词汇')}</option>
            {CORE_WORDS.map(w => <option key={w.word} value={w.word}>{t(w.word)}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-[44px] p-20 text-center border border-dashed border-gray-200">
            <Filter size={40} className="mx-auto opacity-10 mb-4" />
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
              {activeFilter.type === 'all' ? t('馆内暂无藏品') : t('当前分类下暂无思辨记录')}
            </p>
          </div>
        ) : (
          filteredEntries.map(e => (
            <button 
              key={e.id} 
              onClick={() => { setSelectedEntryId(e.id); navigateTo('detail'); }}
              className="w-full bg-white p-8 rounded-[36px] border border-transparent shadow-sm hover:shadow-md hover:border-gray-100 text-left transition-all active:scale-[0.98] flex items-center gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                {CORE_WORDS.find(w => w.word === e.emotion)?.icon || <BookOpen size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{new Date(e.date).toLocaleDateString()}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider" style={{backgroundColor: MorandiTheme.softBlue, color: MorandiTheme.blue}}>{e.school ? t(e.school) : ''}</span>
                </div>
                <h4 className="font-bold text-base opacity-80">{e.emotion ? t(e.emotion) : ''}</h4>
                <p className="text-[11px] opacity-40 truncate italic mt-1 font-serif">“{e.content}”</p>
              </div>
              <ChevronRight size={16} className="opacity-10" />
            </button>
          ))
        )}
      </div>
    </div>
  );

  // Detail View Component
  const DetailView = () => {
    if (!selectedEntry) return null;
    const [isViewFlipped, setIsViewFlipped] = React.useState(false);
    const quoteInfo = selectedEntry.selectedView ? QUOTE_EXPLANATIONS[selectedEntry.selectedView] : null;

    const [isEditing, setIsEditing] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [editContent, setEditContent] = React.useState(selectedEntry.content);
    const [editWeather, setEditWeather] = React.useState(selectedEntry.weather);
    const [editMood, setEditMood] = React.useState(selectedEntry.mood);

    React.useEffect(() => {
      if (selectedEntry) {
        setEditContent(selectedEntry.content);
        setEditWeather(selectedEntry.weather);
        setEditMood(selectedEntry.mood);
        setIsEditing(false);
        setShowDeleteConfirm(false);
      }
    }, [selectedEntry.id]);

    const handleSave = () => {
      if (!editContent.trim()) return;
      setEntries(prev => prev.map(e => {
        if (e.id === selectedEntry.id) {
          return {
            ...e,
            content: editContent.trim(),
            weather: editWeather,
            mood: editMood
          };
        }
        return e;
      }));
      setIsEditing(false);
    };

    return (
      <div className="space-y-8 animate-in slide-in-from-right-4 pb-12">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <button onClick={() => setView(previousView || 'center')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-bold opacity-70">{t('思辨详情')}</h2>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditing(true)} 
                title={t('编辑内容')}
                className="w-8 h-8 rounded-full border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all text-gray-500 shadow-sm bg-white flex items-center justify-center"
              >
                <PenLine size={14} />
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                title={t('删除日记')}
                className="w-8 h-8 rounded-full border border-red-100/60 hover:bg-red-50 text-red-500 active:scale-95 transition-all shadow-sm bg-white flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Floating Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[36px] max-w-sm w-full p-8 space-y-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto">
                <Trash2 size={24} />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="font-bold text-lg text-gray-800">
                  {t('确定删除这篇日记吗？')}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('删除后，对应的思辨足迹和心境状态将无法恢复。')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl font-bold text-[11px] tracking-wider uppercase active:scale-95 transition-all text-center"
                >
                  {t('取消')}
                </button>
                <button
                  onClick={() => {
                    setEntries(prev => prev.filter(e => e.id !== selectedEntry.id));
                    setShowDeleteConfirm(false);
                    setView('archive');
                  }}
                  className="flex-1 py-3 text-white bg-red-500 hover:bg-red-600 rounded-2xl font-bold text-[11px] tracking-wider uppercase active:scale-95 transition-all text-center shadow-lg shadow-red-500/10"
                >
                  {t('确认删除')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[44px] shadow-xl border border-gray-50 overflow-hidden">
          {/* Top Info Bar */}
          <div className="p-6 sm:p-10 border-b border-gray-50 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold opacity-20 uppercase tracking-[0.4em]">{new Date(selectedEntry.date).toLocaleDateString()}</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xl font-bold opacity-80">{selectedEntry.emotion ? t(selectedEntry.emotion) : ''}</span>
                <span className="text-[10px] px-3 py-1 bg-gray-50 rounded-full font-bold uppercase tracking-widest" style={{color: MorandiTheme.purple}}>{selectedEntry.school ? t(selectedEntry.school) : ''}</span>
              </div>
            </div>
            <div className="flex gap-3 opacity-20 shrink-0">
               {WEATHER_OPTIONS.find(o => o.id === selectedEntry.weather)?.icon}
               <div className="w-[1px] h-3 bg-gray-300" />
               {MOOD_OPTIONS.find(o => o.id === selectedEntry.mood)?.icon}
            </div>
          </div>

          {/* Content Area */}
          <div className="px-6 sm:px-10 pb-6 sm:pb-10 pt-2 sm:pt-4 space-y-6 sm:space-y-8">
            {isEditing ? (
              <div className="space-y-6 pt-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-sans">{t('撰写思辨感悟')}</span>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-48 p-5 rounded-[24px] border border-gray-100 focus:border-morandi-purple focus:outline-none text-base leading-relaxed text-gray-800 font-serif placeholder-gray-300 resize-none shadow-inner bg-gray-50/10 focus:ring-1 focus:ring-morandi-purple/20"
                    placeholder={t('在这里记录你的哲思与顿悟...')}
                  />
                </div>

                {/* Weather & Mood Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-sans">{t('此刻天气')}</span>
                    <div className="flex flex-wrap gap-2">
                      {WEATHER_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setEditWeather(opt.id)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            editWeather === opt.id
                              ? 'bg-gray-800 text-white shadow-sm scale-105'
                              : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50 active:scale-95'
                          }`}
                        >
                          {opt.icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] font-sans">{t('情感温度')}</span>
                    <div className="flex flex-wrap gap-2">
                      {MOOD_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setEditMood(opt.id)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            editMood === opt.id
                              ? 'bg-gray-800 text-white shadow-sm scale-105'
                              : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50 active:scale-95'
                          }`}
                        >
                          {opt.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Control Buttons (Save / Cancel) */}
                <div className="flex gap-4 pt-4 border-t border-gray-50">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-4 text-white rounded-2xl font-bold text-[10px] tracking-[0.3em] uppercase shadow-md active:scale-95 transition-all text-center"
                    style={{ backgroundColor: MorandiTheme.purple }}
                  >
                    {t('保存修改')}
                  </button>
                  <button
                    onClick={() => {
                      setEditContent(selectedEntry.content);
                      setEditWeather(selectedEntry.weather);
                      setEditMood(selectedEntry.mood);
                      setIsEditing(false);
                    }}
                    className="px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl font-bold text-[10px] tracking-[0.3em] uppercase active:scale-95 transition-all text-center"
                  >
                    {t('取消')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {selectedEntry.selectedView && (
                  <div 
                    onClick={() => setIsViewFlipped(!isViewFlipped)}
                    className="cursor-pointer group select-none relative py-4 px-3 sm:py-5 sm:px-5 text-left hover:bg-gray-50/45 rounded-[24px] transition-all duration-300 active:scale-[0.99] space-y-3"
                  >
                    {/* Clean accent line on the left to denote quote block */}
                    <div 
                      className="absolute left-0 top-4 bottom-4 w-[2px] transition-all duration-500 rounded-full"
                      style={{ 
                        backgroundColor: isViewFlipped ? MorandiTheme.purple : MorandiTheme.accent,
                        opacity: isViewFlipped ? 0.7 : 0.4
                      }}
                    />

                    {/* Subtitle Header */}
                    {isViewFlipped && (
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase animate-in fade-in duration-300">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: MorandiTheme.purple }} />
                        <span className="whitespace-nowrap">{t('出处与解读')}</span>
                      </div>
                    )}

                    {/* Animated Sliding Content Container */}
                    <div className="relative min-h-[50px] flex items-center pr-2">
                      <div className={`transition-all duration-500 ease-out w-full ${
                        isViewFlipped 
                          ? 'opacity-0 -translate-y-2 pointer-events-none absolute' 
                          : 'opacity-100 translate-y-0 relative'
                      }`}>
                        <p className="text-base sm:text-lg font-serif text-gray-800 leading-relaxed italic">
                          “{selectedEntry.selectedView}”
                        </p>
                      </div>

                      <div className={`transition-all duration-500 ease-out w-full ${
                        isViewFlipped 
                          ? 'opacity-100 translate-y-0 relative' 
                          : 'opacity-0 translate-y-2 pointer-events-none absolute'
                      }`}>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 font-serif shrink-0">{t('引自：')}</span>
                            <h4 className="text-sm font-bold font-serif text-gray-800 tracking-wide shrink-0">
                              {quoteInfo?.source ? t(quoteInfo.source) : t('先贤古代典籍')}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100 font-serif font-medium shrink-0">
                              {selectedEntry.school ? t(selectedEntry.school) : ''}
                            </span>
                          </div>
                          
                          <div className="h-[1px] bg-gray-100/50" />
                          
                          <p className="text-xs md:text-sm leading-relaxed font-serif text-gray-500">
                            {quoteInfo?.explanation ? t(quoteInfo.explanation) : t('引借古今先贤之崇高哲思，用以正己省身、涵养理性，平息凡闹日常之侵染。')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-gray-700 font-serif whitespace-pre-wrap">{selectedEntry.content}</p>
                </div>

                {selectedEntry.aiReflection && (
                  <div className="p-8 rounded-[36px] border border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-2 mb-4 opacity-20">
                      <Sparkles size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{t('智者回响')}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-500 italic font-serif">“{selectedEntry.aiReflection}”</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Library View Component
  const LibraryView = () => {
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
    const [selectedPhilosopher, setSelectedPhilosopher] = useState<Philosopher | null>(null);
    const [isGeneratingWisdom, setIsGeneratingWisdom] = useState<boolean>(false);
    const [generatedWisdom, setGeneratedWisdom] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const selectedSchool = LIBRARY_DATA.find(s => s.id === selectedSchoolId);
    const schoolStatsCount = Object.keys(schoolStats).length;

    const handleGenerateWisdom = async (school: typeof LIBRARY_DATA[0]) => {
      setIsGeneratingWisdom(true);
      setGeneratedWisdom(null);
      setErrorMsg(null);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const entriesInSchool = entries.filter(e => e.school === school.name);
        const prompt = `你是一位精通“${school.name}”的古代思想家。
这是该探索者的修行数据：总共记录了 ${diaryCount} 次思想，在 ${school.name} 流派实践了 ${entriesInSchool.length} 次。
${entriesInSchool.length > 0 ? `他们记录过的感悟有：\n${entriesInSchool.slice(0, 3).map(e => `【${e.emotion}】“${e.content}”`).join('\n')}` : ''}
请为他们撰写一封【${school.name}智者笺】。
要求：
- 篇幅限制在 120 字内。
- 语言风格：温柔、克制、充满古典文学和美学高度，富有哲思、空灵，充满启发。
- 内容：结合他们的修行和思辨（如有），用一句深邃的本流派格言或洞察，抚平人生的迷失和尘嚣。
- 不要包含任何系统格式、前言赘语。直接输出笺信文字。`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });
        setGeneratedWisdom(response.text);
      } catch (err) {
        console.error(err);
        setErrorMsg("山河辽阔，墨笔暂竭。请稍后再试，与睿智意志重连。");
      } finally {
        setIsGeneratingWisdom(false);
      }
    };

    if (selectedSchool) {
      const schoolEntries = entries.filter(e => e.school === selectedSchool.name);
      return (
        <div className="space-y-8 animate-in slide-in-from-right-4 pb-12">
          {/* Header */}
          <div className="flex items-center gap-4 px-2">
            <button onClick={() => { setSelectedSchoolId(null); setGeneratedWisdom(null); setSelectedPhilosopher(null); }} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold opacity-70">{t(selectedSchool.name)}{t('书房')}</h2>
              <span className="text-[10px] font-mono opacity-30">{selectedSchool.englishName} STUDY</span>
            </div>
          </div>

          {/* School Intro Card */}
          <div className="bg-white rounded-[44px] p-8 border border-gray-50 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: MorandiTheme.softPurple, color: MorandiTheme.purple }}>{t(selectedSchool.desc)}</span>
                <span className="text-[10px] font-bold opacity-30 tracking-widest uppercase font-serif">{t('先哲馆藏书架')}</span>
              </div>
              <h3 className="text-lg font-serif text-gray-800 pt-1">「{t(selectedSchool.slogan)}」</h3>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
              <div>
                <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest block mb-2">{t('主要思想先哲（点击深入研读）')}</span>
                <div className="flex flex-wrap gap-2">
                  {selectedSchool.philosophies.map((p, i) => {
                    const isSelected = selectedPhilosopher?.name === p.name;
                    return (
                      <button 
                        key={i} 
                        onClick={() => setSelectedPhilosopher(isSelected ? null : p)}
                        className={`text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-all active:scale-[0.95] flex items-center gap-1.5 ${
                          isSelected 
                            ? 'shadow-sm text-white' 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100/80 hover:text-gray-800'
                        }`}
                        style={{
                          backgroundColor: isSelected ? MorandiTheme.purple : undefined
                        }}
                      >
                        <span>{t(p.name)}</span>
                        <ChevronDown size={10} className={`opacity-40 transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedPhilosopher && (
                <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100/40 text-left animate-in fade-in slide-in-from-top-2 duration-200 space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-800 font-serif border-b pb-0.5" style={{ borderColor: MorandiTheme.purple }}>
                      {t(selectedPhilosopher.name)}
                    </span>
                    <button 
                      onClick={() => setSelectedPhilosopher(null)} 
                      className="text-[9px] uppercase font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {t('收起 ✕')}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-serif">
                    {t(selectedPhilosopher.intro)}
                  </p>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] italic leading-relaxed font-serif" style={{ color: MorandiTheme.blue }}>
                      “{t(selectedPhilosopher.quote)}”
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Self-Reflection Dialogue Q&A */}
          <div className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm space-y-6">
            <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">{t('古今日常叩问')}</h3>
            {selectedSchool.qa.map((q, i) => (
              <div key={i} className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 text-[10px] font-bold opacity-40">{t('问')}</div>
                  <p className="text-xs font-bold text-gray-700 leading-relaxed pt-0.5">{t(q.question)}</p>
                </div>
                <div className="flex items-start gap-3 pl-4 border-l-2 mb-2" style={{ borderColor: MorandiTheme.accent }}>
                  <div className="w-6 h-6 rounded-lg font-bold shrink-0 flex items-center justify-center text-[10px]" style={{ backgroundColor: MorandiTheme.softBlue, color: MorandiTheme.blue }}>{t('启')}</div>
                  <p className="text-xs text-gray-500 italic leading-relaxed pt-0.5 font-serif">“{t(q.answer)}”</p>
                </div>
              </div>
            ))}
          </div>

          {/* Core Principles & Books */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Core Tenets */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm space-y-6">
              <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">{t('经典思想内核')}</h3>
              <div className="space-y-4">
                {selectedSchool.principles.map((p, i) => {
                  const [title, desc] = p.split(' — ');
                  return (
                    <div key={i} className="space-y-1 pl-4 border-l-2" style={{ borderColor: MorandiTheme.blue }}>
                      <h4 className="text-[11px] font-bold opacity-80">{t(title)}</h4>
                      <p className="text-[10px] leading-relaxed opacity-40">{t(desc)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Readings */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm space-y-6">
              <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">{t('推荐研读典籍')}</h3>
              <div className="space-y-5">
                {selectedSchool.recommendedBooks.map((book, i) => (
                  <div key={i} className="space-y-2 group text-left">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="opacity-30" style={{ color: MorandiTheme.purple }} />
                      <span className="text-xs font-bold opacity-80 group-hover:text-morandi-purple transition-all">{t(book.title)}</span>
                      <span className="text-[8px] opacity-30 font-bold">{t('作者：')}{t(book.author)}</span>
                    </div>
                    <p className="text-[10px] leading-relaxed opacity-40 pl-5 font-serif italic">“{t(book.description)}”</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive AI Wisdom Custom Card */}
          <div className="p-8 rounded-[44px] border border-gray-100 bg-white shadow-sm space-y-6 overflow-hidden relative text-left">
            <div className="space-y-1">
              <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em] block">{t('心灵实践回响')}</span>
              <h3 className="text-base font-bold opacity-80">{t('求索先哲折笺')}</h3>
              <p className="text-[10px] opacity-40">{t('结合你至今记录 of 思辨，为你亲启一封温润的书信手札。') || t('结合你至今记录的思辨，为你亲启一封温润的书信手札。')}</p>
            </div>

            {generatedWisdom ? (
              <div className="p-6 rounded-[32px] border border-dashed border-morandi-purple bg-gray-50/50 space-y-4 animate-in zoom-in-95" style={{ borderColor: MorandiTheme.purple }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="opacity-30" style={{ color: MorandiTheme.purple }} />
                    <span className="text-[9px] font-bold opacity-30 tracking-widest uppercase">{t('先哲笺信')}</span>
                  </div>
                  <button onClick={() => handleGenerateWisdom(selectedSchool)} className="text-[8px] font-bold opacity-40 hover:opacity-100 flex items-center gap-1">
                    <RefreshCw size={8} /> {t('重新祈问')}
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-600 font-serif italic whitespace-pre-wrap">
                  {generatedWisdom}
                </p>
                <div className="text-right text-[8px] font-bold uppercase tracking-widest opacity-20">
                  — {t(selectedSchool.name)}{t('学派的隔空对话')}
                </div>
              </div>
            ) : (
              <button 
                disabled={isGeneratingWisdom}
                onClick={() => handleGenerateWisdom(selectedSchool)}
                className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold text-[10px] tracking-[0.3em] uppercase shadow-md disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:opacity-95"
                style={{ backgroundColor: MorandiTheme.purple }}
              >
                {isGeneratingWisdom ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>{t('启信落墨中...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>{t('亲启学派笺信')}</span>
                  </>
                )}
              </button>
            )}

            {errorMsg && (
              <p className="text-[10px] text-red-400 text-center">{errorMsg}</p>
            )}
          </div>

          {/* User's footprints in this school */}
          <div className="space-y-4 text-left">
            <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em] px-2">{t('你的思辨修身足迹')} ({schoolEntries.length})</h3>
            {schoolEntries.length === 0 ? (
              <div className="bg-white/40 border border-dashed border-gray-200 rounded-[32px] p-8 text-center text-gray-400">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t('在日记中尝试对该学派的观念进行实修后，足迹将记录于此')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schoolEntries.map(e => (
                  <button
                    key={e.id}
                    onClick={() => { setSelectedEntryId(e.id); navigateTo('detail'); }}
                    className="w-full bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex items-center gap-4 text-left transition-all active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 shrink-0 flex items-center justify-center text-morandi-blue" style={{ color: MorandiTheme.blue }}>
                      {CORE_WORDS.find(w => w.word === e.emotion)?.icon || <Sparkle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold opacity-80">{e.emotion ? t(e.emotion) : ''}</span>
                        <span className="text-[8px] opacity-30 uppercase font-bold tracking-tighter">{new Date(e.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] opacity-40 truncate italic">“{e.content}”</p>
                    </div>
                    <ChevronRight size={14} className="opacity-10" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in slide-in-from-right-4 pb-12 text-left">
        {/* Header */}
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => setView('center')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold opacity-70">{t('探索流派')}</h2>
        </div>



        {/* School Shelf Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LIBRARY_DATA.map(school => {
            const hasWalked = entries.some(e => e.school === school.name);
            const count = entries.filter(e => e.school === school.name).length;
            return (
              <button
                key={school.id}
                onClick={() => setSelectedSchoolId(school.id)}
                className="bg-white p-6 rounded-[36px] border border-gray-50 shadow-sm text-left hover:border-gray-200 transition-all active:scale-[0.98] flex flex-col justify-between space-y-6 relative group overflow-hidden"
              >
                <div className="absolute right-0 bottom-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <BookOpen size={72} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-25">{school.englishName}</span>
                    {hasWalked ? (
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-500 border border-green-100/40">{t('已探寻')}</span>
                    ) : (
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-transparent">{t('未涉及')}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold opacity-80 group-hover:text-morandi-purple transition-colors">{t(school.name)}</h3>
                    <p className="text-[10px] text-gray-400 font-serif italic">{t(school.desc)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50/50 flex items-center justify-between w-full text-xs">
                  <span className="text-[10px] font-bold opacity-30">
                    {count > 0 ? `${t('实践足迹')} ${count} ${t('篇')}` : t('尚无涉猎历史')}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] font-bold opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <span>{t('研读')}</span>
                    <ChevronRight size={10} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Methodology View Component
  const MethodologyView = () => {
    const [activeToolId, setActiveToolId] = useState<'selector' | 'workplace'>('selector');

    // Read Life Selector History
    const selectorEntries = useMemo(() => {
      try {
        const saved = localStorage.getItem('life_selector_history');
        return saved ? JSON.parse(saved) : [];
      } catch (err) {
        return [];
      }
    }, []);

    // Read Workplace logs & subjects
    const workSubjects = useMemo(() => {
      try {
        const saved = localStorage.getItem('work_observation_subjects');
        return saved ? JSON.parse(saved) : [];
      } catch (err) {
        return [];
      }
    }, []);

    const workLogs = useMemo(() => {
      try {
        const saved = localStorage.getItem('work_observation_logs');
        return saved ? JSON.parse(saved) : [];
      } catch (err) {
        return [];
      }
    }, []);

    const workStrategies = useMemo(() => {
      try {
        const saved = localStorage.getItem('work_observation_strategies');
        return saved ? JSON.parse(saved) : (STRATEGIES_DATABASE || []);
      } catch (err) {
        return STRATEGIES_DATABASE || [];
      }
    }, []);

    // Calculate details for Life Selector
    const selectorLast30DaysCount = useMemo(() => {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      return selectorEntries.filter((e: any) => (e.createdAt || 0) > thirtyDaysAgo).length;
    }, [selectorEntries]);

    const topDimension = useMemo(() => {
      const weights: Record<string, number> = {};
      selectorEntries.forEach((e: any) => {
        if (e.weights) {
          Object.keys(e.weights).forEach(k => {
            weights[k] = (weights[k] || 0) + (e.weights[k] || 0);
          });
        }
      });
      let maxKey = '';
      let maxVal = -1;
      Object.keys(weights).forEach(k => {
        if (weights[k] > maxVal) {
          maxVal = weights[k];
          maxKey = k;
        }
      });
      return maxKey;
    }, [selectorEntries]);

    const lastDecisionProblem = useMemo(() => {
      if (selectorEntries.length === 0) return '';
      const sorted = [...selectorEntries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return sorted[0].problem || '';
    }, [selectorEntries]);

    // Trend selector data
    const selectorTrendData = useMemo(() => {
      const sorted = [...selectorEntries].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).slice(-8);
      return sorted.map((e: any, index: number) => {
        const item: Record<string, any> = { label: `命题 ${index + 1}` };
        if (e.weights) {
          Object.keys(e.weights).forEach(k => {
            item[k] = e.weights[k];
          });
        }
        return item;
      });
    }, [selectorEntries]);

    // Unique dimensions in trend
    const uniqueDimensionsPlotted = useMemo(() => {
      const dims = new Set<string>();
      selectorTrendData.forEach((d: any) => {
        Object.keys(d).forEach(k => {
          if (k !== 'label') dims.add(k);
        });
      });
      return Array.from(dims);
    }, [selectorTrendData]);

    const getDimensionColor = (dim: string, index: number) => {
      const colors = [MorandiTheme.blue, MorandiTheme.purple, MorandiTheme.accent, '#A393A3', '#D88A8A'];
      return colors[index % colors.length];
    };

    // Calculate details for Workplace Survival
    const topTags = useMemo(() => {
      const counts: Record<string, number> = {};
      workLogs.forEach((log: any) => {
        if (log.tags) {
          log.tags.forEach((t: string) => { counts[t] = (counts[t] || 0) + 1; });
        }
      });
      const list = Object.keys(counts).map(k => ({ name: k, count: counts[k] }));
      return list.sort((a, b) => b.count - a.count).slice(0, 3);
    }, [workLogs]);

    const topStrategy = useMemo(() => {
      const counts: Record<string, number> = {};
      workLogs.forEach((log: any) => {
        if (log.selectedStrategyId) {
          const strat = workStrategies.find((s: any) => s.id === log.selectedStrategyId) || 
                        { name: log.selectedStrategyId };
          const name = strat.name || strat.title || log.selectedStrategyId;
          counts[name] = (counts[name] || 0) + 1;
        }
      });
      const list = Object.keys(counts).map(k => ({ name: k, count: counts[k] }));
      return list.sort((a, b) => b.count - a.count)[0] || null;
    }, [workLogs, workStrategies]);

    const monthlyShiftEval = useMemo(() => {
      let healthyCount = 0;
      let neutralCount = 0;
      let dangerousCount = 0;
      
      workLogs.forEach((log: any) => {
        const evalScore = log.shiftEvaluation;
        if (evalScore === 'healthy') healthyCount++;
        else if (evalScore === 'neutral') neutralCount++;
        else if (evalScore === 'dangerous') dangerousCount++;
      });

      return {
        healthy: healthyCount,
        neutral: neutralCount,
        dangerous: dangerousCount
      };
    }, [workLogs]);

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 pb-20 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 px-2">
            <button onClick={() => setView('center')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-bold opacity-70">{t('探索工具')}</h2>
          </div>

          <div className="flex gap-1 p-1 bg-slate-100/80 rounded-2xl border border-gray-200/25 self-start sm:self-center">
            <button
              onClick={() => setActiveToolId('selector')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeToolId === 'selector'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Scale size={14} style={{ color: MorandiTheme.blue }} />
              <span>{t('理性决策分析表')}</span>
            </button>
            <button
              onClick={() => setActiveToolId('workplace')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeToolId === 'workplace'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Briefcase size={14} style={{ color: MorandiTheme.purple }} />
              <span>{t('职场生存研究')}</span>
            </button>
          </div>
        </div>

        {activeToolId === 'selector' && (
          <>
            {/* --- 人生选择器 Section --- */}
        <div className="bg-white rounded-[44px] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${MorandiTheme.blue}15`, color: MorandiTheme.blue }}>
                <Scale size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base opacity-85">{t('理性决策分析表')}</h3>
                  <button 
                    onClick={() => onSelectTool ? onSelectTool('selector') : null}
                    style={{ backgroundColor: MorandiTheme.blue }}
                    className="px-3 py-1 rounded-full text-white font-bold tracking-widest text-[9.5px] uppercase transition-all shadow-xs hover:opacity-90 hover:scale-[1.02] active:scale-[0.96] flex items-center gap-1 shrink-0"
                  >
                    <span>{t('进入')}</span>
                    <ArrowRight size={10} className="opacity-70 animate-pulse" />
                  </button>
                </div>
                <p className="text-[11px] opacity-40 mt-0.5">{t('量化利弊，破除决策迷雾')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-gray-600">
            <div className="lg:col-span-7 space-y-6">
              {/* Highlight Target */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-[0.2em] opacity-40 uppercase">{t('适用场景')}</span>
                <p className="text-base font-semibold text-gray-800 leading-relaxed">
                  {t('当你面临两个（或更多）选项，反复纠结、无法下定决心时，试试这个工具。')}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('它不适合“一拍脑门就能决定”的小事，也不适合“完全没想法”的迷茫。它最擅长的是：你心里已有几个模糊的方向，但总在选项之间来回拉扯，越想越乱。')}
                </p>
              </div>
              
              {/* Core Steps */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t('你只需要')}</span>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-gray-700">{t('诚实地写下每个选项的好处与坏处')}</p>
                      <p className="text-[11px] text-gray-400 font-normal">{t('只聚焦当前这一项。')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-gray-700">{t('设定你当下最在乎的几个维度的权重')}</p>
                      <p className="text-[11px] text-gray-400 font-normal">{t('按你的生活重心分配数字。')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-gray-700">{t('给每个利弊打分')}</p>
                      <p className="text-[11px] text-gray-400 font-normal">{t('凭感觉打分，系统会综合计算。')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Philosophical insight */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t('系统会帮你将“内心的天平”可视化，计算出整体倾向。这并非替你做决定，而是让你看清自己更倾斜于哪一方、原来自己比想象中更在意某件事。')}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50/50" style={{ color: MorandiTheme.blue }}>
                  <span>✦ </span>
                  <span>{t('每一次量化，都是一次更清晰的自我澄明。')}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6 flex flex-col">
              {/* Theoretical Grounding */}
              <div className="bg-white p-5 rounded-[28px] border border-gray-100/50 shadow-xs text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#8A70D6] uppercase tracking-widest block">{t('理论模型支持')}</span>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                    {t('本工具基于决策科学中的')} <strong className="text-slate-800 font-bold">{t('多属性效用理论 (Multi-Attribute Utility Theory, MAUT)')}</strong>{t('。通过将复杂的决策命题拆解为具体的“价值维度”（属性）并分配“主观权重”，结合对各个利弊的客观测度，用数学加权的方法算出整体决策效用。这是一种公认具有深度科学依据的理性决策模型。')}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-gray-50/40 border border-gray-100/60 rounded-[32px] p-6 space-y-6 flex flex-col justify-between text-left">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-4">{t('决策数据档案')}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 bg-white p-4 rounded-2xl shadow-xs border border-gray-105/30">
                      <span className="text-[9px] opacity-45 font-bold block">{t('最近一月决策')}</span>
                      <span className="text-xl font-bold opacity-80">{selectorLast30DaysCount} {t('次')}</span>
                    </div>
                    <div className="space-y-1 bg-white p-4 rounded-2xl shadow-xs border border-gray-105/30">
                      <span className="text-[9px] opacity-45 font-bold block">{t('最看重维度')}</span>
                      <span className="text-xl font-bold opacity-80 text-morandi-blue truncate" style={{ color: MorandiTheme.blue }}>
                        {topDimension ? t(topDimension) : t('暂无评估')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-105/30 mt-4 space-y-1.5">
                    <span className="text-[9px] opacity-45 font-bold block">{t('最近一次决策命题')}</span>
                    <p className="text-xs font-bold leading-relaxed text-gray-700 line-clamp-2">
                      {lastDecisionProblem ? `“${lastDecisionProblem}”` : t('尚未开启首个决策命题')}
                    </p>
                  </div>
                </div>

                {/* Unique Trend Line Chart with Recharts */}
                <div className="space-y-2 mt-2 pt-2 border-t border-gray-100/50">
                  <span className="text-[8.5px] font-bold uppercase tracking-widest text-gray-400 block text-center sm:text-left">
                    {t('内在核心关注点演化趋势 (限最近8次)')}
                  </span>
                  
                  {selectorEntries.length >= 2 ? (
                    <div className="h-36 w-full text-xs opacity-80 pt-1">
                      <ResponsiveContainer width="100%" height="86%">
                        <LineChart data={selectorTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F0" />
                          <XAxis dataKey="label" stroke="#A393A3" fontSize={9} />
                          <YAxis tickCount={5} domain={[0, 5]} stroke="#A393A3" fontSize={9} />
                          <ChartTooltip />
                          {uniqueDimensionsPlotted.map((dim, i) => (
                            <Line 
                              key={dim}
                              type="monotone" 
                              dataKey={dim} 
                              stroke={getDimensionColor(dim, i)} 
                              strokeWidth={2}
                              dot={{ r: 2.5 }}
                              activeDot={{ r: 5 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 text-[8.5px] font-bold text-gray-400">
                        {uniqueDimensionsPlotted.map((dim, i) => (
                          <div key={dim} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDimensionColor(dim, i) }} />
                            <span>{dim}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-white/60 rounded-2xl flex items-center justify-center p-4 border border-dashed border-gray-200">
                      <p className="text-[9.5px] text-gray-400 text-center leading-relaxed">
                        {t('🍁 完成 2 次决策后')}<br />{t('系统将自动绘制“内在天平维度权重”的变化趋势图')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* --- 职场生存研究 Section --- */}
        {activeToolId === 'workplace' && (
          <div className="bg-white rounded-[44px] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${MorandiTheme.purple}15`, color: MorandiTheme.purple }}>
                <Briefcase size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base opacity-85">{t('职场生存研究')}</h3>
                  <button 
                    onClick={() => onSelectTool ? onSelectTool('workplace') : null}
                    style={{ backgroundColor: MorandiTheme.purple }}
                    className="px-3 py-1 rounded-full text-white font-bold tracking-widest text-[9.5px] uppercase transition-all shadow-xs hover:opacity-90 hover:scale-[1.02] active:scale-[0.96] flex items-center gap-1 shrink-0"
                  >
                    <span>{t('进入')}</span>
                    <ArrowRight size={10} className="opacity-70 animate-pulse" />
                  </button>
                </div>
                <p className="text-[11px] opacity-40 mt-0.5">{t('解构互动，沉淀职场法则')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-gray-600">
            <div className="lg:col-span-7 space-y-6">
              {/* Highlight Target */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-[0.2em] opacity-40 uppercase">{t('适用场景')}</span>
                <p className="text-base font-semibold text-gray-800 leading-relaxed text-left">
                  {t('当你身处不舒服的环境，却因为种种客观原因暂时无法离开时，试试这个工具。')}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed text-left">
                  {t('它不是教你“隐忍妥协”，也不是鼓励你“意气离职”。它是一套帮你实现角色转换的认知框架，帮助你从局中人的“负面消耗”切换到极度客观的“观察研究”。')}
                </p>
              </div>
              
              {/* Core Steps */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t('你只需要')}</span>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-gray-700">{t('如实记录发生了什么')}</p>
                      <p className="text-[11px] text-gray-400 font-normal">{t('像旁观者一样写下事实，不加评判。')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-gray-700">{t('标记那些让你难受的行为')}</p>
                      <p className="text-[11px] text-gray-400 font-normal">{t('从标签库里选一个，看清困扰你的模式。')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-gray-700">{t('跟随引导，拆解自己的情绪')}</p>
                      <p className="text-[11px] text-gray-400 font-normal">{t('尝试不同的认知策略，让情绪慢慢松绑。')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Philosophical insight */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed text-left">
                  {t('你会发现，情绪依然真实，但它的虚耗感正逐渐松绑。你不是在忍受折磨，而是在研究这个环境、剖析这些现象，同时更好地了解自身的心理机制。')}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-purple-50/50" style={{ color: MorandiTheme.purple }}>
                  <span>✦ </span>
                  <span>{t('若注定终将离开，必定带走最清醒的认知；若仍需前行，轻装上阵。')}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gray-50/40 border border-gray-100/60 rounded-[32px] p-6 space-y-6 flex flex-col justify-between text-left">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-4">{t('职场生存研究数据')}</span>
                
                <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-105/30 space-y-1 text-center md:text-left flex items-center justify-between">
                  <span className="text-[10px] opacity-45 font-bold">{t('研究主体 & 事件')}</span>
                  <div className="text-[11px] font-bold text-gray-800 flex flex-col items-end gap-0.5 text-right">
                    <div>
                      <strong className="text-sm font-black" style={{ color: MorandiTheme.purple }}>{workSubjects.length}</strong> {t('个研究对象')}
                    </div>
                    <div>
                      <strong className="text-sm font-black" style={{ color: MorandiTheme.blue }}>{workLogs.length}</strong> {t('次事件')}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-105/30 mt-3 space-y-2">
                  <span className="text-[9px] opacity-45 font-bold block">{t('近期常遇标签 TOP 3')}</span>
                  {topTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {topTags.map((tag, idx) => (
                        <span key={idx} className="text-[9px] font-bold px-2 py-1 bg-red-50/50 text-red-500 rounded-full border border-red-100/40">
                          #{t(tag.name)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 block italic">{t('尚未标记高频应激行为')}</span>
                  )}
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-105/30 mt-3 space-y-1.5">
                  <span className="text-[9px] opacity-45 font-bold block">{t('使用最多的策略')}</span>
                  <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
                    <span>{topStrategy ? t(topStrategy.name) : t('暂未使用策略')}</span>
                    {topStrategy && <span className="text-[10px] opacity-40 font-bold">{topStrategy.count}{t('次使用')}</span>}
                  </div>
                </div>
              </div>

              {/* Shift Evaluation Progress */}
              <div className="space-y-2.5 pt-4 border-t border-gray-100/50">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    {t('本月心态转变汇总')}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-bold">
                  <div className="p-2.5 rounded-xl bg-teal-50/40 border border-teal-100/30 text-teal-600">
                    <span className="block opacity-60">{t('健康的适应')}</span>
                    <strong className="text-lg font-black block mt-1">{monthlyShiftEval.healthy} {t('次')}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/60 border border-gray-100/50 text-gray-500">
                    <span className="block opacity-60">{t('中性观察')}</span>
                    <strong className="text-lg font-black block mt-1">{monthlyShiftEval.neutral} {t('次')}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/30 border border-amber-100/20 text-amber-600">
                    <span className="block opacity-60">{t('危险的麻木')}</span>
                    <strong className="text-lg font-black block mt-1">{monthlyShiftEval.dangerous} {t('次')}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    );
  };

  if (view === 'archive') return <div className="p-3 sm:p-6 max-w-4xl mx-auto w-full"><ArchiveView /></div>;
  if (view === 'detail') return <div className="p-3 sm:p-6 max-w-4xl mx-auto w-full"><DetailView /></div>;
  if (view === 'library') return <div className="p-3 sm:p-6 max-w-4xl mx-auto w-full"><LibraryView /></div>;
  if (view === 'methodology') return <div className="p-3 sm:p-6 max-w-4xl mx-auto w-full"><MethodologyView /></div>;

  return (
    <div className="p-3 sm:p-6 space-y-8 pb-12 animate-in fade-in max-w-4xl mx-auto w-full">
      {/* Unified Profile & Bento Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Bento: Profile Status & Level */}
        <section className="bg-white rounded-[36px] p-6 sm:p-7 border border-gray-100/50 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 text-gray-50 opacity-20 pointer-events-none">
            <Zap size={110} />
          </div>

          <div className="absolute top-6 right-6 z-10 flex items-center">
            <button 
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} 
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full text-[9px] font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer font-sans uppercase tracking-widest active:scale-95 shadow-2xs"
            >
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setShowProfileEdit(true)}
              className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-2 border-white shadow-md rotate-2 shrink-0 cursor-pointer hover:scale-105 hover:rotate-6 active:scale-95 transition-all group relative overflow-hidden ${AVATAR_OPTIONS[avatarIndex % AVATAR_OPTIONS.length].bg}`}
              title={lang === 'zh' ? '修改头像和昵称' : 'Edit avatar and nickname'}
            >
              <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white select-none">
                <span className="text-[7.5px] font-sans font-bold tracking-wider uppercase scale-90">
                  {lang === 'zh' ? '修改' : 'Edit'}
                </span>
              </div>
              {getAvatarComponent(
                AVATAR_OPTIONS[avatarIndex % AVATAR_OPTIONS.length].iconName, 
                26, 
                AVATAR_OPTIONS[avatarIndex % AVATAR_OPTIONS.length].text
              )}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 
                  onClick={() => setShowProfileEdit(true)}
                  className="text-base font-bold text-gray-800 tracking-tight font-sans cursor-pointer hover:text-slate-600 transition-colors flex items-center gap-1 group/title"
                  title={lang === 'zh' ? '修改昵称' : 'Edit nickname'}
                >
                  <span>{nickname || (lang === 'zh' ? '小明' : 'Ming')}</span>
                  <PenLine size={10} className="opacity-0 group-hover/title:opacity-40 transition-opacity text-slate-500" />
                </h2>
                <button
                  onClick={() => setShowLevelRules(true)}
                  className="flex items-center gap-1 shrink-0 scale-90 origin-left hover:opacity-85 active:scale-95 transition-all bg-[#8A70D6]/10 px-1.5 py-0.5 rounded-full cursor-pointer border border-transparent hover:border-[#8A70D6]/20 select-none text-left"
                  title={lang === 'zh' ? '查看等级细则指南' : 'View Level Guide'}
                >
                  <span className="text-[8px] font-extrabold tracking-wider" style={{ color: MorandiTheme.purple }}>
                    Lv.{levelInfo.level}
                  </span>
                  <Info size={7} className="text-purple-400 font-bold" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bolder font-sans uppercase tracking-[0.1em]">
                <span>{levelInfo.title}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-end text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              <span>
                {levelInfo.currentExpValue} / {levelInfo.isMaxLevel ? '1060' : levelInfo.nextLevelExpValue} EXP {levelInfo.isMaxLevel ? `(${lang === 'zh' ? '已满级' : 'Max'})` : `(${levelInfo.progressPercent}%)`}
              </span>
            </div>
            <div className="w-full bg-gray-50 h-[4px] rounded-full overflow-hidden">
              <div className="h-full transition-all duration-1000 rounded-full animate-pulse-slow" style={{ width: `${levelInfo.progressPercent}%`, backgroundColor: MorandiTheme.purple }}></div>
            </div>
          </div>
        </section>

        {/* Right Bento: 思辨档案, 探索流派, 格物工具 */}
        <div className="grid grid-cols-1 gap-4">
          {/* Main Link card: 思辨记录 (highlighted) */}
          <button 
            onClick={() => navigateTo('archive')}
            className="bg-white p-5 rounded-[28px] border border-gray-100/50 shadow-sm flex items-center justify-between gap-4 hover:border-gray-200 transition-all active:scale-[0.99] group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 animate-in fade-in zoom-in-95 duration-500" style={{ backgroundColor: `${MorandiTheme.purple}15`, color: MorandiTheme.purple }}>
                <BookOpen size={20} />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-800 leading-none">{diaryCount}</span>
                  <span className="text-[10px] font-serif text-gray-400 font-medium">{t('篇思辨日记')}</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-0.5 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: MorandiTheme.purple }}>
              {t('展开')} <ChevronRight size={12} />
            </div>
          </button>

          {/* Quick Hubs: Grid of 2 small cards */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigateTo('library')}
              className="bg-white p-4 rounded-[24px] border border-gray-100/50 shadow-sm text-left flex items-center gap-3 hover:border-gray-200 transition-all active:scale-[0.98] group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${MorandiTheme.blue}15`, color: MorandiTheme.blue }}>
                <Layers size={14} />
               </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-bold text-gray-700 flex items-center gap-0.5">
                  <span className="truncate">{t('探索流派')}</span>
                  <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-all shrink-0 translate-x-1" />
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigateTo('methodology')}
              className="bg-white p-4 rounded-[24px] border border-gray-100/50 shadow-sm text-left flex items-center gap-3 hover:border-gray-200 transition-all active:scale-[0.98] group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${MorandiTheme.purple}15`, color: MorandiTheme.purple }}>
                <Scale size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-bold text-gray-700 flex items-center gap-0.5">
                  <span className="truncate">{t('探索工具')}</span>
                  <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-all shrink-0 translate-x-1" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* School Distribution */}
      <section className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">
              {distView === 'schools' ? t('思辨偏好分布') : (lang === 'zh' ? '本周心境地图' : "Weekly Consciousness Map")}
            </h3>
            {distView === 'words' && (
              <button
                type="button"
                onClick={() => setShowHawkinsInfo(true)}
                className="text-[#8A70D6] opacity-60 hover:opacity-100 transition-all p-1 hover:bg-slate-50 rounded-full flex items-center justify-center cursor-pointer"
                title={lang === 'zh' ? '查看霍金斯意识层级研究逻辑' : 'View Hawkins scale research logic'}
              >
                <Info size={11} className="stroke-[2.5]" />
              </button>
            )}
          </div>
          <div className="flex items-center bg-gray-50/80 p-0.5 rounded-xl border border-gray-100/50">
            <button
              onClick={() => setDistView('schools')}
              className={`text-[9.5px] font-bold px-3 py-1 rounded-lg transition-all focus:outline-none cursor-pointer ${
                distView === 'schools'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {lang === 'zh' ? '思辨偏好' : 'Schools'}
            </button>
            <button
              onClick={() => setDistView('words')}
              className={`text-[9.5px] font-bold px-3 py-1 rounded-lg transition-all focus:outline-none cursor-pointer ${
                distView === 'words'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {lang === 'zh' ? '心境地图' : 'Consciousness Map'}
            </button>
          </div>
        </div>

        {distView === 'schools' ? (
          <div className="space-y-5 animate-in fade-in duration-300">
             {SCHOOLS.map(school => {
               const count = schoolStats[school.name] || 0;
               const percent = diaryCount > 0 ? (count / diaryCount) * 100 : 0;
               return (
                 <div key={school.id} className="space-y-2 text-left">
                    <div className="flex justify-between text-[10px] font-bold opacity-60">
                       <span>{t(school.name)}</span>
                       <span className="opacity-40 font-mono">{count} {t('次')}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                       <div className="h-full bg-morandi-blue rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: MorandiTheme.blue }}></div>
                    </div>
                 </div>
               );
             })}
          </div>
        ) : (() => {
          // Identify max logged level to scale graph dynamically
          const allLevels: number[] = [];
          hawkinsChartData.days.forEach((d: any) => {
            if (d.hasData) {
              if (d.mainPoint) allLevels.push(d.mainPoint.level);
              if (d.secondaryPoints) {
                d.secondaryPoints.forEach((s: any) => allLevels.push(s.level));
              }
            }
          });
          const maxLevelInWeek = Math.max(...allLevels, 0);
          const yMax = maxLevelInWeek > 600 ? 1000 : 600;
          
          // Define SVG coordinate dimensions
          const W = 600;
          const H = 240;
          const lg = 52;
          const rg = 20;
          const tg = 25;
          const bg = 35;
          const plotW = W - lg - rg; // 528
          const plotH = H - tg - bg; // 180

          const getX = (idx: number) => lg + (idx / 6) * plotW;
          const getY = (level: number) => tg + plotH - (Math.min(yMax, level) / yMax) * plotH;

          // Days with active logged levels
          const loggedDays = hawkinsChartData.days.filter((d: any) => d.hasData);
          
          // Smooth Bezier path generator (Cubic Bezier curve through points)
          const getSmoothPath = (pts: { x: number; y: number }[]) => {
            if (pts.length === 0) return '';
            if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
            let path = `M ${pts[0].x} ${pts[0].y}`;
            for (let i = 0; i < pts.length - 1; i++) {
              const p0 = pts[i];
              const p1 = pts[i + 1];
              const dx = p1.x - p0.x;
              path += ` C ${p0.x + dx / 3} ${p0.y}, ${p0.x + (dx * 2) / 3} ${p1.y}, ${p1.x} ${p1.y}`;
            }
            return path;
          };

          // Find coordinates of main points in order to form the smooth curve
          const pathPoints = loggedDays.map((d: any) => {
            const idx = hawkinsChartData.days.indexOf(d);
            return {
              x: getX(idx),
              y: getY(d.mainPoint.level)
            };
          });

          // Generate path only if we have 2 or more active days
          const pathD = pathPoints.length >= 2 ? getSmoothPath(pathPoints) : '';
          const areaD = pathPoints.length >= 2 ? (
            `${pathD} L ${pathPoints[pathPoints.length - 1].x} ${tg + plotH} L ${pathPoints[0].x} ${tg + plotH} Z`
          ) : '';

          // Gather all dots (both main and secondary) to render
          const allActiveDots: any[] = [];
          hawkinsChartData.days.forEach((day: any, dayIdx: number) => {
            if (day.hasData) {
              if (day.mainPoint) {
                allActiveDots.push({
                  ...day.mainPoint,
                  dayIdx,
                  cx: getX(dayIdx),
                  cy: getY(day.mainPoint.level),
                  weekdayName: day.weekdayName,
                  dateLabel: day.dateLabel
                });
              }
              if (day.secondaryPoints) {
                day.secondaryPoints.forEach((sec: any) => {
                  allActiveDots.push({
                    ...sec,
                    dayIdx,
                    cx: getX(dayIdx),
                    cy: getY(sec.level),
                    weekdayName: day.weekdayName,
                    dateLabel: day.dateLabel
                  });
                });
              }
            }
          });

          // Determine grid line values (e.g. 0, 200, 400, 600 or 0, 200, 400, 600, 800, 1000)
          const gridLines = yMax === 600 ? [0, 200, 400, 600] : [0, 200, 400, 600, 800, 1000];

          return (
            <div className="flex flex-col gap-6 pt-1 text-left animate-in fade-in duration-300">
              <div className="w-full relative select-none">
                <svg 
                  viewBox="0 0 600 240" 
                  className="w-full h-auto overflow-visible select-none font-sans"
                  onClick={() => setClickedDot(null)}
                >
                  {/* Defs for nice gradient under path */}
                  <defs>
                    <linearGradient id="hawkinsChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8A70D6" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#8A70D6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal dotted grid lines */}
                  {gridLines.map(val => {
                    const y = getY(val);
                    return (
                      <g key={val} className="opacity-90">
                        {/* Only draw dotted grid lines if they are not the baseline (0) */}
                        {val !== 0 && (
                          <line 
                            x1={lg} 
                            y1={y} 
                            x2={W - rg} 
                            y2={y} 
                            stroke="#E2E8F0" 
                            strokeDasharray="4 4" 
                            strokeWidth="1.2"
                            className="opacity-60"
                          />
                        )}
                        {/* Y-axis Labels */}
                        <text
                          x={lg - 10}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="11.5"
                          fontWeight="bold"
                          fill="#475569"
                          className="font-mono select-none"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Left solid axis boundary line */}
                  <line 
                    x1={lg} 
                    y1={tg} 
                    x2={lg} 
                    y2={tg + plotH} 
                    stroke="#CBD5E1" 
                    strokeWidth="1.5"
                  />

                  {/* Bottom solid axis boundary line */}
                  <line 
                    x1={lg} 
                    y1={tg + plotH} 
                    x2={W - rg} 
                    y2={tg + plotH} 
                    stroke="#CBD5E1" 
                    strokeWidth="1.5"
                  />

                  {/* Filled area under the curve */}
                  {areaD && (
                    <path
                      d={areaD}
                      fill="url(#hawkinsChartGradient)"
                    />
                  )}

                  {/* Connected line path */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#8A70D6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Weekday name and date labels at bottom */}
                  {hawkinsChartData.days.map((day, idx) => {
                    const cx = getX(idx);
                    return (
                      <g key={idx}>
                        {/* X-axis Weekday Name */}
                        <text
                          x={cx}
                          y={H - 18}
                          textAnchor="middle"
                          fontSize="11.5"
                          fontWeight="bold"
                          fill="#8A70D6"
                          className="font-sans select-none"
                        >
                          {day.weekdayName}
                        </text>
                        {/* X-axis Date string */}
                        <text
                          x={cx}
                          y={H - 5}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="medium"
                          fill="#475569"
                          className="font-mono select-none opacity-90"
                        >
                          {day.dateLabel}
                        </text>
                      </g>
                    );
                  })}

                  {/* Highlight ring for the active clicked dot */}
                  {clickedDot && (
                    <circle
                      cx={clickedDot.cx}
                      cy={clickedDot.cy}
                      r="14"
                      fill="none"
                      stroke="#8A70D6"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      opacity="0.9"
                    />
                  )}

                  {/* Active Dots, Hover Rings and Emotion Labels */}
                  {allActiveDots.map((dot, idx) => {
                    const cx = dot.cx;
                    const cy = dot.cy;

                    let dotColor = '#9CA3AF';
                    if (dot.dotColorGroup === 'great') {
                      dotColor = '#FB923C';
                    } else if (dot.dotColorGroup === 'okay') {
                      dotColor = '#8A70D6';
                    } else if (dot.dotColorGroup === 'bad') {
                      dotColor = '#4B5563';
                    }

                    return (
                      <g key={idx}>
                        {/* Hover ring (back) */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="11.5"
                          fill={dotColor}
                          fillOpacity="0.14"
                          className="pointer-events-none"
                        />

                        {/* Line connector guide to bottom (translucent) */}
                        <line
                          x1={cx}
                          y1={cy + 6}
                          x2={cx}
                          y2={tg + plotH}
                          stroke="#E2E8F0"
                          strokeDasharray="2 2"
                          strokeWidth="1.2"
                        />

                        {/* Interactive Dot / Diamond */}
                        {!dot.isMain ? (
                          <path
                            d={`M ${cx - 7} ${cy} L ${cx} ${cy - 7} L ${cx + 7} ${cy} L ${cx} ${cy + 7} Z`}
                            fill="#FFFFFF"
                            stroke={dotColor}
                            strokeWidth="3.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClickedDot(dot);
                            }}
                            className="cursor-pointer transition-transform duration-200 hover:scale-130"
                          >
                            <title>{`${dot.weekdayName}: ${dot.emotionDisplay} (${Math.round(dot.level)})`}</title>
                          </path>
                        ) : (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="5.5"
                            fill="#FFFFFF"
                            stroke={dotColor}
                            strokeWidth="4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClickedDot(dot);
                            }}
                            className="cursor-pointer transition-transform duration-200 hover:scale-130"
                          >
                            <title>{`${dot.weekdayName}: ${dot.emotionDisplay} (${Math.round(dot.level)})`}</title>
                          </circle>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating details popup card describing "哪个词 - 几点标记的" on click */}
                {clickedDot && (
                  <div 
                    className="absolute bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 shadow-2xl text-[11px] z-30 flex flex-col gap-1 -translate-x-1/2 pointer-events-auto"
                    style={{
                      left: `${(clickedDot.cx / 600) * 100}%`,
                      top: `${(clickedDot.cy / 240) * 100}%`,
                      transform: 'translate(-50%, -108%)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-5 font-sans font-extrabold whitespace-nowrap">
                      <span className="text-[#A78BFA] font-bold text-[11.5px]">
                        {clickedDot.emotionDisplay} ({clickedDot.emotion})
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] font-semibold">{clickedDot.timeStr}</span>
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-300 font-medium whitespace-nowrap">
                      {lang === 'zh' ? `频率: ${Math.round(clickedDot.level)}` : `Level: ${Math.round(clickedDot.level)}`} ({clickedDot.weekdayName} {clickedDot.dateLabel})
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-[5px] border-transparent border-t-slate-950" />
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Hawkins Scale of Consciousness Map explanations modal */}
      {showHawkinsInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-purple-50 flex items-center justify-center text-[#8A70D6]">
                  <Info size={11} className="stroke-[2.5]" />
                </div>
                <h4 className="font-sans font-extrabold text-slate-800 text-[11px] tracking-widest uppercase">
                  {lang === 'zh' ? '大卫·霍金斯意识层级研究' : 'Hawkins Scale of Consciousness'}
                </h4>
              </div>
              <button 
                type="button"
                onClick={() => setShowHawkinsInfo(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[64vh] overflow-y-auto text-left leading-relaxed">
              {lang === 'zh' ? (
                <div className="space-y-5 text-slate-600 text-[10.5px]">
                  <div>
                    <h5 className="font-sans font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5 text-[#8A70D6]">
                      <span>✦</span> 关于心境地图与霍金斯层级
                    </h5>
                    <p className="leading-relaxed font-sans font-medium text-slate-500">
                      这张图背后，是美国精神病学家大卫·霍金斯（David R. Hawkins）跨越30年的研究。
                    </p>
                    <p className="leading-relaxed font-sans mt-2">
                      在《意念力》（Power vs. Force）一书中，霍金斯提出了一个与日常心理学完全不同的框架：人类的意识状态可以被校准为一个从1到1000的对数尺度。这个尺度不是凭感觉定的——他用了超过25万次肌动学测试，让被试在面对不同陈述时测量肌肉的即时反应强度，从而分离出每个意识状态对应的能量层级。
                    </p>
                  </div>

                  <div className="bg-purple-50/30 p-3.5 rounded-2xl border border-purple-100/30 space-y-2">
                    <h5 className="font-sans font-bold text-slate-800 text-[11px] flex items-center gap-1.5 text-[#8A70D6]">
                      <span>✦</span> 核心发现
                    </h5>
                    <p className="font-sans leading-relaxed">
                      <strong className="text-slate-800">200是分水岭</strong>。霍金斯称之为“勇气的临界线”。
                    </p>
                    <div className="space-y-1.5 text-[10px] mt-2">
                      <p className="flex items-start gap-1">
                        <span className="text-rose-500 font-bold shrink-0">·</span>
                        <span><strong className="text-slate-700">200以下</strong> —— 羞耻(20)、内疚(30)、悲伤(75)、恐惧(100)、愤怒(150) —— 是破坏性的“力”(Force)。它们消耗你，让生命体验收缩。</span>
                      </p>
                      <p className="flex items-start gap-1">
                        <span className="text-emerald-500 font-bold shrink-0">·</span>
                        <span><strong className="text-slate-700">200以上</strong> —— 中性(250)、意愿(310)、接纳(350)、理性(400)、爱(500)、喜悦(540) —— 是建设性的“能”(Power)。它们滋养你，让生命体验扩张。</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-sans font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5 text-[#8A70D6]">
                      <span>✦</span> 这和对错无关
                    </h5>
                    <p className="leading-relaxed font-sans">
                      在霍金斯看来，层级低不等于“你有问题”。人会在不同时刻处于不同层级。一生的功课不是永远待在喜悦层，而是学会识别自己此刻的位置，并在条件允许时向上移动。
                    </p>
                  </div>

                  <div className="border-t border-dashed border-gray-100 pt-4">
                    <h5 className="font-sans font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5 text-[#8A70D6]">
                      <span>✦</span> 和澄识之径的关系
                    </h5>
                    <p className="leading-relaxed font-sans font-medium text-slate-500">
                      你的每一篇日记，都在心境地图上留下了一个坐标。我们不会用情绪的好坏来评判你——焦虑(100)和快乐(540)同样是你真实的瞬间。你看见它，它就已经开始松动。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-slate-600 text-[10.5px]">
                  <div>
                    <h5 className="font-sans font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5 text-[#8A70D6]">
                      <span>✦</span> About Consciousness Map & Hawkins Scale
                    </h5>
                    <p className="leading-relaxed font-sans font-medium text-slate-500">
                      This visualization is inspired by over 30 years of research by American psychiatrist Dr. David R. Hawkins.
                    </p>
                    <p className="leading-relaxed font-sans mt-2">
                      In his seminal work *Power vs. Force*, Hawkins proposed a framework distinct from mainstream psychology: human conscious states can be calibrated logarithmically from 1 to 1000. This is not arbitrary; over 250,000 kinesiology tests measured muscle response strength to identify specific energy levels.
                    </p>
                  </div>

                  <div className="bg-purple-50/30 p-3.5 rounded-2xl border border-purple-100/30 space-y-2">
                    <h5 className="font-sans font-bold text-slate-800 text-[11px] flex items-center gap-1.5 text-[#8A70D6]">
                      <span>✦</span> Key Discoveries
                    </h5>
                    <p className="font-sans leading-relaxed">
                      <strong className="text-slate-800">200 is the critical baseline</strong>, which Hawkins termed the "Critical Line of Courage."
                    </p>
                    <div className="space-y-1.5 text-[10px] mt-2">
                      <p className="flex items-start gap-1">
                        <span className="text-rose-500 font-bold shrink-0">·</span>
                        <span><strong className="text-slate-700">Below 200</strong> — Shame (20), Guilt (30), Grief (75), Fear (100), Anger (150) — represent destructive <strong className="text-slate-800">"Force"</strong>. They consume your energy and contract your life.</span>
                      </p>
                      <p className="flex items-start gap-1">
                        <span className="text-emerald-500 font-bold shrink-0">·</span>
                        <span><strong className="text-slate-700">Above 200</strong> — Neutrality (250), Willingness (310), Acceptance (350), Reason (400), Love (500), Joy (540) — represent constructive <strong className="text-slate-800">"Power"</strong>. They nourish your soul and expand your life.</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-sans font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5 text-[#8A70D6]">
                      <span>✦</span> Beyond Right or Wrong
                    </h5>
                    <p className="leading-relaxed font-sans">
                      According to Hawkins, a lower state does not mean "something is wrong with you." We constantly cycle through multiple levels. Our life's practice is to recognize where we stand today and move upwards whenever possible.
                    </p>
                  </div>

                  <div className="border-t border-dashed border-gray-100 pt-4">
                    <h5 className="font-sans font-bold text-slate-800 text-[11px] mb-1.5 flex items-center gap-1.5 text-[#8A70D6]">
                      <span>✦</span> Relation to Pathway of Clarity
                    </h5>
                    <p className="leading-relaxed font-sans font-medium text-slate-500">
                      Every entry you write leaves a trace on this consciousness map. We never judge your emotions as good or bad — Anxiety (100) and Joy (540) are equally valid snapshots of your raw presence. The moment you acknowledge a state, it has already begun to shift.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHawkinsInfo(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {lang === 'zh' ? '我知道了' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Footprints */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">{t('最近足迹')}</h3>
        </div>
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="bg-white/40 border border-dashed border-gray-200 rounded-[32px] p-8 text-center">
              <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest">{t('暂无足迹，开启你的第一次构建')}</p>
            </div>
          ) : (
            entries.slice(0, 3).map(e => (
              <button 
                key={e.id} 
                onClick={() => { setSelectedEntryId(e.id); navigateTo('detail'); }}
                className="w-full bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex items-center gap-4 text-left transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-2xl bg-gray-50 shrink-0 flex items-center justify-center text-morandi-blue" style={{color: MorandiTheme.blue}}>
                  {CORE_WORDS.find(w => w.word === e.emotion)?.icon || <Sparkle size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold opacity-80">{t(e.emotion)}</span>
                    <span className="text-[8px] opacity-30 uppercase font-bold tracking-tighter">{new Date(e.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] opacity-40 truncate italic">“{e.content}”</p>
                </div>
                <ChevronRight size={14} className="opacity-10" />
              </button>
            ))
          )}
        </div>
      </section>

      {/* Achievements (Badges / Milestones) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">{t('里程碑')}</h3>
           <button 
             onClick={() => {
               setTempShowcaseBadgeIds(showcaseBadgeIds);
               setShowAchievementsModal(true);
             }}
             className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-[#8A70D6]/10 flex items-center justify-center text-slate-400 hover:text-[#8A70D6] transition-all cursor-pointer hover:scale-105 active:scale-95 border border-slate-100"
             title={t('成果展示设置')}
           >
             <Award size={13} strokeWidth={2.4} />
           </button>
        </div>
        <div className={`grid gap-4 ${showcasedBadges.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {showcasedBadges.map(badge => (
            <div key={badge.id} className={`p-6 rounded-[36px] border flex flex-col items-center text-center space-y-4 transition-all relative ${badge.unlocked ? 'bg-white shadow-sm border-gray-50' : 'grayscale opacity-10 border-transparent bg-slate-50/20'}`}>
              <div className="absolute top-4 right-4 text-[7px] px-1.5 py-0.5 rounded-full font-sans font-bold tracking-wider" style={{ backgroundColor: badge.unlocked ? `${MorandiTheme.purple}10` : '#F1F3F7', color: badge.unlocked ? MorandiTheme.purple : '#95A5A6' }}>
                {badge.unlocked ? '+30 EXP' : t('未解锁')}
              </div>
              <div className={`p-4 rounded-2xl ${badge.unlocked ? 'bg-morandi-soft-purple text-[#8A70D6]' : 'bg-gray-100 text-gray-400'}`} style={{backgroundColor: badge.unlocked ? MorandiTheme.softPurple : ''}}>
                {React.cloneElement(badge.icon as React.ReactElement, { size: 24 })}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold opacity-80">{badge.name}</p>
                <p className="text-[8px] opacity-40 font-bold uppercase tracking-tight leading-tight">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showProfileEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-left flex flex-col gap-6 animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(to right, ${MorandiTheme.blue}, ${MorandiTheme.purple})` }} />
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight font-sans">
                {lang === 'zh' ? '个性化设置' : 'Profile Settings'}
              </h3>
              <button 
                onClick={() => setShowProfileEdit(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nickname Input Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase font-sans">
                {lang === 'zh' ? '你想被如何称呼' : 'Personal Nickname'}
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => {
                    if (e.target.value.length <= 15) {
                      setNickname(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#FAF8FC] border border-slate-200/65 rounded-2xl text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#8A70D6]/60 focus:bg-white transition-all font-sans"
                  placeholder={lang === 'zh' ? '小明' : 'Ming'}
                />
                <span className="absolute right-3.5 top-3.5 text-[9px] font-bold text-slate-300 font-sans">
                  {nickname.length}/15
                </span>
              </div>
            </div>

            {/* Avatar Select Section */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase font-sans">
                {lang === 'zh' ? '选择头像' : 'Choose Your Icon'}
              </label>

              <div className="grid grid-cols-3 gap-3">
                {AVATAR_OPTIONS.map((item, idx) => {
                  const isSelected = avatarIndex === idx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAvatarIndex(idx)}
                      className={`group p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all focus:outline-none cursor-pointer active:scale-95 ${
                        isSelected 
                          ? `border-[#9C82CB] ${item.bg} shadow-xs scale-102` 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white shadow-xs' : item.bg} transition-all`}>
                        {getAvatarComponent(item.iconName, 20, item.text)}
                      </div>
                      <span className={`text-[9.5px] font-bold font-sans transition-colors ${isSelected ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        {lang === 'zh' ? item.nameZh : item.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm button */}
            <button 
              onClick={() => setShowProfileEdit(false)} 
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold tracking-widest uppercase transition-all shadow-md active:scale-98 cursor-pointer font-sans text-center mt-2"
            >
              {lang === 'zh' ? '保存更改' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {showLevelRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left flex flex-col gap-5 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto scrollbar-thin">
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(to right, ${MorandiTheme.purple}, ${MorandiTheme.blue})` }} />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-800 tracking-tight font-sans">
                  {lang === 'zh' ? '等级与经验' : 'Level & EXP'}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium">
                  {lang === 'zh' ? '在知行合一中觉察心性、澄明见境' : 'See clearly and attain stability step by step'}
                </p>
              </div>
              <button 
                onClick={() => setShowLevelRules(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer focus:outline-none shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* EXP Gain Rules */}
            <div className="bg-[#FAF8FC] rounded-2xl p-4 space-y-3 border border-purple-100/30">
              <h4 className="text-[10px] font-black text-[#8A70D6] tracking-widest uppercase font-sans flex items-center gap-1.5">
                <Sparkles size={11} />
                <span>{lang === 'zh' ? '经验值（EXP）计算规则' : 'EXP Earning Rules'}</span>
              </h4>
              
              <div className="text-[9px] text-[#8670A8]/80 font-sans leading-relaxed space-y-1.5 mt-1">
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A70D6] mt-1 shrink-0"></span>
                  <span><strong>{lang === 'zh' ? '记录日记 +15 EXP' : 'Write Diary +15 EXP'}</strong>：{lang === 'zh' ? '完成并保存每日哲学日记感悟。' : 'Complete and save a philosophical diary entry.'}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A70D6] mt-1 shrink-0"></span>
                  <span><strong>{lang === 'zh' ? '使用工具 +10 EXP' : 'Use Tools +10 EXP'}</strong>：{lang === 'zh' ? '使用格物工具（理性决策分析、职场生存研究等）进行独立练习。' : 'Practice using rational decision table, career survival studies, etc.'}</span>
                </div>
                <div className="flex items-start gap-1.5 border-t border-purple-100/20 pt-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A70D6] mt-1 shrink-0"></span>
                  <span><strong>{lang === 'zh' ? '每日经验上限 100 EXP' : 'Daily Cap 100 EXP'}</strong>：{lang === 'zh' ? '通过日记和工具每天最多可积累 100 基础经验值。' : 'Daily limit for diary & tools is 100.'}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A70D6] mt-1 shrink-0"></span>
                  <span><strong>{lang === 'zh' ? '成就加成' : 'Achievement Bonus'}</strong>：{lang === 'zh' ? '每解锁一个成就有额外经验加成，不占用每日上限。' : 'Earn bonus EXP per unlocked achievement. Bypasses daily cap.'}</span>
                </div>
              </div>
            </div>

            {/* Level Milestones List */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase font-sans">
                {lang === 'zh' ? '成长阶梯' : 'Growth Steps'}
              </label>
              
              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-slate-50/20">
                <div className="grid grid-cols-12 bg-gray-50/75 p-2 px-3 text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                  <span className="col-span-3">{lang === 'zh' ? '级别' : 'Level'}</span>
                  <span className="col-span-4 pl-1">{lang === 'zh' ? '称号' : 'Title'}</span>
                  <span className="col-span-5">{lang === 'zh' ? '累计经验(差值)' : 'Req. EXP (Gap)'}</span>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto pr-0.5 animate-pulse-none">
                  {LEVEL_MILESTONES.map((milestone) => {
                    const isCurrent = levelInfo.level === milestone.level;
                    return (
                      <div 
                        key={milestone.level} 
                        className={`grid grid-cols-12 p-2 px-3 items-center text-[10px] transition-colors ${
                          isCurrent ? 'bg-[#8A70D6]/5 font-bold' : 'hover:bg-gray-50/30'
                        }`}
                      >
                        <div className="col-span-3 flex flex-col gap-0.5">
                          <span 
                            className="text-[7.5px] px-1.5 py-0.5 rounded-md font-sans font-bold tracking-tight w-fit text-center leading-none"
                            style={{ 
                              backgroundColor: isCurrent ? MorandiTheme.purple : `${MorandiTheme.purple}12`, 
                              color: isCurrent ? '#FFFFFF' : MorandiTheme.purple 
                            }}
                          >
                            Lv.{milestone.level}
                          </span>
                        </div>
                        <div className="col-span-4 font-sans text-[9px] font-bold text-slate-700 pl-1">
                          {lang === 'zh' ? milestone.titleZh : milestone.titleEn}
                        </div>
                        <div className="col-span-5 font-sans text-[9px] font-bold text-slate-600">
                          {milestone.requiredExp} <span className="text-[7.5px] font-normal text-gray-400">EXP</span>
                          {milestone.level > 1 && (
                            <span className="text-[7.5px] text-purple-400 font-semibold block sm:inline sm:ml-1">
                              (+{milestone.gap})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="grid grid-cols-12 p-2.5 px-3 items-center text-center bg-gray-50/30 border-t border-gray-100/50">
                    <div className="col-span-12 text-[8.5px] text-gray-400 font-medium italic">
                      ✨ {lang === 'zh' ? '更多级别待解锁' : 'More levels to be unlocked'} ✨
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Close button */}
            <button 
              onClick={() => setShowLevelRules(false)} 
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all shadow-md active:scale-98 cursor-pointer font-sans text-center"
            >
              {lang === 'zh' ? '返回' : 'Back'}
            </button>
          </div>
        </div>
      )}

      {showAchievementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-left flex flex-col gap-5 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto scrollbar-thin">
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(to right, ${MorandiTheme.purple}, ${MorandiTheme.blue})` }} />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-800 tracking-tight font-sans">
                  {t('我的里程碑')}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium">
                  {t('自主选择 1 到 4 个已解锁或心仪的成就展示于成长主页')}
                </p>
              </div>
              <button 
                onClick={() => setShowAchievementsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer focus:outline-none shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Grid of 8 achievements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
              {badges.map((badge) => {
                const isSelected = tempShowcaseBadgeIds.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    onClick={() => {
                      setTempShowcaseBadgeIds(prev => {
                        if (prev.includes(badge.id)) {
                          return prev.filter(x => x !== badge.id);
                        } else {
                          if (prev.length >= 4) {
                            return [...prev.slice(1), badge.id];
                          }
                          return [...prev, badge.id];
                        }
                      });
                    }}
                    className={`p-4 rounded-3xl border text-left flex flex-col items-start gap-3 transition-all cursor-pointer relative group ${
                      isSelected 
                        ? 'bg-[#8A70D6]/5 border-[#8A70D6] shadow-[0_4px_16px_rgba(138,112,214,0.06)]' 
                        : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    {/* Top Status */}
                    <div className="w-full flex items-center justify-between">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        badge.unlocked 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {badge.unlocked ? t('已解锁') : t('未解锁')}
                      </span>

                      {/* Tick circle */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all border ${
                        isSelected 
                          ? 'bg-[#8A70D6] border-[#8A70D6] text-white scale-105' 
                          : 'bg-white border-slate-200 text-transparent'
                      }`}>
                        <Check size={10} strokeWidth={4} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex gap-3 items-center w-full">
                      <div className={`p-2.5 rounded-xl shrink-0 ${badge.unlocked ? 'bg-morandi-soft-purple text-[#8A70D6]' : 'bg-gray-100 text-gray-400'}`} style={{backgroundColor: badge.unlocked ? MorandiTheme.softPurple : ''}}>
                        {React.cloneElement(badge.icon as React.ReactElement, { size: 18 })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{badge.name}</p>
                        <p className="text-[8px] text-slate-400 font-medium leading-tight mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Validation warning or counter */}
            <div className={`p-3 rounded-2xl text-center border transition-all ${tempShowcaseBadgeIds.length === 0 ? 'bg-amber-50 border-amber-100 text-amber-700 font-medium' : 'bg-slate-50 border-slate-100 text-slate-500 font-medium'}`}>
              <p className="text-[10px]">
                {tempShowcaseBadgeIds.length === 0 
                  ? (lang === 'zh' ? '⚠️ 请至少选择 1 个心仪或已解锁的里程碑展示' : '⚠️ Please select at least 1 milestone to display')
                  : (lang === 'zh' ? `✨ 已选中 ${tempShowcaseBadgeIds.length} 个里程碑（最多可选 4 个）` : `✨ Selected ${tempShowcaseBadgeIds.length} milestones (choose up to 4)`)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowAchievementsModal(false)}
                className="flex-1 py-3 border border-gray-150 hover:bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer text-center"
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (tempShowcaseBadgeIds.length >= 1 && tempShowcaseBadgeIds.length <= 4) {
                    setShowcaseBadgeIds(tempShowcaseBadgeIds);
                    try {
                      localStorage.setItem('selected_showcase_badges_v2', JSON.stringify(tempShowcaseBadgeIds));
                    } catch (e) {}
                    setShowAchievementsModal(false);
                  }
                }}
                disabled={tempShowcaseBadgeIds.length === 0 || tempShowcaseBadgeIds.length > 4}
                className="flex-1 py-3 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-center"
                style={{ backgroundColor: MorandiTheme.blue }}
              >
                {lang === 'zh' ? '保存设置' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  let root = (window as any).__reactRoot;
  if (!root) {
    root = createRoot(container);
    (window as any).__reactRoot = root;
  }
  root.render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
