import React from 'react';
import { X, BookMarked, Trash2, Calendar, FileText, ArrowRight } from 'lucide-react';
import { MedicalSummary } from '../types/medical';

interface HistoryModalProps {
  summaries: MedicalSummary[];
  activeId: string | null;
  onSelectSummary: (summary: MedicalSummary) => void;
  onDeleteSummary: (id: string) => void;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  summaries,
  activeId,
  onSelectSummary,
  onDeleteSummary,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Historial de Resúmenes Clínicos ({summaries.length})
              </h3>
              <p className="text-xs text-slate-500">
                Resúmenes médicos generados y almacenados en tu navegador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {summaries.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Aún no tienes resúmenes guardados</p>
              <p className="text-xs text-slate-400 mt-1">
                Sube un archivo PDF para generar tu primera guía de Active Recall.
              </p>
            </div>
          ) : (
            summaries.map((s) => {
              const isActive = s.id === activeId;
              const dateStr = new Date(s.analyzedAt).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const totalItems = s.sections.reduce((acc, sec) => acc + sec.items.length, 0);

              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                    isActive
                      ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div
                    onClick={() => {
                      onSelectSummary(s);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200 shadow-2xs">
                        {s.specialty}
                      </span>
                      {isActive && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Actualmente en estudio
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 hover:text-sky-700 transition-colors">
                      {s.topicTitle}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {s.keyOverview}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                      </span>
                      <span>&bull;</span>
                      <span>{s.fileName}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-slate-600">{totalItems} conceptos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSummary(s);
                        onClose();
                      }}
                      className="p-2 text-slate-600 hover:text-sky-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Abrir este resumen"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Deseas eliminar el resumen de "${s.topicTitle}"?`)) {
                          onDeleteSummary(s.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar resumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
