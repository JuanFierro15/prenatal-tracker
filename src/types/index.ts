export type Cita = {
  id: string;
  fecha: string;       // 'YYYY-MM-DD'
  hora: string;        // 'HH:MM'
  medico: string;
  especialidad: string;
  resultado: string;
  proximaCita: string; // 'YYYY-MM-DD' o ''
};

export type DiaPatadas = {
  id: string;           // fecha como ID
  fecha: string;        // 'YYYY-MM-DD'
  semana: number;
  patadas: number;      // total del día
  meta: number;         // meta de esa semana
  timestamps: number[]; // hora de cada patada
};

export type SesionPatadas = {
  id: string;
  fecha: string;        // 'YYYY-MM-DD'
  semana: number;
  inicio: number;       // ms timestamp
  fin: number | null;   // ms timestamp, null = sesión en curso
  patadas: number;
  meta: number;
  alerta: number;       // umbral por debajo del cual avisar al médico
  timestamps: number[]; // ms timestamp de cada patada
};

export type SintomaRegistrado = {
  id: string;
  intensidad: 'leve' | 'moderado' | 'fuerte';
};

export type RegistroSintomas = {
  id: string;
  fecha: string;   // 'YYYY-MM-DD'
  semana: number;
  sintomas: SintomaRegistrado[];
  nota: string;
};

export type EntradaDiario = {
  id: string;
  fecha: string;     // 'YYYY-MM-DD'
  semana: number;
  animo: string;     // emoji
  texto: string;
  foto: string | null; // URI local
};
