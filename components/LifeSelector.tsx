import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Step, ChoiceState, Option, Dimension } from '../types';
import { STEPS, DEFAULT_DIMENSIONS } from '../constants';
import { Trash2 } from 'lucide-react';
import OptionAnalysis from './OptionAnalysis';
import OptionLinking from './OptionLinking';
import OptionScoring from './OptionScoring';
import ScoringGuide from './ScoringGuide';
import DimensionGuide from './DimensionGuide';
import ResultDashboard from './ResultDashboard';
import DimensionConfig from './DimensionConfig';
import { useLanguage } from './LanguageContext';

const LifeSelector: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<Step>(Step.PROBLEM);
  const [state, setState] = useState<ChoiceState>({
    problem: '',
    options: [
      { id: '1', title: '方案 A', pros: [{ id: 'pa1', text: '', score: 0 }], cons: [{ id: 'ca1', text: '', score: 0 }] },
      { id: '2', title: '方案 B', pros: [{ id: 'pb1', text: '', score: 0 }], cons: [{ id: 'cb1', text: '', score: 0 }] }
    ],
    dimensions: [...DEFAULT_DIMENSIONS]
  });

  // Sidebar Layout Navigation state
  const [activeView, setActiveView] = useState<'wizard' | 'history' | 'weight' | 'scoring'>('wizard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  
  // History list state
  const [historyEntries, setHistoryEntries] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('life_selector_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Listen to top-right hamburger menu trigger in index.tsx
  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggle-selector-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-selector-sidebar', handleToggle);
  }, []);

  // Save decision result automatically once user reaches the result step
  useEffect(() => {
    if (currentStep === Step.RESULT && state.problem.trim().length > 0) {
      try {
        const saved = localStorage.getItem('life_selector_history');
        let historyList = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(historyList)) historyList = [];
        
        // Prevent duplicate saving if refreshed or double entered within last 1 minute
        const isDuplicate = historyList.some((h: any) => 
          h.problem === state.problem && 
          Math.abs(h.timestamp - Date.now()) < 60000
        );
        
        if (!isDuplicate) {
          const newEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            problem: state.problem,
            options: state.options,
            dimensions: state.dimensions
          };
          const updated = [newEntry, ...historyList].slice(0, 50);
          setHistoryEntries(updated);
          localStorage.setItem('life_selector_history', JSON.stringify(updated));
        }
      } catch (e) {
        console.error("Error saving history:", e);
      }
    }
  }, [currentStep, state]);

  const handleStepClick = (stepIdx: number) => {
    if (stepIdx === Step.RESULT) {
      const invalidSteps: string[] = [];
      if (!checkStepValid(Step.PROBLEM)) invalidSteps.push(t('明确问题'));
      if (!checkStepValid(Step.OPTIONS)) invalidSteps.push(t('列出方案'));
      if (!checkStepValid(Step.ANALYSIS)) invalidSteps.push(t('利弊发散'));
      if (!checkStepValid(Step.DIMENSIONS)) invalidSteps.push(t('价值建模'));
      if (!checkStepValid(Step.LINKING)) invalidSteps.push(t('关联维度'));
      
      if (invalidSteps.length > 0) {
        alert(`${t('请先完成以下步骤以生成决策报告')}:\n${invalidSteps.map(s => `• ${s}`).join('\n')}`);
        return;
      }
    }
    
    if (currentStep === Step.ANALYSIS) {
      const cleanedOptions = state.options.map(o => ({
        ...o,
        pros: o.pros.filter(p => p.text.trim().length > 0),
        cons: o.cons.filter(c => c.text.trim().length > 0)
      }));
      setState(prev => ({ ...prev, options: cleanedOptions }));
    }
    
    setCurrentStep(stepIdx as Step);
  };

  const nextStep = () => {
    if (currentStep === Step.ANALYSIS) {
      // Clean up empty pros/cons
      const cleanedOptions = state.options.map(o => ({
        ...o,
        pros: o.pros.filter(p => p.text.trim().length > 0),
        cons: o.cons.filter(c => c.text.trim().length > 0)
      }));
      setState(prev => ({ ...prev, options: cleanedOptions }));
    }
    
    if (currentStep === Step.SCORING) {
      handleStepClick(Step.RESULT);
    } else {
      setCurrentStep(prev => Math.min(prev + 1, Step.RESULT));
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, Step.PROBLEM));

  const updateOption = (id: string, updatedOption: Option) => {
    setState(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === id ? updatedOption : opt)
    }));
  };

  const checkStepValid = (step: Step) => {
    if (step === Step.PROBLEM) return state.problem.trim().length > 0;
    if (step === Step.OPTIONS) {
      const isOptionsCustomized = state.options.length > 2 || state.options.some(o => {
        const t_title = o.title.trim();
        return t_title !== '' && 
               t_title !== '方案 A' && 
               t_title !== '方案 B' && 
               t_title !== '方案A' && 
               t_title !== '方案B' && 
               t_title !== '新方案' &&
               t_title !== 'Option A' &&
               t_title !== 'Option B' &&
               t_title !== 'New Option';
      });
      return state.options.length >= 2 && isOptionsCustomized && state.options.every(o => o.title.trim().length > 0);
    }
    if (step === Step.ANALYSIS) {
      // Must have written at least one pro or con text in any option
      return state.options.some(o => 
        o.pros.some(p => p.text.trim().length > 0) || 
        o.cons.some(c => c.text.trim().length > 0)
      );
    }
    if (step === Step.DIMENSIONS) {
      const isDimensionsCustomized = state.dimensions.length !== DEFAULT_DIMENSIONS.length || 
        state.dimensions.some((d, idx) => {
          const def = DEFAULT_DIMENSIONS[idx];
          return !def || d.weight !== 1 || d.name !== def.name;
        });
      return state.dimensions.length > 0 && isDimensionsCustomized;
    }
    if (step === Step.LINKING) {
      if (!checkStepValid(Step.ANALYSIS)) return false;
      const validOptions = state.options.map(o => ({
        pros: o.pros.filter(p => p.text.trim().length > 0),
        cons: o.cons.filter(c => c.text.trim().length > 0)
      }));
      return validOptions.every(o => 
        o.pros.every(p => !!p.dimensionId) && o.cons.every(c => !!c.dimensionId)
      );
    }
    if (step === Step.SCORING) {
      return [Step.PROBLEM, Step.OPTIONS, Step.ANALYSIS, Step.DIMENSIONS, Step.LINKING].every(s => checkStepValid(s));
    }
    return true;
  };

  const isStepValid = () => {
    return checkStepValid(currentStep);
  };

  // Render selected history item detail
  const renderSelectedHistoryItem = () => {
    if (!selectedHistoryItem) return null;
    return (
      <div className="space-y-6 w-full max-w-4xl animate-in fade-in duration-300">
        <div className="p-6 md:p-8 bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div>
            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-[#7E8AB5] transition-colors cursor-pointer mb-2"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('返回历史决策列表')}
            </button>
            <h3 className="text-xl font-black text-slate-800 break-words max-w-xl">{selectedHistoryItem.problem}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
              {t('评估时间')}：{new Date(selectedHistoryItem.timestamp).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => {
              const confirmed = window.confirm(t("确定要删除这条历史决策吗？"));
              if (confirmed) {
                const updated = historyEntries.filter(h => h.id !== selectedHistoryItem.id);
                setHistoryEntries(updated);
                localStorage.setItem('life_selector_history', JSON.stringify(updated));
                setSelectedHistoryItem(null);
              }
            }}
            className="px-4 py-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all cursor-pointer font-black text-xs self-start md:self-center"
          >
            {t('删除此条历史记录')}
          </button>
        </div>

        <ResultDashboard 
          options={selectedHistoryItem.options} 
          dimensions={selectedHistoryItem.dimensions} 
          problem={selectedHistoryItem.problem}
          onNavigateToDimensions={() => {}} 
        />
      </div>
    );
  };

  // Render history list
  const renderHistoryList = () => {
    if (historyEntries.length === 0) {
      return (
        <div className="bg-white/70 backdrop-blur-lg p-16 rounded-[3rem] shadow-xl border border-white text-center animate-in zoom-in-95 duration-500 mt-6 max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🍁</div>
          <h3 className="text-xl font-black text-slate-800 mb-2">{t('历史记录为空')}</h3>
          <p className="text-sm text-slate-400">{t('你还没有做过任何决策，完成一次建模即可在此查看历史分析日志。')}</p>
          <button
            onClick={() => setActiveView('wizard')}
            className="mt-6 px-6 py-2.5 bg-[#7E8AB5] hover:bg-[#6c79a5] text-white rounded-xl text-xs font-black shadow-lg shadow-[#7E8AB5]/30 transition-all cursor-pointer"
          >
            {t('开始首次决策')}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6 w-full max-w-4xl text-left animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-850">{t('历史决策档案')}</h2>
            <p className="text-xs text-slate-400 mt-1">{t('追溯与重新盘点过往人生路上的每一个关键命题')}</p>
          </div>
          <button
            onClick={() => {
              const confirmed = window.confirm(t("确定要清空所有历史决策记录吗？清除后不可恢复。"));
              if (confirmed) {
                setHistoryEntries([]);
                localStorage.removeItem('life_selector_history');
              }
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 text-xs font-black rounded-xl transition-all cursor-pointer"
          >
            {t('清除全部档案')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {historyEntries.map((item) => {
            const getWeightedScore = (opt: any) => {
              const pSum = opt.pros.reduce((acc: any, p: any) => acc + (p.score * (item.dimensions.find((d: any) => d.id === p.dimensionId)?.weight || 1)), 0);
              const cSum = opt.cons.reduce((acc: any, c: any) => acc + (c.score * (item.dimensions.find((d: any) => d.id === c.dimensionId)?.weight || 1)), 0);
              return pSum - cSum;
            };
            const sorted = [...item.options].map((opt: any) => ({
              title: opt.title,
              score: getWeightedScore(opt)
            })).sort((a, b) => b.score - a.score);
            const bestTitle = sorted[0]?.title || "未决";
            const dateStr = new Date(item.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            return (
              <div 
                key={item.id} 
                className="bg-white/80 hover:bg-white backdrop-blur-sm p-6 rounded-[2.5rem] border border-transparent hover:border-[#7E8AB5]/30 shadow-xs hover:shadow-xl hover:shadow-[#7E8AB5]/5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-[#7E8AB5] bg-indigo-50 px-2 py-1 rounded-md uppercase">
                      {dateStr}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mt-3 line-clamp-2 min-h-[3.5rem]" title={item.problem}>
                    {item.problem}
                  </h3>
                  
                  <div className="mt-4 p-4 bg-slate-50/50 rounded-2xl flex flex-col gap-1">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t('最优理性推荐方案')}</div>
                    <div className="text-sm font-black text-[#7E8AB5] truncate mt-1">🎯 {t(bestTitle)}</div>
                    <div className="text-[10px] text-slate-400 mt-2 truncate">{t('其他分值')}：{sorted.map(s => `${t(s.title)}(${s.score})`).join(' / ')}</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setSelectedHistoryItem(item)}
                    className="flex-1 py-2.5 bg-[#7E8AB5] hover:bg-[#6c79a5] text-white text-xs font-black rounded-xl text-center cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    {t('查看科学报告')}
                  </button>
                  <button
                    onClick={() => {
                      const confirmed = window.confirm(t("确定要删除这条历史决策吗？"));
                      if (confirmed) {
                        const updated = historyEntries.filter(h => h.id !== item.id);
                        setHistoryEntries(updated);
                        localStorage.setItem('life_selector_history', JSON.stringify(updated));
                      }
                    }}
                    className="px-3 py-2.5 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                    title={t("删除记录")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isProblemStep = activeView === 'wizard' && !selectedHistoryItem && currentStep === Step.PROBLEM;

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#F3F4F8] text-[#4A5568] font-sans relative">
      {/* Mobile Header (Always visible on mobile to host the hamburger toggle) */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 w-full shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7E8AB5] flex items-center justify-center font-bold text-sm text-white shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-md font-black tracking-tight text-slate-800 leading-none">{t('理性决策分析表')}</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Decision Matrix</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(prev => !prev)} 
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 focus:outline-none cursor-pointer"
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? (
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

      {/* Main Workspace Frame */}
      <div className="flex-1 min-h-0 flex flex-col items-center pt-6 px-4 max-w-4xl mx-auto w-full md:px-8 md:order-last pb-52">
        {selectedHistoryItem ? (
          renderSelectedHistoryItem()
        ) : activeView === 'history' ? (
          renderHistoryList()
        ) : activeView === 'weight' ? (
          <DimensionGuide isStaticPage={true} />
        ) : activeView === 'scoring' ? (
          <ScoringGuide isStaticPage={true} />
        ) : (
          <>

            {/* Stepper Wizard Progress Indicators */}
            <div className="w-full max-w-4xl mb-12 px-2 md:px-4">
              <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-200 -z-10" />
                {STEPS.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isCompleted = checkStepValid(idx) && idx < currentStep;
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleStepClick(idx)} 
                      className="flex flex-col items-center relative cursor-pointer group select-none"
                    >
                      <motion.div 
                        initial={false}
                        animate={{
                          scale: isActive ? 1.4 : 1,
                          rotate: isActive ? 10 : 0,
                          backgroundColor: isActive ? '#7E8AB5' : isCompleted ? '#FFFFFF' : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : isCompleted ? '#6366F1' : '#CBD5E1',
                          borderColor: isActive ? '#7E8AB5' : isCompleted ? '#EEF2FF' : '#F1F5F9',
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm border transition-all duration-200 ${
                          isActive ? 'shadow-xl' : 'group-hover:scale-110 group-hover:border-[#7E8AB5]/60'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </motion.div>
                      
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -bottom-8 flex flex-col items-center whitespace-nowrap"
                          >
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#7E8AB5]">
                              {step.title}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isActive && (
                        <div className="absolute -bottom-8 flex flex-col items-center whitespace-nowrap opacity-40">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                            {isCompleted ? '' : step.title}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Wizard Content Area */}
            <main className="w-full max-w-4xl mt-4 min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full"
                >
                  {currentStep === Step.PROBLEM && (
                    <div className="bg-white/70 backdrop-blur-lg p-8 md:p-16 rounded-[3rem] shadow-xl border border-white text-center">
                      <h2 className="text-3xl font-black text-slate-800 mb-8">{t('你的难题是什么？')}</h2>
                      <textarea
                        className="w-full text-2xl px-4 py-3 bg-transparent border-b-2 border-slate-100 focus:border-[#7E8AB5] outline-none transition-all font-bold text-center placeholder:text-slate-200 resize-none h-32"
                        placeholder={t('例如：我现在该跳槽还是自己创业')}
                        value={state.problem}
                        onChange={(e) => setState(prev => ({ ...prev, problem: e.target.value }))}
                      />
                      <p className="mt-6 text-sm text-slate-400">{t('用直白的一句话描述你当前最大的纠结。')}</p>
                    </div>
                  )}

                  {currentStep === Step.OPTIONS && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-black text-slate-700 text-center mb-8">{t('可以选择的路')}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {state.options.map((opt, idx) => (
                          <div key={opt.id} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-white flex flex-col gap-4 text-left">
                            <span className="text-[10px] font-black text-slate-300 uppercase">{t('方案')} {idx + 1}</span>
                            <input
                              className="text-xl font-black outline-none bg-transparent text-slate-600 focus:text-[#7E8AB5] truncate"
                              value={opt.title === '方案 A' || opt.title === '方案 B' || opt.title === '新方案' ? t(opt.title) : opt.title}
                              onChange={(e) => updateOption(opt.id, { ...opt, title: e.target.value })}
                              onFocus={() => {
                                const trimmed = opt.title.trim();
                                if (['方案 A', '方案 B', '方案A', '方案B', '新方案'].includes(trimmed)) {
                                  updateOption(opt.id, { ...opt, title: '' });
                                }
                              }}
                            />
                            {state.options.length > 2 && (
                              <button onClick={() => setState(p => ({...p, options: p.options.filter(o => o.id !== opt.id)}))} className="text-left text-xs text-red-300 hover:text-red-400 transition-colors">{t('移除此方案')}</button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => setState(p => ({
                            ...p, 
                            options: [
                              ...p.options, 
                              {
                                id: Date.now().toString(), 
                                title: '新方案', 
                                pros: [{ id: 'p-' + Math.random().toString(36).substr(2, 9), text: '', score: 0 }], 
                                cons: [{ id: 'c-' + Math.random().toString(36).substr(2, 9), text: '', score: 0 }]
                              }
                            ]
                          }))}
                          className="p-8 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-black hover:border-[#7E8AB5] hover:text-[#7E8AB5] transition-all"
                        >
                          {t('+ 添加新路径')}
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === Step.ANALYSIS && (
                    <div className="text-left">
                      <div className="mb-10 text-center">
                        <h2 className="text-2xl font-black text-slate-700">{t('利弊发散')}</h2>
                        <p className="text-sm text-slate-400 mt-2 truncate">{t('问题：')}{state.problem}</p>
                        <p className="text-xs text-slate-300 mt-1">{t('请尽可能多的列出每种方案的好处及坏处')}</p>
                      </div>
                      {state.options.map(opt => (
                        <OptionAnalysis 
                          key={opt.id}
                          problem={state.problem}
                          option={opt}
                          dimensions={state.dimensions}
                          onUpdate={(updated) => updateOption(opt.id, updated)}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep === Step.DIMENSIONS && (
                    <div className="text-left">
                      <DimensionGuide />
                      <DimensionConfig 
                        dimensions={state.dimensions} 
                        onUpdate={(dims) => setState(p => ({...p, dimensions: dims}))} 
                      />
                    </div>
                  )}

                  {currentStep === Step.LINKING && (
                    <div className="text-left">
                      <div className="mb-10 text-center">
                        <h2 className="text-2xl font-black text-slate-700">{t('关联评估维度')}</h2>
                        <p className="text-sm text-slate-400 mt-2">{t('将刚才列出的好处与代价归纳到相应的价值维度中')}</p>
                      </div>
                      {state.options.map(opt => (
                        <OptionLinking 
                          key={opt.id}
                          option={opt}
                          dimensions={state.dimensions}
                          onUpdate={(updated) => updateOption(opt.id, updated)}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep === Step.SCORING && (
                    <div className="text-center">
                      <ScoringGuide />
                      <h2 className="text-2xl font-black text-slate-700 mb-10">{t('分值量化与权重映射')}</h2>
                      {state.options.map(opt => (
                        <OptionScoring 
                          key={opt.id}
                          option={opt}
                          dimensions={state.dimensions}
                          onUpdate={(updated) => updateOption(opt.id, updated)}
                        />
                      ))}
                    </div>
                  )}

                  {currentStep === Step.RESULT && (
                    <ResultDashboard 
                      options={state.options} 
                      dimensions={state.dimensions} 
                      problem={state.problem}
                      onNavigateToDimensions={() => setCurrentStep(Step.DIMENSIONS)} 
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Solid uncollapsible spacer block to ensure the bottommost elements of Step 3 (like Option B's cost list) can scroll completely above the fixed action footer */}
            <div className="h-44 w-full shrink-0" />

            {/* Pinned Bottom Interactive Bar */}
            <footer className="fixed bottom-0 left-0 right-0 md:left-60 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-2xl z-30 py-4 px-6 md:px-12 transition-all">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <button
                    onClick={prevStep}
                    disabled={currentStep === Step.PROBLEM}
                    className="text-xs font-black text-slate-400 hover:text-slate-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-30 disabled:pointer-events-none py-2.5 px-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('上一步')}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {currentStep === Step.RESULT ? (
                    <button
                      onClick={() => window.location.reload()}
                      className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-800 text-white shadow-lg hover:bg-black transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
                      </svg>
                      {t('重新开始')}
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all transform active:scale-95 disabled:grayscale disabled:opacity-50 flex items-center gap-2 bg-[#7E8AB5] hover:shadow-[#7E8AB5]/30 cursor-pointer"
                    >
                      {currentStep === Step.SCORING ? t('生成决策报告') : t('确认并继续')}
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Sidebar Backdrop (Mobile/Tablet drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-45"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <nav className={`
        bg-white border-r border-slate-200 text-slate-700 flex flex-col gap-6 shadow-sm transition-all duration-300 shrink-0 select-none
        md:sticky md:top-0 md:h-full md:w-60 md:translate-x-0 md:z-20 md:p-6 md:order-first
        fixed inset-y-0 left-0 w-60 p-6 z-50 transform h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header for Desktop view */}
        <div className="hidden md:flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-lg bg-[#7E8AB5] flex items-center justify-center font-bold text-sm text-white shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-md font-black tracking-tight text-slate-800 leading-none font-sans">{t('理性决策分析表')}</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Decision Matrix</p>
          </div>
        </div>

        {/* Topmost Exit Tool Button */}
        <div className="flex flex-col gap-4">
          <button 
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              onBack();
            }} 
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/50 transition-all font-black text-xs cursor-pointer shadow-xs active:scale-95"
            title={t('退出工具')}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{t('退出工具')}</span>
            </div>
          </button>
        </div>

        {/* Menu Separator */}
        <div className="h-[1px] bg-slate-100 my-1 font-sans" />

        {/* Function Links */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Active Wizard Flow Toggle */}
          <button
            onClick={() => {
              setActiveView('wizard');
              setSelectedHistoryItem(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs ${
              activeView === 'wizard' && !selectedHistoryItem
                ? 'bg-[#7E8AB5] text-white shadow-lg shadow-[#7E8AB5]/15' 
                : 'text-slate-600 hover:text-[#7E8AB5] hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-left font-black">{t('当前决策流程')}</span>
          </button>

          {/* History Decisions Archive Link */}
          <button
            onClick={() => {
              setActiveView('history');
              setSelectedHistoryItem(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs ${
              activeView === 'history' || selectedHistoryItem
                ? 'bg-[#7E8AB5] text-white shadow-lg shadow-[#7E8AB5]/15' 
                : 'text-slate-600 hover:text-[#7E8AB5] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-black">{t('历史决策')}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              activeView === 'history' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {historyEntries.length}
            </span>
          </button>

          {/* Dimension Weight Handbook Guide Link */}
          <button
            onClick={() => {
              setActiveView('weight');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs ${
              activeView === 'weight' 
                ? 'bg-[#7E8AB5] text-white shadow-lg shadow-[#7E8AB5]/15' 
                : 'text-slate-600 hover:text-[#7E8AB5] hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-left font-black">{t('权重指南')}</span>
          </button>

          {/* Scoring Definitions Guide Link */}
          <button
            onClick={() => {
              setActiveView('scoring');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs ${
              activeView === 'scoring' 
                ? 'bg-[#7E8AB5] text-white shadow-lg shadow-[#7E8AB5]/15' 
                : 'text-slate-600 hover:text-[#7E8AB5] hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-left font-black">{t('评分指南')}</span>
          </button>
        </div>

        {/* Sidebar Footer info */}
        <div className="text-[9px] font-black text-slate-300 tracking-wider text-center flex flex-col items-center gap-1">
          <div className="w-8 h-[2px] bg-slate-100 rounded-full" />
          <span>LIFE DIARY LABS</span>
        </div>
      </nav>
    </div>
  );
};

export default LifeSelector;
