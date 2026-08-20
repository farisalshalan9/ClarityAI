import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations = {
  // Brand & Nav
  'brand.name': { en: 'ClarityAI', ar: 'كلاريتي AI' },
  'brand.tagline': { en: 'Understands any PDF in seconds and know what to do next', ar: 'يفهم أي مستند PDF في ثوانٍ ويحدد لك خطوتك التالية' },
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'nav.logout': { en: 'Sign Out', ar: 'تسجيل الخروج' },
  'nav.login': { en: 'Sign In', ar: 'تسجيل الدخول' },
  'nav.register': { en: 'Create Account', ar: 'إنشاء حساب' },
  'nav.language': { en: 'Language', ar: 'اللغة' },

  // Dashboard
  'dash.welcome': { en: 'Document Intelligence Hub', ar: 'مركز الذكاء الاصطناعي للمستندات' },
  'dash.subtitle': { en: 'Upload contracts, technical specs, research papers, or financial invoices for instant synthesis & action planning.', ar: 'ارفع العقود، المواصفات التقنية، الأوراق البحثية، أو الفواتير للتلخيص الفوري وخطة العمل.' },
  'dash.dropTitle': { en: 'Drop your PDF document here', ar: 'اسحب وأفلت ملف الـ PDF هنا' },
  'dash.dropSubtitle': { en: 'Supports multi-page contracts, invoices, research, and forms up to 50MB', ar: 'يدعم العقود متعددة الصفحات، الفواتير، الأبحاث، والنماذج حتى 50 ميغابايت' },
  'dash.browse': { en: 'Browse Files', ar: 'استعراض الملفات' },
  'dash.uploading': { en: 'Processing & Analyzing Document...', ar: 'جاري رفع وتحليل المستند بالذكاء الاصطناعي...' },
  'dash.recentDocs': { en: 'Your Analyzed Documents', ar: 'المستندات المحللة الخاصة بك' },
  'dash.noDocsTitle': { en: 'No documents analyzed yet', ar: 'لا توجد مستندات بعد' },
  'dash.noDocsSubtitle': { en: 'Upload your first PDF above or test with one of our pre-built samples:', ar: 'ارفع مستندك الأول أعلاه أو جرّب أحد النماذج الجاهزة:' },
  'dash.sampleNda': { en: 'Sample Legal NDA Contract', ar: 'نموذج اتفاقية عدم إفصاح قانونية' },
  'dash.sampleSpecs': { en: 'Sample Nexus Technical Architecture', ar: 'نموذج مواصفات معمارية برمجية' },
  'dash.search': { en: 'Search analyzed documents...', ar: 'بحث في المستندات المحللة...' },
  'dash.colName': { en: 'Document', ar: 'المستند' },
  'dash.colArchetype': { en: 'Archetype', ar: 'النوع' },
  'dash.colPages': { en: 'Pages', ar: 'الصفحات' },
  'dash.colActions': { en: 'Action Progress', ar: 'إنجاز المهام' },
  'dash.colDate': { en: 'Analyzed Date', ar: 'تاريخ التحليل' },
  'dash.open': { en: 'Open Workspace', ar: 'فتح مساحة العمل' },
  'dash.delete': { en: 'Delete', ar: 'حذف' },

  // Workspace Header
  'ws.back': { en: 'Dashboard', ar: 'الرئيسية' },
  'ws.share': { en: 'Share', ar: 'مشاركة' },
  'ws.exportCalendar': { en: 'Export Calendar (.ics)', ar: 'تصدير للتقويم (.ics)' },
  'ws.reanalyze': { en: 'Re-analyze with Gemini', ar: 'إعادة التحليل بـ Gemini' },
  'ws.quickTools': { en: 'Quick Actions', ar: 'أدوات سريعة' },
  'ws.pages': { en: 'Pages', ar: 'الصفحات' },

  // PDF Viewer
  'pdf.toggleThumbnails': { en: 'Toggle Thumbnails', ar: 'عرض المصغرات' },
  'pdf.prevPage': { en: 'Previous Page', ar: 'الصفحة السابقة' },
  'pdf.nextPage': { en: 'Next Page', ar: 'الصفحة التالية' },
  'pdf.zoomIn': { en: 'Zoom In', ar: 'تكبير' },
  'pdf.zoomOut': { en: 'Zoom Out', ar: 'تصغير' },
  'pdf.rotate': { en: 'Rotate', ar: 'تدوير' },
  'pdf.openOriginal': { en: 'Open PDF in New Tab', ar: 'فتح الـ PDF في نافذة جديدة' },
  'pdf.hdRender': { en: 'HD Render', ar: 'عرض فائق الدقة' },
  'pdf.pdfEmbed': { en: 'PDF Embed', ar: 'قارئ PDF مدمج' },
  'pdf.rendering': { en: 'Rendering page...', ar: 'جاري تجهيز الصفحة...' },
  'pdf.errorRender': { en: 'Could not render page preview', ar: 'تعذر عرض المعاينة' },
  'pdf.switchEmbed': { en: 'Switch to PDF Embed', ar: 'التبديل للقارئ المدمج' },

  // Tabs
  'tab.overview': { en: 'Executive Briefing', ar: 'الملخص التنفيذي' },
  'tab.actions': { en: 'Action Items', ar: 'قائمة المهام' },
  'tab.deadlines': { en: 'Deadlines & Milestones', ar: 'المواعيد والمراحل' },
  'tab.risks': { en: 'Risks & Requirements', ar: 'المخاطر والالتزامات' },
  'tab.chat': { en: 'Copilot Q&A', ar: 'المساعد الذكي Q&A' },

  // Executive Summary Tab
  'exec.coreSynthesis': { en: 'Executive Synthesis', ar: 'الخلاصة والهدف الرئيسي' },
  'exec.keyTakeaways': { en: 'Key Strategic Takeaways', ar: 'أهم النقاط الاستراتيجية' },
  'exec.stakeholders': { en: 'Parties & Stakeholders', ar: 'الأطراف والجهات المعنية' },
  'exec.priorityActions': { en: 'Immediate Action Roadmap', ar: 'خارطة المهام العاجلة' },
  'exec.viewAllActions': { en: 'View all action items', ar: 'عرض جميع المهام' },
  'exec.jumpCitation': { en: 'Referenced on page', ar: 'مشار إليها في صفحة' },

  // Action Items Tab
  'act.title': { en: 'Action Items Checklist', ar: 'قائمة المهام التنفيذية' },
  'act.subtitle': { en: 'Prioritized operational tasks extracted from the document.', ar: 'مهام تشغيلية مرتبة حسب الأولوية ومستخرجة من الوثيقة.' },
  'act.completed': { en: 'Completed', ar: 'مكتملة' },
  'act.addTask': { en: 'Add Custom Task', ar: 'إضافة مهمة جديدة' },
  'act.taskPlaceholder': { en: 'Type a new task and press enter...', ar: 'اكتب مهمة جديدة واضغط Enter...' },
  'act.filterAll': { en: 'All', ar: 'الكل' },
  'act.filterPending': { en: 'Pending', ar: 'قيد التنفيذ' },
  'act.filterDone': { en: 'Done', ar: 'مكتملة' },
  'act.priorityHigh': { en: 'High', ar: 'عالي' },
  'act.priorityMedium': { en: 'Medium', ar: 'متوسط' },
  'act.priorityLow': { en: 'Low', ar: 'منخفض' },

  // Deadlines Tab
  'dl.title': { en: 'Key Dates & Deadlines', ar: 'المواعيد والمراحل الزمنية' },
  'dl.subtitle': { en: 'Scheduled milestones, payments, and expiration windows.', ar: 'المراحل الزمنية، الدفعات المستحقة، ومواعيد انتهاء السريان.' },
  'dl.exportBtn': { en: 'Download Apple/Google/Outlook Calendar (.ics)', ar: 'تحميل لتقويم Google / Apple / Outlook (.ics)' },
  'dl.noDeadlines': { en: 'No strict deadlines identified in this document.', ar: 'لم يتم العثور على مواعيد نهائية صارمة في هذا المستند.' },

  // Risks Tab
  'risk.title': { en: 'Obligations & Risk Matrix', ar: 'مصفوفة الالتزامات والمخاطر' },
  'risk.subtitle': { en: 'Identified restrictive clauses, liabilities, and critical requirements.', ar: 'البنود المقيدة، الالتزامات القانونية، والاشتراطات الحرجة.' },
  'risk.critical': { en: 'Critical', ar: 'حرج' },
  'risk.high': { en: 'High', ar: 'عالي' },
  'risk.medium': { en: 'Medium', ar: 'متوسط' },
  'risk.low': { en: 'Low', ar: 'منخفض' },

  // Copilot Tab
  'copilot.headerTitle': { en: 'ClarityAI Copilot', ar: 'المساعد الذكي ClarityAI' },
  'copilot.headerSubtitle': { en: 'Adaptive Q&A grounded in this document with citations', ar: 'إجابات ذكية مدعومة باقتباسات الصفحات الدقيقة' },
  'copilot.welcomeTitle': { en: 'Document-Tailored Intelligence', ar: 'ذكاء مخصص لمستندك' },
  'copilot.welcomeSubtitle': { en: 'Ask anything or choose one of the adapted suggestions generated specifically for this document:', ar: 'اطرح أي سؤال أو اختر من الأسئلة المقترحة الذكية لهذا المستند:' },
  'copilot.inputPlaceholder': { en: 'Ask anything about this document...', ar: 'اسأل أي شيء حول هذا المستند...' },
  'copilot.catAll': { en: 'All', ar: 'الكل' },
  'copilot.catObligations': { en: 'Key Obligations', ar: 'الالتزامات الرئيسية' },
  'copilot.catRisks': { en: 'Risks & Penalties', ar: 'المخاطر والغرامات' },
  'copilot.catFinancials': { en: 'Financials & Dates', ar: 'المبالغ والمواعيد' },
  'copilot.followUp': { en: 'Follow-up:', ar: 'أسئلة متابعة:' },
  'copilot.analyzing': { en: 'Analyzing document & formulating answer...', ar: 'جاري فحص المستند وصياغة الإجابة...' },
  'copilot.sourceCitations': { en: 'Source Citations:', ar: 'مراجع الصفحات:' },

  // Quick Tools Modal
  'tools.modalTitle': { en: 'Quick AI Actions', ar: 'إجراءات الذكاء الاصطناعي السريعة' },
  'tools.modalSubtitle': { en: 'Execute instant high-value transformations on this document.', ar: 'نفّذ تحويلات فورية عالية القيمة على هذا المستند.' },
  'tools.emailTitle': { en: 'Draft Executive Email', ar: 'صياغة بريد إلكتروني تنفيذي' },
  'tools.emailDesc': { en: 'Draft a professional response confirming next steps and deadlines.', ar: 'صياغة رد مهني يحدد الخطوات التالية والمواعيد.' },
  'tools.eli5Title': { en: 'Explain Like I\'m 5 (ELI5)', ar: 'شرح مبسط جداً (ELI5)' },
  'tools.eli5Desc': { en: 'Break down complex jargon into plain, intuitive analogies.', ar: 'تبسيط المصطلحات المعقدة إلى نقاط واضحة ومفهومة للجميع.' },
  'tools.riskTitle': { en: 'Red Flag & Risk Audit', ar: 'فحص البنود الحرجة والمخاطر' },
  'tools.riskDesc': { en: 'Uncover unfair terms, liabilities, and ambiguous clauses.', ar: 'كشف الشروط غير العادلة والمسؤوليات والبنود الغامضة.' },
  'tools.tableTitle': { en: 'Extract Tables & CSV', ar: 'استخراج الجداول والبيانات' },
  'tools.tableDesc': { en: 'Convert document tables into structured CSV and Markdown.', ar: 'تحويل الجداول والأرقام إلى صيغة CSV وجداول جاهزة للنسخ.' },
  'tools.instructions': { en: 'Additional Instructions (Optional)', ar: 'تعليمات إضافية (اختياري)' },
  'tools.instructionsPlaceholder': { en: 'e.g., Tone, recipient name, specific concerns to address...', ar: 'مثال: النبرة، اسم المستلم، نقاط خاصة ترغب بالتركيز عليها...' },
  'tools.generateBtn': { en: 'Generate with Gemini', ar: 'توليد بالذكاء الاصطناعي' },
  'tools.copyBtn': { en: 'Copy Output', ar: 'نسخ النتيجة' },
  'tools.copied': { en: 'Copied!', ar: 'تم النسخ!' },

  // Share Modal
  'share.modalTitle': { en: 'Share Document Intelligence', ar: 'مشاركة ملخص المستند' },
  'share.modalSubtitle': { en: 'Generate a secure public read-only link for colleagues or clients.', ar: 'إنشاء رابط عام وآمن للقراءة فقط للزملاء أو العملاء.' },
  'share.publicToggle': { en: 'Enable Public Share Link', ar: 'تفعيل رابط المشاركة العام' },
  'share.publicDesc': { en: 'Anyone with the link can view the summary, action items, and PDF preview.', ar: 'يمكن لأي شخص لديه الرابط الاطلاع على الملخص والمهام ومعاينة الـ PDF.' },
  'share.shareUrl': { en: 'Public Share Link:', ar: 'رابط المشاركة العام:' },
  'share.copy': { en: 'Copy Link', ar: 'نسخ الرابط' },
  'share.copied': { en: 'Copied to Clipboard!', ar: 'تم نسخ الرابط إلى الحافظة!' },

  // Auth Page
  'auth.signInTitle': { en: 'Sign in to ClarityAI', ar: 'تسجيل الدخول إلى كلاريتي AI' },
  'auth.signUpTitle': { en: 'Create your ClarityAI Account', ar: 'إنشاء حساب جديد في كلاريتي AI' },
  'auth.signInSubtitle': { en: 'Access your document intelligence dashboard and copilot', ar: 'ادخل إلى لوحة التحكم والمساعد الذكي لمستنداتك' },
  'auth.signUpSubtitle': { en: 'Start understanding any PDF in seconds with actionable clarity', ar: 'ابدأ بتحليل وفهم أي مستند PDF في ثوانٍ' },
  'auth.email': { en: 'Email Address', ar: 'البريد الإلكتروني' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور' },
  'auth.fullName': { en: 'Full Name', ar: 'الاسم الكامل' },
  'auth.signInBtn': { en: 'Sign In', ar: 'دخول' },
  'auth.signUpBtn': { en: 'Create Account', ar: 'إنشاء الحساب' },
  'auth.demoBtn': { en: 'Instant Demo Login (One-Click)', ar: 'دخول تجريبي فوري (نقرة واحدة)' },
  'auth.dontHaveAccount': { en: "Don't have an account?", ar: 'ليس لديك حساب؟' },
  'auth.alreadyHaveAccount': { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  'auth.switchToSignUp': { en: 'Sign Up', ar: 'سجل الآن' },
  'auth.switchToSignIn': { en: 'Sign In', ar: 'سجل الدخول' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations, fallback?: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('clarity_language');
    return saved === 'ar' || saved === 'en' ? saved : 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('clarity_language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (isRTL) {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: keyof typeof translations, fallback?: string): string => {
    const entry = translations[key];
    if (!entry) return fallback || String(key);
    return entry[language] || entry.en || fallback || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
