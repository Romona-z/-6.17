
import React, { useState, useRef, useEffect } from 'react';
import { Option, ProCon, Dimension } from '../types';
import { getAISuggestions } from '../services/geminiService';
import { useLanguage } from './LanguageContext';

const AutoGrowTextarea: React.FC<{
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  className?: string;
}> = ({ value, placeholder, onChange, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      className={`${className} resize-none overflow-hidden min-h-[24px] py-1 bg-transparent leading-relaxed break-words`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

interface Props {
  problem: string;
  option: Option;
  dimensions: Dimension[];
  onUpdate: (updatedOption: Option) => void;
}

const OptionAnalysis: React.FC<Props> = ({ problem, option, dimensions, onUpdate }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let changed = false;
    const updatedOption = { ...option };
    if (option.pros.length === 0) {
      updatedOption.pros = [{
        id: 'p-' + Math.random().toString(36).substr(2, 9),
        text: '',
        score: 0
      }];
      changed = true;
    }
    if (option.cons.length === 0) {
      updatedOption.cons = [{
        id: 'c-' + Math.random().toString(36).substr(2, 9),
        text: '',
        score: 0
      }];
      changed = true;
    }
    if (changed) {
      onUpdate(updatedOption);
    }
  }, [option.pros.length, option.cons.length]);

  const addItem = (type: 'pros' | 'cons') => {
    const newItem: ProCon = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      score: 0
    };
    onUpdate({
      ...option,
      [type]: [...option[type], newItem]
    });
  };

  const updateItem = (type: 'pros' | 'cons', id: string, updates: Partial<ProCon>) => {
    const updatedItems = option[type].map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    onUpdate({ ...option, [type]: updatedItems });
  };

  const removeItem = (type: 'pros' | 'cons', id: string) => {
    const filtered = option[type].filter(item => item.id !== id);
    if (filtered.length === 0) {
      filtered.push({
        id: Math.random().toString(36).substr(2, 9),
        text: '',
        score: 0
      });
    }
    onUpdate({
      ...option,
      [type]: filtered
    });
  };

  const handleAIHelp = async () => {
    setLoading(true);
    const suggestions = await getAISuggestions(problem, option.title);
    const newPros = suggestions.pros.map((p: string) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: p,
      score: 0
    }));
    const newCons = suggestions.cons.map((c: string) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: c,
      score: 0
    }));

    onUpdate({
      ...option,
      pros: [...option.pros, ...newPros],
      cons: [...option.cons, ...newCons]
    });
    setLoading(false);
  };

  return (
    <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/60 shadow-lg mb-8 transition-all hover:shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-slate-700 tracking-tight whitespace-nowrap">{t(option.title)}</h3>
        <button 
          onClick={handleAIHelp}
          disabled={loading}
          className="text-sm px-5 py-2 bg-white/80 text-indigo-500 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? t('思考中...') : t('✨ AI 辅助深度分析')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Pros Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-600 flex items-center gap-3 whitespace-nowrap">
              <span className="w-2 h-8 bg-indigo-200 rounded-full"></span>
              {t('获得/好处')}
            </h4>
            <button onClick={() => addItem('pros')} className="text-xs text-indigo-400 font-bold hover:underline whitespace-nowrap">{t('+ 新增')}</button>
          </div>
          <div className="space-y-3">
            {option.pros.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-white/60 rounded-2xl group transition-all border border-transparent hover:border-indigo-100">
                <div className="flex items-center gap-2">
                  <AutoGrowTextarea
                    className="flex-1 text-sm font-medium outline-none text-slate-600 w-full"
                    value={item.text}
                    placeholder={t('输入好处描述...')}
                    onChange={(val) => updateItem('pros', item.id, { text: val })}
                  />
                  <button onClick={() => removeItem('pros', item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all text-xs whitespace-nowrap">{t('移除')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cons Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-slate-600 flex items-center gap-3 whitespace-nowrap">
              <span className="w-2 h-8 bg-purple-200 rounded-full"></span>
              {t('代价/坏处')}
            </h4>
            <button onClick={() => addItem('cons')} className="text-xs text-purple-400 font-bold hover:underline whitespace-nowrap">{t('+ 新增')}</button>
          </div>
          <div className="space-y-3">
            {option.cons.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-white/60 rounded-2xl group transition-all border border-transparent hover:border-purple-100">
                <div className="flex items-center gap-2">
                  <AutoGrowTextarea
                    className="flex-1 text-sm font-medium outline-none text-slate-600 w-full"
                    value={item.text}
                    placeholder={t('输入坏处描述...')}
                    onChange={(val) => updateItem('cons', item.id, { text: val })}
                  />
                  <button onClick={() => removeItem('cons', item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all text-xs whitespace-nowrap">{t('移除')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionAnalysis;
