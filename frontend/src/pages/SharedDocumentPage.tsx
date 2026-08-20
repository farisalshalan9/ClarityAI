import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, CheckSquare, Calendar, ShieldAlert, 
  Sparkles, Lock 
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { PDFViewer } from '../components/PDFViewer';
import { ExecutiveSummary } from '../components/ExecutiveSummary';
import { ActionChecklist } from '../components/ActionChecklist';
import { DeadlinesTimeline } from '../components/DeadlinesTimeline';
import { RiskMatrix } from '../components/RiskMatrix';
import { apiClient } from '../api/client';
import { DocumentDetail } from '../types';

export const SharedDocumentPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'deadlines' | 'risks'>('overview');
  const [activePage, setActivePage] = useState<number>(1);

  useEffect(() => {
    if (token) {
      loadSharedDoc(token);
    }
  }, [token]);

  const loadSharedDoc = async (shareToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getSharedDocument(shareToken);
      setDocument(data);
    } catch (err: any) {
      console.error('Failed to load shared document:', err);
      setError('This shared document is no longer available or access has been restricted by the owner.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar isSharedView />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Loading Shared Document...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar isSharedView />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md glass-panel p-8 rounded-3xl border border-slate-800">
            <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Access Unavailable</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const completedActions = document.action_items.filter((a) => a.is_completed).length;
  const totalActions = document.action_items.length;

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <Navbar currentDoc={document} isSharedView />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden max-w-[1700px] w-full mx-auto">
        {/* Left Column: PDF Viewer */}
        <div className="lg:col-span-7 h-[50vh] lg:h-full overflow-hidden flex flex-col">
          <PDFViewer
            documentId={document.id}
            pageCount={document.page_count}
            activePage={activePage}
            onPageChange={(p) => setActivePage(p)}
            isShared
            shareToken={token}
          />
        </div>

        {/* Right Column: Read-Only Intelligence Hub */}
        <div className="lg:col-span-5 h-[50vh] lg:h-full flex flex-col bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab Header */}
          <div className="border-b border-slate-800 bg-slate-950/80 px-3 pt-3 flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                activeTab === 'overview'
                  ? 'border-brand-500 text-brand-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                activeTab === 'actions'
                  ? 'border-brand-500 text-brand-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tasks ({completedActions}/{totalActions})</span>
            </button>

            <button
              onClick={() => setActiveTab('deadlines')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                activeTab === 'deadlines'
                  ? 'border-brand-500 text-brand-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Deadlines ({document.deadlines.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('risks')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                activeTab === 'risks'
                  ? 'border-brand-500 text-brand-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Risks</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {activeTab === 'overview' && (
              <ExecutiveSummary
                analysis={document.analysis}
                archetype={document.archetype}
                pageCount={document.page_count}
                onJumpToPage={(p) => setActivePage(p)}
              />
            )}

            {activeTab === 'actions' && (
              <ActionChecklist
                documentId={document.id}
                items={document.action_items}
                onItemsChange={() => {}}
                onJumpToPage={(p) => setActivePage(p)}
                isReadOnly
              />
            )}

            {activeTab === 'deadlines' && (
              <DeadlinesTimeline
                documentId={document.id}
                deadlines={document.deadlines}
                onJumpToPage={(p) => setActivePage(p)}
                isReadOnly
              />
            )}

            {activeTab === 'risks' && (
              <RiskMatrix
                items={document.analysis?.risks_and_requirements || []}
                onJumpToPage={(p) => setActivePage(p)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
