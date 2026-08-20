import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, Sparkles, Search, Trash2, 
  Share2, ArrowRight, ShieldCheck, CheckCircle2, 
  Calendar, Layers, Clock
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ShareModal } from '../components/ShareModal';
import { apiClient } from '../api/client';
import { DocumentItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArchetype, setSelectedArchetype] = useState<string>('All');
  const [sharingDoc, setSharingDoc] = useState<DocumentItem | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await apiClient.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF document.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const newDoc = await apiClient.uploadDocument(file, (pct) => setUploadProgress(pct));
      navigate(`/doc/${newDoc.id}`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.detail || 'Upload or analysis failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  });

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await apiClient.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const archetypes = ['All', ...Array.from(new Set(documents.map((d) => d.archetype).filter(Boolean)))];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchetype = selectedArchetype === 'All' || doc.archetype === selectedArchetype;
    return matchesSearch && matchesArchetype;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Hero & Upload Dropzone Banner */}
        <div className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-10 border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>{t('dash.welcome')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {t('brand.tagline')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              {t('dash.subtitle')}
            </p>
          </div>

          {/* Upload Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer relative ${
              isDragActive
                ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                : 'border-slate-700/80 hover:border-brand-500/60 bg-slate-900/60 hover:bg-slate-900/90'
            }`}
          >
            <input {...getInputProps()} />

            {uploading ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <h3 className="text-sm font-bold text-white">{t('dash.uploading')}</h3>
                <p className="text-xs text-slate-400">Extracting structure, action items, deadlines, and risk matrix</p>
                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress || 50}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-inner group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {isDragActive ? t('dash.dropTitle') : t('dash.dropTitle')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('dash.dropSubtitle')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Library Section */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                {t('dash.recentDocs')} ({documents.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Past analyses, interactive checklists, and saved copilot sessions
              </p>
            </div>

            {/* Search and filter */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute ltr:left-3 rtl:right-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t('dash.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl ltr:pl-9 rtl:pr-9 ltr:pr-3 rtl:pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-48 sm:w-60"
                />
              </div>

              {archetypes.length > 1 && (
                <select
                  value={selectedArchetype}
                  onChange={(e) => setSelectedArchetype(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                >
                  {archetypes.map((a) => (
                    <option key={a} value={a}>
                      {a === 'All' ? t('act.filterAll') : a}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Document Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 rounded-2xl glass-card animate-pulse" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl border border-slate-800">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">{t('dash.noDocsTitle')}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {t('dash.noDocsSubtitle')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => {
                const totalActions = doc.action_items_total || 0;
                const completedActions = doc.action_items_completed || 0;
                const pct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/doc/${doc.id}`)}
                    className="glass-card-interactive rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between cursor-pointer group relative"
                  >
                    <div>
                      {/* Top badge row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-brand-400" />
                          {doc.archetype}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharingDoc(doc);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title={t('ws.share')}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title={t('dash.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-2 leading-snug mb-2">
                        {doc.title}
                      </h3>

                      {/* Metadata row */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-500" />
                          {doc.page_count} {t('ws.pages')}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>
                    </div>

                    {/* Footer progress bar & open button */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {completedActions}/{totalActions} {t('act.completed')}
                        </span>
                        <span className="font-semibold text-slate-300 font-mono">{pct}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {sharingDoc && (
        <ShareModal
          documentId={sharingDoc.id}
          isPublic={sharingDoc.is_public}
          shareToken={sharingDoc.share_token}
          isOpen={true}
          onClose={() => setSharingDoc(null)}
          onUpdateShare={(isPub) => {
            setDocuments((prev) =>
              prev.map((d) => (d.id === sharingDoc.id ? { ...d, is_public: isPub } : d))
            );
          }}
        />
      )}
    </div>
  );
};
