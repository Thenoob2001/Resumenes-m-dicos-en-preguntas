import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, ChevronLeft, ChevronRight, FileText, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { ClinicalQA } from '../types/medical';

// Configurar el worker de PDF.js para renderizar páginas en el navegador
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfSectionImageModalProps {
  item: ClinicalQA;
  sectionTitle: string;
  topicTitle: string;
  pdfBase64?: string;
  onClose: () => void;
}

export const PdfSectionImageModal: React.FC<PdfSectionImageModalProps> = ({
  item,
  sectionTitle,
  topicTitle,
  pdfBase64,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(item.pageNumber || 1);
  const [scale, setScale] = useState<number>(1.5);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);

  // Renderizar la página del PDF en el canvas
  useEffect(() => {
    let isCancelled = false;

    async function renderPdfPage() {
      if (!pdfBase64) {
        setIsLoadingImage(false);
        return;
      }

      setIsLoadingImage(true);
      setRenderError(null);

      try {
        const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '');
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({
          data: bytes,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
          cMapPacked: true,
        });

        const pdfDoc = await loadingTask.promise;
        if (isCancelled) return;

        setTotalPages(pdfDoc.numPages);

        const pageNumToRender = Math.min(Math.max(1, currentPage), pdfDoc.numPages);
        const page = await pdfDoc.getPage(pageNumToRender);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        await page.render(renderContext as any).promise;
        if (isCancelled) return;

        // Convertir a Data URL para permitir descarga directa de la imagen del apartado
        const dataUrl = canvas.toDataURL('image/png');
        setRenderedImageUrl(dataUrl);
        setIsLoadingImage(false);
      } catch (err: any) {
        console.error('Error al renderizar página del PDF con PDF.js:', err);
        if (!isCancelled) {
          setRenderError(err.message || 'No se pudo generar la imagen de la página del PDF.');
          setIsLoadingImage(false);
        }
      }
    }

    renderPdfPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfBase64, currentPage, scale]);

  const handleDownloadImage = () => {
    if (!renderedImageUrl) return;
    const link = document.createElement('a');
    link.href = renderedImageUrl;
    link.download = `${topicTitle}_Pagina_${currentPage}_Apartado.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Pop-up con controles de página y zoom */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {sectionTitle}
                </span>
                {item.pageOrSectionRef && (
                  <span className="text-xs text-slate-500 font-medium">
                    &bull; {item.pageOrSectionRef}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                Apartado Original del PDF Fuente
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de Navegación de Páginas */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs text-xs font-medium text-slate-700 mr-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 tabular-nums text-xs">
                  Pág. {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Controles de Zoom */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs mr-2">
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(3.0, s + 0.25))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Acercar imagen"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.75, s - 0.25))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Alejar imagen"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScale(1.5)}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Restablecer tamaño"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Botón para descargar imagen */}
            {renderedImageUrl && (
              <button
                type="button"
                onClick={handleDownloadImage}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs"
                title="Descargar imagen de esta página del PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Guardar PNG</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panel Superior Informativo: Pregunta y Justificación */}
        <div className="px-6 py-3.5 bg-slate-100/70 border-b border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs">
          <div className="space-y-1 flex-1">
            <span className="font-bold text-sky-800 uppercase tracking-wider text-[11px]">
              Pregunta de Active Recall:
            </span>
            <p className="font-bold text-slate-900 text-sm leading-snug">
              {item.question}
            </p>
          </div>
          <div className="space-y-1 flex-1 bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs">
            <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
              Respuesta Justificada:
            </span>
            <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
              {item.detailedAnswer}
            </p>
          </div>
        </div>

        {/* Área Central: Visualizador de la Imagen del Apartado del PDF */}
        <div className="flex-1 overflow-auto bg-slate-800/95 p-4 sm:p-6 flex items-center justify-center relative min-h-[380px]">
          {isLoadingImage && (
            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white z-10">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" />
              <p className="text-xs font-medium text-slate-200">
                Renderizando imagen de alta resolución del PDF fuente...
              </p>
            </div>
          )}

          {renderError ? (
            <div className="max-w-md p-6 bg-white rounded-xl text-center shadow-lg">
              <FileText className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">Página del PDF en Proceso</h4>
              <p className="text-xs text-slate-600 mt-1">{renderError}</p>
              {item.sourceTextSnippet && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-left text-xs italic font-serif text-slate-800">
                  &ldquo;{item.sourceTextSnippet}&rdquo;
                </div>
              )}
            </div>
          ) : !pdfBase64 ? (
            /* En caso de que se haya analizado por texto pegado y no por archivo PDF */
            <div className="max-w-lg p-6 bg-white rounded-xl shadow-xl text-left border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-800">
                <FileText className="w-4 h-4" />
                <span>Apartado Fuente del Texto Clínico</span>
              </div>
              <p className="text-xs text-slate-700 font-serif leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                &ldquo;{item.sourceTextSnippet || item.detailedAnswer}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500">
                Para ver la captura visual directa de páginas escaneadas, sube tu archivo en formato PDF.
              </p>
            </div>
          ) : (
            /* Canvas donde se renderiza la imagen del PDF */
            <div className="shadow-2xl rounded-sm overflow-hidden border border-slate-700 bg-white">
              <canvas ref={canvasRef} className="block max-w-full h-auto mx-auto" />
            </div>
          )}
        </div>

        {/* Pie del Pop-up */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{summaryPageRefText(item, currentPage)}</span>
            <span>&bull;</span>
            <span className="text-slate-500">Pasa el cursor o amplía para ver la sección en detalle</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
};

function summaryPageRefText(item: ClinicalQA, currentPage: number): string {
  if (item.pageOrSectionRef) {
    return `Sección: ${item.pageOrSectionRef} (Pág. ${currentPage})`;
  }
  return `Página ${currentPage} del documento original`;
}
