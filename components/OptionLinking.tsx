
import React from 'react';
import { Option, ProCon, Dimension } from '../types';
import { useLanguage } from './LanguageContext';

interface Props {
  option: Option;
  dimensions: Dimension[];
  onUpdate: (updatedOption: Option) => void;
}

const OptionLinking: React.FC<Props> = ({ option, dimensions, onUpdate }) => {
  const { t } = useLanguage();

  const updateItem = (type: 'pros' | 'cons', id: string, dimensionId: string) => {
    const updatedItems = option[type].map(item => 
      item.id === id ? { ...item, dimensionId } : item
    );
    onUpdate({ ...option, [type]: updatedItems });
  };

  const renderSection = (type: 'pros' | 'cons', title: string, colorClass: string, bgClass: string) => {
    const items = option[type];
    if (items.length === 0) return null;

    return (
      <div className="space-y-4">
        <h4 className={`font-bold ${colorClass} flex items-center gap-2 whitespace-nowrap`}>
          <span className={`w-1.5 h-6 ${bgClass} rounded-full`}></span>
          {t(title)}
        </h4>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/40 rounded-2xl border border-white hover:border-slate-200 transition-all">
              <span className="text-sm font-medium text-slate-700 break-words flex-1 pr-4">{item.text || t('未填写描述')}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('归属于:')}</span>
                <select 
                  className={`text-xs px-3 py-1.5 rounded-xl outline-none shadow-sm border border-transparent focus:border-slate-300 whitespace-nowrap ${item.dimensionId ? 'bg-white text-slate-700' : 'bg-red-50 text-red-400'}`}
                  value={item.dimensionId || ''}
                  onChange={(e) => updateItem(type, item.id, e.target.value)}
                >
                  <option value="" className="whitespace-nowrap">{t('-- 请选择评估维度 --')}</option>
                  {dimensions.map(d => <option key={d.id} value={d.id} className="whitespace-nowrap">{t(d.name)}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl mb-8 overflow-hidden">
      <h3 className="text-xl font-black text-slate-700 mb-8 whitespace-nowrap overflow-hidden text-ellipsis">{t(option.title)}</h3>
      <div className="space-y-10">
        {renderSection('pros', '将收获关联至维度', 'text-indigo-600', 'bg-indigo-300')}
        {renderSection('cons', '将代价关联至维度', 'text-purple-600', 'bg-purple-300')}
      </div>
    </div>
  );
};

export default OptionLinking;
