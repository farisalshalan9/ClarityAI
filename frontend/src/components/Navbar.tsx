import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, FileText, Share2, 
  Wand2, LogOut, ArrowLeft, ShieldCheck, Languages,
  ChevronDown, Mail, Lightbulb, ShieldAlert, Table
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DocumentDetail } from '../types';

interface NavbarProps {
  currentDoc?: DocumentDetail | null;
  onOpenShare?: () => void;
  onSelectQuickTool?: (toolId: string) => void;
  isSharedView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDoc,
  onOpenShare,
  onSelectQuickTool,
  isSharedView = false,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
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
          <div className="flex items-center gap-2 sm:gap-3 ltr:pl-3 rtl:pr-3 ltr:border-l rtl:border-r border-slate-800">
            <Link
              to="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title={t('ws.back')}
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span className="hidden md:inline">{t('ws.back')}</span>
            </Link>

            <span className="text-slate-600 hidden sm:inline">/</span>

            <div className="flex items-center gap-2 max-w-[140px] sm:max-w-[180px] lg:max-w-xs truncate">
              <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-200 truncate" title={currentDoc.title}>
                {currentDoc.title}
              </span>
            </div>

            {/* Separated Quick Actions Dropdown Menu on the Left */}
            {onSelectQuickTool && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 border border-brand-500/30 rounded-xl transition-all shadow-sm group"
                >
                  <Wand2 className="w-3.5 h-3.5 text-brand-400 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">{t('ws.quickTools')}</span>
                  <ChevronDown className={`w-3 h-3 text-brand-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute ltr:left-0 rtl:right-0 mt-2 w-72 sm:w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                    <div className="px-3 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('tools.modalTitle')}</span>
                      <span className="text-[10px] text-brand-400 font-medium">Gemini 3.5</span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectQuickTool('email_draft');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/80 text-start transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-brand-300 transition-colors">
                          {t('tools.emailTitle')}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {t('tools.emailDesc')}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onSelectQuickTool('eli5');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/80 text-start transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                          {t('tools.eli5Title')}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {t('tools.eli5Desc')}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onSelectQuickTool('risk_audit');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/80 text-start transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-rose-300 transition-colors">
                          {t('tools.riskTitle')}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {t('tools.riskDesc')}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onSelectQuickTool('table_extract');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/80 text-start transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <Table className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                          {t('tools.tableTitle')}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {t('tools.tableDesc')}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
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
