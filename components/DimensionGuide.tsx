
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, ChevronRight, ChevronLeft, Target, Scale, Zap, X, Heart } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface Props {
  defaultOpen?: boolean;
  isStaticPage?: boolean;
}

const DimensionGuide: React.FC<Props> = ({ defaultOpen, isStaticPage = false }) => {
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

  const weights = [
    { level: '1', label: t('不太在意'), desc: t('这个维度基本不会影响我的选择。它不是我的重心，我也不会因为它而纠结。') },
    { level: '2', label: t('有点在乎'), desc: t('我会考虑到它，但它不是主角。如果其他方面足够好，我可以接受它不完美。') },
    { level: '3', label: t('正常在乎'), desc: t('我会认真对待它，和大多数人一样。它是我放在天平上一起称量的因素之一。') },
    { level: '4', label: t('很在乎'), desc: t('这对我很重要，不能满足我会很犹豫。它是我做出好选择的关键拼图之一。') },
    { level: '5', label: t('极其在乎'), desc: t('这个维度定义了我想要的生活方向。我会优先追求它，投入最大的精力。') },
  ];

  const renderCoreContent = (showCloseButton: boolean, closeAction?: () => void) => (
    <>
      {/* Header */}
      <div className="p-8 border-b border-indigo-50 flex justify-between items-center bg-indigo-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Heart className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{t('权重设定指南')}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Dimension Weight Guide</p>
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
            <p className="text-xs text-slate-400 mt-1">{t('在决策流程中的建模步骤自动弹出此指南')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoPopup}
              onChange={(e) => toggleAutoPopup(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">{t('核心设定原则')}</h4>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-left">
              <div className="flex items-center gap-3 mb-2">
                <Target className="text-indigo-500" size={16} />
                <div className="text-sm font-black text-slate-700">{t('描绘“现在的我”')}</div>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed pl-7 text-left">
                {t('权重代表你当前生活的真实重心，没有对错之分。诚实地勾选“现在的我”，比纠结“应该怎样”更重要。')}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">{t('维度权重定义 (1-5)')}</h4>
          </div>
          <div className="space-y-4">
            {weights.map((w, i) => (
              <div key={i} className="group bg-slate-50/50 hover:bg-white p-6 rounded-[2.5rem] border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all text-left">
                <div className="flex justify-between items-center mb-4">
                  <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[11px] font-black">{w.level} {t('级权重')}</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-3 py-1 rounded-lg">{t(w.label)}</span>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed text-left">
                  {w.desc}
                </p>
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
            <Heart className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">{t('权重设定指南')}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Dimension Weight Guide</p>
          </div>
        </div>

        {/* Info or helper text */}
        <div className="p-6 bg-white/50 backdrop-blur-md rounded-3xl border border-white text-left">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-indigo-500" size={16} />
            <div className="text-sm font-black text-slate-700">{t('描绘“现在的我”')}</div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed pl-7 text-left">
            {t('权重代表你当前生活的真实重心，没有对错之分。诚实地勾选“现在的我”，比纠结“应该怎样”更重要。')}
          </p>
        </div>

        {/* Auto Popup Setting Card */}
        <div className="p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white flex items-center justify-between text-left gap-4">
          <div>
            <h4 className="text-sm font-black text-slate-805 text-slate-800">{t('自动弹出指引')}</h4>
            <p className="text-xs text-slate-400 mt-1">{t('在决策流程中的建模步骤自动弹出此指南')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoPopup}
              onChange={(e) => toggleAutoPopup(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Content */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">{t('维度权重定义 (1-5)')}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weights.map((w, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all text-left flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-center mb-3">
                  <span className="px-4 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black">{w.level} {t('级权重')}</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50/50 px-3 py-1 rounded-lg">{t(w.label)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed text-left flex-1">
                  {w.desc}
                </p>
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
          className="bg-indigo-900 text-white py-6 px-3 rounded-l-2xl shadow-2xl hover:bg-black transition-all flex flex-col items-center gap-4 border-y border-l border-white/20 active:scale-95 group"
        >
          <Heart size={18} className="text-white group-hover:scale-110 transition-transform" />
          <span className="[writing-mode:vertical-rl] text-[11px] font-black tracking-[0.2em] uppercase whitespace-nowrap">
            {t('权重逻辑定义')}
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
              className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm z-[115]"
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

export default DimensionGuide;
