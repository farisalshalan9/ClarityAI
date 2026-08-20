import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, CheckSquare, Calendar, ShieldAlert, 
  MessageSquare, RefreshCw
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { PDFViewer } from '../components/PDFViewer';
import { ExecutiveSummary } from '../components/ExecutiveSummary';
import { ActionChecklist } from '../components/ActionChecklist';
import { DeadlinesTimeline } from '../components/DeadlinesTimeline';
import { RiskMatrix } from '../components/RiskMatrix';
import { ChatCopilot } from '../components/ChatCopilot';
import { QuickToolsModal } from '../components/QuickToolsModal';
import { ShareModal } from '../components/ShareModal';
import { apiClient } from '../api/client';
import { DocumentDetail } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'deadlines' | 'risks' | 'chat'>('overview');
  const [activePage, setActivePage] = useState<number>(1);
  const [highlightSnippet, setHighlightSnippet] = useState<string | null>(null);

  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState<boolean>(false);
  const [selectedQuickTool, setSelectedQuickTool] = useState<string>('email_draft');
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [reanalyzing, setReanalyzing] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadDocument(id);
    }
  }, [id]);

  // Tab navigation keyboard shortcuts (1-5)
  useEffect(() => {
    const handleTabShortcuts = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === '1') setActiveTab('overview');
      else if (e.key === '2') setActiveTab('actions');
      else if (e.key === '3') setActiveTab('deadlines');
      else if (e.key === '4') setActiveTab('risks');
      else if (e.key === '5') setActiveTab('chat');
    };

    window.addEventListener('keydown', handleTabShortcuts);
    return () => window.removeEventListener('keydown', handleTabShortcuts);
  }, []);

  const loadDocument = async (docId: string) => {
    setLoading(true);
    try {
      const data = await apiClient.getDocument(docId);
      setDocument(data);
    } catch (err) {
      console.error('Failed to load document:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToPage = (pageNum: number, snippet?: string) => {
    setActivePage(pageNum);
    if (snippet) {
      setHighlightSnippet(snippet);
      setTimeout(() => setHighlightSnippet(null), 3500);
    }
  };

  const handleHoverItem = (pageNum: number, snippet?: string) => {
    setActivePage(pageNum);
    if (snippet) {
      setHighlightSnippet(snippet);
    }
  };

  const handleReanalyze = async () => {
    if (!id || reanalyzing) return;
    setReanalyzing(true);
    try {
      const updated = await apiClient.reanalyzeDocument(id);
      setDocument(updated);
    } catch (err) {
      console.error('Failed to reanalyze:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleSelectQuickTool = (toolId: string) => {
    setSelectedQuickTool(toolId);
    setIsQuickToolsOpen(true);
  };

  if (loading || !document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">{t('copilot.analyzing')}</span>
          </div>
        </div>
      </div>
    );
  }

  const completedActions = document.action_items.filter((a) => a.is_completed).length;
  const totalActions = document.action_items.length;

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Navbar with Left-side Separated Quick Actions Dropdown */}
      <Navbar
        currentDoc={document}
        onOpenShare={() => setIsShareOpen(true)}
        onSelectQuickTool={handleSelectQuickTool}
      />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden max-w-[1700px] w-full mx-auto">
        {/* Left Column: PDF Viewer (7 of 12 columns on large screens) */}
        <div className="lg:col-span-7 h-[50vh] lg:h-full overflow-hidden flex flex-col">
          <PDFViewer
            documentId={document.id}
            pageCount={document.page_count}
            activePage={activePage}
            onPageChange={(p) => setActivePage(p)}
            highlightSnippet={highlightSnippet}
          />
        </div>

        {/* Right Column: Action Intelligence Hub & Copilot (5 of 12 columns) */}
        <div className="lg:col-span-5 h-[50vh] lg:h-full flex flex-col bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab Navigation Header */}
          <div className="border-b border-slate-800 bg-slate-950/80 px-3 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                  activeTab === 'overview'
                    ? 'border-brand-500 text-brand-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
                title="Overview (Key: 1)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('tab.overview')}</span>
              </button>

              <button
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                  activeTab === 'actions'
                    ? 'border-brand-500 text-brand-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
                title="Actions (Key: 2)"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('tab.actions')} ({completedActions}/{totalActions})</span>
              </button>

              <button
                onClick={() => setActiveTab('deadlines')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                  activeTab === 'deadlines'
                    ? 'border-brand-500 text-brand-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
                title="Deadlines (Key: 3)"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('tab.deadlines')} ({document.deadlines.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('risks')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                  activeTab === 'risks'
                    ? 'border-brand-500 text-brand-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
                title="Risks (Key: 4)"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('tab.risks')}</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                  activeTab === 'chat'
                    ? 'border-brand-500 text-brand-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
                title="Copilot (Key: 5)"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('tab.chat')}</span>
              </button>
            </div>

            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="p-1.5 text-slate-400 hover:text-brand-300 rounded-lg hover:bg-slate-800 transition-colors mb-1"
              title={t('ws.reanalyze')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {activeTab === 'overview' && (
              <ExecutiveSummary
                analysis={document.analysis}
                archetype={document.archetype}
                pageCount={document.page_count}
                onJumpToPage={handleJumpToPage}
                onHoverItem={handleHoverItem}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
              />
            )}

            {activeTab === 'actions' && (
              <ActionChecklist
                documentId={document.id}
                items={document.action_items}
                onItemsChange={(newItems) =>
                  setDocument((prev) => (prev ? { ...prev, action_items: newItems } : null))
                }
                onJumpToPage={handleJumpToPage}
                onHoverItem={handleHoverItem}
                onReanalyze={handleReanalyze}
                reanalyzing={reanalyzing}
              />
            )}

            {activeTab === 'deadlines' && (
              <DeadlinesTimeline
                documentId={document.id}
                deadlines={document.deadlines}
                onJumpToPage={handleJumpToPage}
                onHoverItem={handleHoverItem}
              />
            )}

            {activeTab === 'risks' && (
              <RiskMatrix
                items={document.analysis?.risks_and_requirements || []}
                onJumpToPage={handleJumpToPage}
                onHoverItem={handleHoverItem}
              />
            )}

            {activeTab === 'chat' && (
              <ChatCopilot
                documentId={document.id}
                onJumpToPage={handleJumpToPage}
                documentTitle={document.title}
                archetype={document.archetype}
                suggestedQuestions={document.analysis?.suggested_questions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickToolsModal
        documentId={document.id}
        isOpen={isQuickToolsOpen}
        onClose={() => setIsQuickToolsOpen(false)}
        initialTool={selectedQuickTool}
      />

      <ShareModal
        documentId={document.id}
        isPublic={document.is_public}
        shareToken={document.share_token}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onUpdateShare={(isPub) =>
          setDocument((prev) => (prev ? { ...prev, is_public: isPub } : null))
        }
      />
    </div>
  );
};
