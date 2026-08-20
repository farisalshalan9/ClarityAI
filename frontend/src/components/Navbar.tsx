import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileText, Share2, Calendar, 
  Wand2, LogOut, ArrowLeft, ShieldCheck, Languages
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DocumentDetail } from '../types';

interface NavbarProps {
  currentDoc?: DocumentDetail | null;
  onOpenShare?: () => void;
  onOpenQuickTools?: () => void;
  onDownloadCalendar?: () => void;
  isSharedView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDoc,
  onOpenShare,
  onOpenQuickTools,
  onDownloadCalendar,
  isSharedView = false,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
              {t('brand.name')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline">
              {t('brand.tagline')}
            </span>
          </div>
        </Link>

        {currentDoc && !isSharedView && (
          <div className="flex items-center gap-2 px-3 border-x border-slate-800">
            <Link
              to="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title={t('ws.back')}
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span className="hidden md:inline">{t('ws.back')}</span>
            </Link>

            <span className="text-slate-600">/</span>

            <div className="flex items-center gap-2 max-w-[180px] lg:max-w-xs truncate">
              <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-200 truncate" title={currentDoc.title}>
                {currentDoc.title}
              </span>
            </div>

            {currentDoc.archetype && (
              <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <ShieldCheck className="w-3 h-3" />
                {currentDoc.archetype}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 rounded-lg transition-all shadow-sm"
          title="Switch Language / تبديل اللغة"
        >
          <Languages className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-mono text-[11px] uppercase">{language === 'en' ? 'العربية' : 'EN'}</span>
        </button>

        {currentDoc && !isSharedView && (
          <>
            {onDownloadCalendar && (
              <button
                onClick={onDownloadCalendar}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all shadow-sm"
                title={t('ws.exportCalendar')}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">{t('ws.exportCalendar')}</span>
              </button>
            )}

            {onOpenQuickTools && (
              <button
                onClick={onOpenQuickTools}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-all shadow-sm"
                title={t('ws.quickTools')}
              >
                <Wand2 className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
                <span>{t('ws.quickTools')}</span>
              </button>
            )}

            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all shadow-sm"
                title={t('ws.share')}
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">{t('ws.share')}</span>
              </button>
            )}
          </>
        )}

        {isSharedView ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full font-medium">
              Shared Preview
            </span>
            <Link
              to="/auth"
              className="px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors shadow-sm"
            >
              {t('nav.login')}
            </Link>
          </div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-2.5 px-2 border-slate-800 border-x">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-start">
              <span className="text-xs font-medium text-slate-200 leading-tight">
                {user.full_name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                {user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
              title={t('nav.logout')}
            >
              <LogOut className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="px-4 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors shadow-sm"
          >
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
};
