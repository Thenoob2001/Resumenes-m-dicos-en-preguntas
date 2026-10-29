import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PdfUploader } from './components/PdfUploader';
import { ActiveRecallTable } from './components/ActiveRecallTable';
import { GlobalControls } from './components/GlobalControls';
import { ExamModeModal } from './components/ExamModeModal';
import { HistoryModal } from './components/HistoryModal';
import { PdfSectionImageModal } from './components/PdfSectionImageModal';
import { ClinicalQA, MedicalSummary, SectionKey } from './types/medical';
import { exportToAnkiCsv } from './utils/ankiExport';
import { downloadSummaryTablesPdf } from './utils/pdfTableExport';
import { getSavedSummaries, saveSummary, deleteSummary, getLastActiveSummaryId } from './utils/storage';
import { BookOpen, FileUp, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [savedSummaries, setSavedSummaries] = useState<MedicalSummary[]>([]);
  const [activeSummary, setActiveSummary] = useState<MedicalSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUploaderModal, setShowUploaderModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [selectedSnippet, setSelectedSnippet] = useState<{ item: ClinicalQA; sectionTitle: string } | null>(null);

  // Cargar resúmenes almacenados en el navegador al iniciar
  useEffect(() => {
    const loaded = getSavedSummaries();
    setSavedSummaries(loaded);

    if (loaded.length > 0) {
      const lastId = getLastActiveSummaryId();
      const match = loaded.find((s) => s.id === lastId);
      setActiveSummary(match || loaded[0]);
    }
  }, []);

  // Almacenar automáticamente cambios en el resumen activo
  const handleUpdateSummary = (updated: MedicalSummary) => {
    setActiveSummary(updated);
    saveSummary(updated);
    setSavedSummaries(getSavedSummaries());
  };

  const handleSummaryGenerated = (newSummary: MedicalSummary) => {
    handleUpdateSummary(newSummary);
    setShowUploaderModal(false);
  };

  const handleDeleteSummary = (id: string) => {
    const updatedList = deleteSummary(id);
    setSavedSummaries(updatedList);
    if (activeSummary?.id === id) {
      setActiveSummary(updatedList[0] || null);
    }
  };

  // Alternar visibilidad de una respuesta individual (Active Recall por ítem)
  const handleToggleAnswer = (sectionKey: string, itemId: string) => {
    if (!activeSummary) return;

    const updatedSections = activeSummary.sections.map((section) => {
      if (section.key !== sectionKey) return section;
      return {
        ...section,
        items: section.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            isRevealed: !item.isRevealed,
          };
        }),
      };
    });

    handleUpdateSummary({
      ...activeSummary,
      sections: updatedSections,
    });
  };

  // Alternar visibilidad simultánea para todas las respuestas de una tabla específica
  const handleToggleAllInSection = (sectionKey: string, forceShow?: boolean) => {
    if (!activeSummary) return;

    const updatedSections = activeSummary.sections.map((section) => {
      if (section.key !== sectionKey) return section;
      const targetState = forceShow !== undefined ? forceShow : !section.items.every((i) => i.isRevealed);
      return {
        ...section,
        items: section.items.map((item) => ({
          ...item,
          isRevealed: targetState,
        })),
      };
    });

    handleUpdateSummary({
      ...activeSummary,
      sections: updatedSections,
    });
  };

  // Alternar visibilidad simultánea para TODAS las respuestas del documento completo
  const handleToggleAllGlobal = (forceShow: boolean) => {
    if (!activeSummary) return;

    const updatedSections = activeSummary.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        isRevealed: forceShow,
      })),
    }));

    handleUpdateSummary({
      ...activeSummary,
      sections: updatedSections,
    });
  };

  // Actualizar estado de autoevaluación (Dominada, Dudosa, Fallada)
  const handleUpdateMastery = (
    sectionKey: string,
    itemId: string,
    status: 'mastered' | 'review' | 'failed'
  ) => {
    if (!activeSummary) return;

    const updatedSections = activeSummary.sections.map((section) => {
      if (section.key !== sectionKey) return section;
      return {
        ...section,
        items: section.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            masteryStatus: status,
          };
        }),
      };
    });

    handleUpdateSummary({
      ...activeSummary,
      sections: updatedSections,
    });
  };

  // Descargar todas las 11 tablas en formato PDF con preguntas y respuestas 100% visualizables
  const handleDownloadPdf = () => {
    if (!activeSummary) return;
    downloadSummaryTablesPdf(activeSummary);
  };

  // Exportar a Anki CSV
  const handleExportAnki = () => {
    if (!activeSummary) return;
    exportToAnkiCsv(activeSummary);
  };

  // Filtrado por búsqueda en preguntas y respuestas
  const filteredSections = activeSummary?.sections
    .map((section) => {
      if (!searchQuery.trim()) return section;
      const query = searchQuery.toLowerCase();
      const matchingItems = section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.detailedAnswer.toLowerCase().includes(query) ||
          item.clinicalPearls?.toLowerCase().includes(query)
      );
      return {
        ...section,
        items: matchingItems,
      };
    })
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Barra de navegación superior (Top Bar Contract) */}
      <Navbar
        onUploadClick={() => setShowUploaderModal(true)}
        onHistoryClick={() => setShowHistoryModal(true)}
        savedCount={savedSummaries.length}
        hasActiveSummary={Boolean(activeSummary)}
        onExamClick={() => setShowExamModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Caso 1: No hay ningún resumen cargado aún */}
        {!activeSummary ? (
          <div className="py-6">
            <PdfUploader
              onSummaryGenerated={handleSummaryGenerated}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            {/* Vista previa de los 11 apartados clínicos que se generarán */}
            <div className="mt-12 max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-sky-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  Estructura Médica de los 11 Apartados de Active Recall
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">
                Cada documento analizado es transformado en tablas clínicas estandarizadas con preguntas de
                razonamiento médico y respuestas desarrolladas con justificación fisiopatológica:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  '1. Definiciones principales del tema',
                  '2. Datos epidemiológicos más importantes (edad, sexo, factores de riesgo, morbi-mortalidad)',
                  '3. Etiologías más importantes y causas subyacentes',
                  '4. Datos clínicos característicos (signos, síntomas, tríada clásica y patognomónicos)',
                  '5. Estudios de gabinete y auxiliares diagnósticos iniciales',
                  '6. Estudio de gabinete/auxiliar más preciso (Estándar de Oro / Gold Standard)',
                  '7. Tratamiento no farmacológico (estilo de vida y medidas higiénicas)',
                  '8. Tratamiento farmacológico de elección y segundas líneas / alternativas',
                  '9. Contraindicaciones de las opciones de tratamiento',
                  '10. Criterios de referencia a otro nivel de atención (urgencias, 2°/3° nivel, UCI)',
                  '11. Complicaciones más importantes (agudas y crónicas)',
                ].map((sec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-800 leading-snug">{sec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Caso 2: Resumen médico activo con sus tablas de Active Recall */
          <div>
            {/* Controles globales (Ocultar/Mostrar todas, Modo Examen, Anki CSV, Descargar Tablas en PDF) */}
            <GlobalControls
              summary={activeSummary}
              onToggleAllGlobal={handleToggleAllGlobal}
              onStartExam={() => setShowExamModal(true)}
              onExportAnki={handleExportAnki}
              onDownloadPdf={handleDownloadPdf}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Listado de las 11 Tablas Clínicas */}
            {filteredSections && filteredSections.length > 0 ? (
              <div className="space-y-2">
                {filteredSections.map((section) => (
                  <ActiveRecallTable
                    key={section.key}
                    section={section}
                    onToggleAnswer={handleToggleAnswer}
                    onToggleAllInSection={handleToggleAllInSection}
                    onUpdateMastery={handleUpdateMastery}
                    onOpenSourceSnippet={(item, sectionTitle) =>
                      setSelectedSnippet({ item, sectionTitle })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">
                  No se encontraron preguntas que coincidan con "{searchQuery}"
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold text-sky-700 hover:underline"
                >
                  Restablecer búsqueda
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal flotante para subir un nuevo PDF sin perder el actual */}
      {showUploaderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <PdfUploader
              onSummaryGenerated={handleSummaryGenerated}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              onCancel={() => setShowUploaderModal(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de Modo Examen con Temporizador */}
      {showExamModal && activeSummary && (
        <ExamModeModal
          summary={activeSummary}
          onClose={() => setShowExamModal(false)}
          onSaveMasteryToSummary={handleUpdateSummary}
        />
      )}

      {/* Modal de Historial de Resúmenes Guardados */}
      {showHistoryModal && (
        <HistoryModal
          summaries={savedSummaries}
          activeId={activeSummary?.id || null}
          onSelectSummary={(s) => setActiveSummary(s)}
          onDeleteSummary={handleDeleteSummary}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Modal / Carta Pop-up con la imagen del apartado del PDF fuente */}
      {selectedSnippet && (
        <PdfSectionImageModal
          item={selectedSnippet.item}
          sectionTitle={selectedSnippet.sectionTitle}
          topicTitle={activeSummary?.topicTitle || 'Documento Médico'}
          pdfBase64={activeSummary?.pdfBase64}
          onClose={() => setSelectedSnippet(null)}
        />
      )}

      {/* Footer minimalista */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MedRecall &bull; Plataforma de Resúmenes de Medicina y Active Recall</span>
          <span>Basado en evidencia médica &bull; Diseñado para retención activa</span>
        </div>
      </footer>
    </div>
  );
}
