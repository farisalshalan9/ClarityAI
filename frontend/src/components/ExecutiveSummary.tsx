import React, { useState } from 'react';
import { 
  Sparkles, Users, Target, FileText, Copy, Check, Eye
} from 'lucide-react';
import { DocumentAnalysis } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExecutiveSummaryProps {
  analysis?: DocumentAnalysis;
  archetype?: string;
  pageCount?: number;
  onJumpToPage?: (page: number, snippet?: string) => void;
  onHoverItem?: (page: number, snippet?: string) => void;
  onNavigateTab?: (tab: 'actions' | 'deadlines' | 'chat') => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  analysis,
  archetype = 'General Document',
  pageCount = 1,
  onJumpToPage,
  onHoverItem,
}) => {
  const { t, language } = useLanguage();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

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
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900/80 to-slate-900 border border-brand-500/20 shadow-lg relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              {archetype}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {pageCount} {t('ws.pages')}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">{t('tab.overview')}</h3>
        </div>

        <button
          onClick={() => handleCopy(analysis.executive_summary, 'summary')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          title="Copy Executive Summary"
        >
          {copiedSection === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedSection === 'summary' ? t('share.copied') : 'Copy'}</span>
        </button>
      </div>

      {/* Summary Paragraphs */}
      <div 
        className="glass-card rounded-2xl p-4.5 border border-slate-800/80 hover:border-brand-500/40 transition-colors cursor-pointer group"
        onMouseEnter={() => onHoverItem?.(1, 'Executive Briefing')}
        onClick={() => onJumpToPage?.(1, 'Executive Briefing')}
      >
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            {t('exec.coreSynthesis')}
          </h4>
          <span className="text-[10px] text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-semibold">
            <Eye className="w-3 h-3" />
            {t('ws.pages')} 1
          </span>
        </div>
        <div className="text-xs leading-relaxed text-slate-200 space-y-2.5 whitespace-pre-line font-normal">
          {analysis.executive_summary}
        </div>
      </div>

      {/* Key Takeaways */}
      {analysis.key_takeaways && analysis.key_takeaways.length > 0 && (
        <div className="glass-card rounded-2xl p-4.5 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              {t('exec.keyTakeaways')}
            </h4>
            <span className="text-[11px] text-slate-400">
              💡 {language === 'ar' ? 'مرر المؤشر لمعاينة الصفحة فوراً' : 'Hover over any point to preview in PDF'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {analysis.key_takeaways.map((takeaway, idx) => {
              const targetPage = Math.min(idx + 1, pageCount);
              return (
                <div
                  key={idx}
                  onMouseEnter={() => onHoverItem?.(targetPage, takeaway.slice(0, 35))}
                  onClick={() => onJumpToPage?.(targetPage, takeaway.slice(0, 35))}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-emerald-500/50 hover:bg-slate-900/90 text-xs text-slate-200 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 font-mono text-[11px] font-bold mt-0.5 group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </div>
                    <span className="leading-snug group-hover:text-white transition-colors">{takeaway}</span>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/30 flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" />
                      {t('ws.pages')} {targetPage}
                    </span>
                  </div>
                </div>
              );
            })}
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
                className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5 hover:bg-indigo-500/20 transition-colors"
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
