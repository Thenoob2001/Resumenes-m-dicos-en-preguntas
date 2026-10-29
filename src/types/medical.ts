export type SectionKey =
  | 'definitions'
  | 'epidemiology'
  | 'etiology'
  | 'clinical_features'
  | 'initial_workup'
  | 'gold_standard'
  | 'non_pharm_treatment'
  | 'first_line_and_alternatives'
  | 'contraindications'
  | 'referral_criteria'
  | 'complications';

export interface ClinicalQA {
  id: string;
  question: string;
  detailedAnswer: string;
  clinicalPearls?: string;
  sourceTextSnippet?: string; // Fragmento literal o cita textual del documento original
  pageOrSectionRef?: string;  // Página o apartado de procedencia en el PDF
  pageNumber?: number;        // Número exacto de página del PDF para renderizar su imagen
  isRevealed?: boolean;
  masteryStatus?: 'untested' | 'mastered' | 'review' | 'failed';
}

export interface ClinicalSection {
  key: SectionKey;
  title: string;
  shortLabel: string;
  iconName: string;
  badgeText: string;
  items: ClinicalQA[];
}

export interface MedicalSummary {
  id: string;
  topicTitle: string;
  specialty: string;
  fileName: string;
  fileSizeBytes: number;
  analyzedAt: string;
  keyOverview: string;
  isOcrApplied?: boolean; // Indica si se aplicó OCR multimodal por PDF escaneado/sin texto seleccionable
  pdfBase64?: string;     // Base64 del archivo PDF para renderizar la imagen exacta de la página en pop-up
  sections: ClinicalSection[];
}

export interface ExamQuestionItem {
  sectionKey: SectionKey;
  sectionTitle: string;
  qa: ClinicalQA;
}

export interface ExamSession {
  isActive: boolean;
  isFinished: boolean;
  totalTimeSeconds: number;
  timeRemainingSeconds: number;
  currentIndex: number;
  questions: ExamQuestionItem[];
  answers: Record<string, {
    userNote?: string;
    grade: 'mastered' | 'review' | 'failed';
    timeSpentSeconds: number;
  }>;
}
