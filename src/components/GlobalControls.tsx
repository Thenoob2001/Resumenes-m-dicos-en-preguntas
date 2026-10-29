import React from 'react';
import { Eye, EyeOff, Sparkles, Download, FileDown, Search, CheckCircle2 } from 'lucide-react';
import { MedicalSummary } from '../types/medical';

interface GlobalControlsProps {
  summary: MedicalSummary;
  onToggleAllGlobal: (show: boolean) => void;
  onStartExam: () => void;
  onExportAnki: () => void;
  onDownloadPdf: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
  summary,
  onToggleAllGlobal,
  onStartExam,
  onExportAnki,
  onDownloadPdf,
  searchQuery,
  setSearchQuery,
}) => {
  // Calcular estadísticas de dominio
  let totalItems = 0;
  let masteredItems = 0;
  let revealedItems = 0;

  summary.sections.forEach((sec) => {
    sec.items.forEach((item) => {
      totalItems += 1;
      if (item.masteryStatus === 'mastered') masteredItems += 1;
      if (item.isRevealed) revealedItems += 1;
    });
  });

  const masteryPercentage = totalItems > 0 ? Math.round((masteredItems / totalItems) * 100) : 0;
  const allGlobalRevealed = totalItems > 0 && revealedItems === totalItems;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-8 no-print">
      {/* Fila Superior: Título del tema y metadata médica */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              {summary.specialty}
            </span>
            {summary.isOcrApplied && (
              <span className="text-xs font-bold text-violet-800 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200 flex items-center gap-1">
                <span>Modo OCR Activo (PDF escaneado/sin texto seleccionable)</span>
              </span>
            )}
            <span className="text-xs text-slate-500">
              Archivo: <strong className="font-medium text-slate-700">{summary.fileName}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {summary.topicTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {summary.keyOverview}
          </p>
        </div>

        {/* Métrica de Dominio Activo */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">Dominio de Active Recall</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {masteredItems} / {totalItems}{' '}
              <span className="text-xs font-semibold text-sky-700">({masteryPercentage}%)</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Fila Inferior: Controles de Estudio y Botones de Acción */}
      <div className="pt-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Barra de búsqueda de conceptos */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por fármaco, signo patognomónico, estudio..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 text-slate-800"
          />
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botones globales para ocultar/mostrar todas las respuestas simultáneamente */}
          <button
            type="button"
            onClick={() => onToggleAllGlobal(!allGlobalRevealed)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            {allGlobalRevealed ? (
              <>
                <EyeOff className="w-4 h-4 text-slate-500" />
                <span>Ocultar Todas</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-sky-700" />
                <span>Mostrar Todas</span>
              </>
            )}
          </button>

          {/* Modo Examen con Temporizador */}
          <button
            type="button"
            onClick={onStartExam}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Modo Examen</span>
          </button>

          {/* Exportar a Anki CSV */}
          <button
            type="button"
            onClick={onExportAnki}
            title="Exportar mazo de tarjetas para Anki"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-700" />
            <span>Anki CSV</span>
          </button>

          {/* Descargar Tablas en Formato PDF (Todas las respuestas visualizables) */}
          <button
            type="button"
            onClick={onDownloadPdf}
            title="Descargar archivo PDF con las 11 tablas clínicas y todas las respuestas en modo visualización"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 shadow-2xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-sky-700" />
            <span>Descargar Tablas en PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
