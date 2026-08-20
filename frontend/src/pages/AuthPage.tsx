import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Zap, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export const AuthPage: React.FC = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await apiClient.register(email, password, fullName);
        login(res.access_token, res.user);
      } else {
        const res = await apiClient.login(email, password);
        login(res.access_token, res.user);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      let detail = err.response?.data?.detail;
      if (!detail) {
        if (!err.response || err.message === 'Network Error') {
          detail = language === 'ar'
            ? 'تعذر الاتصال بخادم الـ Backend. يرجى التأكد من تشغيل الخادم وضبط VITE_API_URL في Vercel.'
            : 'Cannot connect to backend server. If using Vercel, please deploy the backend to Render/Railway and set VITE_API_URL.';
        } else {
          detail = language === 'ar'
            ? 'فشل تسجيل الدخول. يرجى التحقق من صحة البريد الإلكتروني وكلمة المرور، أو النقر على "إنشاء الحساب".'
            : 'Authentication failed. Please check your credentials or click "Create Account".';
        }
      }
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      try {
        const res = await apiClient.login('demo@clarityai.app', 'demoPassword123!');
        login(res.access_token, res.user);
      } catch (err) {
        const res = await apiClient.register('demo@clarityai.app', 'demoPassword123!', 'Alex Morgan (Demo)');
        login(res.access_token, res.user);
      }
      navigate('/');
    } catch (err: any) {
      const isNetErr = !err.response || err.message === 'Network Error';
      setError(
        isNetErr
          ? (language === 'ar'
              ? 'تعذر الاتصال بخادم الـ Backend. تأكد من تشغيل خادم الـ API.'
              : 'Cannot connect to backend API server. Please ensure backend is running or set VITE_API_URL.')
          : (err.response?.data?.detail || 'Could not initialize demo account.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Top Language Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-md"
        >
          <Languages className="w-3.5 h-3.5 text-brand-400" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-2xl shadow-brand-500/30 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
            {t('brand.name')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {t('brand.tagline')}
          </p>
        </div>

        {/* Form Panel */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
          <div className="flex border-b border-slate-800 pb-4 mb-6">
            <button
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 pb-2 text-xs font-bold transition-colors text-center border-b-2 -mb-[18px] ${
                !isRegister
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t('auth.signInBtn')}
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 pb-2 text-xs font-bold transition-colors text-center border-b-2 -mb-[18px] ${
                isRegister
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t('auth.signUpBtn')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl ltr:pl-10 rtl:pr-10 ltr:pr-3.5 rtl:pl-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl ltr:pl-10 rtl:pr-10 ltr:pr-3.5 rtl:pl-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute ltr:left-3.5 rtl:right-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl ltr:pl-10 rtl:pr-10 ltr:pr-3.5 rtl:pl-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? t('auth.signUpBtn') : t('auth.signInBtn')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors group"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>{t('auth.demoBtn')}</span>
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted JWT Sessions & Secure Document Storage</span>
        </div>
      </div>
    </div>
  );
};
