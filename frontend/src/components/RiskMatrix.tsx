import React from 'react';
import { 
  ShieldAlert, AlertCircle, 
  CheckCircle, FileWarning, Eye 
} from 'lucide-react';
import { RiskRequirement } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface RiskMatrixProps {
  items: RiskRequirement[];
  onJumpToPage: (page: number, snippet?: string) => void;
  onHoverItem?: (page: number, snippet?: string) => void;
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ items, onJumpToPage, onHoverItem }) => {
  const { t, language } = useLanguage();

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return t('risk.critical');
      case 'high':
        return t('risk.high');
      case 'medium':
        return t('risk.medium');
      case 'low':
        return t('risk.low');
      default:
        return severity;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'red flag':
      case 'risk':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'financial':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <FileWarning className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="glass-card rounded-2xl p-4.5 border border-slate-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            {t('risk.title')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('risk.subtitle')}
          </p>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          {language === 'ar' ? '💡 مرر المؤشر لمعاينة البند في المستند' : '💡 Hover over any risk to preview in PDF'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 glass-card rounded-2xl">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-xs text-slate-300 font-medium">{t('dl.noDeadlines')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => {
                if (item.page_number) onHoverItem?.(item.page_number, item.description.slice(0, 35));
              }}
              onClick={() => {
                if (item.page_number) onJumpToPage(item.page_number, item.description.slice(0, 35));
              }}
              className="glass-card-interactive rounded-xl p-3.5 border border-slate-800/80 hover:border-rose-500/50 hover:bg-slate-900/90 flex items-start gap-3 cursor-pointer transition-all shadow-sm"
            >
              <div className="mt-0.5 flex-shrink-0">{getTypeIcon(item.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-white">{item.type}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getSeverityBadge(
                      item.severity
                    )}`}
                  >
                    {getSeverityLabel(item.severity)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                {item.page_number && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToPage(item.page_number!, item.description.slice(0, 35));
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 flex items-center gap-1 transition-colors"
                      title={`${t('exec.jumpCitation')} ${item.page_number}`}
                    >
                      <Eye className="w-2.5 h-2.5" />
                      {t('ws.pages')} {item.page_number}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
