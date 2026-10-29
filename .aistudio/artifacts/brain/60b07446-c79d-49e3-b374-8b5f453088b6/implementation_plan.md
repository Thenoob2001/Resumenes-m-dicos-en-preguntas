# MedRecall: Plataforma de Resúmenes Clínicos y Active Recall desde PDF

Plataforma médica especializada para estudiantes de medicina, médicos internos de pregrado (MIP) y residentes que transforma guías clínicas y libros en PDF en tablas interactivas de Active Recall organizadas en los 11 pilares diagnósticos y terapéuticos esenciales, complementada con un Modo Examen cronometrado y exportación a Anki CSV.

## User Review & Critical Decisions

> [!IMPORTANT]
> Se han incorporado las tres decisiones confirmadas por el usuario en la fase de clarificación:
> 1. **Carga exclusiva de PDF**: El flujo principal se centra en la carga manual de documentos PDF clínicos (guías de práctica clínica, consensos, manuales o apuntes médicos).
> 2. **Modo Examen con Temporizador**: Además del estudio interactivo en tablas, se incluye un modo de evaluación simulada paso a paso con temporizador configurable y calificación ponderada por apartado clínico.
> 3. **Exportación a Anki CSV**: Generación y descarga directa de archivos delimitados listos para importar a Anki con etiquetas clínicas por apartado (`#Definiciones`, `#Etiología`, `#GoldStandard`, `#Farmacología`, etc.).

---

## 1. Overview & Core Concept

- **Propósito**: Automatizar la síntesis de documentos médicos densos en un formato pedagógico de alto rendimiento (Active Recall & Retrieval Practice), dividiendo cualquier patología o tema médico en tablas analíticas estandarizadas con preguntas clínicas en la columna izquierda y respuestas desarrolladas y justificadas en la columna derecha.
- **Los 11 Apartados Clínicos Obligatorios**:
  1. *Definiciones principales del tema*
  2. *Datos epidemiológicos más importantes* (edad, sexo, factores de riesgo modificables y no modificables, incidencia, morbilidad y mortalidad)
  3. *Etiologías más importantes* (microorganismos, causas fisiopatológicas, disparadores)
  4. *Datos clínicos característicos de cada patología* (signos y síntomas cardinales, signo patognomónico si existe, tríada clásica si existe)
  5. *Estudios de gabinete y auxiliares diagnósticos iniciales* (laboratorios basales, radiografías, ECG, etc.)
  6. *Estudio de gabinete/auxiliar diagnóstico más preciso o Estándar de Oro (Gold Standard)*
  7. *Tratamiento no farmacológico* (cambios en estilo de vida, dieta, reposo, medidas físicas)
  8. *Tratamiento farmacológico de elección y segundas líneas / alternativas* (alergias o contraindicaciones)
  9. *Contraindicaciones de las opciones de tratamiento*
  10. *Criterios de referencia a otro nivel de atención* (urgencias, segundo/tercer nivel, terapia intensiva)
  11. *Complicaciones más importantes* (agudas, crónicas, secuelas graves)
- **Modo Examen y Autoevaluación**:
  - Examen dinámico con temporizador regresivo personalizable (modo contrarreloj estilo ENARM/USMLE).
  - Revelado de respuesta justificada con autoevaluación (Dominado / En duda / No recordado).
  - Calificación global porcentual y desglose de fortalezas y debilidades por cada sección diagnóstica/terapéutica.
- **Exportación Flexible**:
  - Exportador Anki (.csv con delimitador de tabulación y formato Front/Back HTML limpio).
  - Hoja de estudio imprimible optimizada para papel o PDF exportable.

---

## 2. User Experience & Visual Design

### Flujo Principal del Usuario
1. **Zona de Carga (Upload & Dropzone)**:
   - Panel de arrastre estilizado para archivos PDF médicos con indicador de tamaño y análisis en tiempo real.
   - Estado de progreso animado con etapas de procesamiento: *Extracción de páginas* $\to$ *Identificación de entidades clínicas* $\to$ *Formulación de preguntas activas* $\to$ *Generación de tablas justificadas*.
2. **Vista de Estudio por Tablas (Active Recall Matrix)**:
   - Encabezado con información del tema sintetizado, número total de preguntas formuladas y barra de dominio.
   - Controles globales superiores: *Ocultar Todas las Respuestas* / *Mostrar Todas las Respuestas*, *Modo Examen*, *Exportar Anki CSV*, *Imprimir Guía*.
   - Acordeón / Secciones de los 11 apartados clínicos con botón local para ocultar/mostrar todas las respuestas del apartado específico.
   - Cada fila de tabla cuenta con:
     - Pregunta clínica orientada al razonamiento médico.
     - Celda de respuesta con cortina interactiva de revelado ("Ver justificación clínica" / "Ocultar").
     - Marcador de autoevaluación rápida (check de acierto para seguimiento personal).
3. **Modo Examen (Timed Simulation Deck)**:
   - Interfaz enfocada sin distracciones con temporizador visual, tarjeta clínica central, área para teclear o pensar la respuesta, botón de revelación de justificación y selector de evaluación (3 niveles).
   - Pantalla final de resultados con gráfica de desempeño por apartado clínico y recomendaciones de repaso.

### Visual Identity & Theme
- **Dirección Estética**: *Clinical Precision & High-Yield Editorial*. Inspirada en plataformas médicas de referencia internacional (UpToDate, Amboss, NEJM), con rigor tipográfico, espacios amplios y máxima legibilidad para largas sesiones de estudio.
- **Paleta de Colores**:
  - Base: Canvas limpio blanco y gris pizarra suave (`bg-slate-50`, `bg-white`).
  - Superficies estructurales: Bordes sutiles de línea capilar (`border-slate-200`) y tarjetas en blanco puro con relieve ligero.
  - Acentos Médicos: Azul clínico profundo (`#0284c7` / `#0369a1`) y verde quirúrgico (`#059669`) para conceptos de elección/estándar de oro; ámbar clínico (`#d97706`) para contraindicaciones y precauciones.
- **Tipografía**:
  - Títulos y encabezados: `Plus Jakarta Sans` semi-negrita con jerarquía equilibrada.
  - Cuerpo de lectura: `Plus Jakarta Sans` y números tabulares (`tabular-nums`) para datos epidemiológicos y dosis.
- **Anti-Slop Discipline**: Cero píldoras flotantes estáticas ni decoraciones superfluas; diseño limpio con etiquetas contextuales claras y legibilidad WCAG AA.

---

## 3. Key Product Decisions & Trade-Offs

- **Motor de Análisis Multimodal con Gemini 3.8 Flash**:
  - *Decisión*: Procesar el archivo PDF directamente como documento `inlineData` (`mimeType: application/pdf`) en el backend con `@google/genai` utilizando `gemini-3.8-flash`.
  - *Ventaja*: Gemini procesa nativamente texto, tablas y figuras médicas complejas sin pérdida de formato, entregando un esquema JSON validado con los 11 apartados clínicos requeridos y preguntas de alta calidad.
- **Estructura de Preguntas y Respuestas Justificadas**:
  - *Decisión*: Cada concepto no es solo una definición plana, sino una pregunta clínica formulada para activar el recuerdo (e.g. *¿Cuál es el estudio inicial y cuál es el estándar de oro en apendicitis aguda según el grupo etario?*) y una respuesta desarrollada con su justificación fisiopatológica y evidencia médica.
- **Almacenamiento Local (Local Persistence)**:
  - *Decisión*: Guardar los resúmenes generados en el almacenamiento del navegador (`localStorage`) para que el estudiante pueda alternar entre resúmenes cargados previamente sin necesidad de volver a consumir tokens ni re-subir el PDF.
- **Exportación Estándar para Anki**:
  - *Decisión*: Generar un archivo CSV con codificación UTF-8 listo para importar en Anki con sintaxis de tarjeta básica (Anverso: Pregunta + Categoría; Reverso: Respuesta con justificación clínica enriquecida y resaltados clave).

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                              │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │   PDF Upload Zone        │  │   Study Mode Controller                │  │
│  │   - Drag & Drop          │  │   - Hide/Show Global & By Section      │  │
│  │   - Base64 Encoding      │  │   - Tabular Active Recall View         │  │
│  └─────────────┬────────────┘  └───────────────────┬────────────────────┘  │
│                │                                   │                       │
│                ▼                                   ▼                       │
│  ┌──────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │   Timed Exam Engine      │  │   Export Deck                          │  │
│  │   - Stopwatch / Timer    │  │   - Anki CSV Generator (.csv)          │  │
│  │   - Mastery Score Matrix │  │   - Print-Ready View                   │  │
│  └──────────────────────────┘  └────────────────────────────────────────┘  │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ HTTP POST /api/analyze-pdf
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express Proxy)                            │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │   POST /api/analyze-pdf                                              │  │
│  │   - Recibe payload base64 del PDF                                    │  │
│  │   - Invoca `@google/genai` (SDK moderno) con `gemini-3.8-flash`      │  │
│  │   - System Prompt especializado en medicina basada en evidencia      │  │
│  │   - Structured JSON schema para los 11 apartados clínicos            │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    Google Gen AI SDK (Server-Side)                         │
│                  Modelo: `models/gemini-3.8-flash`                         │
└────────────────────────────────────────────────────────────────────────────┘
```

### Esquema de Datos del Resumen Clínico

```typescript
interface ClinicalQA {
  id: string;
  question: string;
  detailedAnswer: string;
  clinicalPearls?: string;
  isRevealed?: boolean;
}

interface ClinicalSection {
  sectionKey:
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
  sectionTitle: string;
  description: string;
  items: ClinicalQA[];
}

interface MedicalSummary {
  id: string;
  topicTitle: string;
  subspecialty?: string;
  analyzedAt: string;
  fileName: string;
  sections: ClinicalSection[];
}
```
