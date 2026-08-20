import React from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { Deadline } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DeadlinesTimelineProps {
  documentId: string;
  deadlines: Deadline[];
  onJumpToPage: (page: number) => void;
  isReadOnly?: boolean;
}

export const DeadlinesTimeline: React.FC<DeadlinesTimelineProps> = ({
  deadlines,
  onJumpToPage,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 pb-6">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-4.5 border border-slate-800/80">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          {t('dl.title')}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {t('dl.subtitle')}
        </p>
      </div>

      {/* Timeline List */}
      {deadlines.length === 0 ? (
        <div className="text-center py-10 glass-card rounded-2xl">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{t('dl.noDeadlines')}</p>
        </div>
      ) : (
        <div className="relative ltr:pl-6 rtl:pr-6 space-y-4 before:absolute ltr:before:left-2.5 rtl:before:right-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {deadlines.map((d, idx) => (
            <div key={d.id || idx} className="relative group">
              {/* Timeline dot */}
              <div className="absolute ltr:-left-6 rtl:-right-6 top-3 w-5 h-5 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center shadow-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              {/* Deadline Card */}
              <div className="glass-card-interactive rounded-xl p-3.5 border border-slate-800/80 hover:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{d.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                        {d.category || 'Milestone'}
                      </span>
                    </div>

                    {d.description && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {d.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {d.due_date}
                      </span>

                      {d.page_number && (
                        <button
                          type="button"
                          onClick={() => onJumpToPage(d.page_number!)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 flex items-center gap-1 transition-colors"
                          title={`${t('exec.jumpCitation')} ${d.page_number}`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {t('ws.pages')} {d.page_number}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
