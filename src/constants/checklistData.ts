export type ItemPredefinido = {
  id: string;
  texto: string;
  trimestre: 1 | 2 | 3;
};

// Fuentes: ACOG prenatal care guidelines, WHO antenatal care recommendations
export const CHECKLIST_PREDEFINIDA: ItemPredefinido[] = [
  // ── Primer trimestre ──────────────────────────────────────────────────
  { id: 'T1_01', trimestre: 1, texto: 'Primera cita prenatal con el médico' },
  { id: 'T1_02', trimestre: 1, texto: 'Iniciar ácido fólico (400–800 mcg/día)' },
  { id: 'T1_03', trimestre: 1, texto: 'Tomar vitaminas prenatales' },
  { id: 'T1_04', trimestre: 1, texto: 'Análisis de sangre y orina iniciales' },
  { id: 'T1_05', trimestre: 1, texto: 'Primera ecografía (semana 8–12)' },
  { id: 'T1_06', trimestre: 1, texto: 'Elegir obstetra o ginecólogo definitivo' },
  { id: 'T1_07', trimestre: 1, texto: 'Calcular fecha probable de parto' },
  { id: 'T1_08', trimestre: 1, texto: 'Evitar alcohol, tabaco y medicamentos no aprobados' },
  { id: 'T1_09', trimestre: 1, texto: 'Informar al trabajo sobre el embarazo' },
  { id: 'T1_10', trimestre: 1, texto: 'Actualizar el seguro médico o afiliación' },

  // ── Segundo trimestre ─────────────────────────────────────────────────
  { id: 'T2_01', trimestre: 2, texto: 'Ecografía morfológica (semana 18–22)' },
  { id: 'T2_02', trimestre: 2, texto: 'Prueba de glucosa O\'Sullivan (semana 24–28)' },
  { id: 'T2_03', trimestre: 2, texto: 'Vacuna Tdap — tos ferina (semana 27–36)' },
  { id: 'T2_04', trimestre: 2, texto: 'Inscribirse en clases preparto' },
  { id: 'T2_05', trimestre: 2, texto: 'Elegir el nombre del bebé' },
  { id: 'T2_06', trimestre: 2, texto: 'Decorar y preparar el cuarto del bebé' },
  { id: 'T2_07', trimestre: 2, texto: 'Comprar artículos esenciales del bebé' },
  { id: 'T2_08', trimestre: 2, texto: 'Planear la licencia de maternidad y paternidad' },
  { id: 'T2_09', trimestre: 2, texto: 'Organizar el baby shower' },

  // ── Tercer trimestre ──────────────────────────────────────────────────
  { id: 'T3_01', trimestre: 3, texto: 'Preparar el maletín del hospital' },
  { id: 'T3_02', trimestre: 3, texto: 'Visitar el hospital o clínica donde nacerá el bebé' },
  { id: 'T3_03', trimestre: 3, texto: 'Instalar la silla de carro del bebé' },
  { id: 'T3_04', trimestre: 3, texto: 'Elegir pediatra para el recién nacido' },
  { id: 'T3_05', trimestre: 3, texto: 'Redactar el plan de parto' },
  { id: 'T3_06', trimestre: 3, texto: 'Clases de lactancia materna' },
  { id: 'T3_07', trimestre: 3, texto: 'Aprender técnicas de respiración y pujo' },
  { id: 'T3_08', trimestre: 3, texto: 'Organizar la llegada del bebé a casa' },
  { id: 'T3_09', trimestre: 3, texto: 'Tener listos los documentos del seguro y del hospital' },
  { id: 'T3_10', trimestre: 3, texto: 'Hablar con el médico sobre el plan de parto' },
];
