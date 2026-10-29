import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MedicalSummary } from '../types/medical';

/**
 * Genera y descarga un archivo PDF vectorial de alta calidad con las 11 tablas clínicas
 * y TODAS las respuestas en modo de visualización abierta (pregunta y respuesta 100% legibles).
 */
export function downloadSummaryTablesPdf(summary: MedicalSummary) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // --- Encabezado institucional superior ---
  doc.setFillColor(3, 105, 161); // Azul médico #0369a1
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MedRecall  |  Tablas Clínicas de Active Recall', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Especialidad: ${summary.specialty}   ·   Fecha: ${new Date(summary.analyzedAt).toLocaleDateString('es-ES')}`,
    margin,
    17
  );

  currentY = 28;

  // --- Título del tema y síntesis ---
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(summary.topicTitle, margin, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Documento analizado: ${summary.fileName}`, margin, currentY);
  currentY += 5;

  if (summary.keyOverview) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const splitOverview = doc.splitTextToSize(summary.keyOverview, pageWidth - margin * 2);
    doc.text(splitOverview, margin, currentY);
    currentY += splitOverview.length * 4.2 + 4;
  }

  // --- Generar cada una de las 11 tablas clínicas ---
  summary.sections.forEach((section, sIndex) => {
    // Si queda poco espacio en la página, iniciar nueva página
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = margin;
    }

    // Subtítulo de la tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(3, 105, 161);
    doc.text(section.title, margin, currentY);
    currentY += 4;

    // Preparar filas de la tabla con pregunta y respuesta desarrollada y justificada
    const tableRows = section.items.map((item, itemIdx) => {
      let fullAnswerText = item.detailedAnswer;
      if (item.clinicalPearls) {
        fullAnswerText += `\n\n[High-Yield Pearl]: ${item.clinicalPearls}`;
      }
      if (item.pageOrSectionRef) {
        fullAnswerText += `\n[Fuente]: ${item.pageOrSectionRef}`;
      }

      return [
        `P${itemIdx + 1}. ${item.question}`,
        fullAnswerText,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Pregunta Clínica (Active Recall)', 'Respuesta Desarrollada y Justificada (Visualización Abierta)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', fontSize: 8.5, textColor: [15, 23, 42] },
        1: { cellWidth: 'auto', fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 3 },
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 3,
        valign: 'top',
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      didDrawPage: () => {
        // Pie de página en todas las páginas
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `MedRecall  ·  ${summary.topicTitle}  ·  Página ${i} de ${totalPages}`,
            pageWidth / 2,
            pageHeight - 6,
            { align: 'center' }
          );
        }
      },
    });

    // Actualizar currentY después de la tabla
    const finalY = (doc as any).lastAutoTable?.finalY;
    currentY = finalY ? finalY + 7 : currentY + 30;
  });

  const sanitizedTitle = summary.topicTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${sanitizedTitle}_Tablas_ActiveRecall.pdf`);
}
