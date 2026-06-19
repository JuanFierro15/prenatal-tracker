export type Cita = {
  id: string;
  fecha: string;       // 'YYYY-MM-DD'
  hora: string;        // 'HH:MM'
  medico: string;
  especialidad: string;
  resultado: string;
  proximaCita: string; // 'YYYY-MM-DD' o ''
  notifId?: string;        // recordatorio 3h antes
  notifMorningId?: string; // aviso 8 AM del día de la cita
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

export type ContactoEmergencia = {
  id: string;
  nombre: string;
  relacion: string;
  telefono: string;
};

export type DatosMedicos = {
  tipoSangre: string;
  medico: string;
  clinica: string;
  direccionClinica: string;
  alergias: string;
  notas: string;
};

export type FotoSemana = {
  semana: number;
  uri: string;
  fecha: string; // 'YYYY-MM-DD'
};

export type Momento = {
  id: string;
  uri: string;
  titulo: string;
  fecha: string; // 'YYYY-MM-DD'
  nota: string;
};

export type VotoNombre = 'si' | 'no' | null;

export type Nombre = {
  id: string;
  nombre: string;
  genero: 'niño' | 'niña' | 'ambos';
  votaMama: VotoNombre;
  votaPapa: VotoNombre;
  nota: string;
};

export type Contraccion = {
  id: string;
  inicio: number;     // ms timestamp
  fin: number | null; // null = en curso
};

export type SesionContracciones = {
  id: string;
  fecha: string;      // 'YYYY-MM-DD'
  inicio: number;     // ms timestamp inicio sesión
  contracciones: Contraccion[];
};

export type TareaPersonal = {
  id: string;
  texto: string;
  completado: boolean;
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

export type DocumentoPDF = {
  id: string;
  nombre: string;    // nombre que muestra el usuario
  archivo: string;   // nombre original del archivo
  uri: string;       // ruta permanente en documentDirectory
  categoria: string;
  fecha: string;     // 'YYYY-MM-DD'
  semana: number;
};

export type RegistroPeso = {
  id: string;
  fecha: string;  // 'YYYY-MM-DD'
  semana: number;
  peso: number;   // kg, un decimal
};

export type ConfigEmbarazo = {
  nombreBebe: string;
  nombreMama: string;
  nombrePapa: string;
  fechaInicio: string;  // 'YYYY-MM-DD' FUR (fecha última regla)
  sexoBebe: 'niño' | 'niña' | 'desconocido';
};

export type EntradaDiario = {
  id: string;
  fecha: string;     // 'YYYY-MM-DD'
  semana: number;
  animo: string;     // emoji
  texto: string;
  foto: string | null; // URI local
};
