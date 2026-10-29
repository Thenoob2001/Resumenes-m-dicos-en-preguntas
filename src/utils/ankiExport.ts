import { MedicalSummary } from '../types/medical';

/**
 * Genera un archivo CSV / TSV delimitado por tabulaciones optimizado para importación directa en Anki.
 * Formato estándar de Anki:
 * Campo 1 (Anverso / Front): Categoría y Pregunta Clínica
 * Campo 2 (Reverso / Back): Respuesta desarrollada y justificada con perlas clínicas
 * Campo 3 (Etiquetas / Tags): Etiquetas separadas por espacios
 */
export function exportToAnkiCsv(summary: MedicalSummary) {
  const sanitizeTopic = summary.topicTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const rows: string[] = [];

  // Cabecera opcional para mapeo claro en Anki
  rows.push('#separator:tab');
  rows.push('#html:true');
  rows.push('#tags column:3');

  summary.sections.forEach((section) => {
    const sectionTag = section.key;

    section.items.forEach((item) => {
      // Front (Anverso)
      const frontContent = `
<div style="font-family: Arial, sans-serif; text-align: left;">
  <div style="font-size: 11px; text-transform: uppercase; color: #0284c7; font-weight: bold; margin-bottom: 6px;">
    ${summary.topicTitle} &bull; ${section.title}
  </div>
  <div style="font-size: 16px; font-weight: 600; color: #0f172a; line-height: 1.4;">
    ${escapeForTsv(item.question)}
  </div>
</div>
`.trim();

      // Back (Reverso)
      const pearlBlock = item.clinicalPearls
        ? `<div style="margin-top: 10px; padding: 6px 10px; background: #f0fdf4; border-left: 3px solid #16a34a; font-size: 13px; color: #166534;">
            <strong>High-Yield Pearl:</strong> ${escapeForTsv(item.clinicalPearls)}
           </div>`
        : '';

      const sourceBlock = item.sourceTextSnippet
        ? `<div style="margin-top: 10px; padding: 6px 10px; background: #fffbeb; border-left: 3px solid #d97706; font-size: 12px; color: #92400e; font-style: italic;">
            <strong>Fragmento del Texto Original${item.pageOrSectionRef ? ` (${escapeForTsv(item.pageOrSectionRef)})` : ''}:</strong> &ldquo;${escapeForTsv(item.sourceTextSnippet)}&rdquo;
           </div>`
        : '';

      const backContent = `
<div style="font-family: Arial, sans-serif; text-align: left; line-height: 1.5; color: #1e293b;">
  <div style="font-size: 14px; margin-bottom: 8px;">
    ${escapeForTsv(item.detailedAnswer).replace(/\n/g, '<br/>')}
  </div>
  ${pearlBlock}
  ${sourceBlock}
</div>
`.trim();

      const tags = `MedRecall ${sanitizeTopic} ${sectionTag}`;

      rows.push(`${frontContent}\t${backContent}\t${tags}`);
    });
  });

  const tsvData = rows.join('\n');
  const blob = new Blob([tsvData], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${sanitizeTopic}_Anki_ActiveRecall.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeForTsv(text: string): string {
  if (!text) return '';
  return text
    .replace(/\t/g, ' ')
    .replace(/\r/g, '')
    .trim();
}
