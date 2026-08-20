import React, { useState } from 'react';
import { 
  X, Wand2, Mail, Lightbulb, ShieldAlert, 
  Table, Copy, Check, Sparkles
} from 'lucide-react';
import { apiClient } from '../api/client';
import { QuickToolResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QuickToolsModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickToolsModal: React.FC<QuickToolsModalProps> = ({
  documentId,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [activeTool, setActiveTool] = useState<string>('email_draft');
  const [extraInstructions, setExtraInstructions] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<QuickToolResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const tools = [
    {
      id: 'email_draft',
      name: t('tools.emailTitle'),
      icon: <Mail className="w-4 h-4 text-brand-400" />,
      description: t('tools.emailDesc'),
    },
    {
      id: 'eli5',
      name: t('tools.eli5Title'),
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      description: t('tools.eli5Desc'),
    },
    {
      id: 'risk_audit',
      name: t('tools.riskTitle'),
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      description: t('tools.riskDesc'),
    },
    {
      id: 'table_extract',
      name: t('tools.tableTitle'),
      icon: <Table className="w-4 h-4 text-emerald-400" />,
      description: t('tools.tableDesc'),
    },
  ];

  const handleRunTool = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await apiClient.executeQuickTool(documentId, activeTool, extraInstructions);
      setResult(data);
    } catch (err) {
      console.error('Failed to run tool:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('tools.modalTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('tools.modalSubtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Tool Selector Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {tools.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTool(item.id);
                  setResult(null);
                }}
                className={`p-3 rounded-xl border text-start transition-all flex flex-col justify-between ${
                  activeTool === item.id
                    ? 'border-brand-500 bg-brand-500/10 shadow-md ring-1 ring-brand-500'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {item.icon}
                  <span className="text-xs font-bold text-white">{item.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{item.description}</p>
              </button>
            ))}
          </div>

          {/* Optional Extra Instructions */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t('tools.instructions')}
            </label>
            <input
              type="text"
              placeholder={t('tools.instructionsPlaceholder')}
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunTool}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('copilot.analyzing')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t('tools.generateBtn')}</span>
              </>
            )}
          </button>

          {/* Output Display */}
          {result && (
            <div className="glass-card rounded-xl p-4 border border-slate-700/80 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  {result.title}
                </h4>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t('tools.copied') : t('tools.copyBtn')}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-lg p-3.5 max-h-60 overflow-y-auto font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                {result.result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
