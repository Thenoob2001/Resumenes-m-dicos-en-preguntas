import React, { useState } from 'react';
import { X, Quote, Copy, Check, FileText, Bookmark, BookOpen } from 'lucide-react';
import { ClinicalQA } from '../types/medical';

interface SourceSnippetModalProps {
  item: ClinicalQA;
  sectionTitle: string;
  topicTitle: string;
  onClose: () => void;
}

export const SourceSnippetModal: React.FC<SourceSnippetModalProps> = ({
  item,
  sectionTitle,
  topicTitle,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `[${topicTitle} - ${sectionTitle}]\nPregunta: ${item.question}\nRespuesta: ${item.detailedAnswer}\nCita original: "${item.sourceTextSnippet || ''}"\nReferencia: ${item.pageOrSectionRef || 'Documento fuente'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Encabezado de la Carta Pop-up */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Quote className="w-5 h-5 text-sky-700" />
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
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Carta de Evidencia Textual de Origen
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo de la Carta Pop-up */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Pregunta Clínica */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pregunta Clínica de Active Recall
            </p>
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {item.question}
            </h4>
          </div>

          {/* Fragmento Textual / Cita Literal de donde se seleccionó la información */}
          <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200/80 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Bookmark className="w-4 h-4 text-amber-700" />
                <span>Fragmento del Texto Original de donde se extrajo la información</span>
              </div>
              {item.pageOrSectionRef && (
                <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {item.pageOrSectionRef}
                </span>
              )}
            </div>

            <blockquote className="text-slate-800 text-sm leading-relaxed italic font-serif pl-3 border-l-2 border-amber-400 bg-white/70 p-3 rounded-r-lg">
              “{item.sourceTextSnippet || 'La afirmación clínica fue sintetizada a partir del análisis textual del documento original proporcionado.'}”
            </blockquote>
          </div>

          {/* Respuesta Desarrollada y Justificada */}
          <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              Respuesta Desarrollada y Justificación Clínica
            </p>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {item.detailedAnswer}
            </p>

            {item.clinicalPearls && (
              <div className="mt-3 pt-2 border-t border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2">
                <span className="font-bold text-emerald-950">High-Yield Pearl:</span>
                <span>{item.clinicalPearls}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pie de la Carta Pop-up */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">¡Cita copiada al portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar Cita y Justificación</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Cerrar Carta
          </button>
        </div>
      </div>
    </div>
  );
};
