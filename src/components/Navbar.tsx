import React from 'react';
import { FileUp, BookMarked, Sparkles } from 'lucide-react';

interface NavbarProps {
  onUploadClick: () => void;
  onHistoryClick: () => void;
  savedCount: number;
  hasActiveSummary: boolean;
  onExamClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onUploadClick,
  onHistoryClick,
  savedCount,
  hasActiveSummary,
  onExamClick,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zona 1: Brand wordmark único */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            MedRecall
          </span>
        </div>

        {/* Zona 2: Enlaces de navegación concisos y de una sola línea */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={onHistoryClick}
            className="flex items-center gap-2 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            <BookMarked className="w-4 h-4 text-slate-400" />
            <span>Mis Resúmenes ({savedCount})</span>
          </button>
          {hasActiveSummary && onExamClick && (
            <button
              onClick={onExamClick}
              className="flex items-center gap-2 text-sky-700 hover:text-sky-900 transition-colors whitespace-nowrap shrink-0 font-semibold"
            >
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Modo Examen</span>
            </button>
          )}
        </nav>

        {/* Zona 3: 1 Acción Primaria */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 active:bg-sky-900 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            <span>Subir PDF Médico</span>
          </button>
        </div>
      </div>
    </header>
  );
};
