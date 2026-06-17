
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, ChevronRight, ChevronLeft, Target, Scale, Zap, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface Props {
  defaultOpen?: boolean;
  isStaticPage?: boolean;
}

const ScoringGuide: React.FC<Props> = ({ defaultOpen, isStaticPage = false }) => {
  const { t } = useLanguage();

  const [autoPopup, setAutoPopup] = useState(() => {
    return localStorage.getItem('life-selector-auto-popup-guides') !== 'false';
  });

  const [isOpen, setIsOpen] = useState(() => {
    if (defaultOpen !== undefined) return defaultOpen;
    const autoShow = localStorage.getItem('life-selector-auto-popup-guides') !== 'false';
    return autoShow;
  });

  const toggleAutoPopup = (checked: boolean) => {
    setAutoPopup(checked);
    localStorage.setItem('life-selector-auto-popup-guides', String(checked));
  };

  const ranges = [
    { range: '1-20', label: t('微弱'), pro: t('有点小好处，几乎不影响决定'), con: t('有点小麻烦，几乎不影响决定') },
    { range: '21-40', label: t('中等偏低'), pro: t('能感觉到好处，是考虑因素之一'), con: t('能感觉到不适，是考虑因素之一') },
    { range: '41-60', label: t('中等'), pro: t('明确的好处，我会认真权衡它'), con: t('明确的坏处，我会认真权衡它') },
    { range: '61-80', label: t('强烈'), pro: t('有吸引力的好处，很舍不得放弃'), con: t('难以忍受的坏处，会很抗拒接受') },
    { range: '81-100', label: t('极强'), pro: t('极其看重，有巨大的吸引力'), con: t('极其厌恶，对我是巨大的阻力') },
  ];

  const renderCoreContent = (showCloseButton: boolean, closeAction?: () => void) => (
    <>
      {/* Header */}
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Target className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{t('评分指南')}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Scoring Definition Handbook</p>
          </div>
        </div>
        {showCloseButton && closeAction && (
          <button 
            onClick={closeAction}
            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
          >
            <X size={20} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar p-8">
        {/* Auto Popup Setting Card */}
        <div className="mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between text-left gap-4">
          <div>
            <h4 className="text-sm font-black text-slate-700">{t('自动弹出指引')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('在决策流程中的打分步骤自动弹出此指南')}</p>
          </div>
          <label className="relative inline-flex inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoPopup}
              onChange={(e) => toggleAutoPopup(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
          </label>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">{t('核心评估原理')}</h4>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-left">
              <div className="flex items-center gap-3 mb-2">
                <Scale className="text-indigo-500" size={16} />
                <div className="text-sm font-black text-slate-700">{t('没有“一票否决”')}</div>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed pl-7 text-left">
                {t('任何单一因素都不应直接决定最终选择。理性在于全面权衡，通过分值反映每一个维度的真实分量。')}
              </p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-left">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="text-purple-500" size={16} />
                <div className="text-sm font-black text-slate-700">{t('分数代表“重量”')}</div>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed pl-7 text-left">
                {t('高分意味着你非常在意这件事。打分是主观价值的客观量化，是寻找内心真正优先级的过程。')}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">{t('分值区间定义')}</h4>
          </div>
          <div className="space-y-4">
            {ranges.map((r, i) => (
              <div key={i} className="group bg-slate-50/50 hover:bg-white p-6 rounded-[2.5rem] border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all text-left">
                <div className="flex justify-between items-center mb-4">
                  <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[11px] font-black">{r.range} {t('分')}</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-3 py-1 rounded-lg">{t('强度')}：{r.label}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-left">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 shadow-sm" />
                    <div>
                      <div className="text-[11px] font-black text-indigo-400 uppercase mb-0.5 text-left">{t('好处定义')}</div>
                      <p className="text-sm text-slate-600 leading-snug text-left">{r.pro}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-left">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0 shadow-sm" />
                    <div>
                      <div className="text-[11px] font-black text-purple-400 uppercase mb-0.5 text-left">{t('坏处定义')}</div>
                      <p className="text-sm text-slate-600 leading-snug text-left">{r.con}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-slate-100 flex flex-col gap-4 bg-slate-50/30">
        <div className="flex items-center justify-center gap-2 opacity-30">
          <span className="w-10 h-[1px] bg-slate-400"></span>
          <span className="text-[9px] font-black tracking-[0.3em] uppercase">Life Choice Selector</span>
          <span className="w-10 h-[1px] bg-slate-400"></span>
        </div>
      </div>
    </>
  );

  if (isStaticPage) {
    return (
      <div className="w-full max-w-3xl text-left mx-auto animate-in fade-in duration-500 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Target className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">{t('评分指南')}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Scoring Definition Handbook</p>
          </div>
        </div>

        {/* Auto Popup Setting Card */}
        <div className="p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white flex items-center justify-between text-left gap-4">
          <div>
            <h4 className="text-sm font-black text-slate-800">{t('自动弹出指引')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('在决策流程中的打分步骤自动弹出此指南')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoPopup}
              onChange={(e) => toggleAutoPopup(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
          </label>
        </div>

        {/* Principles */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">{t('核心评估原理')}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white text-left">
              <div className="flex items-center gap-3 mb-2">
                <Scale className="text-indigo-500" size={16} />
                <div className="text-sm font-black text-slate-700">{t('没有“一票否决”')}</div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pl-7 text-left">
                {t('任何单一因素都不应直接决定最终选择。理性在于全面权衡，通过分值反映每一个维度的真实分量。')}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white text-left">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="text-purple-500" size={16} />
                <div className="text-sm font-black text-slate-700">{t('分数代表“重量”')}</div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pl-7 text-left">
                {t('高分意味着你非常在意这件事。打分是主观价值的客观量化，是寻找内心真正优先级的过程。')}
              </p>
            </div>
          </div>
        </section>

        {/* Range Definitions */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">{t('分值区间定义')}</h4>
          </div>
          <div className="space-y-4">
            {ranges.map((r, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all text-left">
                <div className="flex justify-between items-center mb-4">
                  <span className="px-4 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black">{r.range} {t('分')}</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50/50 px-3 py-1 rounded-lg">{t('强度')}：{r.label}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2.5 text-left bg-slate-50/40 p-2.5 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 shadow-sm" />
                    <div>
                      <div className="text-[10px] font-black text-indigo-400 uppercase mb-0.5 text-left">{t('好处定义')}</div>
                      <p className="text-sm text-slate-600 leading-snug text-left">{r.pro}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-left bg-slate-50/40 p-2.5 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0 shadow-sm" />
                    <div>
                      <div className="text-[10px] font-black text-purple-400 uppercase mb-0.5 text-left">{t('坏处定义')}</div>
                      <p className="text-sm text-slate-600 leading-snug text-left">{r.con}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[110]">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white py-6 px-3 rounded-l-2xl shadow-2xl hover:bg-black transition-all flex flex-col items-center gap-4 border-y border-l border-white/20 active:scale-95 group"
        >
          <Info size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="[writing-mode:vertical-rl] text-[11px] font-black tracking-[0.2em] uppercase whitespace-nowrap">
            {t('打分逻辑定义')}
          </span>
          <ChevronLeft size={14} className="animate-pulse" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[115]"
            />

            {/* Content Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-[120] flex flex-col overflow-hidden"
            >
              {renderCoreContent(true, () => setIsOpen(false))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScoringGuide;
