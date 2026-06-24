
import React, { useState, useEffect, useRef } from 'react';
import { WorkLog, AnalysisSummary, ResearchSubject, StructuredReaction, EvaluationType, TagDefinition, TagCategory, StrategyDefinition, SubjectReflection } from '../types';
import { DEFAULT_TAG_LIBRARY, STRATEGIES_DATABASE } from '../constants';
import { analyzeSingleLog, generatePeriodicAnalysis } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '../components/LanguageContext';

const EMOTION_OPTIONS = ['愤怒', '焦虑', '无力', '可笑', '平静', '委屈', '震惊'];
const PHYSICAL_OPTIONS = ['胃部紧绷', '心跳加速', '肩颈僵硬', '呼吸浅快', '头痛/眩晕', '手心出汗', '无异常'];
const ACTION_OPTIONS = ['沉默', '解释', '按指示做', '结构化确认法', '延迟回复', '寻求第三方支持', '记录证据'];
const STRATEGY_OPTIONS = ['#去人格化解读', '#系统思维分析', '#边界重建', '#成本收益核算', '#预期管理', '#认知重构', '#情感隔离'];

const EVENT_PROPERTY_CATEGORIES: TagCategory[] = ['沟通与信息障碍', '决策与逻辑失序', '人际与态度', '管理能力缺失', '职业操守与情绪'];
const TAG_CATEGORIES: TagCategory[] = [...EVENT_PROPERTY_CATEGORIES, '生理信号标签', '即时行动标签'];

const EVALUATION_DETAILS: { type: EvaluationType; label: string; desc: string }[] = [
  { type: '健康的适应', label: '健康的适应', desc: '基于更清醒的认知，节省了无谓的情绪消耗。' },
  { type: '危险的麻木', label: '危险的麻木', desc: '源于放弃挣扎，开始接受不合理为“常态”。' },
  { type: '中性观察', label: '中性观察', desc: '只是一种暂时状态，有待观察。' },
];

const WorkplaceSurvival: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab ] = useState<'logs' | 'analysis' | 'subjects' | 'tags_library' | 'strategies_library' | 'monthly_reflections'>('logs');
  const [logs, setLogs] = useState<WorkLog[]>(() => {
    try {
      const saved = localStorage.getItem('work_observation_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [subjects, setSubjects] = useState<ResearchSubject[]>(() => {
    try {
      const saved = localStorage.getItem('work_observation_subjects');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [subjectReflections, setSubjectReflections] = useState<SubjectReflection[]>(() => {
    try {
      const saved = localStorage.getItem('work_observation_subject_reflections');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [editingReflectionText, setEditingReflectionText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const selectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    
    // Find the saved reflection for this subject
    const found = subjectReflections.find(r => r.subjectId === subjectId);
    const content = found ? found.content : '';
    
    setEditingReflectionText(content);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 120);
  };

  useEffect(() => {
    if (activeTab === 'monthly_reflections') {
      if (!selectedSubjectId && subjects.length > 0) {
        selectSubject(subjects[0].id);
      }
    }
  }, [activeTab, subjects]);

  const [isMobileMenuOpen, setIsMobileMenuOpen ] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [cameFromLogs, setCameFromLogs] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [logsSubTab, setLogsSubTab] = useState<'new' | 'history'>('new');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  const formatLogDateTime = (log: WorkLog) => {
    if (!log.timestamp) return log.date;
    const d = new Date(log.timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  const [activeSegment, setActiveSegment] = useState<'全部' | '事件属性' | '生理信号' | '即时行动'>('全部');
  const [eventSubCategory, setEventSubCategory] = useState<string>('全部');
  const [showEventSubCategories, setShowEventSubCategories] = useState(false);
  const [libraryDensity, setLibraryDensity] = useState<'compact' | 'card'>('compact');
  const [expandedTagIds, setExpandedTagIds] = useState<string[]>([]);
  const [tagBoard, setTagBoard] = useState<'事件属性' | '生理信号' | '即时行动'>('事件属性');
  const [subCategory, setSubCategory] = useState<TagCategory>('沟通与信息障碍');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('depersonalization');
  const [currentStep, setCurrentStep] = useState(1);

  const [tagLibrary, setTagLibrary] = useState<TagDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('work_observation_tags');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 迁移旧标签：将 解释/争辩 改为 解释
          let migrated = false;
          parsed = parsed.map(t => {
            if (t.name === '解释/争辩' || t.id === '解释/争辩') {
              migrated = true;
              return { ...t, id: '解释', name: '解释', description: '试图通过详细解释来证明自己的立场。' };
            }
            return t;
          });
          
          const uniqueMap = new Map<string, TagDefinition>();
          parsed.forEach(t => uniqueMap.set(t.name, t));
          parsed = Array.from(uniqueMap.values());

          // 巧妙合并：确保当期默认标签库中的生理信号（如恶心、头晕）以及即时行动等预设指标如果丢失，能自动补回，同时保留用户的新增自定义标签。
          const existingNames = new Set(parsed.map(t => t.name));
          const missingDefaults = DEFAULT_TAG_LIBRARY.filter(d => !existingNames.has(d.name));
          if (missingDefaults.length > 0 || migrated) {
            const merged = [...parsed, ...missingDefaults];
            localStorage.setItem('work_observation_tags', JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TAG_LIBRARY;
  });
  
  const physicalOptions = tagLibrary.filter(t => t.category === '生理信号标签').map(t => t.name);
  const actionOptions = tagLibrary.filter(t => t.category === '即时行动标签').map(t => t.name);
  
  const [newLog, setNewLog] = useState<{
    fact: string;
    subjectId: string;
    selectedTags: string[];
    reaction: StructuredReaction;
  }>(() => {
    let initialSubjectId = '';
    try {
      const savedSubjects = localStorage.getItem('work_observation_subjects');
      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialSubjectId = parsed[0].id;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { 
      fact: '', 
      subjectId: initialSubjectId, 
      selectedTags: [],
      reaction: {
        emotions: [{ name: '', score: 5 }],
        physicalSignals: [],
        immediateThoughts: [],
        actionTaken: [],
        turningPoint: '',
        appliedStrategies: [],
        finalMindsetLabel: '',
        shiftEvaluation: '中性观察',
        survivalRule: '',
        customNotes: ''
      } 
    };
  });
  
  const [newSubject, setNewSubject] = useState({ alias: '', role: '', context: '' });
  const [newTag, setNewTag] = useState<{ name: string; category: TagCategory; description: string }>({
    name: '',
    category: '沟通与信息障碍',
    description: ''
  });
  
  const [selectedEmotionToAdd, setSelectedEmotionToAdd] = useState(EMOTION_OPTIONS[0]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisSummary | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [strategies, setStrategies] = useState<StrategyDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('work_observation_strategies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sync schemas if helpful
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return STRATEGIES_DATABASE.map(s => ({
      ...s,
      isEnabled: true,
      isCustom: false
    }));
  });

  const [expandedStrategyIds, setExpandedStrategyIds] = useState<Record<string, boolean>>({
    'depersonalization': true
  });

  const [viewingSubjectLogs, setViewingSubjectLogs] = useState<ResearchSubject | null>(null);
  const [viewingReportLog, setViewingReportLog] = useState<WorkLog | null>(null);
  const [preEditingReportLog, setPreEditingReportLog] = useState<WorkLog | null>(null);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<ResearchSubject | null>(null);
  const [showStatusHelp, setShowStatusHelp] = useState(false);

  const getReflectionWordCount = (text: string) => {
    if (!text) return 0;
    const clean = text.replace(/◆ \d{4}年\d{2}月\d{2}日 \d{2}:\d{2}\s*/g, '');
    return clean.trim().length;
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const regex = /(◆ \d{4}年\d{2}月\d{2}日 \d{2}:\d{2})/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (part.match(/^◆ \d{4}年\d{2}月\d{2}日 \d{2}:\d{2}$/)) {
        return (
          <sup key={index} className="text-[9px] font-bold font-mono text-slate-400 bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/50 ml-1 select-none pointer-events-none align-baseline relative -top-1">
            {part}
          </sup>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  useEffect(() => {
    if (!editingSubject) {
      setShowStatusHelp(false);
    }
  }, [editingSubject]);

  const startEditingLog = (log: WorkLog) => {
    setEditingLogId(log.id);
    setPreEditingReportLog(log);
    setNewLog({
      fact: log.fact,
      subjectId: log.subjectId,
      selectedTags: log.tags || [],
      reaction: log.structuredReaction ? {
        emotions: log.structuredReaction.emotions || [],
        physicalSignals: log.structuredReaction.physicalSignals || [],
        immediateThoughts: log.structuredReaction.immediateThoughts || [],
        actionTaken: Array.isArray(log.structuredReaction.actionTaken) 
          ? log.structuredReaction.actionTaken 
          : (log.structuredReaction.actionTaken ? [log.structuredReaction.actionTaken] : []),
        turningPoint: log.structuredReaction.turningPoint || '',
        appliedStrategies: log.structuredReaction.appliedStrategies || [],
        finalMindsetLabel: log.structuredReaction.finalMindsetLabel || '',
        shiftEvaluation: log.structuredReaction.shiftEvaluation || '中性观察',
        survivalRule: log.structuredReaction.survivalRule || '',
        customNotes: log.structuredReaction.customNotes || ''
      } : {
        emotions: [],
        physicalSignals: [],
        immediateThoughts: [],
        actionTaken: [],
        turningPoint: '',
        appliedStrategies: [],
        finalMindsetLabel: '',
        shiftEvaluation: '中性观察',
        survivalRule: '',
        customNotes: ''
      }
    });
    setActiveTab('logs');
    setLogsSubTab('new');
    setCurrentStep(1);
    setViewingReportLog(null);
  };

  const confirmCallbackRef = useRef<() => void>(() => {});
  const mainRef = useRef<HTMLElement>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    confirmCallbackRef.current = onConfirm;
    setConfirmConfig({
      isOpen: true,
      title,
      message,
    });
  };

  const showAlert = (title: string, message: string) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
    });
  };

  const [isAddingStrategy, setIsAddingStrategy] = useState(false);
  const [showStrategyConfig, setShowStrategyConfig] = useState(false);
  const [newStrategy, setNewStrategy] = useState<{
    name: string;
    concept: string;
    reason: string;
    how: string;
    example: string;
    tip: string;
    applyImmediately: boolean;
  }>({
    name: '',
    concept: '',
    reason: '',
    how: '',
    example: '',
    tip: '',
    applyImmediately: true
  });

  useEffect(() => {
    localStorage.setItem('work_observation_strategies', JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    localStorage.setItem('work_observation_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('work_observation_subjects', JSON.stringify(subjects));
    const activeSubjects = subjects.filter(s => s.status !== 'completed');
    if (activeSubjects.length > 0) {
      if (!newLog.subjectId || !activeSubjects.some(s => s.id === newLog.subjectId)) {
        setNewLog(prev => ({ ...prev, subjectId: activeSubjects[0].id }));
      }
    } else {
      if (newLog.subjectId) {
        setNewLog(prev => ({ ...prev, subjectId: '' }));
      }
    }
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('work_observation_tags', JSON.stringify(tagLibrary));
  }, [tagLibrary]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab, viewingSubjectLogs, logsSubTab, currentStep, selectedSubjectId]);

  const toggleSelection = (field: keyof StructuredReaction, value: string) => {
    setNewLog(prev => {
      const current = prev.reaction[field] as string[];
      const next = current.includes(value) ? current.filter(i => i !== value) : [...current, value];
      return { ...prev, reaction: { ...prev.reaction, [field]: next } };
    });
  };

  const toggleTagSelection = (tagName: string) => {
    setNewLog(prev => {
      const current = prev.selectedTags;
      const next = current.includes(tagName) ? current.filter(t => t !== tagName) : [...current, tagName];
      return { ...prev, selectedTags: next };
    });
  };

  const setEmotionScore = (name: string, score: number) => {
    setNewLog(prev => {
      const current = [...prev.reaction.emotions];
      const index = current.findIndex(e => e.name === name);
      if (index >= 0) {
        if (score === 0) current.splice(index, 1);
        else current[index].score = score;
      } else if (score > 0) current.push({ name, score });
      return { ...prev, reaction: { ...prev.reaction, emotions: current } };
    });
  };

  const handleDirectSaveEdit = () => {
    if (!editingLogId) return;
    const targetSubject = subjects.find(s => s.id === newLog.subjectId);
    const existing = logs.find(l => l.id === editingLogId);
    const cleanEmotions = newLog.reaction.emotions.filter(e => e.name !== '');
    const cleanReaction = {
      ...newLog.reaction,
      emotions: cleanEmotions
    };
    const logEntry: WorkLog = {
      id: editingLogId,
      subjectId: newLog.subjectId,
      subjectAlias: targetSubject?.alias || existing?.subjectAlias,
      subjectRole: targetSubject?.role || existing?.subjectRole,
      date: existing ? existing.date : '',
      fact: newLog.fact,
      reaction: JSON.stringify(cleanReaction),
      structuredReaction: cleanReaction,
      tags: newLog.selectedTags,
      aiQuestions: existing ? existing.aiQuestions : [],
      timestamp: existing ? existing.timestamp : Date.now(),
    };
    setLogs(prev => prev.map(l => l.id === editingLogId ? logEntry : l));
    
    setViewingReportLog(logEntry);
    setPreEditingReportLog(null);

    setEditingLogId(null);
    setLogsSubTab('history');
    setNewLog({ 
      fact: '', 
      subjectId: subjects[0]?.id || '', 
      selectedTags: [],
      reaction: { emotions: [{ name: '', score: 5 }], physicalSignals: [], immediateThoughts: [], actionTaken: [], turningPoint: '', appliedStrategies: [], finalMindsetLabel: '', shiftEvaluation: '中性观察', survivalRule: '', customNotes: '' } 
    });
    setCurrentStep(1);
    showAlert("保存成功", "观察记录已成功更新。");
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.fact || !newLog.subjectId) return;
    setIsAnalyzing(true);
    const targetSubject = subjects.find(s => s.id === newLog.subjectId);
    
    let suggestedTags: string[] = [];
    let followUpQuestions: string[] = [];

    try {
      const aiResponse = await analyzeSingleLog(
        { fact: newLog.fact, structuredReaction: newLog.reaction }, 
        tagLibrary, 
        targetSubject
      );
      if (aiResponse) {
        suggestedTags = aiResponse.suggestedTags || [];
        followUpQuestions = aiResponse.followUpQuestions || [];
      }
    } catch (err) {
      console.warn("AI Analysis failed or API key not configured, saving log without AI analysis:", err);
    }

    try {
      const finalTags = Array.from(new Set([...newLog.selectedTags, ...suggestedTags]));
      const cleanEmotions = newLog.reaction.emotions.filter(e => e.name !== '');
      const cleanReaction = {
        ...newLog.reaction,
        emotions: cleanEmotions
      };

      if (editingLogId) {
        const existing = logs.find(l => l.id === editingLogId);
        const logEntry: WorkLog = {
          id: editingLogId,
          subjectId: newLog.subjectId,
          subjectAlias: targetSubject?.alias || existing?.subjectAlias,
          subjectRole: targetSubject?.role || existing?.subjectRole,
          date: existing ? existing.date : '',
          fact: newLog.fact,
          reaction: JSON.stringify(cleanReaction),
          structuredReaction: cleanReaction,
          tags: finalTags,
          aiQuestions: existing ? existing.aiQuestions : [],
          timestamp: existing ? existing.timestamp : Date.now(),
        };
        setLogs(prev => prev.map(l => l.id === editingLogId ? logEntry : l));
        setEditingLogId(null);
      } else {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formattedDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const logEntry: WorkLog = {
          id: crypto.randomUUID(),
          subjectId: newLog.subjectId,
          subjectAlias: targetSubject?.alias,
          subjectRole: targetSubject?.role,
          date: formattedDateTime,
          fact: newLog.fact,
          reaction: JSON.stringify(cleanReaction),
          structuredReaction: cleanReaction,
          tags: finalTags,
          aiQuestions: followUpQuestions,
          timestamp: now.getTime(),
        };
        setLogs([logEntry, ...logs]);
      }
      
      setNewLog({ 
        fact: '', 
        subjectId: subjects[0]?.id || '', 
        selectedTags: [],
        reaction: { emotions: [{ name: '', score: 5 }], physicalSignals: [], immediateThoughts: [], actionTaken: [], turningPoint: '', appliedStrategies: [], finalMindsetLabel: '', shiftEvaluation: '中性观察', survivalRule: '', customNotes: '' } 
      });
      setCurrentStep(1);
      setShowToast(true);
      setLogsSubTab('history');
      setTimeout(() => setShowToast(false), 3000);
    } catch (saveErr) {
      console.error("Failed to save log entry:", saveErr);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.name || !newTag.description) return;
    
    let finalCategory: TagCategory = '沟通与信息障碍';
    if (tagBoard === '生理信号') {
      finalCategory = '生理信号标签';
    } else if (tagBoard === '即时行动') {
      finalCategory = '即时行动标签';
    } else {
      finalCategory = subCategory;
    }

    const tag: TagDefinition = {
      id: newTag.name,
      name: newTag.name,
      category: finalCategory,
      description: newTag.description
    };
    if (tagLibrary.find(t => t.name === tag.name)) {
      showAlert("提示", "该标签已存在");
      return;
    }
    setTagLibrary([...tagLibrary, tag]);
    setNewTag({ ...newTag, name: '', description: '' });
  };

  const handleDeleteStrategy = (id: string) => {
    showConfirm("确认删除", "确定要删除这个自定义策略吗？", () => {
      setStrategies(prev => prev.filter(s => s.id !== id));
    });
  };

  const toggleStrategyEnabled = (id: string) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, isEnabled: s.isEnabled === false ? true : !s.isEnabled } : s));
  };

  const handleCreateStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStrategy.concept.trim()) {
      showAlert("提示", "核心思想为必填项！");
      return;
    }
    const finalName = newStrategy.name.trim() || `自定义策略 ${strategies.filter(s => s.isCustom).length + 1}`;
    const steps = newStrategy.how.trim()
      ? newStrategy.how.split('\n').map(l => l.trim()).filter(Boolean)
      : [];

    const created: StrategyDefinition = {
      id: `custom-${Date.now()}`,
      num: `自定义`,
      name: finalName,
      concept: newStrategy.concept.trim(),
      reason: newStrategy.reason.trim() || undefined,
      how: steps.length > 0 ? steps : undefined,
      example: newStrategy.example.trim() || undefined,
      tip: newStrategy.tip.trim() || undefined,
      isCustom: true,
      isEnabled: newStrategy.applyImmediately,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/30',
      bgGradient: 'from-indigo-50/20 to-white'
    };

    setStrategies(prev => [...prev, created]);
    setNewStrategy({
      name: '',
      concept: '',
      reason: '',
      how: '',
      example: '',
      tip: '',
      applyImmediately: true
    });
    setIsAddingStrategy(false);
    setExpandedStrategyIds(prev => ({ ...prev, [created.id]: true }));
  };

  const handleDeleteLog = (id: string) => {
    showConfirm("确认删除", "确定要永久删除这条观察记录吗？删除后不可恢复。", () => {
      setLogs(prev => prev.filter(l => l.id !== id));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      if (viewingReportLog?.id === id) {
        setViewingReportLog(null);
      }
    });
  };

  const handleEditLog = (updated: WorkLog) => {
    setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setEditingLog(null);
    if (viewingReportLog?.id === updated.id) {
      setViewingReportLog(updated);
    }
  };

  const handleDeleteTag = (id: string) => {
    showConfirm("确认删除", "确定要删除这个标签吗？", () => {
      setTagLibrary(tagLibrary.filter(t => t.id !== id));
    });
  };

  const renderTagItem = (tag: TagDefinition) => {
    let badgeColor = 'bg-slate-900 text-white';
    let hoverBorderColor = 'hover:border-slate-350';
    if (tag.category === '生理信号标签') {
      badgeColor = 'bg-[#4281a4] text-white';
      hoverBorderColor = 'hover:border-[#bde0f0]';
    } else if (tag.category === '即时行动标签') {
      badgeColor = 'bg-indigo-600 text-white';
      hoverBorderColor = 'hover:border-indigo-200';
    }

    const isExpanded = expandedTagIds.includes(tag.id);

    if (!isExpanded) {
      return (
        <div 
          key={tag.id} 
          onClick={(e) => {
            e.stopPropagation();
            setExpandedTagIds(prev => [...prev, tag.id]);
          }}
          className={`bg-white px-4 py-3 rounded-2xl border border-slate-100 hover:shadow-xs transition-all flex items-center justify-between gap-3 group relative animate-in fade-in duration-200 cursor-pointer ${hoverBorderColor}`}
          title="点击展示卡片详情"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 uppercase tracking-tighter ${badgeColor}`}>
              #{tag.name}
            </span>
            <p className="text-xs text-slate-500 font-bold truncate pr-3 mt-0.5" title={tag.description}>
              {tag.description}
            </p>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTag(tag.id);
            }}
            className="text-slate-300 hover:text-rose-600 transition-colors shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-50"
            title="从标签库中移除"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      );
    }

    // Default Card view
    return (
      <div 
        key={tag.id} 
        onClick={(e) => {
          e.stopPropagation();
          setExpandedTagIds(prev => prev.filter(id => id !== tag.id));
        }}
        className={`bg-white p-6 rounded-[2rem] border border-slate-150 hover:border-slate-300 shadow-md transition-all group relative animate-in fade-in duration-200 cursor-pointer ${hoverBorderColor}`}
        title="点击隐藏详情（恢复紧凑）"
      >
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTag(tag.id);
          }}
          className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50"
          title="从标签库中移除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter ${badgeColor}`}>#{tag.name}</span>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-3 pr-4">{tag.description}</p>
      </div>
    );
  };

  const handleTextChange = (text: string) => {
    setEditingReflectionText(text);
    if (!selectedSubjectId) return;

    const updatedReflections = [...subjectReflections];
    const existingIndex = updatedReflections.findIndex(r => r.subjectId === selectedSubjectId);
    
    if (existingIndex >= 0) {
      updatedReflections[existingIndex] = {
        ...updatedReflections[existingIndex],
        content: text,
        updatedAt: Date.now()
      };
    } else {
      updatedReflections.push({
        id: selectedSubjectId,
        subjectId: selectedSubjectId,
        content: text,
        updatedAt: Date.now(),
        snapshots: []
      });
    }
    setSubjectReflections(updatedReflections);
    localStorage.setItem('work_observation_subject_reflections', JSON.stringify(updatedReflections));
  };

  const handleCreateSnapshot = () => {
    if (!selectedSubjectId) {
      showAlert("提示", "请先选择一个研究对象。");
      return;
    }
    const cleanInput = editingReflectionText;
    if (!cleanInput.trim()) {
      showAlert("提示", "当前备忘内容为空，无法生成备份。");
      return;
    }

    const updatedReflections = [...subjectReflections];
    const existingIndex = updatedReflections.findIndex(r => r.subjectId === selectedSubjectId);
    
    const newSnapshot = {
      timestamp: Date.now(),
      content: cleanInput
    };

    const targetSubject = subjects.find(s => s.id === selectedSubjectId);
    const alias = targetSubject?.alias || '通用随笔';

    if (existingIndex >= 0) {
      const existing = updatedReflections[existingIndex];
      const snapshots = existing.snapshots || [];
      const hasDuplicate = snapshots.length > 0 && snapshots[snapshots.length - 1].content === cleanInput;
      const updatedSnapshots = hasDuplicate ? snapshots : [...snapshots, newSnapshot].slice(-5);

      updatedReflections[existingIndex] = {
        ...existing,
        content: cleanInput,
        updatedAt: Date.now(),
        snapshots: updatedSnapshots
      };
    } else {
      updatedReflections.push({
        id: selectedSubjectId,
        subjectId: selectedSubjectId,
        content: cleanInput,
        updatedAt: Date.now(),
        snapshots: [newSnapshot]
      });
    }
    setSubjectReflections(updatedReflections);
    localStorage.setItem('work_observation_subject_reflections', JSON.stringify(updatedReflections));
    showAlert("备份成功", `已为您成功生成研究个体【${alias}】的随笔备份节点（历史备份至多保存5个）。`);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.alias || !newSubject.role) return;
    const subject: ResearchSubject = { id: crypto.randomUUID(), alias: newSubject.alias, role: newSubject.role, context: newSubject.context, createdAt: Date.now(), status: 'under_study' };
    setSubjects([...subjects, subject]);
    setNewSubject({ alias: '', role: '', context: '' });
    if (!newLog.subjectId) setNewLog(prev => ({ ...prev, subjectId: subject.id }));
    setShowAddSubjectForm(false);
  };

  const handleDeleteSubject = (id: string, alias: string) => {
    showConfirm(
      "确认删除研究对象",
      `确认要删除研究对象“${alias}”吗？关联的日志将保留该化名，但该研究对象本身将被移除。`,
      () => {
        setSubjects(prev => prev.filter(s => s.id !== id));
        if (newLog.subjectId === id) {
          setNewLog(prev => ({ ...prev, subjectId: '' }));
        }
      }
    );
  };

  const handleToggleSubjectStatus = (id: string, alias: string, currentStatus?: 'under_study' | 'completed') => {
    const nextStatus = currentStatus === 'completed' ? 'under_study' : 'completed';
    setSubjects(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: nextStatus };
      }
      return s;
    }));
    
    if (viewingSubjectLogs && viewingSubjectLogs.id === id) {
      setViewingSubjectLogs(prev => prev ? { ...prev, status: nextStatus } : null);
    }

    if (nextStatus === 'completed' && selectedSubjectId === id) {
      setSelectedSubjectId('general_essay');
      const defaultReflection = subjectReflections.find(r => r.subjectId === 'general_essay')?.content || '';
      setEditingReflectionText(defaultReflection);
    }

    const statusStr = nextStatus === 'completed' ? '已标记为【完成研究】' : '已重置为【研究中】';
    showAlert("状态已更新", `研究对象“${alias}”的状态${statusStr}。`);
  };

  const handleRunAnalysis = async () => {
    if (logs.length < 3) { showAlert("无法分析", "请至少记录3篇日志后再进行周期分析。"); return; }
    setIsAnalyzing(true);
    try { 
      const result = await generatePeriodicAnalysis(logs, subjects, subjectReflections); 
      setAnalysisResult(result); 
    } catch (err: any) { 
      console.error("Analysis failed", err); 
      showAlert("分析失败", err.message || "由于未知错误，周期洞察分析失败。请检查您的 API Key 或者是网络配置。");
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const getSubjectAlias = (id: string, log?: WorkLog) => {
    const subj = subjects.find(s => s.id === id);
    if (subj) return subj.alias;
    if (log && log.subjectAlias) return `${log.subjectAlias} (已删除)`;
    // Dynamic scan: find if any log with this subjectId contains cached alias
    const matchingLog = logs.find(l => l.subjectId === id && l.subjectAlias);
    if (matchingLog?.subjectAlias) {
      return `${matchingLog.subjectAlias} (已删除)`;
    }
    return '未知对象';
  };

  const getSubjectRole = (id: string, log?: WorkLog) => {
    const subj = subjects.find(s => s.id === id);
    if (subj) return subj.role;
    if (log && log.subjectRole) return log.subjectRole;
    // Dynamic scan: find if any log with this subjectId contains cached role
    const matchingLog = logs.find(l => l.subjectId === id && l.subjectRole);
    if (matchingLog?.subjectRole) {
      return matchingLog.subjectRole;
    }
    return '';
  };

  const filteredLogs = logs.filter((log) => {
    if (filterSubjectId !== 'all' && log.subjectId !== filterSubjectId) {
      return false;
    }
    if (filterStartDate) {
      const logTime = log.timestamp || (log.date ? new Date(log.date).getTime() : 0);
      const startTime = new Date(filterStartDate + 'T00:00:00').getTime();
      if (logTime < startTime) return false;
    }
    if (filterEndDate) {
      const logTime = log.timestamp || (log.date ? new Date(log.date).getTime() : 0);
      const endTime = new Date(filterEndDate + 'T23:59:59').getTime();
      if (logTime > endTime) return false;
    }
    if (filterKeyword.trim()) {
      const kw = filterKeyword.toLowerCase().trim();
      const searchStr = `${log.fact || ''} ${log.structuredReaction?.survivalRule || ''} ${log.tags?.join(' ') || ''}`.toLowerCase();
      if (!searchStr.includes(kw)) return false;
    }
    return true;
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="h-full w-full flex flex-col md:flex-row text-slate-900 bg-[#F1F2F6] font-sans overflow-hidden relative">
      {/* Mobile Sticky Header */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 text-slate-800 px-5 py-4 sticky top-0 z-30 shadow-xs h-16 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#4281a4] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#4281a4]/20">
            <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.7 19h14.6a1 1 0 0 0 .9-1.5L14 7V3h-4v4L4.8 17.5a1 1 0 0 0 .9 1.5z" />
              <path d="M9 3h6" />
              <path d="M7 14.5h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none font-sans">{t('实验室')}</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Workplace Research</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(prev => !prev)} 
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="md:hidden fixed inset-0 bg-transparent z-[100] transition-opacity duration-300 cursor-pointer"
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`
        bg-slate-50 border-r border-slate-200 text-slate-700 flex flex-col gap-8 shadow-sm transition-all duration-300 shrink-0
        /* Desktop styles */
        md:sticky md:top-0 md:h-screen md:translate-x-0 md:z-20
        ${isDesktopCollapsed ? 'md:w-16 md:p-3' : 'md:w-56 md:p-5'}
        /* Mobile drawer styles */
        fixed inset-y-0 left-0 w-56 p-5 z-[101] transform h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Collapse Button for desktop with clean placement */}
        <button 
          onClick={() => setIsDesktopCollapsed(prev => !prev)} 
          className="hidden md:flex absolute top-6 -right-3.5 w-7 h-7 bg-[#4281a4] hover:bg-[#32698a] text-white border-2 border-slate-50 rounded-full items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-all z-50 focus:outline-none"
          title={isDesktopCollapsed ? t("展开边栏") : t("收起边栏")}
        >
          <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isDesktopCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Tab Buttons */}
        <div className="flex flex-col gap-1">
          <button 
            type="button"
            onClick={onBack} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDesktopCollapsed ? 'md:justify-center md:px-0' : ''} text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-dashed border-slate-350/80 mb-3`}
            title={t('退出工具')}
          >
            <svg className="w-5 h-5 shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {!isDesktopCollapsed && <span className="animate-in fade-in duration-300 font-bold text-sm text-slate-655">{t('退出工具')}</span>}
          </button>




          <button 
            onClick={() => { setActiveTab('analysis'); setCameFromLogs(false); setIsMobileMenuOpen(false); }} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDesktopCollapsed ? 'md:justify-center md:px-0' : ''} ${activeTab === 'analysis' ? 'bg-[#4281a4] text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
            title={t('周期洞察')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!isDesktopCollapsed && <span className="animate-in fade-in duration-300 font-bold text-sm">{t('周期洞察')}</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('tags_library'); setCameFromLogs(false); setIsMobileMenuOpen(false); }} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDesktopCollapsed ? 'md:justify-center md:px-0' : ''} ${activeTab === 'tags_library' ? 'bg-[#4281a4] text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
            title={t('标签库')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {!isDesktopCollapsed && <span className="animate-in fade-in duration-300 font-bold text-sm">{t('标签库')}</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('strategies_library'); setCameFromLogs(false); setIsMobileMenuOpen(false); }} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDesktopCollapsed ? 'md:justify-center md:px-0' : ''} ${activeTab === 'strategies_library' ? 'bg-[#4281a4] text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
            title={t('策略库')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {!isDesktopCollapsed && <span className="animate-in fade-in duration-300 font-bold text-sm">{t('策略库')}</span>}
          </button>
        </div>

        {/* Code of Conduct / Rules */}
        {!isDesktopCollapsed ? (
          <div className="mt-2 p-5 bg-slate-100/60 rounded-2xl border border-slate-200 animate-in fade-in duration-300">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{t('研究员行为守则')}</p>
            <ul className="text-[11px] text-slate-600 space-y-4">
              <li className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#4281a4] font-black">01</span>
                  <span className="font-bold text-slate-800 text-[11px]">{t('观察者不审判')}</span>
                </div>
                <p className="text-slate-500 pl-4 leading-relaxed text-[10px]">{t('记录事实而非评判对错，你的目标不是给谁定罪。')}</p>
              </li>
              <li className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#4281a4] font-black">02</span>
                  <span className="font-bold text-slate-800 text-[11px]">{t('解构即释能')}</span>
                </div>
                <p className="text-slate-500 pl-4 leading-relaxed text-[10px]">{t('看穿现象的运行逻辑，压迫便自行松绑。')}</p>
              </li>
              <li className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#4281a4] font-black">03</span>
                  <span className="font-bold text-slate-800 text-[11px]">{t('研究是为了行动')}</span>
                </div>
                <p className="text-slate-500 pl-4 leading-relaxed text-[10px]">{t('日志的终点不是情绪宣泄，而是提炼出属于你的生存法则。')}</p>
              </li>
            </ul>
          </div>
        ) : (
          <div className="mt-2 flex justify-center group relative">
            <div className="w-10 h-10 bg-slate-200/50 hover:bg-slate-200 text-[#4281a4] rounded-full flex items-center justify-center font-black cursor-pointer shadow-inner hover:scale-105 transition-all">
              <svg className="w-5 h-5 text-[#4281a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            {/* Elegant Hover Code of Conduct tooltip */}
            <div className="absolute bottom-12 left-2 w-72 bg-white border border-slate-200 p-5 rounded-2xl shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[60]">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">{t('研究员行为守则')}</p>
              <ul className="text-[11px] text-slate-600 space-y-3 text-left">
                <li className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4281a4] font-black">01</span>
                    <span className="font-bold text-slate-800">{t('观察者不审判')}</span>
                  </div>
                  <p className="text-slate-500 pl-4 leading-relaxed text-[10px]">{t('记录事实而非评判对错，你的目标不是给谁定罪。')}</p>
                </li>
                <li className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4281a4] font-black">02</span>
                    <span className="font-bold text-slate-800">{t('解构即释能')}</span>
                  </div>
                  <p className="text-slate-500 pl-4 leading-relaxed text-[10px]">{t('看穿现象的运行逻辑，压迫便自行松绑。')}</p>
                </li>
                <li className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4281a4] font-black">03</span>
                    <span className="font-bold text-slate-800">{t('研究是为了行动')}</span>
                  </div>
                  <p className="text-slate-500 pl-4 leading-relaxed text-[10px]">{t('日志的终点不是情绪宣泄，而是提炼出属于你的生存法则。')}</p>
                </li>
              </ul>
            </div>
          </div>
        )}
      </nav>

      <div 
        onClick={() => { if (isMobileMenuOpen) setIsMobileMenuOpen(false); }}
        className="flex-1 flex flex-col min-w-0 h-full min-h-0 overflow-hidden relative cursor-default"
      >
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-10 pb-28">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'subjects' && (
            viewingSubjectLogs ? (
              <div className="space-y-6 animate-in fade-in duration-350">
                {/* Back button to return */}
                <div className="flex items-center justify-between pb-2">
                  <button
                    type="button"
                    onClick={() => setViewingSubjectLogs(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-black transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回对象管理列表
                  </button>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
                  {/* Research subject header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#4281a4] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-[#4281a4]/10 shrink-0">
                        {viewingSubjectLogs.alias ? viewingSubjectLogs.alias[0] : 'O'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-xl text-slate-900 truncate max-w-[150px] sm:max-w-xs">{viewingSubjectLogs.alias}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-tight">
                            {viewingSubjectLogs.role}
                          </span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-tight ${
                            viewingSubjectLogs.status === 'completed'
                              ? 'bg-slate-200 text-slate-655'
                              : 'bg-emerald-50 text-emerald-700 animate-pulse'
                          }`}>
                            {viewingSubjectLogs.status === 'completed' ? '已完成研究' : '观察研究中'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1" title={viewingSubjectLogs.context}>
                          {viewingSubjectLogs.context || "（未录入背景脉络）"}
                        </p>
                      </div>
                    </div>
                    {/* Add Logs and Edit Subject block */}
                    <div className="flex items-center gap-2.5 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubject(viewingSubjectLogs);
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        编辑此对象
                      </button>
                      <button
                        type="button"
                        disabled={viewingSubjectLogs.status === 'completed'}
                        onClick={() => {
                          if (viewingSubjectLogs.status === 'completed') return;
                          setActiveTab('logs');
                          setNewLog(prev => ({ ...prev, subjectId: viewingSubjectLogs.id }));
                          setViewingSubjectLogs(null);
                        }}
                        className={`px-5 py-2.5 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shrink-0 ${
                          viewingSubjectLogs.status === 'completed'
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-200'
                            : 'bg-[#4281a4] hover:bg-[#32698a] shadow-lg shadow-[#4281a4]/15'
                        }`}
                        title={viewingSubjectLogs.status === 'completed' ? '研究已完成，无法添加新日志' : '添加报告日志'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        添加报告日志
                      </button>
                    </div>
                  </div>

                  {/* Research Logs List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-955 pb-1">观察日志</h4>
                    {logs.filter(l => l.subjectId === viewingSubjectLogs.id).length === 0 ? (
                      <div className="py-16 text-center text-slate-400 italic font-medium flex flex-col items-center justify-center gap-3 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-150">
                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>针对此观察目标尚未录入任何日志。</span>
                         <button
                          type="button"
                          disabled={viewingSubjectLogs.status === 'completed'}
                          onClick={() => {
                            if (viewingSubjectLogs.status === 'completed') return;
                            setActiveTab('logs');
                            setNewLog(prev => ({ ...prev, subjectId: viewingSubjectLogs.id }));
                            setViewingSubjectLogs(null);
                          }}
                          className={`mt-2 px-5 py-2.5 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 ${
                            viewingSubjectLogs.status === 'completed'
                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-250'
                              : 'bg-[#4281a4] hover:bg-[#32698a] shadow-md'
                          }`}
                          title={viewingSubjectLogs.status === 'completed' ? '研究已完成，无法添加新日志' : '去写观察日志'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          去写观察日志
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-150 border border-slate-200 overflow-hidden rounded-[2rem]">
                        {logs.filter(l => l.subjectId === viewingSubjectLogs.id).map((log, idx) => (
                          <div 
                            key={log.id} 
                            onClick={() => setViewingReportLog(log)} 
                            className={`p-4 md:p-5 flex flex-row items-center justify-between gap-4 hover:bg-[#4281a4]/5 cursor-pointer transition-all duration-200 group animate-in fade-in duration-300 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <svg className="w-4 h-4 text-[#4281a4] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <div className="min-w-0">
                                <span className="text-slate-800 font-mono font-bold text-sm">
                                  {formatLogDateTime(log)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <span className="text-xs font-black text-[#4281a4] opacity-0 group-hover:opacity-100 transition-opacity">
                                点击查阅详情 →
                              </span>
                              <div onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="text-slate-300 hover:text-rose-600 p-2 rounded-xl transition-all hover:bg-rose-50 active:scale-95"
                                  title="删除报告"
                                  aria-label="删除报告"
                                >
                                  <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in duration-500">
                <header className="border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('研究对象管理')}</h2>
                  </div>
                </header>

                {/* Already Created Research Subjects List (Top) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#4281a4] rounded-full" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('已创建的研究对象')}</h3>
                  </div>

                  {subjects.length === 0 ? (
                    <div className="py-12 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 italic">
                      <p>{t('尚未建立任何观察研究对象')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {subjects.map(s => (
                        <div 
                          key={s.id} 
                          onClick={() => setViewingSubjectLogs(s)}
                          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-[#4281a4] hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold group-hover:bg-[#eef5f8] group-hover:text-[#4281a4] transition-colors shrink-0">
                                  {s.alias ? s.alias[0] : 'O'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-base text-slate-900 group-hover:text-[#32698a] transition-colors truncate">
                                      {s.alias}
                                    </h4>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tight ${
                                      s.status === 'completed'
                                        ? 'bg-slate-100 text-slate-500 border border-slate-250' 
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse'
                                    }`}>
                                      {s.status === 'completed' ? t('已完成') : t('研究中')}
                                    </span>
                                  </div>
                                  <span className="inline-block text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                                    {s.role}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubject(s)}
                                  className="text-slate-300 hover:text-[#4281a4] transition-colors p-2 rounded-xl hover:bg-slate-50"
                                  title={t("编辑此研究对象")}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(s.id, s.alias)}
                                  className="text-slate-300 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50"
                                  title={t("删除此研究对象")}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[2rem]">
                              {s.context || t('暂无详细背景记录。')}
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-bold text-[#4281a4] bg-[#eef5f8] px-2.5 py-1 rounded-lg border border-[#daedf5]/50 flex items-center gap-1 group-hover:bg-[#4281a4] group-hover:text-white group-hover:border-transparent transition-all">
                              {t('点击查看')} {logs.filter(l => l.subjectId === s.id).length} {t('篇日志')} →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Add Button displayed daily */}
                  {!showAddSubjectForm && (
                    <div className="flex justify-start pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddSubjectForm(true)}
                        className="bg-slate-900 hover:bg-[#4281a4] text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-[#4281a4]/15 transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {t('新增研究对象')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Add New Research Subject Form (Conditional) */}
                {showAddSubjectForm && (
                  <div className="pt-8 border-t border-slate-200 space-y-6 animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-[#4281a4] rounded-full" />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('定制并录入新的观察研究对象')}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddSubjectForm(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                      >
                        {t('收起')}
                      </button>
                    </div>

                    <form onSubmit={handleAddSubject} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 max-w-2xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">{t('化名 / 对象代号')} <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            value={newSubject.alias} 
                            onChange={e => setNewSubject({...newSubject, alias: e.target.value})} 
                            placeholder={t("例如：对象A、神秘上司")} 
                            className="w-full px-4 py-3 rounded-xl bg-[#F1F2F6] border border-slate-200 text-sm focus:bg-white focus:border-[#4281a4] outline-none transition-all font-bold" 
                            required 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">{t('角色 / 岗位职级')} <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            value={newSubject.role} 
                            onChange={e => setNewSubject({...newSubject, role: e.target.value})} 
                            placeholder={t("例如：直属领导、产品经理、合作方")} 
                            className="w-full px-4 py-3 rounded-xl bg-[#F1F2F6] border border-slate-200 text-sm focus:bg-white focus:border-[#4281a4] outline-none transition-all font-bold" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">{t('背景脉络与互动简述')}</label>
                        <textarea 
                          value={newSubject.context} 
                          onChange={e => setNewSubject({...newSubject, context: e.target.value})} 
                          placeholder={t("补充其背书背景，或在职场中对该对象的观察脉络...")} 
                          className="w-full px-4 py-3 rounded-xl bg-[#F1F2F6] border border-slate-200 text-xs h-28 resize-none focus:bg-white focus:border-[#4281a4] outline-none transition-all font-semibold text-slate-800" 
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          type="submit" 
                          className="bg-slate-900 hover:bg-[#4281a4] text-white px-8 py-3.5 rounded-xl font-bold font-sans text-sm hover:shadow-lg hover:shadow-[#4281a4]/10 transition-all cursor-pointer"
                        >
                          {t('录入并开始观察研究')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowAddSubjectForm(false)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3.5 rounded-xl font-bold font-sans text-sm transition-all cursor-pointer"
                        >
                          {t('取消')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === 'monthly_reflections' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Header block with elegant typography and subtext */}
              <header className="border-b border-slate-200 pb-5">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('研究员随笔')}</h2>
                <p className="text-slate-500 mt-2 font-medium">
                  {t('在数据之外，安放你的思考')}
                </p>
              </header>

              {/* Subject Selection Dropdown inline row */}
              <div className="flex flex-wrap items-center gap-2.5 bg-white border border-slate-150 py-2 px-3 rounded-2xl shadow-xs w-full sm:max-w-max">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4281a4] animate-pulse shrink-0" />
                  <p className="text-xs font-black text-slate-700 tracking-wide uppercase">{t('选择观察样本：')}</p>
                </div>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    if (e.target.value) {
                      selectSubject(e.target.value);
                    }
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold font-sans rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-[#4281a4] transition-all cursor-pointer truncate w-full sm:w-auto max-w-full sm:max-w-[240px]"
                >
                  <option value="" disabled>{t('-- 请选择一个观察样本以开始书写 --')}</option>
                  {[{ id: 'general_essay', alias: '通用随笔', role: '' }, ...subjects.filter(s => s.status !== 'completed')].map((subj) => {
                    const found = subjectReflections.find(r => r.subjectId === subj.id);
                    const wordCount = getReflectionWordCount(found?.content || '');
                    return (
                      <option key={subj.id} value={subj.id}>
                        {subj.id === 'general_essay' ? t('通用随笔') : `${subj.alias} (${subj.role})`}{wordCount > 0 ? ` · [${t('已写')} ${wordCount} ${t('字')}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Main functional container */}
              {selectedSubjectId ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Left Side: Continuous Writing Sheet (White Paper Canvas) */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-[2rem] pt-12 px-8 pb-8 border border-slate-150 shadow-sm space-y-4 relative overflow-hidden min-h-[600px] flex flex-col">
                      {/* Top decoration ribbon simulating continuous notebook paper tear bar */}
                      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#4281a4] to-cyan-600" />
                      
                      {/* Compact absolute word counter */}
                      <div className="absolute top-4 right-6 text-[10px] font-mono font-extrabold text-slate-400 select-none bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-100">
                        {getReflectionWordCount(editingReflectionText)} {t('字')}
                      </div>

                      {/* Continuous Text Area */}
                      <div className="flex-1 flex flex-col relative font-sans text-base">
                        <textarea
                          ref={textareaRef}
                          value={editingReflectionText}
                          onChange={(e) => handleTextChange(e.target.value)}
                          className="w-full flex-1 text-slate-800 focus:outline-none resize-none font-sans font-medium select-text scroll-smooth min-h-[500px]"
                          placeholder={t("在此处记下您的随笔，随写随存，可以随时在此删改...")}
                          style={{
                            lineHeight: '2.2rem',
                            paddingTop: '0.2rem',
                            paddingBottom: '0.2rem',
                            backgroundImage: 'linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0) 95%, #f1f5f9 95%, #f1f5f9 100%)',
                            backgroundSize: '100% 2.2rem',
                            backgroundAttachment: 'local',
                          }}
                        />
                      </div>

                      {/* Bottom action controls */}
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                          {t('实时自动保存中 已写')} {getReflectionWordCount(editingReflectionText)} {t('字')}
                        </span>
                        <button
                          onClick={handleCreateSnapshot}
                          className="bg-[#4281a4] hover:bg-[#32698a] text-white px-6 py-2.5 rounded-xl font-bold font-sans text-xs hover:shadow-lg hover:shadow-[#4281a4]/15 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          {t('生成随笔备份节点')}
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Right Side: Backups Controls Sidebar */}
                  <div className="space-y-4 lg:col-span-1">
                    <div className="bg-slate-900 text-slate-100 rounded-[2rem] p-6 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden h-full">
                      {/* Section header */}
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                        <svg className="w-5 h-5 text-[#4281a4]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h3 className="text-sm font-black font-sans text-white tracking-widest">{t('随笔备份')}</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Continuum Backups</p>
                        </div>
                      </div>

                      {/* Snapshots info & manual save */}
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        {t('您可以随时手动生成当前纸本的临时备份，并在大文本遭到误清空或误盖写时，一键安全回位。')}
                      </p>

                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={handleCreateSnapshot}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                          >
                            💾 {t('生成当前存档点')}
                          </button>
                        </div>

                        {/* Backups select list dropdown */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-black block">{t('恢复历史存档节点：')}</label>
                          {(() => {
                            const found = subjectReflections.find(r => r.subjectId === selectedSubjectId);
                            const currentSnapshots = found?.snapshots || [];
                            return (
                              <div>
                                {currentSnapshots.length > 0 ? (
                                  <select
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val) {
                                        const snap = currentSnapshots.find(s => String(s.timestamp) === val);
                                        if (snap) {
                                          showConfirm(
                                            t("确定覆盖并历史回滚？"),
                                            `${t('您选择恢复到')} [${new Date(snap.timestamp).toLocaleString()}] ${t('时的历史版本')} (共 ${getReflectionWordCount(snap.content)} ${t('字')})。\n${t('这会覆盖目前编辑框中的内容，确定切换吗？')}`,
                                            () => {
                                              handleTextChange(snap.content);
                                              showAlert(t("恢复成功"), t("历史备份已成功恢复并自动保存。"));
                                            }
                                          );
                                        }
                                        e.target.value = "";
                                      }
                                    }}
                                    className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl px-3 py-2.5 text-xs outline-none cursor-pointer text-ellipsis overflow-hidden font-bold"
                                  >
                                    <option value="">⚙️ {t('按此安全选择回退节点...')}</option>
                                    {[...currentSnapshots].sort((a, b) => b.timestamp - a.timestamp).map((snap, sIdx) => (
                                      <option key={snap.timestamp} value={snap.timestamp}>
                                        {t('备份点')} #{currentSnapshots.length - sIdx} ({new Date(snap.timestamp).toLocaleString().slice(5, 16)} · {getReflectionWordCount(snap.content)}{t('字')})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="text-[10px] text-slate-500 italic py-2 text-center border border-dashed border-slate-800 rounded-xl">
                                    {t('暂无本研究员随笔档案的节点备份')}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Manage archival points with delete options */}
                        {(() => {
                          const found = subjectReflections.find(r => r.subjectId === selectedSubjectId);
                          const currentSnapshots = found?.snapshots || [];
                          if (currentSnapshots.length === 0) return null;
                          return (
                            <div className="space-y-2 pt-3 border-t border-slate-800/60 mt-1.5 animate-in fade-in duration-300">
                              <label className="text-[10px] text-slate-400 font-black block">{t('管理/清理历史存档点：')}</label>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {[...currentSnapshots].sort((a, b) => b.timestamp - a.timestamp).map((snap, sIdx) => {
                                  const idxNum = currentSnapshots.length - sIdx;
                                  return (
                                    <div key={snap.timestamp} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-slate-200">{t('备份点')} #{idxNum}</p>
                                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">{new Date(snap.timestamp).toLocaleString().slice(5, 16)} · {getReflectionWordCount(snap.content)}{t('字')}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          showConfirm(
                                            t("确定删除此存档点吗？"),
                                            `${t('您正在删除')} [${new Date(snap.timestamp).toLocaleString()}] ${t('的历史版本')} (共 ${getReflectionWordCount(snap.content)} ${t('字')})，${t('此操作不可撤销。')}`,
                                            () => {
                                              const updatedReflections = [...subjectReflections];
                                              const existingIdx = updatedReflections.findIndex(r => r.subjectId === selectedSubjectId);
                                              if (existingIdx >= 0) {
                                                const existing = updatedReflections[existingIdx];
                                                const snapshots = existing.snapshots || [];
                                                const updatedSnapshots = snapshots.filter(s => s.timestamp !== snap.timestamp);
                                                updatedReflections[existingIdx] = {
                                                  ...existing,
                                                  snapshots: updatedSnapshots
                                                };
                                                setSubjectReflections(updatedReflections);
                                                localStorage.setItem('work_observation_subject_reflections', JSON.stringify(updatedReflections));
                                                showAlert(t("删除成功"), `${t('备份点')} #${idxNum} ${t('已安全移除。')}`);
                                              }
                                            }
                                          );
                                        }}
                                        title={t("删除此存档点")}
                                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-full bg-[#4281a4]/10 flex items-center justify-center text-[#4281a4] mx-auto text-2xl">📝</div>
                  <h3 className="text-lg font-black text-slate-800">{t('等待开启书写')}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {t('请选择上方需要追踪记录解构随笔的研究对象个体，本系统将为你自动调阅并智能开辟整块连贯白稿区。')}
                  </p>
                </div>
              )}

            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              {editingLogId ? (
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
                  <button 
                    onClick={() => {
                      if (preEditingReportLog) {
                        setViewingReportLog(preEditingReportLog);
                      }
                      setEditingLogId(null);
                      setNewLog({ 
                        fact: '', 
                        subjectId: subjects[0]?.id || '', 
                        selectedTags: [],
                        reaction: { emotions: [{ name: '', score: 5 }], physicalSignals: [], immediateThoughts: [], actionTaken: [], turningPoint: '', appliedStrategies: [], finalMindsetLabel: '', shiftEvaluation: '中性观察', survivalRule: '', customNotes: '' } 
                      });
                      setCurrentStep(1);
                      setLogsSubTab('history');
                      setPreEditingReportLog(null);
                    }}
                    className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('返回')}
                  </button>
                  <p className="font-extrabold text-[#4281a4] text-sm">{t('编辑观察日志')}</p>
                  <div className="w-16" />
                </div>
              ) : (
                <header className="border-b border-slate-200 pb-3 flex items-center justify-center gap-4">
                  <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-fit items-center gap-1 shadow-inner shrink-0 leading-none mx-auto">
                    <button 
                      onClick={() => setLogsSubTab('new')} 
                      className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${logsSubTab === 'new' ? 'bg-[#4281a4] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                      {t('新记录')}
                    </button>
                    <button 
                      onClick={() => setLogsSubTab('history')} 
                      className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${logsSubTab === 'history' ? 'bg-[#4281a4] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      {t('观察日志')}
                    </button>
                  </div>
                </header>
              )}

              {logsSubTab === 'new' && (
                subjects.length === 0 ? (
                  <div className="bg-[#eef5f8] border-2 border-dashed border-[#bde0f0] p-12 rounded-[3rem] text-center space-y-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <svg className="w-8 h-8 text-[#4281a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <div className="space-y-2">
                       <p className="font-black text-[#32698a] text-xl">{t('实验室准备中...')}</p>
                      <p className="text-[#4281a4] text-sm">{t('开始记录前，请先在“研究对象”菜单中定义一个你正在观察的目标人物。')}</p>
                    </div>
                    <button onClick={() => setActiveTab('subjects')} className="bg-[#4281a4] text-white px-10 py-4 rounded-2xl font-black hover:bg-[#32698a] shadow-xl shadow-[#4281a4]/20 transition-all">{t('立即去创建研究对象')}</button>
                  </div>
                ) : (
                  <div className="space-y-4 pb-32">
                    {editingLogId && (
                      <div className="bg-[#eef5f8] border border-[#daedf5] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm animate-in fade-in duration-300">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">✍️</span>
                          <div>
                            <p className="text-slate-800 font-black text-sm">{t('正在二次编辑这篇观察日志')}</p>
                            <p className="text-[#32698a] text-xs mt-0.5 font-bold">{t('时间')}: {logs.find(l => l.id === editingLogId)?.date || 'unknown'} | {t('研究对象')}: {getSubjectAlias(logs.find(l => l.id === editingLogId)?.subjectId || '', logs.find(l => l.id === editingLogId))}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDirectSaveEdit}
                          className="bg-[#4281a4] hover:bg-[#32698a] text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md shadow-[#4281a4]/15 shrink-0"
                        >
                          {t('立即保存')}
                        </button>
                      </div>
                    )}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 py-6 px-8">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mb-6 px-4">
                      {[1, 2, 3, 4].map((step) => (
                        <React.Fragment key={step}>
                          <div className={`flex items-center justify-center w-10 h-10 rounded-2xl font-black transition-all ${currentStep === step ? 'bg-[#4281a4] text-white scale-110 shadow-lg' : currentStep > step ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {step}
                          </div>
                          {step < 4 && <div className={`flex-1 h-0.5 mx-4 rounded-full transition-all ${currentStep > step ? 'bg-slate-900' : 'bg-slate-100'}`} />}
                        </React.Fragment>
                      ))}
                    </div>

                    <form onSubmit={handleSubmitLog} className="space-y-12">
                      {/* Step 1: Fact & Behavioral Tagging */}
                      {currentStep === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">01. 事实记录与行为分类</h3>
                          </div>
                          <div className="space-y-6">
                            <div className="space-y-2 max-w-md">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">选择观察研究对象</label>
                              <div className="flex gap-3">
                                <select
                                  value={newLog.subjectId}
                                  onChange={e => setNewLog(prev => ({ ...prev, subjectId: e.target.value }))}
                                  className="flex-1 min-w-0 bg-[#F1F2F6] border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#4281a4] truncate"
                                >
                                  {newLog.subjectId && !subjects.some(s => s.id === newLog.subjectId) && (
                                    <option value={newLog.subjectId}>
                                      {getSubjectAlias(newLog.subjectId)}（如有需要请重新关联）
                                    </option>
                                  )}
                                  {subjects.filter(s => s.status !== 'completed' || s.id === newLog.subjectId).map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.alias} ({s.role}){s.status === 'completed' ? ' [已完成研究]' : ''}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('subjects')}
                                  className="px-4 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all flex items-center justify-center whitespace-nowrap"
                                >
                                  去管理
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 col-span-full">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">观察事实</label>
                                <span className="text-[10px] text-slate-400 font-extrabold font-mono">{(newLog.fact || '').length} 字</span>
                              </div>
                              <textarea
                                value={newLog.fact}
                                onChange={e => setNewLog(prev => ({ ...prev, fact: e.target.value }))}
                                placeholder="客观描述发生了什么（时间、地点、当事人言行、客观结果等），避免带有主观情绪词汇..."
                                className="w-full min-h-[160px] h-44 bg-[#F1F2F6] border border-slate-200 rounded-2xl px-5 py-4 text-xs font-medium leading-relaxed outline-none focus:ring-2 focus:ring-[#4281a4] resize-y"
                              />
                            </div>
                          </div>

                          {/* Interactive Tag Selector */}
                          <div className="space-y-4 pt-6 border-t border-slate-50">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">归类事件属性</label>
                              <button type="button" onClick={() => { setActiveTab('tags_library'); setCameFromLogs(true); }} className="text-[10px] font-black text-[#4281a4] bg-[#eef5f8] px-3 py-1 rounded-full hover:bg-[#daedf5] transition-colors flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                去库中自定义标签
                              </button>
                            </div>
                            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {EVENT_PROPERTY_CATEGORIES.map(category => {
                                const categoryTags = tagLibrary.filter(t => t.category === category);
                                if (categoryTags.length === 0) return null;
                                return (
                                  <div key={category} className="space-y-2">
                                    <h5 className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{category}</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {categoryTags.map(tag => (
                                        <button
                                          key={tag.id}
                                          type="button"
                                          onClick={() => toggleTagSelection(tag.name)}
                                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                                            newLog.selectedTags.includes(tag.name)
                                              ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                                              : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                          }`}
                                          title={tag.description}
                                        >
                                          #{tag.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Immediate Reaction */}
                      {currentStep === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">02. 第一时间反应</h3>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">即时感受 (1-10)</h4>
                              <div className="bg-[#F1F2F6] p-4 rounded-2xl border border-slate-200/50 text-[11px] space-y-2 text-slate-600">
                                <p className="font-bold text-slate-800 border-b border-slate-200/50 pb-1 mb-2">打分定义说明：</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                  <p><span className="font-black text-slate-900">0</span> - 完全无感：完全没有这种感觉。</p>
                                  <p><span className="font-black text-slate-900">1-3</span> - 轻微：能感觉到一点，不强烈。</p>
                                  <p><span className="font-black text-slate-900">4-6</span> - 中等：清晰感受到，占用注意力。</p>
                                  <p><span className="font-black text-slate-900">7-9</span> - 强烈：很难忽视，影响思考行为。</p>
                                  <p><span className="font-black text-slate-900">10</span> - 极端：达到承受顶峰，无法处理他事。</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {newLog.reaction.emotions.length === 0 ? (
                                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 text-xs italic">
                                  暂无情绪记录。请点击下方按钮添加。
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-4">
                                  {newLog.reaction.emotions.map((emotion, idx) => {
                                    const availableOptions = EMOTION_OPTIONS.filter(
                                      opt => !newLog.reaction.emotions.some((e, i) => i !== idx && e.name === opt)
                                    );
                                    
                                    return (
                                      <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-2">
                                            <select
                                              value={emotion.name}
                                              onChange={(e) => {
                                                const newEmotions = [...newLog.reaction.emotions];
                                                newEmotions[idx] = { ...newEmotions[idx], name: e.target.value };
                                                setNewLog(prev => ({
                                                  ...prev,
                                                  reaction: { ...prev.reaction, emotions: newEmotions }
                                                }));
                                              }}
                                              className="bg-[#F1F2F6] hover:bg-slate-200 border-none rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 outline-none cursor-pointer transition-colors focus:ring-1 focus:ring-[#4281a4]"
                                            >
                                              {emotion.name === '' && (
                                                <option value="">-- 请选择情绪 --</option>
                                              )}
                                              {!availableOptions.includes(emotion.name) && emotion.name !== '' && (
                                                <option value={emotion.name}>{emotion.name}</option>
                                              )}
                                              {availableOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-[#4281a4] bg-[#eef5f8] px-3 py-1 rounded-full">{emotion.score}</span>
                                            <button 
                                              type="button" 
                                              onClick={() => {
                                                setNewLog(prev => ({
                                                  ...prev,
                                                  reaction: {
                                                    ...prev.reaction,
                                                    emotions: prev.reaction.emotions.filter((_, i) => i !== idx)
                                                  }
                                                }));
                                              }}
                                              className="text-slate-300 hover:text-red-500 transition-colors focus:outline-none"
                                              title="删除此项"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-1">
                                          <input 
                                            type="range" 
                                            min="0" 
                                            max="10" 
                                            step="1" 
                                            value={emotion.score} 
                                            onChange={(e) => {
                                              const newEmotions = [...newLog.reaction.emotions];
                                              newEmotions[idx] = { ...newEmotions[idx], score: parseInt(e.target.value) };
                                              setNewLog(prev => ({
                                                ...prev,
                                                reaction: { ...prev.reaction, emotions: newEmotions }
                                              }));
                                            }}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#4281a4]"
                                          />
                                          <div className="flex justify-between text-[8px] font-black text-slate-300 px-1">
                                            <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewLog(prev => {
                                      return {
                                        ...prev,
                                        reaction: {
                                          ...prev.reaction,
                                          emotions: [...prev.reaction.emotions, { name: '', score: 5 }]
                                        }
                                      };
                                    });
                                  }}
                                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl hover:border-[#4281a4] hover:text-[#4281a4] text-slate-400 hover:bg-[#eef5f8]/30 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                  </svg>
                                  增加情绪打分项
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-8 pt-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">生理信号记录</h4>
                                <button type="button" onClick={() => { setActiveTab('tags_library'); setCameFromLogs(true); }} className="text-[10px] font-black text-[#4281a4] bg-[#eef5f8] px-3 py-1 rounded-full hover:bg-[#daedf5] transition-colors flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                  去库中自定义标签
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {physicalOptions.map(val => (
                                  <button 
                                    key={val} 
                                    type="button" 
                                    onClick={() => toggleSelection('physicalSignals', val)} 
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${newLog.reaction.physicalSignals.includes(val) ? 'bg-[#4281a4] text-white border-[#4281a4] shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-[#9ccfe6]'}`}
                                  >
                                    {val}
                                  </button>
                                ))}
                                {physicalOptions.length === 0 && (
                                  <p className="text-xs text-slate-400 italic">请在标签库中添加“生理信号标签”</p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">即时行动</h4>
                                <button type="button" onClick={() => { setActiveTab('tags_library'); setCameFromLogs(true); }} className="text-[10px] font-black text-[#4281a4] bg-[#eef5f8] px-3 py-1 rounded-full hover:bg-[#daedf5] transition-colors flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                  去库中自定义标签
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {actionOptions.map(val => {
                                  const isSelected = Array.isArray(newLog.reaction.actionTaken)
                                    ? newLog.reaction.actionTaken.includes(val)
                                    : (newLog.reaction.actionTaken === val);
                                  return (
                                    <button 
                                      key={val} 
                                      type="button" 
                                      onClick={() => {
                                        setNewLog(prev => {
                                          const current = Array.isArray(prev.reaction.actionTaken) 
                                            ? prev.reaction.actionTaken 
                                            : (prev.reaction.actionTaken ? [prev.reaction.actionTaken] : []);
                                          const next = current.includes(val)
                                            ? current.filter(i => i !== val)
                                            : [...current, val];
                                          return { ...prev, reaction: { ...prev.reaction, actionTaken: next } };
                                        });
                                      }} 
                                      className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${isSelected ? 'bg-[#4281a4] text-white border-[#4281a4] shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-[#9ccfe6]'}`}
                                    >
                                      {val}
                                    </button>
                                  );
                                })}
                                {actionOptions.length === 0 && (
                                  <p className="text-xs text-slate-400 italic">请在标签库中添加“即时行动标签”</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Evolution Path */}
                      {currentStep === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">03. 认知催化与演变</h3>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">演变转折点 (Turning Point)</h4>
                            <textarea value={newLog.reaction.turningPoint} onChange={e => setNewLog(prev => ({ ...prev, reaction: { ...prev.reaction, turningPoint: e.target.value } }))} placeholder="我是如何从最初反应走到最终状态的？哪一个念头的转变让我解脱或冷静了？..." className="w-full min-h-[160px] p-6 rounded-3xl bg-[#F1F2F6] border border-slate-200 text-sm italic font-medium leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">运用的深度解构策略</h4>
                              <button type="button" onClick={() => { setActiveTab('strategies_library'); setCameFromLogs(true); }} className="text-[10px] font-black text-[#4281a4] bg-[#eef5f8] px-3 py-1 rounded-full hover:bg-[#daedf5] transition-colors flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                了解及自定义
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {strategies
                                .filter(s => s.isEnabled !== false)
                                .map(s => {
                                  const rawName = s.name.startsWith('#') ? s.name.substring(1) : s.name;
                                  const val = `#${rawName}`;
                                  return (
                                    <button 
                                      key={s.id} 
                                      type="button" 
                                      onClick={() => toggleSelection('appliedStrategies', val)} 
                                      className={`px-5 py-3 rounded-2xl text-[11px] font-black border transition-all ${newLog.reaction.appliedStrategies.includes(val) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-300'}`}
                                    >
                                      {val}
                                    </button>
                                  );
                                })}
                              {strategies.filter(s => s.isEnabled !== false).length === 0 && (
                                <p className="text-xs text-slate-400 font-medium italic">（暂无在当前流程中被选用的策略，请在库中启用策略或添加新策略）</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Final State & Evaluation */}
                      {currentStep === 4 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">04. 生存法则与防同化自测</h3>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">沉淀生存法则 (Survival Rule)</h4>
                            <div className="bg-[#F1F2F6] p-6 rounded-3xl border border-slate-200 relative group">
                                <textarea value={newLog.reaction.survivalRule} onChange={e => setNewLog(prev => ({ ...prev, reaction: { ...prev.reaction, survivalRule: e.target.value } }))} placeholder="下次遇到这类情况，我应该..." className="w-full min-h-[120px] bg-transparent text-slate-800 text-sm font-bold border-none outline-none leading-relaxed resize-none scrollbar-hide placeholder:italic focus:ring-0 focus:outline-none" />
                            </div>
                          </div>

                          <div className="space-y-4 pt-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">防同化自测</h4>
                            <div className="grid grid-cols-1 gap-4">
                              {EVALUATION_DETAILS.map((opt, idx) => (
                                <button
                                  key={opt.type}
                                  type="button"
                                  onClick={() => setNewLog(prev => ({ ...prev, reaction: { ...prev.reaction, shiftEvaluation: opt.type } }))}
                                  className={`p-6 rounded-3xl border-2 text-left transition-all relative ${
                                    newLog.reaction.shiftEvaluation === opt.type
                                      ? 'bg-[#eef5f8] border-[#4281a4] shadow-xl shadow-[#4281a4]/10'
                                      : 'bg-white border-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                      newLog.reaction.shiftEvaluation === opt.type ? 'border-[#4281a4] bg-[#4281a4]' : 'border-slate-300'
                                    }`}>
                                      {newLog.reaction.shiftEvaluation === opt.type && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <div>
                                      <h5 className={`font-black text-sm mb-1 ${newLog.reaction.shiftEvaluation === opt.type ? 'text-slate-900' : 'text-slate-800'}`}>
                                        {opt.label}
                                      </h5>
                                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        {opt.desc}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Controls */}
                      <div className="flex items-center justify-between pt-10 border-t border-slate-100 font-sans">
                        <button type="button" onClick={prevStep} disabled={currentStep === 1} className={`px-8 py-3 rounded-2xl font-black transition-all whitespace-nowrap shrink-0 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-100'}`}>
                          上一步
                        </button>
                        
                        {currentStep < 4 ? (
                          <button 
                            key="btn-next"
                            type="button" 
                            onClick={nextStep} 
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                          >
                            下一步
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          </button>
                        ) : (
                          <button 
                            key="btn-submit"
                            type="submit" 
                            disabled={isAnalyzing} 
                            className="bg-[#4281a4] text-white px-12 py-4 rounded-2xl font-black hover:bg-[#32698a] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-lg shadow-xl shadow-[#4281a4]/20 whitespace-nowrap shrink-0"
                          >
                            {isAnalyzing ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin shrink-0" /> : "保存研究"}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
                )
              )}

              {logsSubTab === 'history' && (
                <div className="space-y-6 pb-20 animate-in fade-in duration-300">
                  {/* Filter Panel Card */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xs flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        {t('研究对象')}
                      </label>
                      <select
                        value={filterSubjectId}
                        onChange={(e) => setFilterSubjectId(e.target.value)}
                        className="w-full bg-[#F1F2F6] border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-[#4281a4]"
                      >
                        <option value="all">{t('全部研究对象')}</option>
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.alias} ({sub.role}){sub.status === 'completed' ? t(' [已完成]') : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-auto flex-1 min-w-[280px] space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        {t('日期范围')}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="flex-1 bg-[#F1F2F6] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none"
                        />
                        <span className="text-slate-400 text-xs">{t('至')}</span>
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="flex-1 bg-[#F1F2F6] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-[180px] space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        {t('关键词检索')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('检索事实或生存法则...')}
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                        className="w-full bg-[#F1F2F6] border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-[#4281a4]"
                      />
                    </div>

                    {/* Reset Button */}
                    {(filterSubjectId !== 'all' || filterStartDate || filterEndDate || filterKeyword) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterSubjectId('all');
                          setFilterStartDate('');
                          setFilterEndDate('');
                          setFilterKeyword('');
                        }}
                        className="text-slate-500 hover:text-slate-900 px-4 py-2 text-xs font-black rounded-xl hover:bg-slate-100 transition-all self-end h-[38px] shrink-0"
                      >
                        {t('重置')}
                      </button>
                    )}
                  </div>

                  {/* List header with counts */}
                  <div className="flex items-center justify-between px-4 pt-4">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                      <div className="w-2 h-8 bg-[#4281a4] rounded-full" />
                      {t('观察日志列表')}
                    </h3>
                    <span className="text-xs bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded-full font-black">
                      {t('筛选后共计')} {filteredLogs.length} {t('篇日志')}
                    </span>
                  </div>

                  {/* Logs timeline items list */}
                  {filteredLogs.length === 0 ? (
                    <div className="py-20 text-center text-slate-550 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                      <svg className="w-12 h-12 text-slate-350 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm text-slate-500 font-bold">{t('没有匹配到符合筛选条件的实验观察日志。')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredLogs.map((log) => (
                        <div 
                          key={log.id} 
                          onClick={() => setViewingReportLog(log)} 
                          className="bg-white rounded-2xl border border-slate-150 p-4 md:p-5 flex flex-row items-center justify-between gap-4 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden shadow-xs hover:shadow-md hover:border-[#4281a4]/45 group animate-in fade-in duration-300"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 flex-1 min-w-0">
                            {/* Record Time section - FIRST */}
                            <div className="min-w-0">
                              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase leading-none block mb-1">
                                {t('记录时间')}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span className="text-slate-600 font-mono font-bold text-xs select-all">
                                  {formatLogDateTime(log)}
                                </span>
                              </div>
                            </div>

                            {/* Divider on grid block scales */}
                            <div className="hidden sm:block h-6 w-[1px] bg-slate-200" />

                            {/* Research Subject detail text - SECOND */}
                            <div className="min-w-0">
                              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase leading-none block mb-1">
                                {t('研究对象')}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-800 text-sm truncate">
                                  {getSubjectAlias(log.subjectId, log)}
                                </span>
                                {getSubjectRole(log.subjectId, log) && (
                                  <span className="text-[10px] px-2 py-0.5 bg-[#eef5f8] border border-[#daedf5] text-[#32698a] rounded font-bold font-sans shrink-0 uppercase">
                                    {getSubjectRole(log.subjectId, log)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete button only, right-aligned to match time, icon only without text */}
                          <div className="flex items-center justify-end shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all active:scale-95"
                              title="删除报告"
                              aria-label="删除报告"
                            >
                              <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                )}
              </div>
            )}

          {activeTab === 'analysis' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6"><div><h2 className="text-3xl font-black text-slate-900 tracking-tight">周期性观察分析</h2></div><button onClick={handleRunAnalysis} disabled={isAnalyzing || logs.length < 3} className="bg-[#4281a4] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#32698a] transition-all shadow-xl shadow-[#4281a4]/20 disabled:opacity-50 flex items-center gap-2">{isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}启动深度分析</button></header>
              {analysisResult ? (
                <div className="space-y-8 pb-32">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><div className="w-1 h-3 bg-[#4281a4] rounded-full" />高频行为特征分析</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analysisResult.topTags} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="tag" type="category" width={100} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="count" radius={[0, 8, 8, 0]}>{analysisResult.topTags.map((_, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#4281a4' : '#cbd5e1'} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><div className="w-1 h-3 bg-indigo-500 rounded-full" />核心模式发现</h3><div className="text-slate-600 text-sm leading-relaxed space-y-4"><p className="font-medium bg-[#F1F2F6] p-6 rounded-2xl border-l-4 border-indigo-500 italic leading-relaxed">{analysisResult.aiInsights}</p></div></div>
                  </div>
                  <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-[#4281a4]/10 blur-[100px] -mr-32 -mt-32" /><h3 className="text-[#67abc4] font-black uppercase tracking-[0.2em] text-xs mb-10 flex items-center gap-3"><div className="w-8 h-[1px] bg-[#4281a4]" />进阶研究课题</h3><div className="grid md:grid-cols-2 gap-10">{analysisResult.suggestedQuestions.map((q, i) => (<div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#4281a4]/30 transition-all group"><p className="text-xl font-medium text-slate-100 leading-snug mb-4 group-hover:text-[#67abc4] transition-colors">“{q}”</p></div>))}</div></div>
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center bg-slate-100 rounded-[2.5rem] border-2 border-dashed border-slate-200"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-6"><svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg></div><h3 className="text-xl font-black text-slate-800">数据不足以支撑模式识别</h3><p className="text-slate-400 max-w-sm mt-3 text-sm font-medium">请积累至少 3 篇观察日志后再启动周期深度分析。</p></div>
              )}
            </div>
          )}

          {activeTab === 'tags_library' && (
            <div 
              onClick={() => setExpandedTagIds([])}
              className="space-y-8 animate-in fade-in duration-500 pb-32 flex flex-col"
            >
              {cameFromLogs && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('logs');
                    setCameFromLogs(false);
                  }}
                  className="self-start mb-2 px-5 py-2.5 rounded-2xl font-black text-xs text-[#4281a4] bg-[#eef5f8] hover:bg-[#daedf5] border border-[#bde0f0] flex items-center gap-2 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  返回观察日志（继续当前第 {currentStep} 步记录）
                </button>
              )}

              <div className="space-y-12 animate-in fade-in duration-300">
                  <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">标签库</h2>
                      <p className="text-slate-500 mt-2 font-medium">了解标签内容，也可以根据具体的职场环境，灵活增加或删减标签。</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        showConfirm(
                          "确认重置",
                          "确定要重置并恢复为默认的系统标签库吗？这会覆盖你目前的自定义标签。",
                          () => {
                            setTagLibrary(DEFAULT_TAG_LIBRARY);
                          }
                        );
                      }}
                      className="bg-slate-950 text-white hover:bg-slate-800 transition-all px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-slate-950/20 shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4H18" />
                      </svg>
                      恢复默认标签库
                    </button>
                  </header>

                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Form to Add Tags */}
                    <div className="md:col-span-1 border border-slate-100/50 rounded-[2rem] bg-white h-fit shadow-xs">
                      <form onSubmit={handleAddTag} onClick={(e) => e.stopPropagation()} className="bg-white p-6 md:p-8 rounded-[2rem] border-2 border-[#4281a4] shadow-xl shadow-[#4281a4]/10 space-y-6 h-fit sticky top-8">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-[#4281a4]" />
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            新增标签
                          </h3>
                        </div>

                        {/* 标签板块 select */}
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <span>标签板块</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={tagBoard}
                            onChange={(e) => setTagBoard(e.target.value as '事件属性' | '生理信号' | '即时行动')}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs bg-[#F1F2F6] outline-none focus:border-[#4281a4] focus:bg-white transition-all shadow-input text-slate-700"
                          >
                            <option value="事件属性">事件属性</option>
                            <option value="生理信号">生理信号</option>
                            <option value="即时行动">即时行动</option>
                          </select>
                        </div>

                        {/* 二级分类, shown only when "事件属性" is active */}
                        {tagBoard === '事件属性' && (
                          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <span>标签分类</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={subCategory}
                              onChange={(e) => setSubCategory(e.target.value as TagCategory)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs bg-[#F1F2F6] outline-none focus:border-[#4281a4] focus:bg-white transition-all shadow-input text-slate-700"
                            >
                              {EVENT_PROPERTY_CATEGORIES.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <span>标签名称</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newTag.name}
                            onChange={(e) =>
                              setNewTag({ ...newTag, name: e.target.value })
                            }
                            placeholder=""
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs bg-[#F1F2F6] outline-none focus:border-[#4281a4] focus:bg-white transition-all placeholder-slate-350 shadow-input text-slate-800"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <span>现象详细说明</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            value={newTag.description}
                            onChange={(e) =>
                              setNewTag({ ...newTag, description: e.target.value })
                            }
                            placeholder=""
                            className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 font-semibold text-xs bg-[#F1F2F6] outline-none focus:border-[#4281a4] focus:bg-white transition-all placeholder-slate-350 resize-none shadow-input text-slate-700"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all text-xs shadow-xl shadow-slate-900/10 active:scale-98"
                        >
                          存入标签库
                        </button>
                      </form>
                    </div>

                    {/* Tag Library Display */}
                    <div className="md:col-span-2 space-y-6">
                      {/* Search Bar */}
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#F1F2F6] p-4 rounded-3xl border border-slate-100"
                      >
                        <div className="relative w-full sm:max-w-md">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="快速检索标签名称或说明..."
                            value={tagSearchQuery}
                            onChange={(e) => setTagSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4281a4] focus:border-[#4281a4] transition-all"
                          />
                          {tagSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setTagSearchQuery('')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-[10px] font-black uppercase text-slate-405 italic tracking-wider flex items-center gap-1.5 px-2">
                            <svg className="w-3.5 h-3.5 text-[#4281a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>点击单个标签可展开/折叠其说明卡片</span>
                          </div>

                          {expandedTagIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedTagIds([])}
                              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 transition-all shadow-md shrink-0 flex items-center gap-1.5 animate-in zoom-in-95 duration-200"
                            >
                              <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                              一键收起全部 ({expandedTagIds.length})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Three Major Boards Filter Pills */}
                      <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-3 p-1.5 bg-[#F1F2F6] rounded-3xl border border-slate-150">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSegment('全部');
                              setShowEventSubCategories(false);
                            }}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                              activeSegment === '全部'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                          >
                            <span>全部板块</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeSegment === '全部' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {tagLibrary.length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (activeSegment === '事件属性') {
                                // Already active, so toggle retraction
                                setShowEventSubCategories(!showEventSubCategories);
                              } else {
                                // Set active and expand
                                setActiveSegment('事件属性');
                                setEventSubCategory('全部');
                                setShowEventSubCategories(true);
                              }
                            }}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                              activeSegment === '事件属性'
                                ? 'bg-[#4281a4] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                          >
                            <span>💼 事件属性</span>
                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showEventSubCategories && activeSegment === '事件属性' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeSegment === '事件属性' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {tagLibrary.filter(t => EVENT_PROPERTY_CATEGORIES.includes(t.category)).length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSegment('生理信号');
                              setShowEventSubCategories(false);
                            }}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                              activeSegment === '生理信号'
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                          >
                            <span>🫀 生理信号</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeSegment === '生理信号' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {tagLibrary.filter(t => t.category === '生理信号标签').length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSegment('即时行动');
                              setShowEventSubCategories(false);
                            }}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
                              activeSegment === '即时行动'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                          >
                            <span>⚡ 即时行动</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeSegment === '即时行动' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {tagLibrary.filter(t => t.category === '即时行动标签').length}
                            </span>
                          </button>
                        </div>

                        {/* Expandable level-2 subcategories for 事件属性 */}
                        {showEventSubCategories && activeSegment === '事件属性' && (
                          <div className="pt-2 border-t border-slate-150 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-300">
                            <span className="text-[10px] text-slate-400 font-black tracking-wide flex items-center px-1.5 uppercase shrink-0">二级分类:</span>
                            <button
                              type="button"
                              onClick={() => setEventSubCategory('全部')}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                                eventSubCategory === '全部'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/40'
                              }`}
                            >
                              全部细分 ({tagLibrary.filter(t => EVENT_PROPERTY_CATEGORIES.includes(t.category)).length})
                            </button>
                            {EVENT_PROPERTY_CATEGORIES.map(cat => {
                              const count = tagLibrary.filter(t => t.category === cat).length;
                              return (
                                <button
                                  type="button"
                                  key={cat}
                                  onClick={() => setEventSubCategory(cat)}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                                    eventSubCategory === cat
                                      ? 'bg-slate-800 text-white shadow-xs'
                                      : 'text-slate-500 hover:text-slate-850 hover:bg-slate-200/40'
                                  }`}
                                >
                                  {cat} ({count})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Tags List Container */}
                      {(() => {
                        // Pre-filter by search query
                        const searchFiltered = tagLibrary.filter(tag => {
                          return tagSearchQuery.trim() === '' || 
                            tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) || 
                            tag.description.toLowerCase().includes(tagSearchQuery.toLowerCase());
                        });

                        // Define function to render a board section
                        const renderBoardBlock = (
                          title: string, 
                          subtitle: string,
                          categoriesToInclude: string[], 
                          borderColorClass: string,
                          dotColorClass: string,
                          isEventBoard: boolean
                        ) => {
                          // Get matching tags for this board
                          const boardTags = searchFiltered.filter(t => categoriesToInclude.includes(t.category));
                          if (boardTags.length === 0) return null;

                          return (
                            <div key={title} className={`bg-[#F1F2F6]/50 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/60 space-y-6 animate-in fade-in duration-300`}>
                              {/* Header */}
                              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${dotColorClass}`} />
                                    <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase">
                                      {title}
                                    </h3>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-bold">{subtitle}</p>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-fit">
                                  共 {boardTags.length} 个标签
                                </span>
                              </div>

                              {/* Inner Structure */}
                              {isEventBoard ? (
                                // Render subcategories separately under Event Properties Board
                                <div className="space-y-8 pl-1">
                                  {EVENT_PROPERTY_CATEGORIES.map(category => {
                                    if (eventSubCategory !== '全部' && eventSubCategory !== category) return null;
                                    const catTags = boardTags.filter(t => t.category === category);
                                    if (catTags.length === 0) return null;
                                    return (
                                      <div key={category} className="space-y-3 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                            {category}
                                          </h4>
                                          <span className="text-[9px] font-extrabold text-slate-350">{catTags.length} 个</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {catTags.map(tag => renderTagItem(tag))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                // Straightforward grid for other boards
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {boardTags.map(tag => renderTagItem(tag))}
                                </div>
                              )}
                            </div>
                          );
                        };

                        // Let's determine what is rendered based on activeSegment and eventSubCategory:
                        let renderedBlocks: React.ReactNode[] = [];

                        // 1. Event Properties block
                        if (activeSegment === '全部' || activeSegment === '事件属性') {
                          // Filter categories based on eventSubCategory selected
                          const categories = eventSubCategory === '全部' 
                            ? EVENT_PROPERTY_CATEGORIES 
                            : [eventSubCategory];
                          
                          const block = renderBoardBlock(
                            '事件属性',
                            '系统性行为特征及人际交往变异表现形式',
                            categories,
                            'border-slate-300',
                            'bg-slate-800',
                            true
                          );
                          if (block) renderedBlocks.push(block);
                        }

                        // 2. Physical Signals block
                        if (activeSegment === '全部' || activeSegment === '生理信号') {
                          const block = renderBoardBlock(
                            '生理信号',
                            '压力之下的非言语躯体应激机制与自主神经反应',
                            ['生理信号标签'],
                            'border-[#9ccfe6]',
                            'bg-[#4281a4]',
                            false
                          );
                          if (block) renderedBlocks.push(block);
                        }

                        // 3. Action taken block
                        if (activeSegment === '全部' || activeSegment === '即时行动') {
                          const block = renderBoardBlock(
                            '即时行动',
                            '交互发生时的即刻应对习惯与其微观战术应对动作',
                            ['即时行动标签'],
                            'border-indigo-300',
                            'bg-indigo-500',
                            false
                          );
                          if (block) renderedBlocks.push(block);
                        }

                        if (renderedBlocks.length === 0) {
                          return (
                            <div className="py-20 text-center bg-[#F1F2F6]/50 rounded-[2.5rem] border border-slate-200">
                              <p className="text-xs text-slate-400 font-bold">没有找到符合检索条件的观察指标标签。</p>
                            </div>
                          );
                        }

                        return <div className="space-y-8">{renderedBlocks}</div>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {activeTab === 'strategies_library' && (
            <div className="space-y-8 animate-in fade-in duration-500 pb-32 flex flex-col">
              {cameFromLogs && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('logs');
                    setCameFromLogs(false);
                  }}
                  className="self-start mb-2 px-5 py-2.5 rounded-2xl font-black text-xs text-[#4281a4] bg-[#eef5f8] hover:bg-[#daedf5] border border-[#bde0f0] flex items-center gap-2 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  返回观察日志（继续当前第 {currentStep} 步记录）
                </button>
              )}

              <div className="space-y-8 animate-in fade-in duration-300">
                  <header className="border-b border-slate-200 pb-6">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight font-sans">深度解构策略中心</h2>
                      <p className="text-slate-500 mt-2 font-medium">尝试主动使用这些思维工具，帮你找回观察者的视角和主动权</p>
                    </div>
                  </header>

                  {/* 1. 全部策略详情 */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">全部策略详情（点击折叠/展开）</div>
                    
                    <div className="space-y-4">
                      {strategies.map((strategy) => {
                        const isExpanded = !!expandedStrategyIds[strategy.id];
                        const cleanName = strategy.name.startsWith('#') ? strategy.name.substring(1) : strategy.name;
                        
                        return (
                          <div 
                            key={strategy.id} 
                            className={`bg-white rounded-[2rem] border transition-all overflow-hidden ${
                              isExpanded 
                                ? 'border-slate-800 shadow-md shadow-slate-900/5' 
                                : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedStrategyIds(prev => ({ ...prev, [strategy.id]: !prev[strategy.id] }))}
                              className="w-full text-left p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 outline-none focus:outline-none select-none"
                            >
                              <div className="flex items-start sm:items-center gap-4 overflow-hidden">
                                <div className="space-y-1 overflow-hidden">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-black text-base text-slate-900 tracking-tight">#{cleanName}</h4>
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium leading-relaxed truncate max-w-xl">
                                    {strategy.concept}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <span className="text-[10px] font-black text-slate-400 tracking-tighter">
                                  {isExpanded ? "收起策略明细 -" : "阅读策略明细 +"}
                                </span>
                                <svg 
                                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-slate-800' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="border-t border-slate-100 bg-white p-6 md:p-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                {/* 核心思想 */}
                                <div className="bg-slate-950 text-white rounded-[1.5rem] p-6 border border-slate-800 shadow-lg relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#4281a4]/10 blur-[50px]" />
                                  <span className="text-[9px] font-black tracking-widest text-[#67abc4] uppercase">CORE IDEA // 核心思想</span>
                                  <p className="text-sm font-bold mt-2 leading-relaxed italic text-[#eaf3f7]">“{strategy.concept}”</p>
                                </div>

                                {/* 为什么有用 */}
                                {strategy.reason && (
                                  <div className="space-y-2 text-slate-800">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                      为什么有用 // WHY IT WORKS
                                    </h4>
                                    <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed bg-[#F1F2F6]/50 p-5 rounded-2xl border border-slate-100">
                                      {strategy.reason}
                                    </p>
                                  </div>
                                )}

                                {/* 如何运用 */}
                                {strategy.how && strategy.how.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-[#4281a4] rounded-full" />
                                      如何运用 // APPLICATION STEPS
                                    </h4>
                                    <div className="space-y-3">
                                      {strategy.how.map((step, index) => (
                                        <div key={index} className="flex gap-3 p-4 rounded-xl bg-[#F1F2F6] border border-slate-100 shadow-sm">
                                          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                                            {index + 1}
                                          </div>
                                          <p className="text-xs md:text-sm text-slate-700 font-semibold leading-relaxed">
                                            {step}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 职场场景示例 */}
                                {strategy.example && (
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                      职场场景示例 // CASE STUDY
                                    </h4>
                                    <div className="bg-indigo-50/10 border border-indigo-100/50 p-6 rounded-[1.5rem] space-y-3">
                                      <div className="flex gap-2 items-center">
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-500 text-white uppercase tracking-tight">情境 & 解构分析</span>
                                      </div>
                                      <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed italic">
                                        {strategy.example}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* 小贴士 */}
                                {strategy.tip && (
                                  <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-[1.5rem] flex gap-3 text-amber-900">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/10 shrink-0">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                    </div>
                                    <div className="space-y-0.5">
                                      <h5 className="text-[10px] font-black uppercase tracking-wider">贴心指南 // PERSPECTIVE TIP</h5>
                                      <p className="text-xs font-semibold leading-relaxed text-amber-800">
                                        {strategy.tip}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400">选择应用状态：</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleStrategyEnabled(strategy.id)}
                                      className={`px-4 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                        strategy.isEnabled !== false 
                                          ? 'bg-[#eef5f8] border-[#bde0f0] text-[#4281a4] shadow-xs' 
                                          : 'bg-[#F1F2F6] border-slate-200 text-slate-400'
                                      }`}
                                    >
                                      {strategy.isEnabled !== false ? "● 已启用（流程中展示）" : "○ 已禁用（流程中隐藏）"}
                                    </button>
                                  </div>

                                  {strategy.isCustom && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteStrategy(strategy.id)}
                                      className="bg-rose-50 text-rose-650 border border-rose-100 px-4 py-1.5 rounded-xl font-black text-xs hover:bg-rose-100 transition-all self-start sm:self-center"
                                    >
                                      彻底删除该自定义策略
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. 添加新策略 */}
                  <div className="bg-[#F1F2F6] border border-slate-200 rounded-[2rem] p-6 md:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#4281a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                          </svg>
                          以空白模板定制新策略
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          根据您面临的特定职场问题，手动定制新的行为和心态隔离方法。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingStrategy(!isAddingStrategy)}
                        className="bg-[#4281a4] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#32698a] transition-all text-sm flex items-center gap-2 shadow-lg shadow-[#4281a4]/10"
                      >
                        {isAddingStrategy ? "收起空白模板 -" : "添加新策略 +"}
                      </button>
                    </div>

                    {isAddingStrategy && (
                      <div className="bg-slate-900 text-white rounded-[2rem] border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in slide-in-from-top-6 duration-300">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4281a4]/5 blur-[80px]" />
                        <div className="flex items-center gap-2 mb-6">
                          <span className="text-[10px] font-black tracking-widest text-[#67abc4] bg-[#4281a4]/10 border border-[#4281a4]/20 px-3 py-1 rounded-full uppercase">
                            NEW TEMPLATE // 空白策略模板
                          </span>
                        </div>
                        
                        <form onSubmit={handleCreateStrategy} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">策略名称 (Name)</label>
                              <input 
                                type="text" 
                                value={newStrategy.name}
                                onChange={e => setNewStrategy(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="例如：战略性降噪、情绪真空化 (留空默认为自定义策略)"
                                className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder-slate-500 focus:border-[#4281a4] focus:ring-1 focus:ring-[#4281a4] outline-none transition-all"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                核心思想 (Core Idea) <span className="text-rose-500 font-black text-xs">*必填</span>
                              </label>
                              <input 
                                type="text" 
                                value={newStrategy.concept}
                                onChange={e => setNewStrategy(prev => ({ ...prev, concept: e.target.value }))}
                                placeholder="在此用一句话阐述该策略的心态准则（如：他只是一个发号施令的道具）"
                                className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-sm font-bold text-white placeholder-slate-500 focus:border-[#4281a4] focus:ring-1 focus:ring-[#4281a4] outline-none transition-all"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">为什么有用 (Why it works)</label>
                              <textarea
                                value={newStrategy.reason}
                                onChange={e => setNewStrategy(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="解释为什么采取这个策略可以避免主观情绪失控..."
                                className="w-full h-24 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder-slate-500 focus:border-[#4281a4] focus:ring-1 focus:ring-[#4281a4] outline-none transition-all resize-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">如何运用 (Application Steps) <span className="text-[9px] text-slate-500">一行写一个步骤</span></label>
                              <textarea
                                value={newStrategy.how}
                                onChange={e => setNewStrategy(prev => ({ ...prev, how: e.target.value }))}
                                placeholder="步骤 1. 定位对方逻辑偏失点&#10;步骤 2. 忽略高分贝言语噪音&#10;步骤 3. 只提取关键业务事实中性答复..."
                                className="w-full h-24 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder-slate-500 focus:border-[#4281a4] focus:ring-1 focus:ring-[#4281a4] outline-none transition-all resize-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">职场场景示例 (Case Study)</label>
                              <textarea
                                value={newStrategy.example}
                                onChange={e => setNewStrategy(prev => ({ ...prev, example: e.target.value }))}
                                placeholder="面对甩锅或者指控时，具体如何使用该逻辑来解读？..."
                                className="w-full h-24 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder-slate-500 focus:border-[#4281a4] focus:ring-1 focus:ring-[#4281a4] outline-none transition-all resize-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">小贴士 (Perspective Tip)</label>
                              <textarea
                                value={newStrategy.tip}
                                onChange={e => setNewStrategy(prev => ({ ...prev, tip: e.target.value }))}
                                placeholder="给深陷此情绪漩涡的自己一句提示..."
                                className="w-full h-24 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder-slate-500 focus:border-[#4281a4] focus:ring-1 focus:ring-[#4281a4] outline-none transition-all resize-none"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox"
                                checked={newStrategy.applyImmediately}
                                onChange={e => setNewStrategy(prev => ({ ...prev, applyImmediately: e.target.checked }))}
                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#4281a4] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                              />
                              <div className="space-y-0.5">
                                <span className="text-xs font-black text-white group-hover:text-[#67abc4] transition-colors">是否应用当前策略</span>
                                <p className="text-[10px] text-slate-400">若启用，该新策略将立即显示在正常观察日志记录的第三步选择列表中</p>
                              </div>
                            </label>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => setIsAddingStrategy(false)}
                                className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                              >
                                取消 (Cancel)
                              </button>
                              <button
                                type="submit"
                                className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-[#4281a4] hover:bg-[#4281a4]/95 text-white font-black text-xs shadow-lg shadow-[#4281a4]/20 transition-all"
                              >
                                保存策略 (Save)
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* 3. 策略展示设置 */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          策略展示设置 (Showcase Controls)
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          自定义您在日常观察记录流程中实际能选用的策略范围。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStrategyConfig(!showStrategyConfig)}
                        className="bg-indigo-650 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/10"
                      >
                        {showStrategyConfig ? "收起展示设置 -" : "展开展示设置 +"}
                      </button>
                    </div>

                    {showStrategyConfig && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        {strategies.map(s => {
                          const hasHash = s.name.startsWith('#');
                          const displayName = hasHash ? s.name : `#${s.name}`;
                          const isEnabled = s.isEnabled !== false;
                          return (
                            <div 
                              key={s.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                isEnabled 
                                  ? 'bg-[#F1F2F6]/50 border-slate-200 shadow-xs' 
                                  : 'bg-slate-150/40 border-slate-200/50 opacity-60'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                  <input 
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => toggleStrategyEnabled(s.id)}
                                    className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                  />
                                  <span className={`text-[11px] font-black tracking-tight ${isEnabled ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {displayName}
                                  </span>
                                </label>

                                {s.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStrategy(s.id)}
                                    className="text-slate-400 hover:text-rose-600 transition-colors"
                                    title="彻底删除此策略"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className={`text-[9px] font-black tracking-tighter px-2 py-0.5 rounded-lg border ${
                                  s.isCustom ? 'bg-indigo-50 text-indigo-600 border-indigo-150' : 'bg-[#eef5f8] text-[#4281a4] border-[#daedf5]'
                                }`}>
                                  {s.isCustom ? '自定义' : `策略 ${s.num}`}
                                </span>
                                
                                <span className={`text-[9px] font-black ${isEnabled ? 'text-[#4281a4]' : 'text-slate-400'}`}>
                                  {isEnabled ? '● 流程展示中' : '○ 已隐藏'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>

      {/* Elegant Bottom Navigation Toolbar */}
      <div className="fixed md:absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 h-20 flex items-center justify-around px-4 z-40 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] md:pb-safe">
        <button 
          type="button"
          onClick={() => { setActiveTab('logs'); setCameFromLogs(false); }} 
          className={`flex-1 max-w-[150px] flex flex-col items-center justify-center gap-1.5 py-1.5 px-3 rounded-2xl transition-all duration-300 relative ${activeTab === 'logs' ? 'text-[#4281a4] scale-105' : 'text-slate-500 hover:text-[#4281a4]/80'}`}
        >
          {activeTab === 'logs' && (
            <span className="absolute inset-0 bg-[#4281a4]/10 border border-[#4281a4]/20 rounded-2xl animate-in fade-in zoom-in-95 duration-200" />
          )}
          <svg className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'logs' ? 'text-[#4281a4] scale-110' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={activeTab === 'logs' ? "2.5" : "2"} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-[10px] font-bold tracking-tight leading-none text-center">{t('观察日志')}</span>
        </button>

        <button 
          type="button"
          onClick={() => { setActiveTab('monthly_reflections'); setCameFromLogs(false); }} 
          className={`flex-1 max-w-[150px] flex flex-col items-center justify-center gap-1.5 py-1.5 px-3 rounded-2xl transition-all duration-300 relative ${activeTab === 'monthly_reflections' ? 'text-[#4281a4] scale-105' : 'text-slate-500 hover:text-[#4281a4]/80'}`}
        >
          {activeTab === 'monthly_reflections' && (
            <span className="absolute inset-0 bg-[#4281a4]/10 border border-[#4281a4]/20 rounded-2xl animate-in fade-in zoom-in-95 duration-200" />
          )}
          <svg className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'monthly_reflections' ? 'text-[#4281a4] scale-110' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={activeTab === 'monthly_reflections' ? "2.5" : "2"} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-[10px] font-bold tracking-tight leading-none text-center">{t('研究员随笔')}</span>
        </button>

        <button 
          type="button"
          onClick={() => { setActiveTab('subjects'); setCameFromLogs(false); }} 
          className={`flex-1 max-w-[150px] flex flex-col items-center justify-center gap-1.5 py-1.5 px-3 rounded-2xl transition-all duration-300 relative ${activeTab === 'subjects' ? 'text-[#4281a4] scale-105' : 'text-slate-500 hover:text-[#4281a4]/80'}`}
        >
          {activeTab === 'subjects' && (
            <span className="absolute inset-0 bg-[#4281a4]/10 border border-[#4281a4]/20 rounded-2xl animate-in fade-in zoom-in-95 duration-200" />
          )}
          <svg className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'subjects' ? 'text-[#4281a4] scale-110' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={activeTab === 'subjects' ? "2.5" : "2"} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-[10px] font-bold tracking-tight leading-none text-center">{t('研究对象管理')}</span>
        </button>
      </div>
    </div>

      {showToast && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-12 border border-[#4281a4]/20 z-50"><div className="w-8 h-8 bg-[#4281a4] rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div><p className="font-black text-sm uppercase tracking-widest">{t('观察记录已保存')}</p></div>
      )}

      {/* Detailed Research Report View Overlay Modal */}
      {viewingReportLog && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200" onClick={() => setViewingReportLog(null)}>
          <div className="bg-[#F1F2F6] w-full max-w-4xl h-[90vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <header className="bg-white p-5 md:px-8 md:py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 relative">
              {/* Close button placed at top-right for mobile to save spacing */}
              <button 
                onClick={() => setViewingReportLog(null)}
                className="absolute top-4 right-4 sm:static text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100 animate-pulse shrink-0 order-first sm:order-last"
                aria-label={t("关闭 modal")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-start sm:items-center gap-3 pr-8 sm:pr-0">
                <div className="min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-3 text-[11px] text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-slate-400">{t('观察时间')}:</span> 
                      <span className="text-slate-700 font-mono font-black">{formatLogDateTime(viewingReportLog)}</span>
                    </span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-slate-400">{t('研究对象')}:</span>
                      <span className="text-[#4281a4] font-black">{getSubjectAlias(viewingReportLog.subjectId, viewingReportLog)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center mt-1 sm:mt-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { startEditingLog(viewingReportLog); }}
                  className="flex-1 sm:flex-initial bg-[#4281a4] hover:bg-[#32698a] text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  {t('二次编辑')}
                </button>
                <button
                  type="button"
                  onClick={() => { handleDeleteLog(viewingReportLog.id); }}
                  className="flex-1 sm:flex-initial bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black transition-all border border-rose-200 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  {t('删除报告')}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 bg-white">
              <div className="max-w-3xl mx-auto space-y-10 font-sans text-slate-800">
                
                {/* Section I: Fact & Environment Observations */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 tracking-widest flex items-center gap-2 border-b border-slate-900 pb-1.5">
                    01. {t('事实记录与行为分类')}
                  </h4>
                  <div className="pl-4 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <span className="font-black text-slate-400 w-28 shrink-0 text-xs">[ {t('事实记录')} ]</span>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap flex-1 pl-0">
                        {viewingReportLog.fact}
                      </p>
                    </div>
                    {viewingReportLog.tags && viewingReportLog.tags.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-black text-slate-400 w-28 shrink-0 text-xs">[ {t('行为分类')} ]</span>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {viewingReportLog.tags.map(tKey => (
                            <span key={tKey} className="text-[10px] font-bold text-[#4281a4] bg-[#4281a4]/5 border border-[#4281a4]/20 px-2.5 py-0.5 rounded-sm">#{t(tKey)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section II: Reactions Matrix & Physical Manifest */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 tracking-widest flex items-center gap-2 border-b border-slate-900 pb-1.5">
                    02. {t('第一时间反应')}
                  </h4>
                  <div className="pl-4 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-black text-slate-400 w-28 shrink-0">[ {t('情绪反应')} ]</span>
                      <div className="flex flex-wrap gap-2">
                        {viewingReportLog.structuredReaction.emotions && viewingReportLog.structuredReaction.emotions.length > 0 ? (
                          viewingReportLog.structuredReaction.emotions.map(e => (
                            <span key={e.name} className="inline-flex items-center gap-1.5 text-xs text-slate-800 font-extrabold bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                              <span>{t(e.name)}</span>
                              <span className="text-rose-600 font-black text-[10px]">L{e.score}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 font-bold">{t('未检出明显的异常情绪极化反应')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-black text-slate-400 w-28 shrink-0">[ {t('生理信号')} ]</span>
                      <div className="flex flex-wrap gap-2">
                        {viewingReportLog.structuredReaction.physicalSignals && viewingReportLog.structuredReaction.physicalSignals.length > 0 ? (
                          viewingReportLog.structuredReaction.physicalSignals.map(sig => (
                            <span key={sig} className="text-xs text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                              {t(sig)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 font-bold">{t('躯体植物神经机制运转平稳')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-1">
                      <span className="font-black text-slate-400 w-28 shrink-0">[ {t('即时反应')} ]</span>
                      <span className="text-xs text-slate-800 font-bold leading-relaxed">
                        {Array.isArray(viewingReportLog.structuredReaction.actionTaken) 
                          ? (viewingReportLog.structuredReaction.actionTaken.map(a => t(a)).join('、') || t('无记录')) 
                          : (t(viewingReportLog.structuredReaction.actionTaken) || t('无记录'))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section III: Cognitive Pivot & Disarming Logic */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 tracking-widest flex items-center gap-2 border-b border-slate-900 pb-1.5">
                    03. {t('认知催化与演变')}
                  </h4>
                  <div className="pl-4 space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400">[ {t('演变转折点')} ]</span>
                      <p className="text-sm font-serif italic text-slate-700 bg-slate-50 p-4 border-l-4 border-slate-400 leading-relaxed rounded-r-sm font-medium">
                        “{t(viewingReportLog.structuredReaction.turningPoint) || t('未检测到明显的非理性偏见重构或逆转节点')}”
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400">[ {t('运用的深度解构策略')} ]</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {viewingReportLog.structuredReaction.appliedStrategies && viewingReportLog.structuredReaction.appliedStrategies.length > 0 ? (
                          viewingReportLog.structuredReaction.appliedStrategies.map(str => (
                            <span key={str} className="text-xs font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-sm">
                              {t(str)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 font-bold pb-2 italic">{t('在思维演化中未选用特定预设心态策略体系')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section IV: Experimental Diagnostics & Derived Law */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 tracking-widest flex items-center gap-2 border-b border-slate-900 pb-1.5">
                    04. {t('生存法则与防同化自测')}
                  </h4>
                  <div className="pl-4 space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400">[ {t('生存法则')} ]</span>
                      <p className="text-xs font-bold text-emerald-700 bg-emerald-50/50 p-4 border border-emerald-100 rounded-sm leading-relaxed">
                        “ {t(viewingReportLog.structuredReaction.survivalRule) || t('在本次经历中未写明安全生存守则')} ”
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400">[ {t('防同化自测')} ]</span>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-2 mt-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${viewingReportLog.structuredReaction.shiftEvaluation === '健康的适应' ? 'bg-[#4281a4]' : viewingReportLog.structuredReaction.shiftEvaluation === '危险的麻木' ? 'bg-rose-500' : 'bg-slate-350'}`} />
                        {viewingReportLog.structuredReaction.shiftEvaluation ? t(viewingReportLog.structuredReaction.shiftEvaluation) : t('中性观察')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section V: Clinical Inquiry & Deep AI Follow-Ups */}
                {viewingReportLog.aiQuestions && viewingReportLog.aiQuestions.length > 0 && (
                  <div className="pt-4 border-t border-dashed border-slate-300 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 tracking-widest flex items-center gap-2">
                      05. {t('辩证追问与自省')}
                    </h4>
                    <div className="pl-4 space-y-2.5">
                      {viewingReportLog.aiQuestions.map((q, i) => (
                        <p key={i} className="text-xs text-slate-600 leading-relaxed font-bold bg-[#4281a4]/5 border-l-2 border-[#4281a4] p-3 rounded-r-sm">
                          “ {t(q)} ”
                        </p>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
            
            <footer className="bg-white border-t border-slate-150 px-8 py-4 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setViewingReportLog(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md"
              >
                {t('关闭报告')}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Edit Log Overlay Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={() => setEditingLog(null)}>
          <div className="bg-[#F1F2F6] w-full max-w-4xl h-[90vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <header className="bg-white px-8 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-lg">
                  E
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-slate-900">
                    {t('二次编辑观察研究记录')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t('修改此篇观察存档的所有事实与心态解构评估指标')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LHS: Facts and Basic Info */}
                <div className="space-y-6">
                  {/* Event Fact & Subject */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#4281a4]" />
                      01. {t('基础事实与研究对象')}
                    </h4>

                    {/* Research Subject Select */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('观察研究对象 (Research Subject)')}</label>
                      <select 
                        value={editingLog.subjectId}
                        onChange={e => setEditingLog({ ...editingLog, subjectId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs bg-[#F1F2F6] outline-none text-slate-800 focus:bg-white focus:border-[#4281a4] transition-all truncate"
                      >
                        {editingLog.subjectId && !subjects.some(s => s.id === editingLog.subjectId) && (
                          <option value={editingLog.subjectId}>
                            {getSubjectAlias(editingLog.subjectId, editingLog)} {t('（如有需要请重新关联）')}
                          </option>
                        )}
                        {subjects.filter(sub => sub.status !== 'completed' || sub.id === editingLog.subjectId).map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.alias} ({sub.role}){sub.status === 'completed' ? ` [${t('已完成')}]` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fact edit */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('观察到的职场事实 (Fact Details)')}</label>
                      <textarea
                        value={editingLog.fact}
                        onChange={e => setEditingLog({ ...editingLog, fact: e.target.value })}
                        className="w-full min-h-[140px] p-4 text-xs font-bold leading-relaxed rounded-xl border border-slate-200 bg-[#F1F2F6] outline-none text-slate-800 focus:bg-white focus:border-[#4281a4] transition-all resize-none"
                        required
                      />
                    </div>
                  </div>

                  {/* RHS Reacting Indicators: Emotions & Physical signals */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      02. {t('应激与反应指标')}
                    </h4>

                    {/* Emotional levels */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('情绪反应烈度 (1-10级)')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {EMOTION_OPTIONS.map(emo => {
                          const exist = editingLog.structuredReaction.emotions.find(e => e.name === emo);
                          const currentScore = exist ? exist.score : 0;
                          return (
                            <div key={emo} className="p-2 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col gap-1 items-center">
                              <span className="text-[10px] font-extrabold text-slate-700">{t(emo)}</span>
                              <div className="flex gap-1">
                                {[0, 3, 6, 9].map(scoreLevel => (
                                  <button
                                    key={scoreLevel}
                                    type="button"
                                    onClick={() => {
                                      const updatedEmotions = [...editingLog.structuredReaction.emotions];
                                      const index = updatedEmotions.findIndex(e => e.name === emo);
                                      if (index >= 0) {
                                        if (scoreLevel === 0) updatedEmotions.splice(index, 1);
                                        else updatedEmotions[index].score = scoreLevel;
                                      } else if (scoreLevel > 0) {
                                        updatedEmotions.push({ name: emo, score: scoreLevel });
                                      }
                                      setEditingLog({
                                        ...editingLog,
                                        structuredReaction: {
                                          ...editingLog.structuredReaction,
                                          emotions: updatedEmotions
                                        }
                                      });
                                    }}
                                    className={`w-6 py-0.5 text-[8px] font-extrabold rounded transition-all ${
                                      currentScore === scoreLevel 
                                        ? scoreLevel === 0 ? 'bg-slate-400 text-white' : 'bg-rose-500 text-white' 
                                        : 'bg-white hover:bg-slate-200 text-slate-550 border border-slate-150'
                                    }`}
                                  >
                                    {scoreLevel === 0 ? t('无') : `L${scoreLevel}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Physical indicators */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('生理信号记录 (Physical Signals)')}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PHYSICAL_OPTIONS.map(sig => {
                          const active = editingLog.structuredReaction.physicalSignals.includes(sig);
                          return (
                            <button
                              key={sig}
                              type="button"
                              onClick={() => {
                                      const current = editingLog.structuredReaction.physicalSignals;
                                      const next = current.includes(sig) ? current.filter(i => i !== sig) : [...current, sig];
                                      setEditingLog({
                                        ...editingLog,
                                        structuredReaction: {
                                          ...editingLog.structuredReaction,
                                          physicalSignals: next
                                        }
                                      });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                                active 
                                  ? 'bg-[#4281a4] border-[#4281a4] text-white shadow-xs' 
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350'
                              }`}
                            >
                              {t(sig)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('即时采取行动 (Immediate Action)')}</label>
                      <select
                        value={Array.isArray(editingLog.structuredReaction.actionTaken) ? editingLog.structuredReaction.actionTaken[0] || '' : (editingLog.structuredReaction.actionTaken || '')}
                        onChange={e => setEditingLog({
                          ...editingLog,
                          structuredReaction: {
                            ...editingLog.structuredReaction,
                            actionTaken: [e.target.value]
                          }
                        })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-[#F1F2F6] outline-none text-slate-800"
                      >
                        <option value="">{t('请选择即时应对')}</option>
                        {ACTION_OPTIONS.map(act => (
                          <option key={act} value={act}>{t(act)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* RHS: Cognitive construction, Pivot point & Evaluation */}
                <div className="space-y-6">
                  
                  {/* Step 3: Shift process */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      03. {t('认知转变与解构心态策略')}
                    </h4>

                    {/* Turning Point */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('理性概念转变/转折念头 (Pivot Thought)')}</label>
                      <textarea
                        value={editingLog.structuredReaction.turningPoint}
                        onChange={e => setEditingLog({
                          ...editingLog,
                          structuredReaction: {
                            ...editingLog.structuredReaction,
                            turningPoint: e.target.value
                          }
                        })}
                        className="w-full h-20 p-3 text-xs font-medium leading-relaxed rounded-xl border border-slate-200 bg-[#F1F2F6] outline-none text-slate-800"
                        placeholder={t("那句能拉开情绪距离，使你重获理性的关键念头...")}
                      />
                    </div>

                    {/* Applied strategies */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('启用的解构心态策略 (Select Strategies)')}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {strategies
                          .filter(s => s.isEnabled !== false)
                          .map(s => {
                            const displayName = s.name.startsWith('#') ? s.name : `#${s.name}`;
                            const isSelected = editingLog.structuredReaction.appliedStrategies.includes(displayName);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  const current = editingLog.structuredReaction.appliedStrategies;
                                  const next = current.includes(displayName) ? current.filter(str => str !== displayName) : [...current, displayName];
                                  setEditingLog({
                                    ...editingLog,
                                    structuredReaction: {
                                      ...editingLog.structuredReaction,
                                      appliedStrategies: next
                                    }
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-all ${
                                  isSelected 
                                    ? 'bg-indigo-600 border-indigo-700 text-white' 
                                    : 'bg-indigo-50/50 border-indigo-150 text-indigo-700 hover:bg-indigo-100/50'
                                }`}
                              >
                                {t(displayName)}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Final rule & Evaluation */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      04. {t('定位与生存法则是守')}
                    </h4>

                    {/* Mindset evaluation status row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('定位心态标签 (State Tag)')}</label>
                        <input
                          type="text"
                          value={editingLog.structuredReaction.finalMindsetLabel}
                          onChange={e => setEditingLog({
                            ...editingLog,
                            structuredReaction: {
                              ...editingLog.structuredReaction,
                              finalMindsetLabel: e.target.value
                            }
                          })}
                          placeholder={t("例如: 冷眼看剧、防御启动")}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-[#F1F2F6]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('自评安全水位')}</label>
                        <select
                          value={editingLog.structuredReaction.shiftEvaluation}
                          onChange={e => setEditingLog({
                            ...editingLog,
                            structuredReaction: {
                              ...editingLog.structuredReaction,
                              shiftEvaluation: e.target.value as any
                            }
                          })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-[#F1F2F6]"
                        >
                          <option value="健康的适应">{t('健康的适应')}</option>
                          <option value="危险的麻木">{t('危险的麻木')}</option>
                          <option value="中性观察">{t('中性观察')}</option>
                        </select>
                      </div>

                    </div>

                    {/* Survival Rule */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#4281a4] uppercase tracking-widest">{t('沉淀的职场核心生存法则 (Survival Rule)')}</label>
                      <textarea
                        value={editingLog.structuredReaction.survivalRule}
                        onChange={e => setEditingLog({
                          ...editingLog,
                          structuredReaction: {
                            ...editingLog.structuredReaction,
                            survivalRule: e.target.value
                          }
                        })}
                        placeholder={t("例如：警惕任何情绪溢价...")}
                        className="w-full h-20 p-3 text-xs font-bold leading-relaxed rounded-xl border border-slate-200 bg-[#F1F2F6]"
                      />
                    </div>

                    {/* Custom note */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('附加观察笔记/随笔随想')}</label>
                      <textarea
                        value={editingLog.structuredReaction.customNotes}
                        onChange={e => setEditingLog({
                          ...editingLog,
                          structuredReaction: {
                            ...editingLog.structuredReaction,
                            customNotes: e.target.value
                          }
                        })}
                        placeholder={t("有何细节可补充...")}
                        className="w-full h-16 p-3 text-xs font-semibold leading-relaxed rounded-xl border border-slate-200 bg-[#F1F2F6]"
                      />
                    </div>

                    {/* Custom report tag selector */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('标签归纳 (Associated Tags)')}</label>
                      <div className="max-h-24 overflow-y-auto border border-slate-200 bg-slate-50/50 p-2 rounded-xl flex flex-wrap gap-1">
                        {tagLibrary.map(tData => {
                          const active = editingLog.tags.includes(tData.name);
                          return (
                            <button
                              key={tData.id}
                              type="button"
                              onClick={() => {
                                const current = editingLog.tags;
                                const next = current.includes(tData.name) ? current.filter(x => x !== tData.name) : [...current, tData.name];
                                setEditingLog({
                                  ...editingLog,
                                  tags: next
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                active ? 'bg-[#4281a4] text-white' : 'bg-white text-slate-500 border border-slate-200'
                              }`}
                            >
                              #{t(tData.name)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>

            <footer className="bg-white border-t border-slate-200 p-6 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-xs"
              >
                {t('取消修改')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleEditLog(editingLog);
                  setEditingLog(null);
                  if (viewingReportLog && viewingReportLog.id === editingLog.id) {
                    setViewingReportLog(editingLog);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-98"
              >
                {t('保存修改并存档')}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Edit Research Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={() => setEditingSubject(null)}>
          <div className="bg-white max-w-xl w-full rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#4281a4] rounded-full" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">编辑研究对象信息</h3>
              </div>
              <button 
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setSubjects(prev => prev.map(s => s.id === editingSubject.id ? editingSubject : s));
              
              if (editingSubject.status === 'completed' && selectedSubjectId === editingSubject.id) {
                setSelectedSubjectId('general_essay');
                const defaultReflection = subjectReflections.find(r => r.subjectId === 'general_essay')?.content || '';
                setEditingReflectionText(defaultReflection);
              }

              setEditingSubject(null);
              if (viewingSubjectLogs && viewingSubjectLogs.id === editingSubject.id) {
                setViewingSubjectLogs(editingSubject);
              }
            }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">化名 / 对象代号 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={editingSubject.alias} 
                    onChange={e => setEditingSubject({...editingSubject, alias: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-[#4281a4] outline-none transition-all font-bold" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">{t('角色 / 岗位职级')} <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={editingSubject.role} 
                    onChange={e => setEditingSubject({...editingSubject, role: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-[#4281a4] outline-none transition-all font-bold" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">{t('背景脉络与互动简述')}</label>
                <textarea 
                  value={editingSubject.context || ''} 
                  onChange={e => setEditingSubject({...editingSubject, context: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs h-28 resize-none focus:bg-white focus:border-[#4281a4] outline-none transition-all" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 relative">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">{t('研究状态')}</label>
                  <button
                    type="button"
                    id="status-info-toggle-btn"
                    onClick={() => setShowStatusHelp(!showStatusHelp)}
                    className="w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                    title={t('点击查看观察状态的区别与说明')}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </button>

                  {showStatusHelp && (
                    <>
                      {/* Close popup if clicking anywhere outside */}
                      <div className="fixed inset-0 z-30" onClick={() => setShowStatusHelp(false)} />
                      <div className="absolute bottom-full mb-2.5 left-0 bg-white border border-slate-150 rounded-2xl p-5 w-[290px] sm:w-[360px] space-y-3.5 text-slate-600 text-xs shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            💡 {t('研究状态说明')}
                          </p>
                          <button 
                            type="button" 
                            onClick={() => setShowStatusHelp(false)} 
                            className="text-slate-400 hover:text-slate-700 font-extrabold p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-3 font-medium">
                          <div className="space-y-1">
                            <span className="font-extrabold text-[#4281a4] flex items-center gap-1">
                              🟢 {t('观察研究中 :')}
                            </span>
                            <span className="text-slate-500 block leading-relaxed pl-1">
                              {t('对象为活跃观察状态。项目内可正常为其录入工作日志，并在研究员随笔处录入心流笔录。')}
                            </span>
                          </div>
                          <div className="space-y-1 border-t border-slate-100 pt-2.5">
                            <span className="font-extrabold text-slate-500 flex items-center gap-1">
                              ⚫ {t('已完成研究 :')}
                            </span>
                            <span className="text-slate-500 block leading-relaxed pl-1">
                              {t('研究已完成或归档。该对象将自动在新增日志、研究员随笔的选择器中隐藏，帮助你聚焦于进行中的研究。如需重新激活，请将其设回「观察研究中」。')}
                            </span>
                          </div>
                        </div>
                        {/* Elegant speech bubble arrow pointing down */}
                        <div className="absolute -bottom-1.5 left-20 w-3 h-3 bg-white border-r border-b border-slate-150 rotate-45 pointer-events-none" />
                      </div>
                    </>
                  )}
                </div>

                <select
                  value={editingSubject.status || 'under_study'}
                  onChange={e => setEditingSubject({...editingSubject, status: e.target.value as 'under_study' | 'completed'})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-[#4281a4] outline-none transition-all font-bold"
                >
                  <option value="under_study">🟢 {t('观察研究中')}</option>
                  <option value="completed">⚫ {t('已完成研究')}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-bold font-sans text-xs transition-all cursor-pointer"
                >
                  {t('取消')}
                </button>
                <button 
                  type="submit" 
                  className="bg-slate-900 hover:bg-[#4281a4] text-white px-8 py-2.5 rounded-xl font-bold font-sans text-xs hover:shadow-lg hover:shadow-[#4281a4]/10 transition-all cursor-pointer"
                >
                  {t('保存修改')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[80] animate-in fade-in duration-200" onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>
          <div className="bg-white max-w-sm w-full rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="font-extrabold text-base text-slate-900">{confirmConfig.title}</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {confirmConfig.message}
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmCallbackRef.current();
                  setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[80] animate-in fade-in duration-200" onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}>
          <div className="bg-white max-w-sm w-full rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#eef5f8] text-[#4281a4] rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 animate-bounce text-[#4281a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-extrabold text-base text-slate-900">{alertConfig.title}</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {alertConfig.message}
            </p>
            <div className="flex items-center justify-end mt-2">
              <button
                type="button"
                onClick={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                好的
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkplaceSurvival;
