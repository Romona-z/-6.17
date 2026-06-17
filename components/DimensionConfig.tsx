
import React from 'react';
import { Dimension } from '../types';
import { useLanguage } from './LanguageContext';

interface Props {
  dimensions: Dimension[];
  onUpdate: (dims: Dimension[]) => void;
}

const DimensionConfig: React.FC<Props> = ({ dimensions, onUpdate }) => {
  const { t } = useLanguage();

  const addDim = () => {
    onUpdate([...dimensions, { id: Date.now().toString(), name: t('新维度'), weight: 1 }]);
  };

  const updateDim = (id: string, updates: Partial<Dimension>) => {
    onUpdate(dimensions.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const removeDim = (id: string) => {
    onUpdate(dimensions.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-700 whitespace-nowrap">{t('价值建模')}</h2>
        <p className="text-slate-400 text-sm mt-2 whitespace-nowrap">{t('此刻，你的人生重心在哪里？')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensions.map(dim => (
          <div key={dim.id} className="bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-white shadow-sm flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-2xl border border-slate-100 max-w-full">
                <input 
                  className="font-bold text-slate-700 bg-transparent outline-none whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0"
                  value={dim.name}
                  onChange={(e) => updateDim(dim.id, { name: e.target.value })}
                  onFocus={() => {
                    const trimmed = dim.name.trim();
                    if ([t('新维度'), '新维度'].includes(trimmed)) {
                      updateDim(dim.id, { name: '' });
                    }
                  }}
                />
                <button onClick={() => removeDim(dim.id)} className="text-slate-400 hover:text-red-400 text-xs whitespace-nowrap px-2 py-1 bg-white rounded-lg border border-slate-100 shadow-sm ml-2 shrink-0">{t('移除')}</button>
              </div>
              {dim.description && (
                <p className="text-[10px] text-slate-400 italic mt-1 px-1">{t(dim.description)}</p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 whitespace-nowrap">{t('权重')}: {dim.weight}x</span>
              <input 
                type="range" min="1" max="5" step="1"
                className="flex-1 accent-indigo-400"
                value={dim.weight}
                onChange={(e) => updateDim(dim.id, { weight: parseInt(e.target.value) })}
              />
            </div>
          </div>
        ))}
        <button 
          onClick={addDim}
          className="p-5 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 flex items-center justify-center hover:bg-white/40 transition-all whitespace-nowrap"
        >
          {t('+ 自定义评估维度')}
        </button>
      </div>
    </div>
  );
};

export default DimensionConfig;
