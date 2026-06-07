export type Cita = {
  id: string;
  fecha: string;       // 'YYYY-MM-DD'
  hora: string;        // 'HH:MM'
  medico: string;
  especialidad: string;
  resultado: string;
  proximaCita: string; // 'YYYY-MM-DD' o ''
};
