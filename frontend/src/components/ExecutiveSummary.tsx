import React from 'react';
import { 
  Sparkles, Users, Target, FileText
} from 'lucide-react';
import { DocumentAnalysis } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExecutiveSummaryProps {
  analysis?: DocumentAnalysis;
  archetype?: string;
  pageCount?: number;
  onJumpToPage?: (page: number) => void;
  onNavigateTab?: (tab: 'actions' | 'deadlines' | 'chat') => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  analysis,
  archetype = 'General Document',
  pageCount = 1,
}) => {
  const { t } = useLanguage();

  if (!analysis) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <h4 className="text-sm font-medium text-slate-300">Extracting executive intelligence...</h4>
        <p className="text-xs text-slate-500 mt-1">Analyzing layout, key terms, and obligations</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Archetype & Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900/80 to-slate-900 border border-brand-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            {archetype}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {pageCount} {t('ws.pages')}
          </span>
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight">{t('tab.overview')}</h3>
      </div>

      {/* Summary Paragraphs */}
      <div className="glass-card rounded-2xl p-4.5 border border-slate-800/80">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-brand-400" />
          {t('exec.coreSynthesis')}
        </h4>
        <div className="text-xs leading-relaxed text-slate-200 space-y-2.5 whitespace-pre-line font-normal">
          {analysis.executive_summary}
        </div>
      </div>

      {/* Key Takeaways */}
      {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
        <div className="glass-card rounded-2xl p-4.5 border border-slate-800/80">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            {t('exec.keyTakeaways')}
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {analysis.key_takeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-200"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 font-mono text-[11px] font-bold mt-0.5">
                  {idx + 1}
                </div>
                <span className="leading-snug">{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stakeholders Identified */}
      {analysis.stakeholders && analysis.stakeholders.length > 0 && (
        <div className="glass-card rounded-2xl p-4.5 border border-slate-800/80">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            {t('exec.stakeholders')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.stakeholders.map((s, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
