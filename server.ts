import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Permite payloads grandes de base64 para PDFs médicos
app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: true, limit: '80mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint de diagnóstico de salud
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

const CLINICAL_SYSTEM_INSTRUCTION = `
Eres un médico especialista de alto rendimiento y docente médico de élite para preparación de exámenes de residencia médica (ENARM, USMLE, MIR) y práctica clínica basada en evidencia.
Tu objetivo es analizar minuciosamente el documento médico proporcionado (PDF o texto clínico) y sintetizarlo en tablas de ACTIVE RECALL de alta fidelidad.

CAPACIDAD OCR Y LECTURA DE DOCUMENTOS ESCANEADOS:
- Si el documento adjunto corresponde a un archivo PDF escaneado, fotocopia, imagen o carece de texto seleccionable o de búsqueda, APLICA OCR VISUAL PROFUNDO página por página sobre el documento para transcribir y analizar el 100% de los datos clínicos, esquemas, tablas e ilustraciones.

REGLAS CRÍTICAS DE CALIDAD, CITACIÓN Y EXTRACCIÓN:
1. BASADO 100% EN EL TEXTO DEL DOCUMENTO: Cada pregunta y cada respuesta DEBE estar fundamentada directamente en los datos clínicos, estadísticas, guías y fármacos del texto suministrado.
2. EXTRACCIÓN DE CITAS TEXTUALES Y FRAGMENTOS DE ORIGEN ("sourceTextSnippet" y "pageOrSectionRef"):
   - Para CADA una de las preguntas formuladas, DEBES incluir en "sourceTextSnippet" el fragmento o cita textual exacta y literal del documento de donde se seleccionó la información para justificar la respuesta.
   - En "pageOrSectionRef", indica la página aproximada o sección del documento donde se ubica dicha cita (ej. "Página 4, sección Criterios Diagnósticos", "Pág. 12, Tabla 3 de Tratamiento").
3. NO USES PLANTILLAS GENÉRICAS NI PLACEHOLDERS: Prohibido responder con frases como "debe ser corroborada en la guía". Deduce la respuesta con precisión médica avanzada para la patología específica y justifícala explícitamente.
4. ORGANIZACIÓN ESTRICTA EN LOS 11 APARTADOS CLÍNICOS:
   - "definitions": Definición precisa de la patología, conceptos fisiopatológicos clave y clasificaciones del texto.
   - "epidemiology": Edad de presentación más frecuente, sexo predominante, factores de riesgo modificables y no modificables, incidencia, prevalencia, morbilidad y mortalidad con las cifras exactas del texto.
   - "etiology": Causas principales, microorganismos etiológicos específicos, factores desencadenantes o fisiopatología de inicio.
   - "clinical_features": Signos y síntomas cardinales, porcentajes de presentación, signo patognomónico (si existe) y tríada clásica (si existe).
   - "initial_workup": Primeros estudios de laboratorio y gabinete a solicitar (biometría, radiografía, ECG, ultrasonido basal) y qué hallazgos buscar.
   - "gold_standard": El estudio de gabinete o auxiliar diagnóstico más preciso o estándar de oro (Gold Standard) con su justificación diagnóstica (sensibilidad, especificidad o criterios definitivos).
   - "non_pharm_treatment": Medidas higiénico-dietéticas, cambios en estilo de vida, reposo, posición, terapia física, oxigenoterapia o restricciones nutricionales.
   - "first_line_and_alternatives": Esquema farmacológico de primera elección (fármacos, dosis/vía si se indican) y segundas líneas o alternativas específicas ante alergias o contraindicaciones señaladas en el documento.
   - "contraindications": Contraindicaciones absolutas y relativas de los tratamientos principales y qué medicamentos o maniobras deben evitarse.
   - "referral_criteria": Criterios específicos para referir a urgencias, enviar a segundo o tercer nivel de atención, o criterios de ingreso a Unidad de Cuidados Intensivos (UCI).
   - "complications": Complicaciones más importantes agudas, crónicas, secuelas graves o causas de mortalidad.

5. CADA PREGUNTA Y RESPUESTA (2 COLUMNAS):
   - Columna Izquierda ("question"): Pregunta clínica directa y desafiante para forzar el Active Recall.
   - Columna Derecha ("detailedAnswer"): Respuesta desarrollada y fundamentada explicando el PORQUÉ clínico y el mecanismo o recomendación de la guía.
   - "clinicalPearls": Perla mnemotécnica o regla de oro de alto rendimiento para recordar el concepto.
`;

// Esquema estructurado con enum estricto y campos de cita de origen (OCR / snippet)
const CLINICAL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topicTitle: {
      type: Type.STRING,
      description: 'Nombre de la patología o tema clínico principal del documento (ej. Apendicitis Aguda, Cetoacidosis Diabética)',
    },
    specialty: {
      type: Type.STRING,
      description: 'Especialidad médica (ej. Cirugía General, Medicina Interna, Cardiología, Endocrinología, etc.)',
    },
    keyOverview: {
      type: Type.STRING,
      description: 'Síntesis clínica ejecutiva de alto impacto del documento (2 a 3 oraciones densas en información médica)',
    },
    sections: {
      type: Type.ARRAY,
      description: 'Lista de los 11 apartados clínicos obligatorios',
      items: {
        type: Type.OBJECT,
        properties: {
          key: {
            type: Type.STRING,
            enum: [
              'definitions',
              'epidemiology',
              'etiology',
              'clinical_features',
              'initial_workup',
              'gold_standard',
              'non_pharm_treatment',
              'first_line_and_alternatives',
              'contraindications',
              'referral_criteria',
              'complications',
            ],
            description: 'Identificador exacto del apartado',
          },
          items: {
            type: Type.ARRAY,
            description: 'Lista de preguntas clínicas de active recall con respuestas justificadas y fragmento textual de origen',
            items: {
              type: Type.OBJECT,
              properties: {
                question: {
                  type: Type.STRING,
                  description: 'Pregunta clínica orientada al active recall sobre este subtema',
                },
                detailedAnswer: {
                  type: Type.STRING,
                  description: 'Respuesta desarrollada y justificada basada en el texto del documento médico',
                },
                clinicalPearls: {
                  type: Type.STRING,
                  description: 'Perla de alta rentabilidad (High-Yield Pearl) o mnemotecnia clínica para el concepto',
                },
                sourceTextSnippet: {
                  type: Type.STRING,
                  description: 'Fragmento textual literal o cita exacta del documento original de donde se obtuvo la información',
                },
                pageOrSectionRef: {
                  type: Type.STRING,
                  description: 'Página aproximada o subtítulo del documento fuente (ej. "Página 4, sección Criterios Diagnósticos")',
                },
                pageNumber: {
                  type: Type.INTEGER,
                  description: 'Número exacto de página del documento PDF (1, 2, 3...) donde se ubica el apartado de la respuesta',
                },
              },
              required: ['question', 'detailedAnswer'],
            },
          },
        },
        required: ['key', 'items'],
      },
    },
  },
  required: ['topicTitle', 'specialty', 'keyOverview', 'sections'],
};

// Metadata descriptiva y títulos de los 11 apartados
const SECTION_METADATA: Record<string, { title: string; shortLabel: string; iconName: string; badgeText: string }> = {
  definitions: {
    title: '1. Definiciones Principales del Tema',
    shortLabel: 'Definiciones',
    iconName: 'BookOpen',
    badgeText: 'Concepto Clave',
  },
  epidemiology: {
    title: '2. Datos Epidemiológicos más Importantes',
    shortLabel: 'Epidemiología',
    iconName: 'Activity',
    badgeText: 'Factores de Riesgo y Morbi-Mortalidad',
  },
  etiology: {
    title: '3. Etiologías más Importantes',
    shortLabel: 'Etiología',
    iconName: 'Microscope',
    badgeText: 'Causas y Disparadores',
  },
  clinical_features: {
    title: '4. Datos Clínicos Característicos y Tríada/Patognomónico',
    shortLabel: 'Clínica',
    iconName: 'Stethoscope',
    badgeText: 'Signos, Síntomas y Tríadas',
  },
  initial_workup: {
    title: '5. Estudios de Gabinete y Auxiliares Diagnósticos Iniciales',
    shortLabel: 'Gabinete Inicial',
    iconName: 'FileText',
    badgeText: 'Primer Abordaje',
  },
  gold_standard: {
    title: '6. Estudio de Gabinete/Auxiliar Más Preciso (Estándar de Oro)',
    shortLabel: 'Estándar de Oro',
    iconName: 'Award',
    badgeText: 'Gold Standard',
  },
  non_pharm_treatment: {
    title: '7. Tratamiento No Farmacológico',
    shortLabel: 'No Farmacológico',
    iconName: 'HeartPulse',
    badgeText: 'Estilo de Vida y Medidas Generales',
  },
  first_line_and_alternatives: {
    title: '8. Tratamiento Farmacológico de Elección y Alternativas',
    shortLabel: 'Farmacología',
    iconName: 'Pill',
    badgeText: '1ª Línea y 2ªs Líneas (Alergias)',
  },
  contraindications: {
    title: '9. Contraindicaciones de las Opciones de Tratamiento',
    shortLabel: 'Contraindicaciones',
    iconName: 'AlertTriangle',
    badgeText: 'Precauciones Críticas',
  },
  referral_criteria: {
    title: '10. Criterios de Referencia a Otro Nivel de Atención',
    shortLabel: 'Referencia',
    iconName: 'Share2',
    badgeText: 'Segundo/Tercer Nivel y UCI',
  },
  complications: {
    title: '11. Complicaciones más Importantes',
    shortLabel: 'Complicaciones',
    iconName: 'ShieldAlert',
    badgeText: 'Agudas y Crónicas',
  },
};

const ORDERED_KEYS = [
  'definitions',
  'epidemiology',
  'etiology',
  'clinical_features',
  'initial_workup',
  'gold_standard',
  'non_pharm_treatment',
  'first_line_and_alternatives',
  'contraindications',
  'referral_criteria',
  'complications',
];

// Endpoint para procesar el PDF con Gemini API y OCR automático
app.post('/api/analyze-pdf', async (req, res) => {
  try {
    const { pdfBase64, rawText, fileName = 'documento_clinico.pdf', fileSize = 0 } = req.body;

    if (!pdfBase64 && !rawText) {
      return res.status(400).json({
        error: 'Debe proporcionar el archivo PDF codificado en Base64 o el texto clínico a procesar.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'No se ha configurado la variable de entorno GEMINI_API_KEY en el servidor.',
      });
    }

    let extractedPdfText = '';
    let cleanBase64 = '';
    let isOcrNeeded = false;

    if (pdfBase64) {
      cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '');
      try {
        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const pdfData = await pdfParse(pdfBuffer);
        extractedPdfText = pdfData.text ? pdfData.text.trim() : '';
        console.log(`[MedRecall] Texto extraído con pdf-parse: ${extractedPdfText.length} caracteres (${pdfData.numpages} páginas)`);
      } catch (pdfErr) {
        console.warn('[MedRecall] Error al extraer texto plano con pdf-parse. Se activará OCR visual:', pdfErr);
      }
    }

    // Detección automática de PDF escaneado / sin texto seleccionable
    if (pdfBase64 && (!extractedPdfText || extractedPdfText.length < 150)) {
      isOcrNeeded = true;
      console.log('[MedRecall] Archivo sin texto seleccionable o escaneado detectado. Activando OCR visual multimodal con Gemini.');
    }

    const contentsParts: any[] = [];

    // Si se requiere OCR o el texto extraído es corto, enviamos siempre el archivo PDF como inlineData multimodal
    if (pdfBase64) {
      contentsParts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
    }

    const fullTextContent = (rawText || '') + (extractedPdfText ? `\n\n${extractedPdfText}` : '');

    const ocrInstructionText = isOcrNeeded
      ? `\n\n[ATENCIÓN OCR MULTIMODAL]: Este archivo PDF no contiene texto seleccionable digital nativo o es un documento escaneado/fotocopiado. Aplica lectura visual por OCR en cada página para transcribir y analizar todos los conceptos médicos, tablas, clasificaciones y dosificaciones contenidas en las imágenes del documento.`
      : '';

    const promptMessage = `
Analiza a fondo el siguiente documento médico: "${fileName}".${ocrInstructionText}

Extrae minuciosamente toda la información y organiza obligatoriamente las preguntas y respuestas de Active Recall en los 11 apartados clínicos:
1. definitions (Definiciones principales del tema)
2. epidemiology (Datos epidemiológicos: edad, sexo, factores de riesgo modificables/no modificables, incidencia, mortalidad)
3. etiology (Etiologías más importantes y causas fisiopatológicas)
4. clinical_features (Datos clínicos característicos: signos, síntomas, signo patognomónico si existe, tríada clásica si existe)
5. initial_workup (Estudios de gabinete/auxiliares diagnósticos iniciales)
6. gold_standard (Estudio de gabinete/auxiliar más preciso o estándar de oro)
7. non_pharm_treatment (Tratamiento no farmacológico)
8. first_line_and_alternatives (Tratamiento farmacológico de elección y sus alternativas/segundas líneas ante alergias o contraindicaciones)
9. contraindications (Contraindicaciones de las opciones de tratamiento)
10. referral_criteria (Criterios de referencia a otro nivel de atención: urgencias, 2°/3° nivel, UCI)
11. complications (Complicaciones más importantes agudas y crónicas)

REGLAS DE CITA DE ORIGEN PARA CADA RESPUESTA:
Para CADA pregunta clínica generada, debes incluir:
- "sourceTextSnippet": El fragmento literal o cita textual exacta de donde se obtuvo la afirmación del texto/documento original.
- "pageOrSectionRef": La referencia de la página o sección (ej. "Página 3, Apartado de Diagnóstico", "Pág. 8, Tratamiento").

${
  fullTextContent.trim().length > 0
    ? `--- INICIO DEL TEXTO DEL DOCUMENTO MÉDICO ---\n${fullTextContent.slice(0, 70000)}\n--- FIN DEL TEXTO DEL DOCUMENTO MÉDICO ---`
    : 'Por favor lee e interpreta visualmente todas las páginas del PDF adjunto mediante OCR visual para estructurar el contenido.'
}
`;

    contentsParts.push({ text: promptMessage });

    // Modelos permitidos con reintento para alta disponibilidad
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let response: any = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(`[MedRecall] Consultando modelo ${model} (intento ${attempt + 1})...`);
          response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: contentsParts,
              },
            ],
            config: {
              systemInstruction: CLINICAL_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: CLINICAL_RESPONSE_SCHEMA,
            },
          });
          if (response?.text) {
            console.log(`[MedRecall] Éxito con modelo ${model}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[MedRecall] Fallo con ${model}:`, err?.message || err);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      if (response?.text) break;
    }

    if (!response || !response.text) {
      throw lastError || new Error('No se pudo obtener respuesta del modelo médico de IA.');
    }

    const responseText = response.text.trim();
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error al parsear respuesta JSON de Gemini:', responseText);
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        parsedData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('La respuesta de la IA no pudo ser interpretada como JSON válido.');
      }
    }

    const rawSections = parsedData.sections || [];

    const KEY_ALIASES: Record<string, string[]> = {
      definitions: ['definitions', 'definicion', 'definiciones', 'definicion_principal', 'concepto'],
      epidemiology: ['epidemiology', 'epidemiologia', 'epidemiologia_factores_riesgo', 'factores_riesgo', 'demografia', 'epidemiologicos'],
      etiology: ['etiology', 'etiologia', 'etiopatogenia', 'causas', 'fisiopatologia', 'etiologias'],
      clinical_features: ['clinical_features', 'manifestaciones_clinicas', 'clinica', 'signos_sintomas', 'cuadro_clinico', 'datos_clinicos'],
      initial_workup: ['initial_workup', 'estudios_diagnosticos_iniciales', 'gabinete_inicial', 'estudios_iniciales', 'laboratorio_inicial', 'abordaje_inicial'],
      gold_standard: ['gold_standard', 'estudio_confirmatorio_gold_standard', 'estandar_oro', 'estudio_oro', 'confirmatorio', 'gold_standard_diagnostico'],
      non_pharm_treatment: ['non_pharm_treatment', 'tratamiento_no_farmacologico', 'no_farmacologico', 'medidas_generales', 'estilo_vida'],
      first_line_and_alternatives: ['first_line_and_alternatives', 'tratamiento_farmacologico_primera_linea', 'farmacologia', 'tratamiento_farmacologico', 'eleccion_alternativas', 'farmacologico'],
      contraindications: ['contraindications', 'contraindicaciones_precauciones', 'contraindicaciones', 'precauciones', 'contraindicaciones_tratamiento'],
      referral_criteria: ['referral_criteria', 'criterios_referencia_ingreso', 'referencia', 'criterios_referencia', 'segundo_tercer_nivel', 'criterios_de_referencia'],
      complications: ['complications', 'complicaciones', 'complicaciones_secuelas', 'complicaciones_mas_importantes'],
    };

    function findItemsForSection(targetKey: string, targetIndex: number): any[] {
      const aliases = KEY_ALIASES[targetKey] || [targetKey];

      // 1. Coincidencia exacta o parcial de alias en la key
      for (const s of rawSections) {
        if (!s) continue;
        const sKey = (s.key || s.sectionKey || s.id || '').toLowerCase().trim();
        if (aliases.some((alias) => sKey === alias || sKey.includes(alias) || alias.includes(sKey))) {
          if (Array.isArray(s.items) && s.items.length > 0) return s.items;
        }
      }

      // 2. Coincidencia en el título si la sección tiene nombre o título
      for (const s of rawSections) {
        if (!s) continue;
        const sTitle = (s.title || s.name || s.shortLabel || '').toLowerCase().trim();
        if (aliases.some((alias) => sTitle.includes(alias))) {
          if (Array.isArray(s.items) && s.items.length > 0) return s.items;
        }
      }

      // 3. Posicional: si el modelo retornó los 11 apartados en el orden exacto solicitado
      if (rawSections[targetIndex] && Array.isArray(rawSections[targetIndex].items) && rawSections[targetIndex].items.length > 0) {
        return rawSections[targetIndex].items;
      }

      return [];
    }

    // Estructurar los 11 apartados en el orden exacto solicitado
    const formattedSections = ORDERED_KEYS.map((key, index) => {
      const meta = SECTION_METADATA[key];
      const modelItems = findItemsForSection(key, index);

      const finalItems = modelItems.map((item: any, itemIdx: number) => ({
        id: `${key}-${index}-${itemIdx}-${Math.random().toString(36).substring(2, 7)}`,
        question: item.question || `Aspecto clínico clave sobre ${meta.shortLabel}`,
        detailedAnswer: item.detailedAnswer || 'Respuesta y justificación fundamentada en el texto del documento.',
        clinicalPearls: item.clinicalPearls || undefined,
        sourceTextSnippet: item.sourceTextSnippet || item.cita || undefined,
        pageOrSectionRef: item.pageOrSectionRef || item.referencia || undefined,
        pageNumber: item.pageNumber ? Number(item.pageNumber) : 1,
        isRevealed: false,
        masteryStatus: 'untested',
      }));

      return {
        key,
        title: meta.title,
        shortLabel: meta.shortLabel,
        iconName: meta.iconName,
        badgeText: meta.badgeText,
        items: finalItems,
      };
    });

    const summaryPayload = {
      id: `summary-${Date.now()}`,
      topicTitle: parsedData.topicTitle || fileName.replace(/\.pdf$/i, '').replace(/_/g, ' '),
      specialty: parsedData.specialty || 'Medicina General / Especialidad',
      fileName,
      fileSizeBytes: fileSize,
      analyzedAt: new Date().toISOString(),
      keyOverview: parsedData.keyOverview || 'Resumen clínico estructurado en los 11 apartados esenciales con Active Recall.',
      isOcrApplied: isOcrNeeded,
      pdfBase64: cleanBase64 || undefined,
      sections: formattedSections,
    };

    return res.json({
      success: true,
      summary: summaryPayload,
    });
  } catch (error: any) {
    console.error('[MedRecall] Error al procesar documento médico:', error);
    return res.status(500).json({
      error: error?.message || 'Ocurrió un error inesperado al analizar el documento médico.',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MedRecall Server] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
