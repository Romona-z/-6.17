
import React from 'react';
import { Option, ProCon, Dimension } from '../types';
import { useLanguage } from './LanguageContext';

interface Props {
  option: Option;
  dimensions: Dimension[];
  onUpdate: (updatedOption: Option) => void;
}

const OptionScoring: React.FC<Props> = ({ option, dimensions, onUpdate }) => {
  const { t } = useLanguage();

  const updateScore = (type: 'pros' | 'cons', id: string, score: number) => {
    const updatedItems = option[type].map(item => 
      item.id === id ? { ...item, score } : item
    );
    onUpdate({ ...option, [type]: updatedItems });
  };

  const calculateTotal = () => {
    const pSum = option.pros.reduce((acc, p) => {
      const dim = dimensions.find(d => d.id === p.dimensionId);
      return acc + (p.score * (dim?.weight || 1));
    }, 0);
    const cSum = option.cons.reduce((acc, c) => {
      const dim = dimensions.find(d => d.id === c.dimensionId);
      return acc + (c.score * (dim?.weight || 1));
    }, 0);
    return pSum - cSum;
  };

  return (
    <div className="bg-white/60 backdrop-blur-md p-10 rounded-[2.5rem] border border-white shadow-xl mb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div className="text-left w-full overflow-hidden">
          <h3 className="text-2xl font-black text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">{t(option.title)} {t('的量化评估')}</h3>
        </div>
        <div className="bg-white/80 p-6 rounded-3xl shadow-inner border border-white min-w-[160px] text-center shrink-0">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider mb-1 whitespace-nowrap">{t('当前加权净分')}</span>
          <span className={`text-4xl font-black whitespace-nowrap ${calculateTotal() >= 0 ? 'text-indigo-600' : 'text-purple-600'}`}>
            {calculateTotal()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Pros */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-indigo-300 rounded-full"></div>
            <h4 className="font-bold text-slate-600 whitespace-nowrap">{t('收益打分 (0-100)')}</h4>
          </div>
          <div className="space-y-4">
            {option.pros.map((pro) => {
              const dim = dimensions.find(d => d.id === pro.dimensionId);
              const impact = pro.score * (dim?.weight || 1);
              return (
                <div key={pro.id} className="group flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white/80 hover:border-indigo-200 transition-all">
                  <div className="w-16 shrink-0">
                    <input
                      type="number"
                      className="w-full bg-white border-0 rounded-xl py-2 text-center font-bold text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-200 outline-none whitespace-nowrap"
                      value={pro.score || ''}
                      onChange={(e) => updateScore('pros', pro.id, Math.min(Math.max(parseInt(e.target.value) || 0, 0), 200))}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-700 break-words leading-snug">{pro.text || t('未填写描述')}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">{dim?.name ? t(dim.name) : ''}</span>
                      <span className="whitespace-nowrap">{t('权重')} x{dim?.weight}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-300 uppercase whitespace-nowrap">{t('影响值')}</div>
                    <div className="text-sm font-black text-indigo-400 whitespace-nowrap">+{impact}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cons */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-purple-300 rounded-full"></div>
            <h4 className="font-bold text-slate-600 whitespace-nowrap">{t('代价打分 (0-100)')}</h4>
          </div>
          <div className="space-y-4">
            {option.cons.map((con) => {
              const dim = dimensions.find(d => d.id === con.dimensionId);
              const impact = con.score * (dim?.weight || 1);
              return (
                <div key={con.id} className="group flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white/80 hover:border-purple-200 transition-all">
                  <div className="w-16 shrink-0">
                    <input
                      type="number"
                      className="w-full bg-white border-0 rounded-xl py-2 text-center font-bold text-purple-600 shadow-sm focus:ring-2 focus:ring-purple-200 outline-none whitespace-nowrap"
                      value={con.score || ''}
                      onChange={(e) => updateScore('cons', con.id, Math.min(Math.max(parseInt(e.target.value) || 0, 0), 200))}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-700 break-words leading-snug">{con.text || t('未填写描述')}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">{dim?.name ? t(dim.name) : ''}</span>
                      <span className="whitespace-nowrap">{t('权重')} x{dim?.weight}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-300 uppercase whitespace-nowrap">{t('影响值')}</div>
                    <div className="text-sm font-black text-purple-400">-{impact}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionScoring;
