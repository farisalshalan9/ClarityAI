import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  RotateCw, LayoutGrid, FileText, 
  ExternalLink, Sparkles, Eye, Maximize2
} from 'lucide-react';
import { apiClient, api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface PDFViewerProps {
  documentId: string;
  pageCount: number;
  activePage: number;
  onPageChange: (page: number) => void;
  isShared?: boolean;
  shareToken?: string;
  highlightSnippet?: string | null;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  documentId,
  pageCount,
  activePage,
  onPageChange,
  isShared = false,
  shareToken,
  highlightSnippet,
}) => {
  const { t } = useLanguage();
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'hd' | 'embed'>('hd');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [showSpotlight, setShowSpotlight] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawPdfUrl = apiClient.getRawPdfUrl(documentId, isShared, shareToken);

  // Trigger glowing spotlight on new snippet highlight
  useEffect(() => {
    if (highlightSnippet) {
      setShowSpotlight(true);
      const timer = setTimeout(() => setShowSpotlight(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightSnippet, activePage]);

  // Keyboard Shortcuts (QoL)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in text inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        if (activePage > 1) onPageChange(activePage - 1);
      } else if (e.key === 'ArrowRight') {
        if (activePage < pageCount) onPageChange(activePage + 1);
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 0.2, 2.5));
      } else if (e.key === '-') {
        setZoom((prev) => Math.max(prev - 0.2, 0.6));
      } else if (e.key === '0') {
        setZoom(1.0);
        setRotation(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, pageCount, onPageChange]);

  // Authenticated Page Image Fetcher
  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const fetchPageImage = async () => {
      setImageLoading(true);
      setImageError(false);

      const targetUrl = apiClient.getPageImageUrl(documentId, activePage, isShared, shareToken);

      try {
        const response = await api.get(targetUrl, { responseType: 'blob' });
        if (isMounted) {
          objectUrl = URL.createObjectURL(response.data);
          setImageSrc(objectUrl);
          setImageLoading(false);
        }
      } catch (err) {
        console.warn('Authenticated blob fetch failed, falling back to direct URL with query token:', err);
        if (isMounted) {
          setImageSrc(targetUrl);
          setImageLoading(false);
        }
      }
    };

    if (viewMode === 'hd') {
      fetchPageImage();
    }

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [documentId, activePage, isShared, shareToken, viewMode]);

  const handlePrevPage = () => {
    if (activePage > 1) {
      onPageChange(activePage - 1);
    }
  };

  const handleNextPage = () => {
    if (activePage < pageCount) {
      onPageChange(activePage + 1);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.6));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetView = () => {
    setZoom(1.0);
    setRotation(0);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl relative group/viewer">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-slate-800 bg-slate-950/70 backdrop-blur px-3 flex items-center justify-between text-xs text-slate-300">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded-lg transition-colors ${
              showThumbnails ? 'bg-brand-500/20 text-brand-400' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title={t('pdf.toggleThumbnails')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={handlePrevPage}
            disabled={activePage <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
            title={`${t('pdf.prevPage')} (←)`}
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>

          <div className="flex items-center gap-1 font-mono text-xs">
            <input
              type="number"
              min={1}
              max={pageCount}
              value={activePage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= pageCount) onPageChange(val);
              }}
              className="w-10 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-brand-500 font-bold"
            />
            <span className="text-slate-500">/ {pageCount}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={activePage >= pageCount}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
            title={`${t('pdf.nextPage')} (→)`}
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        {/* Center: Jump Citation Alert */}
        {highlightSnippet && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 text-xs font-semibold shadow-lg shadow-brand-500/10 animate-bounce duration-1000">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin" />
            <span className="truncate max-w-[200px]">{highlightSnippet}</span>
          </div>
        )}

        {/* Right: Mode Toggle & Zoom & Actions */}
        <div className="flex items-center gap-1">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800 mr-1.5 rtl:mr-0 rtl:ml-1.5">
            <button
              onClick={() => setViewMode('hd')}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                viewMode === 'hd'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('pdf.hdRender')}
            >
              {t('pdf.hdRender')}
            </button>
            <button
              onClick={() => setViewMode('embed')}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                viewMode === 'embed'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('pdf.pdfEmbed')}
            >
              {t('pdf.pdfEmbed')}
            </button>
          </div>

          {viewMode === 'hd' && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title={`${t('pdf.zoomOut')} (-)`}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="font-mono text-[11px] text-slate-400 hover:text-brand-300 w-11 text-center py-1 rounded hover:bg-slate-800 transition-colors font-semibold"
                title="Reset Zoom (0)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title={`${t('pdf.zoomIn')} (+)`}
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={handleRotate}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title={t('pdf.rotate')}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}

          <a
            href={rawPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title={t('pdf.openOriginal')}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar Drawer */}
        {showThumbnails && (
          <div className="w-44 border-r rtl:border-r-0 rtl:border-l border-slate-800 bg-slate-950/90 p-3 overflow-y-auto flex flex-col gap-3 z-10 animate-in slide-in-from-left duration-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
              {t('ws.pages')} ({pageCount})
            </span>
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    onPageChange(pageNum);
                    if (viewMode === 'embed') setViewMode('hd');
                  }}
                  className={`relative rounded-lg p-1.5 border transition-all text-start group ${
                    activePage === pageNum
                      ? 'border-brand-500 bg-brand-500/10 shadow-md ring-1 ring-brand-500'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="w-full aspect-[3/4] bg-slate-950 rounded overflow-hidden flex items-center justify-center border border-slate-800/50">
                    <img
                      src={apiClient.getPageImageUrl(documentId, pageNum, isShared, shareToken)}
                      alt={`Page ${pageNum}`}
                      className="w-full h-full object-cover group-hover:opacity-90"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 mt-1 block text-center">
                    {t('ws.pages')} {pageNum}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View Mode: Native PDF Embed */}
        {viewMode === 'embed' ? (
          <div className="flex-1 h-full w-full bg-slate-950">
            <iframe
              src={`${rawPdfUrl}#page=${activePage}`}
              title="Embedded PDF Document"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          /* View Mode: HD Canvas / Image View */
          <div
            ref={containerRef}
            className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/40 relative"
          >
            {imageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-10 backdrop-blur-sm">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs text-slate-400 font-medium">{t('pdf.rendering')}</span>
              </div>
            )}

            {imageError ? (
              <div className="text-center p-8 max-w-sm">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-200 mb-1">{t('pdf.errorRender')}</h4>
                <p className="text-xs text-slate-400 mb-4">
                  {t('pdf.switchEmbed')}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setViewMode('embed')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t('pdf.switchEmbed')}
                  </button>
                  <a
                    href={rawPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('pdf.openOriginal')}
                  </a>
                </div>
              </div>
            ) : (
              imageSrc && (
                <div
                  className="relative transition-transform duration-200 ease-out shadow-2xl rounded-xl overflow-hidden border border-slate-700/80 bg-white"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <img
                    src={imageSrc}
                    alt={`Document Page ${activePage}`}
                    className="max-h-[82vh] w-auto object-contain block select-none"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />

                  {/* Animated Glowing Spotlight Overlay on Hover/Jump */}
                  {showSpotlight && (
                    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-center items-center">
                      <div className="absolute inset-0 bg-brand-500/10 animate-pulse duration-700 border-4 border-brand-400/80 rounded-xl" />
                      <div className="w-full h-1/3 bg-gradient-to-b from-amber-400/25 via-amber-300/35 to-transparent backdrop-blur-[1px] border-y-2 border-amber-400 animate-in fade-in zoom-in duration-300 shadow-2xl flex items-center justify-center">
                        <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-amber-400 text-amber-300 text-xs font-bold shadow-2xl flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                          <span>{highlightSnippet || `Page ${activePage}`}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
