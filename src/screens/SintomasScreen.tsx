import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistroSintomas, SintomaRegistrado } from '../types';
import { SINTOMAS, SEMAFORO_COLOR, SEMAFORO_BG } from '../constants/sintomasData';

const STORAGE_KEY = '@registros_sintomas';
const PREGNANCY_START = new Date(2026, 2, 29);

function semanaActual(): number {
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - PREGNANCY_START.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(dias / 7);
}

function trimestreActual(semana: number): 1 | 2 | 3 {
  if (semana <= 13) return 1;
  if (semana <= 27) return 2;
  return 3;
}

function hoyStr(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

function formatFecha(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

const INTENSIDAD: Array<'leve' | 'moderado' | 'fuerte'> = ['leve', 'moderado', 'fuerte'];
const INTENSIDAD_LABEL = { leve: 'Leve', moderado: 'Moderado', fuerte: 'Fuerte' };

async function leerRegistros(): Promise<RegistroSintomas[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export default function SintomasScreen() {
  const [registros, setRegistros] = useState<RegistroSintomas[]>([]);
  const [seleccionados, setSeleccionados] = useState<Record<string, 'leve' | 'moderado' | 'fuerte'>>({});
  const [nota, setNota] = useState('');
  const [editando, setEditando] = useState(false);
  const [verTodos, setVerTodos] = useState(false);

  const semana = semanaActual();
  const trimestre = trimestreActual(semana);
  const hoy = hoyStr();

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      const todos = await leerRegistros();
      setRegistros(todos);
      const registroHoy = todos.find(r => r.fecha === hoy);
      if (registroHoy) {
        const sel: Record<string, 'leve' | 'moderado' | 'fuerte'> = {};
        registroHoy.sintomas.forEach(s => { sel[s.id] = s.intensidad; });
        setSeleccionados(sel);
        setNota(registroHoy.nota);
        setEditando(false);
      } else {
        setEditando(true);
      }
    } catch {}
  }

  function toggleSintoma(id: string) {
    setSeleccionados(prev => {
      if (prev[id] !== undefined) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 'leve' };
    });
  }

  function setIntensidad(id: string, intensidad: 'leve' | 'moderado' | 'fuerte') {
    setSeleccionados(prev => ({ ...prev, [id]: intensidad }));
  }

  async function guardar() {
    const sintomas: SintomaRegistrado[] = Object.entries(seleccionados).map(
      ([id, intensidad]) => ({ id, intensidad })
    );
    const registro: RegistroSintomas = { id: hoy, fecha: hoy, semana, sintomas, nota };
    const todos = await leerRegistros();
    const actualizados = [registro, ...todos.filter(r => r.fecha !== hoy)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));
    setRegistros(actualizados);
    setEditando(false);
  }

  async function eliminarRegistro(id: string) {
    Alert.alert('Eliminar registro', '¿Seguro que quieres eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const todos = await leerRegistros();
          const actualizados = todos.filter(r => r.id !== id);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));
          setRegistros(actualizados);
          if (id === hoy) {
            setSeleccionados({});
            setNota('');
            setEditando(true);
          }
        },
      },
    ]);
  }

  const sintomasComunes = SINTOMAS.filter(s => s.trimestres.includes(trimestre));
  const sintomasResto = SINTOMAS.filter(s => !s.trimestres.includes(trimestre));
  const sintomasMostrados = verTodos ? SINTOMAS : sintomasComunes;

  const seleccionadosConDatos = Object.keys(seleccionados)
    .map(id => ({ sintoma: SINTOMAS.find(s => s.id === id)!, intensidad: seleccionados[id] }))
    .filter(x => x.sintoma);

  const alertas = seleccionadosConDatos.filter(x => x.sintoma.semaforo !== 'verde');
  const registroHoy = registros.find(r => r.fecha === hoy);
  const historial = registros.filter(r => r.fecha !== hoy).slice(0, 7);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Síntomas de hoy</Text>
        <Text style={styles.subtitle}>{formatFecha(hoy)} · Semana {semana} · Trimestre {trimestre}</Text>

        {/* Leyenda semáforo */}
        <View style={styles.leyenda}>
          {(['verde', 'amarillo', 'rojo'] as const).map(s => (
            <View key={s} style={styles.leyendaItem}>
              <View style={[styles.leyendaDot, { backgroundColor: SEMAFORO_COLOR[s] }]} />
              <Text style={styles.leyendaLabel}>
                {s === 'verde' ? 'Normal' : s === 'amarillo' ? 'Consultar' : 'Urgente'}
              </Text>
            </View>
          ))}
        </View>

        {editando ? (
          <>
            <Text style={styles.sectionTitle}>
              ¿Cómo te sientes hoy?
              <Text style={styles.sectionHint}> — Toca los que sientes</Text>
            </Text>

            {/* Grid de chips */}
            <View style={styles.chipsGrid}>
              {sintomasMostrados.map(s => {
                const sel = seleccionados[s.id] !== undefined;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.chip,
                      sel && { backgroundColor: SEMAFORO_BG[s.semaforo], borderColor: SEMAFORO_COLOR[s.semaforo] },
                    ]}
                    onPress={() => toggleSintoma(s.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipEmoji}>{s.emoji}</Text>
                    <Text style={[styles.chipNombre, sel && { color: SEMAFORO_COLOR[s.semaforo], fontWeight: '700' }]}>
                      {s.nombre}
                    </Text>
                    <View style={[styles.dot, { backgroundColor: SEMAFORO_COLOR[s.semaforo] }]} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {sintomasResto.length > 0 && (
              <TouchableOpacity style={styles.verTodosBtn} onPress={() => setVerTodos(v => !v)}>
                <Text style={styles.verTodosText}>
                  {verTodos ? '− Ver menos síntomas' : `+ Ver ${sintomasResto.length} síntomas más`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Intensidad */}
            {seleccionadosConDatos.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Intensidad</Text>
                {seleccionadosConDatos.map(({ sintoma, intensidad }) => (
                  <View key={sintoma.id} style={[styles.intensidadRow, { borderLeftColor: SEMAFORO_COLOR[sintoma.semaforo] }]}>
                    <Text style={styles.intensidadNombre}>{sintoma.emoji}  {sintoma.nombre}</Text>
                    <View style={styles.intensidadBtns}>
                      {INTENSIDAD.map(nivel => (
                        <TouchableOpacity
                          key={nivel}
                          style={[
                            styles.intensidadBtn,
                            intensidad === nivel && { backgroundColor: SEMAFORO_COLOR[sintoma.semaforo] },
                          ]}
                          onPress={() => setIntensidad(sintoma.id, nivel)}
                        >
                          <Text style={[styles.intensidadBtnText, intensidad === nivel && { color: '#fff' }]}>
                            {INTENSIDAD_LABEL[nivel]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Avisos médicos */}
            {alertas.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Avisos médicos</Text>
                {alertas.map(({ sintoma }) => (
                  <View key={sintoma.id} style={[styles.alertaCard, { borderLeftColor: SEMAFORO_COLOR[sintoma.semaforo] }]}>
                    <Text style={styles.alertaEmoji}>{sintoma.semaforo === 'rojo' ? '🚨' : '⚠️'}</Text>
                    <Text style={[styles.alertaTexto, { color: sintoma.semaforo === 'rojo' ? '#B71C1C' : '#E65100' }]}>
                      {sintoma.alerta}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Nota */}
            <Text style={styles.sectionTitle}>Nota adicional <Text style={styles.sectionHint}>(opcional)</Text></Text>
            <TextInput
              style={styles.notaInput}
              placeholder="¿Algo más que quieras recordar?"
              placeholderTextColor="#bbb"
              value={nota}
              onChangeText={setNota}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.btnGuardar, seleccionadosConDatos.length === 0 && styles.btnGuardarDisabled]}
              onPress={guardar}
              disabled={seleccionadosConDatos.length === 0}
            >
              <Text style={styles.btnGuardarText}>Guardar registro del día</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Vista del registro de hoy */
          registroHoy && (
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Registro de hoy ✅</Text>
                <View style={styles.panelAcciones}>
                  <TouchableOpacity onPress={() => setEditando(true)}>
                    <Text style={styles.btnEditar}>✏️ Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => eliminarRegistro(hoy)}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.chipsResumen}>
                {registroHoy.sintomas.map(s => {
                  const def = SINTOMAS.find(x => x.id === s.id);
                  if (!def) return null;
                  return (
                    <View key={s.id} style={[styles.chipResumen, { backgroundColor: SEMAFORO_BG[def.semaforo], borderColor: SEMAFORO_COLOR[def.semaforo] }]}>
                      <Text>{def.emoji}</Text>
                      <Text style={[styles.chipResumenNombre, { color: SEMAFORO_COLOR[def.semaforo] }]}>{def.nombre}</Text>
                      <Text style={styles.chipResumenIntensidad}>· {INTENSIDAD_LABEL[s.intensidad]}</Text>
                    </View>
                  );
                })}
              </View>

              {registroHoy.nota ? (
                <Text style={styles.notaTexto}>📝 {registroHoy.nota}</Text>
              ) : null}
            </View>
          )
        )}

        {/* Historial últimos 7 días */}
        {historial.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Últimos registros</Text>
            {historial.map(r => {
              const tieneAlerta = r.sintomas.some(s => {
                const def = SINTOMAS.find(x => x.id === s.id);
                return def && def.semaforo !== 'verde';
              });
              return (
                <View key={r.id} style={[styles.histCard, tieneAlerta && styles.histCardAlerta]}>
                  <View style={styles.histHeader}>
                    <View>
                      <Text style={styles.histFecha}>{formatFecha(r.fecha)}</Text>
                      <Text style={styles.histSemana}>Semana {r.semana}</Text>
                    </View>
                    <View style={styles.histAcciones}>
                      {tieneAlerta && <Text>⚠️</Text>}
                      <Text style={styles.histCount}>{r.sintomas.length} síntoma{r.sintomas.length !== 1 ? 's' : ''}</Text>
                      <TouchableOpacity onPress={() => eliminarRegistro(r.id)}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.histChips}>
                    {r.sintomas.slice(0, 4).map(s => {
                      const def = SINTOMAS.find(x => x.id === s.id);
                      if (!def) return null;
                      return (
                        <View key={s.id} style={[styles.histChip, { backgroundColor: SEMAFORO_BG[def.semaforo] }]}>
                          <Text style={{ fontSize: 12 }}>{def.emoji}</Text>
                          <Text style={[styles.histChipText, { color: SEMAFORO_COLOR[def.semaforo] }]}>{def.nombre}</Text>
                        </View>
                      );
                    })}
                    {r.sintomas.length > 4 && (
                      <Text style={styles.histMas}>+{r.sintomas.length - 4} más</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#C2185B', paddingTop: 24 },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 4, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 8, marginBottom: 12 },
  sectionHint: { fontSize: 13, fontWeight: '400', color: '#aaa' },

  leyenda: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaDot: { width: 10, height: 10, borderRadius: 5 },
  leyendaLabel: { fontSize: 12, color: '#666' },

  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#eee',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  chipEmoji: { fontSize: 16 },
  chipNombre: { fontSize: 13, color: '#555' },
  dot: { width: 7, height: 7, borderRadius: 4 },

  verTodosBtn: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 8 },
  verTodosText: { fontSize: 13, color: '#C2185B', fontWeight: '600' },

  intensidadRow: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  intensidadNombre: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  intensidadBtns: { flexDirection: 'row', gap: 8 },
  intensidadBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center' },
  intensidadBtnText: { fontSize: 12, fontWeight: '600', color: '#888' },

  alertaCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderLeftWidth: 4,
    elevation: 1,
  },
  alertaEmoji: { fontSize: 18 },
  alertaTexto: { flex: 1, fontSize: 13, lineHeight: 20 },

  notaInput: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    fontSize: 14, color: '#333', minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1.5, borderColor: '#eee', marginBottom: 20,
  },

  btnGuardar: {
    backgroundColor: '#C2185B', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 16,
    elevation: 4, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnGuardarDisabled: { backgroundColor: '#ddd', elevation: 0, shadowOpacity: 0 },
  btnGuardarText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  panel: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20,
    elevation: 3, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  panelAcciones: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  btnEditar: { fontSize: 13, color: '#C2185B', fontWeight: '600' },
  chipsResumen: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipResumen: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5,
  },
  chipResumenNombre: { fontSize: 13, fontWeight: '600' },
  chipResumenIntensidad: { fontSize: 11, color: '#999' },
  notaTexto: { fontSize: 13, color: '#666', marginTop: 12, lineHeight: 20 },

  histCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  histCardAlerta: { borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  histFecha: { fontSize: 14, fontWeight: '700', color: '#222' },
  histSemana: { fontSize: 12, color: '#aaa', marginTop: 2 },
  histAcciones: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  histCount: { fontSize: 12, color: '#aaa' },
  histChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  histChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  histChipText: { fontSize: 11, fontWeight: '600' },
  histMas: { fontSize: 11, color: '#aaa', alignSelf: 'center' },
});
