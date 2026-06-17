
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
  Info
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
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('philosophical_diary_entries_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showToolSettings, setShowToolSettings] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
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
        />
      );
      case 'tools': 
        if (activeTool === 'selector') return <LifeSelector onBack={() => setActiveTool('none')} />;
        if (activeTool === 'workplace') return <WorkplaceSurvival onBack={() => setActiveTool('none')} />;
        return <Toolbox onSelectTool={setActiveTool} onOpenSettings={() => setShowToolSettings(true)} />;
      case 'growth': return <UserCenter entries={diaryEntries} setEntries={setDiaryEntries} onTabChange={setActiveTab} onSelectTool={(t) => { setActiveTab('tools'); setActiveTool(t); }} />;
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col font-sans select-none ${activeTool !== 'none' ? 'h-screen overflow-hidden' : 'min-h-screen'}`} style={{ backgroundColor: MorandiTheme.bg, color: MorandiTheme.ink }}>
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
      <main className={`flex-1 ${activeTool === 'none' ? 'overflow-y-auto pb-24' : 'overflow-hidden flex flex-col h-full'}`}>{renderContent()}</main>
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
                { id: 'coming_soon', name: '更多工具，敬请期待', desc: '探索更多思维解离与重构工具', icon: <Sparkles size={18} /> }
              ].map(opt => {
                const isSelected = quickToolIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
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
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-purple-50/10 border-[#8A70D6] shadow-xs' 
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ 
                        backgroundColor: isSelected ? 'rgba(138, 112, 214, 0.12)' : 'rgba(148, 163, 184, 0.08)',
                        color: isSelected ? '#8A70D6' : '#64748B' 
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
  quickToolIds: string[]
}> = ({ entries, setEntries, getInsight, isLoading, onTabChange, onSelectTool, quickToolIds }) => {
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
  const [userMoodSelected, setUserMoodSelected] = useState<string | null>(null);
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
    setContent(''); setSelectedSchoolId(null); setSelectedWord(null); setWeather('sunny'); setMood('calm'); setStep('word-selection');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return t('早上好，小明');
    if (hour >= 11 && hour < 14) return t('中午好，小明');
    if (hour >= 14 && hour < 18) return t('下午好，小明');
    return t('晚上好，小明');
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
              { id: 'coming_soon', name: '更多工具，敬请期待', desc: '探索更多思维解离与重构工具', icon: <Sparkles size={20} strokeWidth={2.2} />, color: '#64748B', bgColor: 'rgba(100, 116, 139, 0.08)', disabled: true }
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

        {/* Global Mood Trends Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-xs border border-slate-100 space-y-5 text-left">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase font-sans">
                {t('澄识指数')}
              </h3>
              <button 
                onClick={() => setShowClarityIndexInfo(true)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer inline-flex items-center justify-center focus:outline-none"
                title={lang === 'zh' ? '查看指数量化逻辑' : 'View index logic'}
              >
                <Info size={13} className="opacity-85" />
              </button>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
              {lang === 'zh' ? '本周趋势' : 'This Week'}
            </span>
          </div>

          <div className="flex justify-between items-end h-28 pt-2 px-1 relative">
            {[
              { day: 'Mon', h: '55%', active: false },
              { day: 'Tue', h: '68%', active: false },
              { day: 'Wed', h: '42%', active: false },
              { day: 'Thu', h: '72%', active: false },
              { day: 'Fri', h: '58%', active: false },
              { day: 'Sat', h: '85%', active: true },
              { day: 'Sun', h: '80%', active: false }
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-3.5 bg-slate-50 rounded-full h-20 flex items-end overflow-hidden">
                  <div 
                    className="w-full rounded-full transition-all duration-1000" 
                    style={{ 
                      height: bar.h, 
                      backgroundColor: bar.active ? '#9C82CB' : '#8A70D6',
                      opacity: bar.active ? 1 : 0.7 
                    }}
                  />
                </div>
                <span className="text-[9px] text-[#A393A3] font-bold font-sans">{bar.day}</span>
              </div>
            ))}
          </div>

          {/* Active stats listing counts */}
          <div className="pt-3 border-t border-slate-50 text-[10px] text-slate-400 flex justify-between font-sans items-center">
            <span>
              {lang === 'zh' ? '今日全球分布' : 'Today\'s choices'}: 🟢{' '}
              <strong className="text-slate-700">{globalMoodStats.great}</strong> | 🟡{' '}
              <strong className="text-slate-700">{globalMoodStats.okay}</strong> | 🔴{' '}
              <strong className="text-slate-700">{globalMoodStats.bad}</strong>
            </span>
            <span className="italic opacity-80 italic text-[9px]">
              {lang === 'zh' ? '实时更新' : 'Live state'}
            </span>
          </div>

          {/* Average info stats */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50 text-left font-sans">
            <div>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{t('全球平均')}</p>
              <h4 className="text-lg font-black text-slate-700 mt-0.5">75%</h4>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{t('你的平均')}</p>
              <h4 className="text-lg font-black mt-0.5" style={{ color: MorandiTheme.blue }}>
                {diaryCount > 0 ? `${Math.min(96, 75 + diaryCount * 5)}%` : '75%'}
              </h4>
            </div>
          </div>
        </div>

        {/* Badges Container */}
        <div className="space-y-3 text-left">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase font-sans">{t('你的徽章')}</h3>
            <button 
              onClick={() => { if (onTabChange) onTabChange('growth'); }} 
              className="text-xs font-bold transition-opacity hover:opacity-80 font-sans flex items-center gap-0.5"
              style={{ color: MorandiTheme.blue }}
            >
              <span>{t('查看全部')}</span>
              <ChevronRight size={13} strokeWidth={2.5} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-white p-5 rounded-[32px] shadow-xs border border-slate-50">
            {[
              { id: 'streak', name: t('7天连续'), icon: <Zap size={14} />, unlocked: isSevenDayStreak },
              { id: 'master', name: t('反思大师'), icon: <BookOpen size={14} />, unlocked: isReflectionMaster },
              { id: 'mood', name: t('情绪记录者'), icon: <Smile size={14} />, unlocked: b => isMoodRecorder },
              { id: 'early', name: t('早期用户'), icon: <Award size={14} />, unlocked: true }
            ].map(b => {
              const isUnlocked = typeof b.unlocked === 'function' ? b.unlocked(null) : b.unlocked;
              return (
                <div key={b.id} className="flex flex-col items-center gap-2">
                  <div 
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-[#9C82CB] to-[#8A70D6] text-white shadow-xs' 
                        : 'bg-slate-50 text-slate-300'
                    }`}
                  >
                    {b.icon}
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 font-sans text-center tracking-tighter truncate w-full px-0.5">
                    {b.name}
                  </span>
                </div>
              );
            })}
          </div>
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
            <div className="flex items-center justify-start gap-3 sm:gap-4 pb-2">
              <div className="flex gap-2 sm:gap-3">
                {WEATHER_OPTIONS.map(opt => (
                  <button 
                    key={opt.id} 
                    onClick={() => setWeather(opt.id)}
                    className={`transition-all duration-300 p-1.5 sm:p-2 rounded-xl flex items-center justify-center ${weather === opt.id ? 'bg-gray-50 shadow-sm opacity-100 scale-125' : 'opacity-10 hover:opacity-30'}`}
                    style={{ color: weather === opt.id ? MorandiTheme.blue : 'inherit' }}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
              
              <div className="w-[1.5px] h-4 bg-gray-100 mx-1" />
              
              <div className="flex gap-2 sm:gap-3">
                {MOOD_OPTIONS.map(opt => (
                  <button 
                    key={opt.id} 
                    onClick={() => setMood(opt.id)}
                    className={`transition-all duration-300 p-1.5 sm:p-2 rounded-xl flex items-center justify-center ${mood === opt.id ? 'bg-gray-50 shadow-sm opacity-100 scale-125' : 'opacity-10 hover:opacity-30'}`}
                    style={{ color: mood === opt.id ? MorandiTheme.purple : 'inherit' }}
                  >
                    {opt.icon}
                  </button>
                ))}
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
              placeholder={t("此处留白，供你构建秩序...")}
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
              {isLoading ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white" /> : t("建立秩序")}
            </button>
          </div>
        </section>
      )}

      {/* History - Below word selection */}
      {step === 'word-selection' && entries.length > 0 && (
        <section className="space-y-6 pt-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">Chronicles</h3>
            <History size={16} className="opacity-10" />
          </div>
          <div className="space-y-6">
            {entries.slice(0, 3).map(e => (
              <div key={e.id} className="bg-white rounded-[36px] p-8 shadow-sm border border-gray-100/50 space-y-6 transition-transform hover:scale-[1.01]">
                <div className="flex justify-between items-start border-b border-gray-50 pb-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">{new Date(e.date).toLocaleDateString()}</span>
                      <div className="flex gap-2 opacity-20">
                        {WEATHER_OPTIONS.find(o => o.id === e.weather)?.icon}
                        {MOOD_OPTIONS.find(o => o.id === e.mood)?.icon}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[9px] px-2.5 py-1 bg-gray-50 rounded-lg text-gray-400 font-bold uppercase tracking-wider">{t(e.emotion)}</span>
                      <span className="text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider" style={{backgroundColor: MorandiTheme.softBlue, color: MorandiTheme.blue}}>{t(e.school || '')}</span>
                    </div>
                  </div>
                  <Check size={14} className="opacity-10" />
                </div>

                <div className="space-y-5">
                  {e.selectedView && (
                    <div className="border-l-2 pl-4 py-1" style={{borderColor: MorandiTheme.accent}}>
                      <p className="text-[11px] italic text-gray-400 leading-relaxed font-serif">“{t(e.selectedView)}”</p>
                    </div>
                  )}
                  
                  <p className="text-[14px] leading-relaxed text-gray-600 font-serif whitespace-pre-wrap">{e.content}</p>
                  
                  {e.aiReflection && (
                    <div className="p-6 rounded-[28px] border border-gray-50" style={{backgroundColor: MorandiTheme.bg + '40'}}>
                      <div className="flex items-center gap-2 mb-3 opacity-20">
                        <Sparkles size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Insight Reflection</span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-gray-500 italic font-serif">“{e.aiReflection}”</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
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
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl relative text-left flex flex-col gap-6 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(to right, ${MorandiTheme.blue}, ${MorandiTheme.purple})` }} />
            
            <div className="flex items-center justify-between">
              <h3 className="text-md sm:text-lg font-black text-slate-800 tracking-tight font-sans">
                {t('澄识指数计算公式')}
              </h3>
              <button 
                onClick={() => setShowClarityIndexInfo(false)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-sans">
              {t('澄识指数（Clarity Index, CI）是反映个体内在认知秩序、情绪解离水平与理性重构深度的量化指标。基于认知行为疗法（CBT）及经典哲学流派（斯多葛、儒家、实用主义等）的理论模型构建。')}
            </p>

            <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 text-center space-y-1.5 font-sans">
              <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{t('核心公式')}</span>
              <div className="text-sm sm:text-base font-black text-slate-800 tracking-wider">
                CI = 40% · Rr + 30% · Da + 30% · Mc
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-800 tracking-wider uppercase font-sans">
                {t('参数说明')}
              </h4>
              
              <div className="space-y-3">
                <div className="bg-slate-50/30 p-4 rounded-2xl border border-slate-100/50 space-y-1">
                  <h5 className="font-bold text-xs text-slate-800 tracking-tight font-sans">
                    {t('1. 认知重构系数 (Rr - Cognitive Reframing Factor)')}
                  </h5>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-sans">
                    {t('衡量消极情绪或非理性信念被理性哲学框架（如斯多葛接受、儒家礼法克制、实用主义行动）成功重构的比例。**: 通过模型评估每个记录周期中的“秩序建立”质量。')}
                  </p>
                </div>

                <div className="bg-slate-50/30 p-4 rounded-2xl border border-slate-100/50 space-y-1">
                  <h5 className="font-bold text-xs text-slate-800 tracking-tight font-sans">
                    {t('2. 情绪解离深度 (Da - Affect Dissociation Depth)')}
                  </h5>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-sans">
                    {t('评估用户在记录前后，初始情绪浓度与反思后澄明度之间的绝对差值。差值越大，说明情绪解离越彻底。**: $Da = \text{Initial Intensity} - \text{Post-reflection Intensity}$。')}
                  </p>
                </div>

                <div className="bg-slate-50/30 p-4 rounded-2xl border border-slate-100/50 space-y-1">
                  <h5 className="font-bold text-xs text-slate-800 tracking-tight font-sans">
                    {t('3. 认知秩序协同度 (Mc - Consistency & Order Synergy)')}
                  </h5>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-sans">
                    {t('反映连续记录的频率和思考的内在连贯性。避免情绪随外部事件过度摆动，从而建立稳定的决策和思考心流。**: 基于过去7天连续记录 and 思考的方差指数。')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 tracking-wider uppercase font-sans">
                {t('指数分级')}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-[9px] sm:text-[10px] font-medium font-sans">
                <div className="p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 space-y-0.5">
                  <span className="font-bold text-emerald-600 shrink-0">{t('90-100 澄明 (Highly Clear)')}</span>
                  <p className="text-slate-400 leading-normal">{t('心物相通，理性重构高度自如，情绪能即时解离。')}</p>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 space-y-0.5">
                  <span className="font-bold text-indigo-600 shrink-0">{t('70-89 渐悟 (Guided Clarity)')}</span>
                  <p className="text-slate-400 leading-normal">{t('能够运用哲学工具解析日常，秩序感正在稳步建立。')}</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/30 border border-amber-100/50 space-y-0.5">
                  <span className="font-bold text-amber-600 shrink-0">{t('50-69 混沌 (Struggling/Unordered)')}</span>
                  <p className="text-slate-400 leading-normal">{t('情绪易受外在侵扰，理智与执念仍处于博弈拉扯阶段。')}</p>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/30 border border-rose-100/50 space-y-0.5">
                  <span className="font-bold text-rose-600 shrink-0">{t('0-49 执迷 (Distorted)')}</span>
                  <p className="text-slate-400 leading-normal">{t('缺乏认知工具，陷入单一情绪死循环，秩序亟待重建。')}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowClarityIndexInfo(false)} 
              className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all shadow-md active:scale-98 cursor-pointer font-sans text-center mt-2"
            >
              {lang === 'zh' ? '理解并关闭' : 'Close'}
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
            <p className="text-xs text-slate-400 mt-1 font-medium">{t('探索更多思维解离与重构工具')}</p>
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
  onSelectTool?: (tool: ToolType) => void
}> = ({ entries, setEntries, onTabChange, onSelectTool }) => {
  const { lang, t, setLang } = useLanguage();
  const [view, setView] = useState<GrowthView>('center');
  const [previousView, setPreviousView] = useState<GrowthView>('center');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<{type: 'all' | 'school' | 'emotion', value: string | null}>({type: 'all', value: null});

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
  };

  const diaryCount = entries.length;
  
  const schoolStats = useMemo(() => {
    const stats: Record<string, number> = {};
    entries.forEach(e => {
      if (e.school) stats[e.school] = (stats[e.school] || 0) + 1;
    });
    return stats;
  }, [entries]);

  const badges: Badge[] = [
    { id: '1', name: t('破晓行者'), description: t('完成第1篇哲学日记'), icon: <Compass />, unlocked: diaryCount >= 1 },
    { id: '2', name: t('深度思辨'), description: t('累计5篇哲学日记'), icon: <BookOpen />, unlocked: diaryCount >= 5 },
    { id: '3', name: t('秩序守护'), description: t('探索过3个哲学流派'), icon: <Award />, unlocked: Object.keys(schoolStats).length >= 3 },
    { id: '4', name: t('格物大师'), description: t('常用工具辅助思考'), icon: <Scale />, unlocked: diaryCount >= 10 },
  ];

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
    const [editContent, setEditContent] = React.useState(selectedEntry.content);
    const [editWeather, setEditWeather] = React.useState(selectedEntry.weather);
    const [editMood, setEditMood] = React.useState(selectedEntry.mood);

    React.useEffect(() => {
      if (selectedEntry) {
        setEditContent(selectedEntry.content);
        setEditWeather(selectedEntry.weather);
        setEditMood(selectedEntry.mood);
        setIsEditing(false);
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
            <button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all text-[11px] font-bold tracking-widest text-gray-500 uppercase shadow-sm bg-white"
            >
              <PenLine size={13} />
              {t('编辑内容')}
            </button>
          )}
        </div>

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

        {/* Banner with state */}
        <div className="bg-white rounded-[44px] p-8 border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
          <BookOpen className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.02]" />
          <div className="space-y-1">
            <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em] block">THOUGHT MATRIX INDEX</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold opacity-85">{schoolStatsCount}</span>
              <span className="text-xs opacity-30">/ 4 {t('个已记录维度')}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed font-serif italic pt-2 border-t border-gray-50">
            {t('“心智之秩序不应任凭本能摆弄，而应交由先贤理性所铸之框架安放。在此翻阅学派书室，让每一次日常实践都在古典智慧中交汇。”')}
          </p>
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

            <div className="lg:col-span-5 bg-gray-50/40 border border-gray-100/60 rounded-[32px] p-6 space-y-6 flex flex-col justify-between text-left">
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
            <div className="w-14 h-14 rounded-[20px] bg-gray-50 flex items-center justify-center border-2 border-white shadow-md rotate-2 shrink-0">
              <User size={28} className="text-gray-300" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-800 font-serif">{t('秩序构建者')}</h2>
                <span className="text-[8px] px-2 py-0.5 rounded-full font-bold tracking-wider scale-90 origin-left shrink-0" style={{ backgroundColor: `${MorandiTheme.purple}15`, color: MorandiTheme.purple }}>
                  Lv.{Math.floor(diaryCount/5) + 1}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold font-sans">Pathway Pioneer</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              <span>{t('践行进度')}</span>
              <span>{(diaryCount % 5) * 20}%</span>
            </div>
            <div className="w-full bg-gray-50 h-[3px] rounded-full overflow-hidden">
              <div className="h-full transition-all duration-1000 rounded-full" style={{ width: `${(diaryCount % 5) * 20}%`, backgroundColor: MorandiTheme.purple }}></div>
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
        <div className="flex items-center justify-between">
           <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">{t('思辨偏好分布')}</h3>
           <BarChart3 size={14} className="opacity-10" />
        </div>
        <div className="space-y-5">
           {SCHOOLS.map(school => {
             const count = schoolStats[school.name] || 0;
             const percent = diaryCount > 0 ? (count / diaryCount) * 100 : 0;
             return (
               <div key={school.id} className="space-y-2 text-left">
                  <div className="flex justify-between text-[10px] font-bold opacity-60">
                     <span>{t(school.name)}</span>
                     <span className="opacity-40">{count} {t('次')}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                     <div className="h-full bg-morandi-blue rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: MorandiTheme.blue }}></div>
                  </div>
               </div>
             );
           })}
        </div>
      </section>

      {/* Recent Footprints */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">{t('最近足迹')}</h3>
           <Calendar size={14} className="opacity-10" />
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

      {/* Achievements (Badges) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.4em]">{t('勋衔馆')}</h3>
           <Award size={14} className="opacity-10" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {badges.map(badge => (
            <div key={badge.id} className={`p-6 rounded-[36px] border flex flex-col items-center text-center space-y-4 transition-all ${badge.unlocked ? 'bg-white shadow-sm border-gray-50' : 'grayscale opacity-10 border-transparent'}`}>
              <div className={`p-4 rounded-2xl ${badge.unlocked ? 'bg-morandi-soft-purple' : 'bg-gray-100'}`} style={{backgroundColor: badge.unlocked ? MorandiTheme.softPurple : '', color: badge.unlocked ? MorandiTheme.purple : 'inherit'}}>
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
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
