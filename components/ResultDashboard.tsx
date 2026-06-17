
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import { Option, Dimension } from '../types';
import { useLanguage } from './LanguageContext';

interface Props {
  options: Option[];
  dimensions: Dimension[];
  onNavigateToDimensions?: () => void;
}

const ResultDashboard: React.FC<Props> = ({ options, dimensions, onNavigateToDimensions }) => {
  const { t } = useLanguage();

  const getWeightedScore = (opt: Option) => {
    const pSum = opt.pros.reduce((acc, p) => acc + (p.score * (dimensions.find(d => d.id === p.dimensionId)?.weight || 1)), 0);
    const cSum = opt.cons.reduce((acc, c) => acc + (c.score * (dimensions.find(d => d.id === c.dimensionId)?.weight || 1)), 0);
    return pSum - cSum;
  };

  const chartData = options.map(opt => ({
    name: opt.title,
    score: getWeightedScore(opt),
  })).sort((a, b) => b.score - a.score);

  const bestOptionTitle = chartData[0].name;
  const bestOption = options.find(o => o.title === bestOptionTitle)!;

  // Calculate dimension contribution for the winner
  const dimensionContribution = dimensions.map(dim => {
    const pScore = bestOption.pros.filter(p => p.dimensionId === dim.id).reduce((s, p) => s + (p.score * dim.weight), 0);
    const cScore = bestOption.cons.filter(c => c.dimensionId === dim.id).reduce((s, c) => s + (c.score * dim.weight), 0);
    return {
      subject: t(dim.name),
      value: pScore - cScore,
      fullMark: 100 * dim.weight,
    };
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      {/* Hero Section */}
      <div className="text-center bg-gradient-to-br from-[#7E8AB5] to-[#A696C5] p-8 md:p-16 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] mb-6 opacity-70">{t('最优理性路径推荐')}</div>
          <div className="text-7xl md:text-[120px] leading-none mb-4">🎯</div>
          <h2 className="text-3xl md:text-6xl font-black mb-8 tracking-tighter drop-shadow-sm px-2 break-words leading-tight">{t(bestOptionTitle)}</h2>
          <div className="inline-flex flex-wrap justify-center items-center gap-3 bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/30">
            <span className="text-xs md:text-sm font-medium opacity-80">{t('综合决策分值:')}</span>
            <span className="text-2xl md:text-3xl font-black">{chartData[0].score}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Radar Analysis */}
        <div className="bg-white/60 backdrop-blur-md p-6 md:p-10 rounded-[2.5rem] border border-white shadow-sm flex flex-col overflow-hidden">
          <h3 className="text-xl font-bold text-slate-700 mb-2">{t('价值分布图')}</h3>
          <p className="text-xs text-slate-400 mb-8">{t('展示')} {t(bestOptionTitle)} {t('在各维度的净收益表现')}</p>
          <div className="h-80 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dimensionContribution}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} />
                <Radar
                  name={t('净收益')}
                  dataKey="value"
                  stroke="#7E8AB5"
                  fill="#7E8AB5"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="bg-white/60 backdrop-blur-md p-6 md:p-10 rounded-[2.5rem] border border-white shadow-sm flex flex-col overflow-hidden">
          <h3 className="text-xl font-bold text-slate-700 mb-2">{t('维度影响力分解')}</h3>
          <p className="text-xs text-slate-400 mb-8">{t('哪些价值观决定了这个结果？')}</p>
          <div className="space-y-5">
            {dimensionContribution.sort((a,b) => b.value - a.value).map((dim, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold gap-4">
                  <span className="text-slate-600 break-all">{t(dim.subject)}</span>
                  <span className={`whitespace-nowrap shrink-0 ${dim.value >= 0 ? 'text-indigo-500' : 'text-purple-500'}`}>
                    {dim.value >= 0 ? '+' : ''}{dim.value} {t('影响点')}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  {dim.value >= 0 ? (
                    <div className="bg-indigo-300 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(Math.abs(dim.value)/5, 100)}%` }}></div>
                   ) : (
                    <div className="bg-purple-300 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(Math.abs(dim.value)/5, 100)}%` }}></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison List */}
      <div className="bg-white/60 backdrop-blur-md p-6 md:p-10 rounded-[2.5rem] border border-white shadow-sm">
        <h3 className="text-xl font-bold text-slate-700 mb-10">{t('所有方案对比排位')}</h3>
        <div className="space-y-8">
          {chartData.map((data, idx) => (
            <div key={data.name} className="flex items-center gap-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${idx === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-2 gap-4">
                  <span className="font-black text-slate-700 break-words leading-tight">{t(data.name)}</span>
                  <span className="text-sm font-bold text-slate-400 whitespace-nowrap shrink-0">{data.score} pts</span>
                </div>
                <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-white">
                  <div 
                    className={`h-full transition-all duration-1000 delay-500 ${idx === 0 ? 'bg-gradient-to-r from-indigo-400 to-indigo-500' : 'bg-slate-200'}`}
                    style={{ width: `${Math.max((data.score / (chartData[0].score || 1)) * 100, 5)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 md:p-12 bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white/60 text-center overflow-hidden">
        <div className="w-16 h-1 bg-slate-200 mx-auto mb-8 rounded-full"></div>
        <p className="text-slate-500 italic text-sm max-w-xl mx-auto leading-relaxed">
          “{t('理性的选择不是寻找完美，而是在所有不完美的路径中，找到最符合你当下价值观的那一条。')}”
        </p>
        <p className="text-slate-400 text-xs mt-4 leading-relaxed">
          {t('这个报告基于你对')} <b>{dimensions.length} {t('个价值维度')}</b> {t('的权重定义。如果结果令你惊讶，请回到')}
          <button 
            onClick={onNavigateToDimensions}
            className="text-indigo-600 hover:text-indigo-800 font-extrabold underline transition-all hover:scale-105 inline-block mx-1 focus:outline-none"
          >
            {t('价值建模')}
          </button>
          {t('步骤审视权重。')}
        </p>
      </div>
    </div>
  );
};

export default ResultDashboard;
