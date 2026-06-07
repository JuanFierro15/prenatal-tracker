import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Cita } from '../types';
import { ESPECIALIDAD_COLORS } from '../constants/especialidadColors';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

interface Props {
  citas: Cita[];
}

export default function CalendarioCitas({ citas }: Props) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // Citas de este mes agrupadas por día
  const citasPorDia: Record<number, Cita[]> = {};
  const prefixMes = `${year}-${String(month + 1).padStart(2, '0')}`;
  citas.forEach(c => {
    if (!c.fecha?.startsWith(prefixMes)) return;
    const dia = parseInt(c.fecha.split('-')[2]);
    if (!citasPorDia[dia]) citasPorDia[dia] = [];
    citasPorDia[dia].push(c);
  });

  // Especialidades presentes este mes para la leyenda
  const especialidadesPresentes = Array.from(
    new Set(Object.values(citasPorDia).flat().map(c => c.especialidad))
  );

  const diasEnMes   = new Date(year, month + 1, 0).getDate();
  const primerDia   = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes=0
  const hoyDia      = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1;

  const celdas: (number | null)[] = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <View style={styles.container}>
      {/* Encabezado mes */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.mesTitle}>{MESES[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Nombres de días */}
      <View style={styles.diasRow}>
        {DIAS.map(d => (
          <Text key={d} style={styles.diaHeader}>{d}</Text>
        ))}
      </View>

      {/* Grilla */}
      <View style={styles.grid}>
        {celdas.map((dia, i) => {
          if (!dia) return <View key={`e-${i}`} style={styles.celda} />;

          const citasHoy  = citasPorDia[dia] ?? [];
          const isHoy     = dia === hoyDia;
          const tieneCita = citasHoy.length > 0;
          const colorPrincipal = tieneCita
            ? ESPECIALIDAD_COLORS[citasHoy[0].especialidad] ?? '#9E9E9E'
            : undefined;

          return (
            <View key={dia} style={styles.celda}>
              <View style={[
                styles.diaCirculo,
                isHoy && styles.diaCirculoHoy,
                tieneCita && !isHoy && { backgroundColor: colorPrincipal + '22' },
              ]}>
                <Text style={[
                  styles.diaNum,
                  isHoy && styles.diaNumHoy,
                  tieneCita && !isHoy && { color: colorPrincipal, fontWeight: '700' },
                ]}>
                  {dia}
                </Text>
              </View>

              {/* Puntos de especialidades */}
              <View style={styles.puntos}>
                {citasHoy.slice(0, 3).map((c, idx) => (
                  <View
                    key={idx}
                    style={[styles.punto, { backgroundColor: ESPECIALIDAD_COLORS[c.especialidad] ?? '#9E9E9E' }]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Leyenda */}
      {especialidadesPresentes.length > 0 && (
        <View style={styles.leyenda}>
          {especialidadesPresentes.map(esp => (
            <View key={esp} style={styles.leyendaItem}>
              <View style={[styles.leyendaDot, { backgroundColor: ESPECIALIDAD_COLORS[esp] ?? '#9E9E9E' }]} />
              <Text style={styles.leyendaText}>{esp}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    marginBottom: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: '#C2185B', fontWeight: '700' },
  mesTitle: { fontSize: 17, fontWeight: '800', color: '#222' },
  diasRow: { flexDirection: 'row', marginBottom: 6 },
  diaHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#aaa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 6 },
  diaCirculo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaCirculoHoy: {
    backgroundColor: '#C2185B',
  },
  diaNum: { fontSize: 14, color: '#333' },
  diaNumHoy: { color: '#fff', fontWeight: '800' },
  puntos: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6 },
  punto: { width: 5, height: 5, borderRadius: 3 },
  leyenda: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaDot: { width: 10, height: 10, borderRadius: 5 },
  leyendaText: { fontSize: 12, color: '#555' },
});
