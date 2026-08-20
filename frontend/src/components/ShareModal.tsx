import React, { useState } from 'react';
import { X, Share2, Copy, Check, Globe, Lock, ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface ShareModalProps {
  documentId: string;
  isPublic: boolean;
  shareToken: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateShare: (isPublic: boolean) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  documentId,
  isPublic,
  shareToken,
  isOpen,
  onClose,
  onUpdateShare,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const fullShareUrl = `${window.location.origin}/share/${shareToken}`;

  const handleToggleShare = async () => {
    setLoading(true);
    try {
      const res = await apiClient.updateShareSettings(documentId, !isPublic);
      onUpdateShare(res.is_public);
    } catch (err) {
      console.error('Failed to update share settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('share.modalTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('share.modalSubtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Public Toggle Card */}
          <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isPublic ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {isPublic ? t('share.publicToggle') : 'Private'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isPublic ? t('share.publicDesc') : 'Only you can access this document'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleShare}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isPublic ? 'bg-brand-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Share URL Input */}
          {isPublic && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t('share.shareUrl')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullShareUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 select-all font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t('share.copied') : t('share.copy')}</span>
                </button>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>
              {t('share.publicDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
