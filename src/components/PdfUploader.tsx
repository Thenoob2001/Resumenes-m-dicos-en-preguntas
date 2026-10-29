import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { MedicalSummary } from '../types/medical';

interface PdfUploaderProps {
  onSummaryGenerated: (summary: MedicalSummary) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  onCancel?: () => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onSummaryGenerated,
  isLoading,
  setIsLoading,
  onCancel,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingSteps = [
    'Codificando documento médico y verificando capa de texto/OCR...',
    'Analizando páginas y tablas clínicas mediante visión multimodal...',
    'Extrayendo los 11 apartados clínicos y citas textuales de origen...',
    'Estructurando preguntas de Active Recall, justificaciones y perlas clínicas...',
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File | undefined) => {
    setErrorMessage(null);
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Por favor selecciona un archivo con formato PDF válido (.pdf).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('El archivo excede el límite permitido de 50 MB.');
      return;
    }

    setSelectedFile(file);
  };

  const processFileOrText = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    setCurrentStepIndex(0);

    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < processingSteps.length - 1 ? prev + 1 : prev));
    }, 3500);

    try {
      let payload: any = {};

      if (activeTab === 'upload') {
        if (!selectedFile) {
          throw new Error('Selecciona un archivo PDF antes de iniciar el análisis.');
        }

        // Convertir PDF a base64
        const base64 = await readFileAsBase64(selectedFile);
        payload = {
          pdfBase64: base64,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        };
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 50) {
          throw new Error('Ingresa al menos 50 caracteres de texto clínico para generar el resumen.');
        }

        payload = {
          rawText: pastedText,
          fileName: 'texto_clinico_manual.txt',
          fileSize: pastedText.length,
        };
      }

      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo procesar el documento médico.');
      }

      clearInterval(stepTimer);
      setCurrentStepIndex(processingSteps.length - 1);

      // Pequeña pausa para permitir al usuario ver la finalización
      setTimeout(() => {
        setIsLoading(false);
        onSummaryGenerated(data.summary);
      }, 600);
    } catch (err: any) {
      clearInterval(stepTimer);
      setIsLoading(false);
      setErrorMessage(err.message || 'Ocurrió un error inesperado al procesar el archivo.');
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      {/* Título y descripción */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Análisis de Documentos Médicos y Active Recall
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sube tu guía de práctica clínica, artículo o capítulo en PDF. Gemini estructurará automáticamente
          el tema en los 11 apartados clínicos con preguntas y respuestas justificadas.
        </p>
      </div>

      {/* Selector de modo: Subir PDF o Pegar Texto */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subir Archivo PDF
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pegar Texto Clínico
          </button>
        </div>
      </div>

      {/* Estado de Carga / Procesamiento en vivo */}
      {isLoading ? (
        <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-sky-100 border-t-sky-700 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-6 h-6 text-sky-700" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Procesando documento médico
          </h3>
          <p className="text-sm text-sky-700 font-medium h-6">
            {processingSteps[currentStepIndex]}
          </p>

          {/* Línea de etapas */}
          <div className="mt-8 w-full max-w-md space-y-2 text-left">
            {processingSteps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs py-1 transition-opacity ${
                  idx === currentStepIndex
                    ? 'text-sky-800 font-semibold opacity-100'
                    : idx < currentStepIndex
                    ? 'text-emerald-700 opacity-90'
                    : 'text-slate-400 opacity-40'
                }`}
              >
                {idx < currentStepIndex ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : idx === currentStepIndex ? (
                  <Loader2 className="w-4 h-4 text-sky-700 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'upload' ? (
        /* Zona de arrastre de PDF */
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-sky-500 bg-sky-50/40'
                : 'border-slate-300 hover:border-sky-500 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-100/80 flex items-center justify-center text-sky-700 mb-4 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <FileText className="w-4 h-4 text-sky-700" />
                  <span className="text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <p className="text-xs text-slate-500">Haz clic o arrastra otro archivo para cambiarlo</p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-slate-800">
                  Arrastra y suelta tu archivo PDF aquí o{' '}
                  <span className="text-sky-700 underline underline-offset-2">explora tu equipo</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Admite guías, manuales y libros en PDF (incluso documentos escaneados o fotocopias sin texto editable con OCR visual automático, hasta 50 MB)
                </p>
              </div>
            )}
          </div>

          {/* Alerta de error si ocurre */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error al procesar el archivo</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Análisis confidencial y privado mediante Google Gen AI</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={processFileOrText}
                disabled={!selectedFile}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all ${
                  selectedFile
                    ? 'bg-sky-700 hover:bg-sky-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Generar Tablas de Active Recall</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Pestaña de texto clínico manual */
        <div className="space-y-4">
          <label className="block text-xs font-medium text-slate-700">
            Pega aquí el contenido médico (resumen de guía, apuntes o sección de texto):
          </label>
          <textarea
            rows={8}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Ejemplo: Insuficiencia Cardíaca Congestiva. Definición: síndrome clínico complejo... Diagnóstico: Criterios de Framingham... Péptido natriurético tipo B (BNP)... Tratamiento: inhibidores de SGLT2, ARNI/IECA, betabloqueadores..."
            className="w-full p-4 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 font-sans"
          />

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error al procesar el texto</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={processFileOrText}
              disabled={!pastedText.trim()}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all ${
                pastedText.trim()
                  ? 'bg-sky-700 hover:bg-sky-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Generar Resumen de Active Recall</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
