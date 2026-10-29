import React from 'react';
import { Eye, EyeOff, Check, HelpCircle, X, Sparkles, BookOpen, Activity, Microscope, Stethoscope, FileText, Award, HeartPulse, Pill, AlertTriangle, Share2, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { ClinicalSection, ClinicalQA } from '../types/medical';

interface ActiveRecallTableProps {
  section: ClinicalSection;
  onToggleAnswer: (sectionKey: string, itemId: string) => void;
  onToggleAllInSection: (sectionKey: string, forceShow?: boolean) => void;
  onUpdateMastery: (sectionKey: string, itemId: string, status: 'mastered' | 'review' | 'failed') => void;
  onOpenSourceSnippet?: (item: ClinicalQA, sectionTitle: string) => void;
}

export const ActiveRecallTable: React.FC<ActiveRecallTableProps> = ({
  section,
  onToggleAnswer,
  onToggleAllInSection,
  onUpdateMastery,
  onOpenSourceSnippet,
}) => {
  const allRevealed = section.items.every((item) => item.isRevealed);
  const someRevealed = section.items.some((item) => item.isRevealed);

  const getSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-sky-700" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-emerald-700" />;
      case 'Microscope':
        return <Microscope className="w-5 h-5 text-violet-700" />;
      case 'Stethoscope':
        return <Stethoscope className="w-5 h-5 text-sky-700" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-indigo-700" />;
      case 'Award':
        return <Award className="w-5 h-5 text-amber-600" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-teal-700" />;
      case 'Pill':
        return <Pill className="w-5 h-5 text-sky-700" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'Share2':
        return <Share2 className="w-5 h-5 text-blue-700" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-red-700" />;
      default:
        return <BookOpen className="w-5 h-5 text-sky-700" />;
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8 transition-shadow hover:shadow-sm">
      {/* Encabezado y Subtítulo de la Tabla con Control Local Simultáneo */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            {getSectionIcon(section.iconName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {section.title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {section.badgeText} &bull; {section.items.length}{' '}
              {section.items.length === 1 ? 'concepto clínico' : 'conceptos clínicos'}
            </p>
          </div>
        </div>

        {/* Botón arriba de cada tabla para ocultar/mostrar todas las respuestas simultáneamente */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => onToggleAllInSection(section.key, !allRevealed)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              allRevealed
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-white hover:bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
            }`}
          >
            {allRevealed ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ocultar todas las respuestas de esta tabla</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Mostrar todas las respuestas de esta tabla</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenedor de la Tabla con 2 Columnas Obligatorias */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/60 text-xs font-semibold text-slate-600">
              <th scope="col" className="w-2/5 p-4 pl-6">
                Pregunta Clínica (Active Recall)
              </th>
              <th scope="col" className="w-3/5 p-4 pr-6">
                Respuesta Desarrollada y Justificada
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {section.items.map((item, index) => {
              const isRevealed = item.isRevealed;

              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  } hover:bg-slate-50/80`}
                >
                  {/* Columna Izquierda: Pregunta Clínica */}
                  <td className="p-4 pl-6 align-top">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 shrink-0 mt-0.5">
                          P{index + 1}
                        </span>
                        <p className="font-semibold text-slate-900 leading-snug text-[15px]">
                          {item.question}
                        </p>
                      </div>

                      {/* Control de autoevaluación rápida para el estudiante */}
                      <div className="pt-2 flex items-center gap-1 text-xs text-slate-500">
                        <span className="text-[11px] mr-1">Autoevaluación:</span>
                        <button
                          type="button"
                          title="Dominada (+1)"
                          onClick={() => onUpdateMastery(section.key, item.id, 'mastered')}
                          className={`p-1 rounded transition-colors ${
                            item.masteryStatus === 'mastered'
                              ? 'bg-emerald-100 text-emerald-800 font-bold'
                              : 'hover:bg-slate-200 text-slate-400 hover:text-emerald-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Dudosa (Repasar)"
                          onClick={() => onUpdateMastery(section.key, item.id, 'review')}
                          className={`p-1 rounded transition-colors ${
                            item.masteryStatus === 'review'
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'hover:bg-slate-200 text-slate-400 hover:text-amber-700'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="No recordada"
                          onClick={() => onUpdateMastery(section.key, item.id, 'failed')}
                          className={`p-1 rounded transition-colors ${
                            item.masteryStatus === 'failed'
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : 'hover:bg-slate-200 text-slate-400 hover:text-rose-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Columna Derecha: Respuesta Desarrollada y Justificada con Botón para Esconder/Ocultar */}
                  <td className="p-4 pr-6 align-top">
                    <div className="space-y-3">
                      {/* Botón individual para esconder u ocultar el contenido y botón de carta pop-up de evidencia */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleAnswer(section.key, item.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                              isRevealed
                                ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                            }`}
                          >
                            {isRevealed ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Ocultar respuesta</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Revelar respuesta y justificación</span>
                              </>
                            )}
                          </button>

                          {/* Botón de Carta Pop-up con la imagen real del apartado del PDF */}
                          <button
                            type="button"
                            onClick={() => onOpenSourceSnippet?.(item, section.title)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 transition-colors cursor-pointer shadow-2xs"
                            title="Ver carta pop-up con la imagen del apartado del PDF donde se obtuvo la respuesta"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-sky-700" />
                            <span>Ver Imagen del Apartado (Carta Pop-up)</span>
                          </button>
                        </div>

                        {!isRevealed && (
                          <span className="text-xs text-slate-400 italic font-mono text-[11px]">
                            [Respuesta oculta para active recall]
                          </span>
                        )}
                      </div>

                      {/* Contenido de la respuesta desarrollada y justificada */}
                      {isRevealed ? (
                        <div className="pt-1 space-y-2 animate-in fade-in duration-150">
                          <p className="text-slate-800 leading-relaxed text-sm whitespace-pre-line">
                            {item.detailedAnswer}
                          </p>

                          {item.clinicalPearls && (
                            <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-xs text-emerald-900 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-emerald-950">High-Yield Pearl: </span>
                                <span>{item.clinicalPearls}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => onToggleAnswer(section.key, item.id)}
                          className="h-14 rounded-lg bg-slate-100/80 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500 cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
                        >
                          <span>Haz clic aquí o en el botón para comprobar tu razonamiento clínico</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
