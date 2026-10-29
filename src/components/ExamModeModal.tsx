import React, { useState, useEffect } from 'react';
import { X, Timer, Clock, Award, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, RotateCcw, Sparkles, Bookmark } from 'lucide-react';
import { MedicalSummary, ExamQuestionItem } from '../types/medical';

interface ExamModeModalProps {
  summary: MedicalSummary;
  onClose: () => void;
  onSaveMasteryToSummary: (updatedSummary: MedicalSummary) => void;
}

export const ExamModeModal: React.FC<ExamModeModalProps> = ({
  summary,
  onClose,
  onSaveMasteryToSummary,
}) => {
  // Aplanar todas las preguntas de las 11 secciones para el examen
  const allQuestions: ExamQuestionItem[] = summary.sections.flatMap((sec) =>
    sec.items.map((qa) => ({
      sectionKey: sec.key,
      sectionTitle: sec.title,
      qa,
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [grades, setGrades] = useState<Record<string, 'mastered' | 'review' | 'failed'>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !isFinished) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isFinished]);

  const currentQ = allQuestions[currentIndex];
  const isCurrentRevealed = revealedQuestions[currentQ?.qa?.id] || false;
  const currentGrade = grades[currentQ?.qa?.id];

  const handleRevealCurrent = () => {
    if (!currentQ) return;
    setRevealedQuestions((prev) => ({
      ...prev,
      [currentQ.qa.id]: true,
    }));
  };

  const handleGrade = (grade: 'mastered' | 'review' | 'failed') => {
    if (!currentQ) return;
    setGrades((prev) => ({
      ...prev,
      [currentQ.qa.id]: grade,
    }));

    // Auto-avanzar al siguiente si no es la última
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleFinishExam = () => {
    setIsTimerRunning(false);
    setIsFinished(true);

    // Actualizar estados de dominio en el resumen principal
    const updatedSections = summary.sections.map((sec) => ({
      ...sec,
      items: sec.items.map((item) => {
        if (grades[item.id]) {
          return {
            ...item,
            masteryStatus: grades[item.id],
          };
        }
        return item;
      }),
    }));

    onSaveMasteryToSummary({
      ...summary,
      sections: updatedSections,
    });
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cálculo de resultados
  const totalQuestions = allQuestions.length;
  let masteredCount = 0;
  let reviewCount = 0;
  let failedCount = 0;

  Object.values(grades).forEach((g) => {
    if (g === 'mastered') masteredCount += 1;
    if (g === 'review') reviewCount += 1;
    if (g === 'failed') failedCount += 1;
  });

  // Puntuación: 1 pto por mastered, 0.5 por review
  const rawScore = masteredCount * 1.0 + reviewCount * 0.5;
  const percentageScore = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;

  // Desglose por sección clínica
  const sectionBreakdown: Record<string, { title: string; total: number; correct: number }> = {};
  allQuestions.forEach((q) => {
    if (!sectionBreakdown[q.sectionKey]) {
      sectionBreakdown[q.sectionKey] = {
        title: q.sectionTitle,
        total: 0,
        correct: 0,
      };
    }
    sectionBreakdown[q.sectionKey].total += 1;
    if (grades[q.qa.id] === 'mastered') {
      sectionBreakdown[q.sectionKey].correct += 1;
    } else if (grades[q.qa.id] === 'review') {
      sectionBreakdown[q.sectionKey].correct += 0.5;
    }
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del examen */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Modo Examen &bull; {summary.topicTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Simulación activa de active recall con puntuación ponderada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Temporizador */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs font-mono text-sm font-bold text-slate-800">
              <Timer className="w-4 h-4 text-sky-700" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del examen: Pregunta activa o Pantalla de Resultados */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isFinished ? (
            <div className="space-y-6">
              {/* Barra de progreso de preguntas */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  Pregunta {currentIndex + 1} de {totalQuestions}
                </span>
                <span>
                  Respondidas: {Object.keys(grades).length} / {totalQuestions}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-700 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Subtema clínico */}
              <div className="inline-block px-3 py-1 bg-sky-50 border border-sky-200/80 rounded-lg text-xs font-bold text-sky-800">
                {currentQ.sectionTitle}
              </div>

              {/* Pregunta Clínica Principal */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Pregunta Clínica
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {currentQ.qa.question}
                </h2>
              </div>

              {/* Área opcional para pensar o redactar la respuesta activa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tu razonamiento clínico (opcional, para forzar el active recall antes de revelar):
                </label>
                <textarea
                  rows={3}
                  value={userNotes[currentQ.qa.id] || ''}
                  onChange={(e) =>
                    setUserNotes((prev) => ({
                      ...prev,
                      [currentQ.qa.id]: e.target.value,
                    }))
                  }
                  placeholder="Escribe tu diagnóstico, dosis, estudio o sospecha clínica aquí..."
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600 font-sans"
                />
              </div>

              {/* Botón para revelar respuesta justificada */}
              {!isCurrentRevealed ? (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleRevealCurrent}
                    className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-sky-700 hover:bg-sky-800 text-white shadow-sm transition-colors cursor-pointer"
                  >
                    Revelar Respuesta Justificada
                  </button>
                </div>
              ) : (
                /* Respuesta Revelada y Autoevaluación */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                      Respuesta Desarrollada y Justificación Clínica
                    </p>
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {currentQ.qa.detailedAnswer}
                    </p>

                    {currentQ.qa.clinicalPearls && (
                      <div className="mt-3 p-3 rounded-lg bg-white border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-950">High-Yield Pearl: </strong>
                          <span>{currentQ.qa.clinicalPearls}</span>
                        </div>
                      </div>
                    )}

                    {currentQ.qa.sourceTextSnippet && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                          <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                          <span>Fragmento del Texto Original de donde se extrajo la respuesta:</span>
                          {currentQ.qa.pageOrSectionRef && (
                            <span className="font-normal text-amber-800">({currentQ.qa.pageOrSectionRef})</span>
                          )}
                        </div>
                        <p className="italic font-serif pl-2 border-l-2 border-amber-400 text-slate-800">
                          &ldquo;{currentQ.qa.sourceTextSnippet}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Panel de calificación */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs font-bold text-slate-700 mb-2 text-center">
                      ¿Cómo fue tu respuesta mental antes de ver la justificación?
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGrade('mastered')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                          currentGrade === 'mastered'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        ✓ Dominada (+1)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGrade('review')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                          currentGrade === 'review'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        ? Dudosa (+0.5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGrade('failed')}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                          currentGrade === 'failed'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                            : 'bg-white hover:bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        ✕ No recordada (0)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Pantalla de Resultados Finales */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Examen Clínico Finalizado
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Tiempo invertido: <strong>{formatTime(elapsedSeconds)}</strong> &bull; Total de conceptos:{' '}
                  <strong>{totalQuestions}</strong>
                </p>
              </div>

              {/* Tarjeta de Calificación Ponderada */}
              <div className="max-w-xs mx-auto p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
                <p className="text-xs uppercase font-bold text-slate-500">Puntuación Final</p>
                <p className="text-4xl font-extrabold text-sky-800 mt-1 tabular-nums">
                  {percentageScore}%
                </p>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  {rawScore.toFixed(1)} / {totalQuestions} puntos posibles
                </p>
              </div>

              {/* Desglose por Apartado Clínico */}
              <div className="text-left border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700">
                  Desglose de Desempeño por Apartado Clínico
                </div>
                <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
                  {Object.entries(sectionBreakdown).map(([secKey, stat]) => {
                    const secPercent = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                    return (
                      <div key={secKey} className="px-4 py-2.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-sm sm:max-w-md">
                          {stat.title}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 tabular-nums">
                            {stat.correct} / {stat.total}
                          </span>
                          <span
                            className={`font-bold tabular-nums w-12 text-right ${
                              secPercent >= 80
                                ? 'text-emerald-700'
                                : secPercent >= 50
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {secPercent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal con navegación */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!isFinished ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFinishExam}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors"
                >
                  Finalizar y Calificar
                </button>

                {currentIndex < totalQuestions - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsFinished(false);
                  setCurrentIndex(0);
                  setElapsedSeconds(0);
                  setIsTimerRunning(true);
                  setGrades({});
                  setRevealedQuestions({});
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Examen</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-800 text-white shadow-sm"
              >
                Volver a las Tablas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
