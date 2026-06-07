export type Cita = {
  id: string;
  fecha: string;       // 'YYYY-MM-DD'
  hora: string;        // 'HH:MM'
  medico: string;
  especialidad: string;
  resultado: string;
  proximaCita: string; // 'YYYY-MM-DD' o ''
};

export type EntradaDiario = {
  id: string;
  fecha: string;     // 'YYYY-MM-DD'
  semana: number;
  animo: string;     // emoji
  texto: string;
  foto: string | null; // URI local
};
