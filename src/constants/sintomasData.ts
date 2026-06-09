export type Semaforo = 'verde' | 'amarillo' | 'rojo';

export type Sintoma = {
  id: string;
  nombre: string;
  emoji: string;
  semaforo: Semaforo;
  alerta?: string;
  trimestres: number[]; // 1, 2, 3
};

// Fuentes: ACOG Practice Bulletin, UpToDate "Common symptoms during pregnancy"
export const SINTOMAS: Sintoma[] = [
  // ── Verde: normales del embarazo ──────────────────────────────────────
  {
    id: 'nauseas',
    nombre: 'Náuseas',
    emoji: '🤢',
    semaforo: 'verde',
    trimestres: [1, 2],
  },
  {
    id: 'fatiga',
    nombre: 'Fatiga',
    emoji: '😴',
    semaforo: 'verde',
    trimestres: [1, 2, 3],
  },
  {
    id: 'acidez',
    nombre: 'Acidez',
    emoji: '🔥',
    semaforo: 'verde',
    trimestres: [1, 2, 3],
  },
  {
    id: 'estrenimiento',
    nombre: 'Estreñimiento',
    emoji: '😣',
    semaforo: 'verde',
    trimestres: [1, 2, 3],
  },
  {
    id: 'sensibilidad_senos',
    nombre: 'Senos sensibles',
    emoji: '💗',
    semaforo: 'verde',
    trimestres: [1, 2],
  },
  {
    id: 'miccion_frecuente',
    nombre: 'Micción frecuente',
    emoji: '🚽',
    semaforo: 'verde',
    trimestres: [1, 3],
  },
  {
    id: 'mareos',
    nombre: 'Mareos leves',
    emoji: '😵‍💫',
    semaforo: 'verde',
    trimestres: [1, 2],
  },
  {
    id: 'cambios_humor',
    nombre: 'Cambios de humor',
    emoji: '😢',
    semaforo: 'verde',
    trimestres: [1, 2, 3],
  },
  {
    id: 'dolor_espalda',
    nombre: 'Dolor de espalda',
    emoji: '🔙',
    semaforo: 'verde',
    trimestres: [2, 3],
  },
  {
    id: 'dolor_ligamentos',
    nombre: 'Dolor ligamentos',
    emoji: '🤕',
    semaforo: 'verde',
    trimestres: [2, 3],
  },
  {
    id: 'congestion_nasal',
    nombre: 'Congestión nasal',
    emoji: '🤧',
    semaforo: 'verde',
    trimestres: [2, 3],
  },
  {
    id: 'calambres_piernas',
    nombre: 'Calambres',
    emoji: '⚡',
    semaforo: 'verde',
    trimestres: [2, 3],
  },
  {
    id: 'hinchazon_pies',
    nombre: 'Hinchazón de pies',
    emoji: '🦶',
    semaforo: 'verde',
    trimestres: [2, 3],
  },
  {
    id: 'braxton_hicks',
    nombre: 'Braxton Hicks',
    emoji: '🫄',
    semaforo: 'verde',
    trimestres: [3],
  },
  {
    id: 'insomnio',
    nombre: 'Insomnio',
    emoji: '🌙',
    semaforo: 'verde',
    trimestres: [1, 3],
  },
  {
    id: 'falta_aliento',
    nombre: 'Falta de aliento leve',
    emoji: '💨',
    semaforo: 'verde',
    trimestres: [3],
  },

  // ── Amarillo: consultar si persiste o es intenso ──────────────────────
  {
    id: 'vomitos',
    nombre: 'Vómitos frecuentes',
    emoji: '🤮',
    semaforo: 'amarillo',
    alerta: 'Si vomitas más de 3-4 veces al día o no puedes retener líquidos, consulta a tu médico — puede ser hiperémesis gravídica.',
    trimestres: [1],
  },
  {
    id: 'dolor_cabeza',
    nombre: 'Dolor de cabeza',
    emoji: '🤯',
    semaforo: 'amarillo',
    alerta: 'Un dolor de cabeza intenso que no mejora con reposo puede ser señal de hipertensión gestacional. Consulta a tu médico.',
    trimestres: [1, 2, 3],
  },
  {
    id: 'fiebre',
    nombre: 'Fiebre',
    emoji: '🌡️',
    semaforo: 'amarillo',
    alerta: 'Fiebre mayor a 38 °C durante el embarazo debe ser evaluada por tu médico sin demora.',
    trimestres: [1, 2, 3],
  },
  {
    id: 'hinchazon_cara',
    nombre: 'Hinchazón de cara/manos',
    emoji: '😮',
    semaforo: 'amarillo',
    alerta: 'La hinchazón repentina de cara o manos puede ser señal de preeclampsia. Consulta a tu médico pronto.',
    trimestres: [2, 3],
  },
  {
    id: 'vision_borrosa',
    nombre: 'Visión borrosa',
    emoji: '👁️',
    semaforo: 'amarillo',
    alerta: 'Visión borrosa o destellos de luz pueden indicar preeclampsia. Consulta a tu médico.',
    trimestres: [2, 3],
  },
  {
    id: 'dolor_abdominal_mod',
    nombre: 'Dolor abdominal moderado',
    emoji: '😖',
    semaforo: 'amarillo',
    alerta: 'El dolor abdominal moderado o persistente debe ser evaluado por tu médico para descartar causas serias.',
    trimestres: [1, 2, 3],
  },

  // ── Rojo: atención médica inmediata ───────────────────────────────────
  {
    id: 'sangrado',
    nombre: 'Sangrado vaginal',
    emoji: '🩸',
    semaforo: 'rojo',
    alerta: 'Cualquier sangrado vaginal durante el embarazo requiere atención médica inmediata. Acude a urgencias.',
    trimestres: [1, 2, 3],
  },
  {
    id: 'dolor_severo',
    nombre: 'Dolor abdominal severo',
    emoji: '😱',
    semaforo: 'rojo',
    alerta: 'Dolor abdominal severo o agudo requiere atención de urgencias de inmediato.',
    trimestres: [1, 2, 3],
  },
  {
    id: 'contracciones_prematuras',
    nombre: 'Contracciones regulares',
    emoji: '⏱️',
    semaforo: 'rojo',
    alerta: 'Contracciones regulares antes de la semana 37 pueden indicar parto prematuro. Ve al hospital ahora.',
    trimestres: [2, 3],
  },
  {
    id: 'perdida_liquido',
    nombre: 'Pérdida de líquido',
    emoji: '💧',
    semaforo: 'rojo',
    alerta: 'La pérdida repentina de líquido puede indicar rotura de membranas. Acude a urgencias de inmediato.',
    trimestres: [2, 3],
  },
];

export const SEMAFORO_COLOR: Record<string, string> = {
  verde: '#4CAF50',
  amarillo: '#FF9800',
  rojo: '#F44336',
};

export const SEMAFORO_BG: Record<string, string> = {
  verde: '#E8F5E9',
  amarillo: '#FFF3E0',
  rojo: '#FFEBEE',
};
