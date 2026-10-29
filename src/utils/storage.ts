import { MedicalSummary } from '../types/medical';

const STORAGE_KEY = 'medrecall_saved_summaries_v1';
const CURRENT_ID_KEY = 'medrecall_current_summary_id_v1';

export function getSavedSummaries(): MedicalSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error al leer resúmenes de localStorage:', error);
    return [];
  }
}

export function saveSummary(summary: MedicalSummary): void {
  try {
    const summaries = getSavedSummaries();
    const existingIndex = summaries.findIndex((s) => s.id === summary.id);
    if (existingIndex >= 0) {
      summaries[existingIndex] = summary;
    } else {
      summaries.unshift(summary);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(summaries));
    localStorage.setItem(CURRENT_ID_KEY, summary.id);
  } catch (error) {
    console.error('Error al guardar resumen en localStorage:', error);
  }
}

export function deleteSummary(id: string): MedicalSummary[] {
  try {
    const summaries = getSavedSummaries().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(summaries));
    return summaries;
  } catch (error) {
    console.error('Error al eliminar resumen:', error);
    return [];
  }
}

export function getLastActiveSummaryId(): string | null {
  try {
    return localStorage.getItem(CURRENT_ID_KEY);
  } catch {
    return null;
  }
}
