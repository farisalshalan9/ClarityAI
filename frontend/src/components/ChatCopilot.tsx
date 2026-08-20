import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, User as UserIcon, Bot, 
  RefreshCw, ArrowRight, Lightbulb
} from 'lucide-react';
import { ChatMessage } from '../types';
import { apiClient } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface ChatCopilotProps {
  documentId: string;
  onJumpToPage: (page: number, snippet?: string) => void;
  documentTitle?: string;
  archetype?: string;
  suggestedQuestions?: string[];
}

export const ChatCopilot: React.FC<ChatCopilotProps> = ({
  documentId,
  onJumpToPage,
  archetype = 'General Document',
  suggestedQuestions = [],
}) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic contextual question library adapted to language & document
  const getCategorizedSuggestions = () => {
    const isAr = language === 'ar';

    const defaultDocSpecificEn = [
      `What are the primary obligations in this ${archetype.toLowerCase()}?`,
      `Are there any critical deadlines or time-sensitive deliverables?`,
      `What are the most significant risks, penalties, or liabilities?`,
      `Summarize the key deliverables and assigned responsibilities`,
    ];

    const defaultDocSpecificAr = [
      `ما هي الالتزامات والمسؤوليات الرئيسية في هذا المستند؟`,
      `هل توجد مواعيد تسليم أو مدد زمنية ملزمة أو مواعيد انتهاء؟`,
      `ما هي أبرز المخاطر، الشروط الجزائية، أو البنود المقيدة؟`,
      `لخّص أهم المخرجات المطلوبة والجهات المسؤولة عنها`,
    ];

    const docSpecific = suggestedQuestions && suggestedQuestions.length > 0
      ? suggestedQuestions
      : (isAr ? defaultDocSpecificAr : defaultDocSpecificEn);

    const clausesQuestionsEn = [
      `What are the governing terms, laws, and dispute resolution clauses?`,
      `Are there any termination or breach provisions?`,
      `What warranties, representations, or guarantees are outlined?`,
    ];

    const clausesQuestionsAr = [
      `ما هو القانون الحاكم وإجراءات فض النزاعات المحددة؟`,
      `ما هي شروط إنهاء الاتفاقية أو حالات الإخلال بالعقد؟`,
      `ما هي الضمانات والتعهدات المنصوص عليها؟`,
    ];

    const financialQuestionsEn = [
      `What are all financial obligations, payments, fees, or penalty amounts?`,
      `When are payments due and what are the payment milestones?`,
      `Are there late fees, liquidated damages, or refund policies?`,
    ];

    const financialQuestionsAr = [
      `ما هي كافة الالتزامات المالية، المبالغ المستحقة، والغرامات؟`,
      `متى تستحق الدفعات وما هي مراحل السداد المحددة؟`,
      `هل توجد غرامات تأخير أو تعويضات اتفاقية محددة؟`,
    ];

    const risksQuestionsEn = [
      `What are the top 3 biggest red flags or unfair terms in this document?`,
      `Are there any vague or ambiguous clauses that need clarification?`,
      `What happens in a worst-case non-performance or breach scenario?`,
    ];

    const risksQuestionsAr = [
      `ما هي أهم 3 بنود حرجة أو شروط غير متكافئة في المستند؟`,
      `هل توجد بنود غامضة أو غير محددة تحتاج إلى توضيح؟`,
      `ما هي الآثار المترتبة في حال تعذر التنفيذ أو الإخلال؟`,
    ];

    const clauses = isAr ? clausesQuestionsAr : clausesQuestionsEn;
    const financials = isAr ? financialQuestionsAr : financialQuestionsEn;
    const risks = isAr ? risksQuestionsAr : risksQuestionsEn;

    return {
      [t('copilot.catAll')]: docSpecific,
      [t('copilot.catObligations')]: [docSpecific[0] || (isAr ? 'ما هي الالتزامات؟' : 'What are obligations?'), ...clauses.slice(0, 2)],
      [t('copilot.catRisks')]: [docSpecific[2] || (isAr ? 'ما هي المخاطر والغرامات؟' : 'What are risks?'), ...risks],
      [t('copilot.catFinancials')]: [docSpecific[1] || (isAr ? 'ما هي المواعيد والمالية؟' : 'What are payments?'), ...financials],
    };
  };

  const categorizedSuggestions = getCategorizedSuggestions();
  const categoryKeys = Object.keys(categorizedSuggestions);
  const currentSuggestions = categorizedSuggestions[activeCategory] || categorizedSuggestions[categoryKeys[0]] || [];

  useEffect(() => {
    loadChatHistory();
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const history = await apiClient.getChatHistory(documentId);
      setMessages(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage.trim();
    if (!query || isLoading) return;

    setInputMessage('');
    setIsLoading(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      document_id: documentId,
      role: 'user',
      content: query,
      citations: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const botResponse = await apiClient.sendChatMessage(documentId, query);
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, botResponse]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: string, citations?: Array<{ page: number; snippet?: string }>) => {
    const parts = content.split(/(\[Page\s*\d+\])/gi);
    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-200">
        <p className="whitespace-pre-line">
          {parts.map((part, i) => {
            const match = part.match(/\[Page\s*(\d+)\]/i);
            if (match) {
              const pageNum = parseInt(match[1]);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onJumpToPage(pageNum, `Page ${pageNum}`)}
                  className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 border border-brand-500/30 transition-colors shadow-sm"
                  title={`${t('exec.jumpCitation')} ${pageNum}`}
                >
                  <Sparkles className="w-2.5 h-2.5 text-brand-400" />
                  {t('ws.pages')} {pageNum}
                </button>
              );
            }
            return part;
          })}
        </p>

        {citations && citations.length > 0 && (
          <div className="pt-2 mt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-slate-400 font-medium">{t('copilot.sourceCitations')}</span>
            {citations.map((c, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => onJumpToPage(c.page, c.snippet)}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-brand-300 border border-slate-700/60 flex items-center gap-1 transition-colors"
              >
                {t('ws.pages')} {c.page}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[650px] max-h-[75vh] glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              {t('copilot.headerTitle')}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400">{t('copilot.headerSubtitle')}</p>
          </div>
        </div>

        <button
          onClick={loadChatHistory}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-3 py-4">
            <div className="w-11 h-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-2.5 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-0.5">
              {t('copilot.welcomeTitle')}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {t('copilot.welcomeSubtitle')}
            </p>

            {/* Topic Category Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 w-full max-w-md">
              {categoryKeys.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    (activeCategory === cat || (!activeCategory && cat === categoryKeys[0]))
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 border border-slate-700/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Adaptive Suggested Questions Cards */}
            <div className="w-full max-w-md space-y-2">
              {currentSuggestions.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-start p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group shadow-sm"
                >
                  <span className="truncate mr-2 rtl:mr-0 rtl:ml-2 font-medium">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id || idx} className="space-y-2">
              <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white shadow-md mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md border ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white border-brand-500 rounded-br-none rtl:rounded-br-2xl rtl:rounded-bl-none'
                      : 'bg-slate-900/90 text-slate-200 border-slate-800 rounded-bl-none rtl:rounded-bl-2xl rtl:rounded-br-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                  ) : (
                    renderMessageContent(msg.content, msg.citations)
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-300 shadow mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Dynamic Follow-up Suggestions on latest message */}
              {msg.role === 'assistant' && idx === messages.length - 1 && !isLoading && (
                <div className="ltr:pl-10 rtl:pr-10 pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <Lightbulb className="w-2.5 h-2.5 text-amber-400" /> {t('copilot.followUp')}
                  </span>
                  {(language === 'ar' ? [
                    'اشرح لي بلغة مبسطة جداً',
                    'ما هي الخطوات الإجرائية التالية؟',
                    'هل توجد أي غرامات أو مسؤوليات متعلقة بهذا؟'
                  ] : [
                    'Explain in simpler terms',
                    'What are the concrete next steps?',
                    'Are there any penalties related to this?'
                  ]).map((followUp, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => handleSendMessage(followUp)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white shadow-md">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 ltr:rounded-bl-none rtl:rounded-br-none flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
              <span className="text-xs text-slate-400">{t('copilot.analyzing')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={t('copilot.inputPlaceholder')}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white rounded-xl transition-all shadow-md flex items-center justify-center flex-shrink-0"
            title="Send"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
