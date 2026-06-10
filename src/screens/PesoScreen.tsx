import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Dimensions, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Polygon, Polyline, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { RegistroPeso } from '../types';

const KEY_BASELINE = '@peso_baseline';
const KEY_REGISTROS = '@registros_peso';
const PREGNANCY_START = new Date(2026, 2, 29);
const WEEK_MIN = 4;
const WEEK_MAX = 40;

// ── Helpers ──────────────────────────────────────────────────────────────────

function semanaActual(): number {
  const dias = Math.floor((Date.now() - PREGNANCY_START.getTime()) / 86400000);
  return Math.floor(dias / 7);
}

function semanaDeDate(dateStr: string): number {
  const dias = Math.floor((new Date(dateStr + 'T00:00:00').getTime() - PREGNANCY_START.getTime()) / 86400000);
  return Math.max(0, Math.floor(dias / 7));
}

function hoyStr(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(s: string): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

// ── IMC y rangos IOM 2009 ─────────────────────────────────────────────────────

type BMICat = 'bajo' | 'normal' | 'sobrepeso' | 'obesidad';
type Baseline = { peso: number; talla: number };

function calcBMI(peso: number, tallaCm: number): number {
  const m = tallaCm / 100;
  return +(peso / (m * m)).toFixed(1);
}

function catBMI(bmi: number): BMICat {
  if (bmi < 18.5) return 'bajo';
  if (bmi < 25)   return 'normal';
  if (bmi < 30)   return 'sobrepeso';
  return 'obesidad';
}

function rangoIOM(cat: BMICat): [number, number] {
  switch (cat) {
    case 'bajo':      return [12.5, 18];
    case 'normal':    return [11.5, 16];
    case 'sobrepeso': return [7,    11.5];
    case 'obesidad':  return [5,    9];
  }
}

function gananciaAcum(semana: number, low: number, high: number): [number, number] {
  if (semana <= 0) return [0, 0];
  const t1L = low  * 0.1;
  const t1H = high * 0.1;
  const rL  = (low  - t1L) / 27;
  const rH  = (high - t1H) / 27;
  if (semana <= 13) {
    const t = semana / 13;
    return [t * t1L, t * t1H];
  }
  return [
    Math.min(t1L + (semana - 13) * rL, low),
    Math.min(t1H + (semana - 13) * rH, high),
  ];
}

const CAT_INFO: Record<BMICat, { label: string; color: string; bg: string }> = {
  bajo:      { label: 'Bajo peso',  color: '#2196F3', bg: '#E3F2FD' },
  normal:    { label: 'Normal',     color: '#4CAF50', bg: '#E8F5E9' },
  sobrepeso: { label: 'Sobrepeso',  color: '#FF9800', bg: '#FFF3E0' },
  obesidad:  { label: 'Obesidad',   color: '#F44336', bg: '#FFEBEE' },
};

// ── Gráfico SVG ───────────────────────────────────────────────────────────────

function WeightChart({ registros, baseline, semana }: {
  registros: RegistroPeso[];
  baseline: Baseline;
  semana: number;
}) {
  const W = Dimensions.get('window').width - 40;
  const H = 210;
  const pL = 46, pR = 14, pT = 14, pB = 34;
  const cW = W - pL - pR;
  const cH = H - pT - pB;

  const bmi = calcBMI(baseline.peso, baseline.talla);
  const cat = catBMI(bmi);
  const [totL, totH] = rangoIOM(cat);

  const yMin = baseline.peso - 1;
  const yMax = baseline.peso + totH + 2;

  const xW = (w: number) => pL + ((w - WEEK_MIN) / (WEEK_MAX - WEEK_MIN)) * cW;
  const yP = (p: number) => pT + (1 - (p - yMin) / (yMax - yMin)) * cH;

  // Área recomendada
  const upper: string[] = [];
  const lower: string[] = [];
  for (let w = WEEK_MIN; w <= WEEK_MAX; w++) {
    const [gl, gh] = gananciaAcum(w, totL, totH);
    upper.push(`${xW(w).toFixed(1)},${yP(baseline.peso + gh).toFixed(1)}`);
    lower.push(`${xW(w).toFixed(1)},${yP(baseline.peso + gl).toFixed(1)}`);
  }
  const polyPts = [...upper, ...[...lower].reverse()].join(' ');

  // Datos reales
  const sorted = [...registros].sort((a, b) => a.semana - b.semana);
  const dataPts = sorted.map(r =>
    `${xW(r.semana).toFixed(1)},${yP(r.peso).toFixed(1)}`
  ).join(' ');

  // Etiquetas Y
  const yRange = yMax - yMin;
  const yStep  = yRange > 12 ? 4 : yRange > 6 ? 2 : 1;
  const yLabels: number[] = [];
  for (let p = Math.ceil(yMin / yStep) * yStep; p <= yMax; p += yStep) {
    yLabels.push(Math.round(p));
  }
  const xLabels = [4, 10, 16, 22, 28, 34, 40];

  return (
    <Svg width={W} height={H}>
      {/* Área recomendada (verde) */}
      <Polygon points={polyPts} fill="rgba(76,175,80,0.12)" stroke="rgba(76,175,80,0.35)" strokeWidth="1" />

      {/* Grilla horizontal + etiquetas Y */}
      {yLabels.map(p => (
        <G key={p}>
          <Line x1={pL} y1={yP(p)} x2={pL + cW} y2={yP(p)} stroke="#f0f0f0" strokeWidth="1" />
          <SvgText x={pL - 5} y={yP(p) + 4} fontSize="10" fill="#bbb" textAnchor="end">{p}</SvgText>
        </G>
      ))}

      {/* Línea de peso base (pre-embarazo) */}
      <Line
        x1={pL} y1={yP(baseline.peso)} x2={pL + cW} y2={yP(baseline.peso)}
        stroke="#ddd" strokeWidth="1" strokeDasharray="4,3"
      />

      {/* Semana actual */}
      {semana >= WEEK_MIN && semana <= WEEK_MAX && (
        <Line
          x1={xW(semana)} y1={pT} x2={xW(semana)} y2={pT + cH}
          stroke="#C2185B" strokeWidth="1.5" strokeDasharray="4,3" opacity={0.5}
        />
      )}

      {/* Etiquetas X */}
      {xLabels.map(w => (
        <SvgText key={w} x={xW(w)} y={H - 4} fontSize="10" fill="#bbb" textAnchor="middle">{w}</SvgText>
      ))}
      <SvgText x={pL + cW / 2} y={H - 2} fontSize="9" fill="#ddd" textAnchor="middle">semana →</SvgText>

      {/* Línea de datos */}
      {sorted.length > 1 && (
        <Polyline
          points={dataPts}
          fill="none"
          stroke="#C2185B"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Puntos de datos */}
      {sorted.map(r => (
        <Circle
          key={r.id}
          cx={xW(r.semana)}
          cy={yP(r.peso)}
          r={5}
          fill="#C2185B"
          stroke="#fff"
          strokeWidth="2"
        />
      ))}
    </Svg>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function PesoScreen() {
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [registros, setRegistros] = useState<RegistroPeso[]>([]);
  const [setupVisible, setSetupVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<RegistroPeso | null>(null);

  // Campos setup
  const [setupPeso, setSetupPeso] = useState('');
  const [setupTalla, setSetupTalla] = useState('');

  // Campos registro
  const [formPeso, setFormPeso] = useState('');
  const [formFecha, setFormFecha] = useState(hoyStr());
  const [pickerVisible, setPickerVisible] = useState(false);

  const semana = semanaActual();

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    const [bl, reg] = await Promise.all([
      AsyncStorage.getItem(KEY_BASELINE),
      AsyncStorage.getItem(KEY_REGISTROS),
    ]);
    if (bl)  setBaseline(JSON.parse(bl));
    if (reg) setRegistros(JSON.parse(reg));
  }

  // ── Baseline ──

  async function guardarBaseline() {
    const p = parseFloat(setupPeso.replace(',', '.'));
    const t = parseFloat(setupTalla.replace(',', '.'));
    if (isNaN(p) || p < 30 || p > 200) {
      Alert.alert('Peso inválido', 'Ingresa un peso entre 30 y 200 kg.');
      return;
    }
    if (isNaN(t) || t < 100 || t > 250) {
      Alert.alert('Talla inválida', 'Ingresa una talla entre 100 y 250 cm.');
      return;
    }
    const bl: Baseline = { peso: p, talla: t };
    await AsyncStorage.setItem(KEY_BASELINE, JSON.stringify(bl));
    setBaseline(bl);
    setSetupVisible(false);
  }

  function abrirSetup(bl?: Baseline) {
    setSetupPeso(bl ? String(bl.peso) : '');
    setSetupTalla(bl ? String(bl.talla) : '');
    setSetupVisible(true);
  }

  // ── Registros ──

  function abrirNuevo() {
    setEditando(null);
    setFormPeso('');
    setFormFecha(hoyStr());
    setFormVisible(true);
  }

  function abrirEditar(r: RegistroPeso) {
    setEditando(r);
    setFormPeso(String(r.peso));
    setFormFecha(r.fecha);
    setFormVisible(true);
  }

  async function guardarRegistro() {
    const p = parseFloat(formPeso.replace(',', '.'));
    if (isNaN(p) || p < 30 || p > 200) {
      Alert.alert('Peso inválido', 'Ingresa un valor entre 30 y 200 kg.');
      return;
    }
    const nuevo: RegistroPeso = {
      id: editando?.id ?? String(Date.now()),
      fecha: formFecha,
      semana: semanaDeDate(formFecha),
      peso: Math.round(p * 10) / 10,
    };
    let actualizados: RegistroPeso[];
    if (editando) {
      actualizados = registros.map(r => r.id === editando.id ? nuevo : r);
    } else {
      actualizados = [...registros, nuevo];
    }
    actualizados.sort((a, b) => b.fecha.localeCompare(a.fecha));
    await AsyncStorage.setItem(KEY_REGISTROS, JSON.stringify(actualizados));
    setRegistros(actualizados);
    setFormVisible(false);
  }

  async function eliminar(id: string) {
    Alert.alert('Eliminar registro', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const filtrados = registros.filter(r => r.id !== id);
          await AsyncStorage.setItem(KEY_REGISTROS, JSON.stringify(filtrados));
          setRegistros(filtrados);
        },
      },
    ]);
  }

  // ── Cálculos stats ──

  const ultimoPeso = registros.length > 0
    ? [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha))[0].peso
    : null;

  const gananciaActual = baseline && ultimoPeso !== null
    ? Math.round((ultimoPeso - baseline.peso) * 10) / 10
    : null;

  const bmi        = baseline ? calcBMI(baseline.peso, baseline.talla) : 0;
  const cat        = baseline ? catBMI(bmi) : 'normal';
  const [rL, rH]   = baseline ? rangoIOM(cat) : [11.5, 16];
  const catInfo    = CAT_INFO[cat];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.topRow}>
          <Text style={styles.title}>Control de peso</Text>
          {baseline && (
            <TouchableOpacity style={styles.btnNuevo} onPress={abrirNuevo}>
              <Text style={styles.btnNuevoText}>+ Agregar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Sin baseline: setup inicial ── */}
        {!baseline ? (
          <View style={styles.setupPrompt}>
            <Text style={styles.setupEmoji}>⚖️</Text>
            <Text style={styles.setupTitle}>Configura tu peso inicial</Text>
            <Text style={styles.setupSub}>
              Para calcular la ganancia recomendada según las guías IOM 2009 necesitamos
              tu peso y talla antes del embarazo.
            </Text>
            <TouchableOpacity style={styles.btnConfigurar} onPress={() => abrirSetup()}>
              <Text style={styles.btnConfigurarText}>Configurar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Tarjeta IMC ── */}
            <View style={[styles.imcCard, { backgroundColor: catInfo.bg }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.imcCat, { color: catInfo.color }]}>{catInfo.label}</Text>
                <Text style={[styles.imcBMI, { color: catInfo.color }]}>IMC {bmi}</Text>
                <Text style={styles.imcRango}>
                  Ganancia recomendada: <Text style={{ fontWeight: '700' }}>{rL}–{rH} kg</Text>
                </Text>
                <Text style={styles.imcBase}>Peso pre-embarazo: {baseline.peso} kg · {baseline.talla} cm</Text>
              </View>
              <TouchableOpacity onPress={() => abrirSetup(baseline)}>
                <Text style={styles.editarBaselineText}>✏️ Editar</Text>
              </TouchableOpacity>
            </View>

            {/* ── Stats row ── */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Peso actual</Text>
                <Text style={styles.statValue}>
                  {ultimoPeso !== null ? `${ultimoPeso}` : '–'}
                </Text>
                <Text style={styles.statUnit}>kg</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Ganancia</Text>
                <Text style={[
                  styles.statValue,
                  gananciaActual !== null && gananciaActual > rH && { color: '#F44336' },
                  gananciaActual !== null && gananciaActual < 0 && { color: '#FF9800' },
                ]}>
                  {gananciaActual !== null ? `${gananciaActual > 0 ? '+' : ''}${gananciaActual}` : '–'}
                </Text>
                <Text style={styles.statUnit}>kg</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Semana</Text>
                <Text style={styles.statValue}>{semana}</Text>
                <Text style={styles.statUnit}>de 40</Text>
              </View>
            </View>

            {/* ── Gráfico ── */}
            <View style={styles.chartCard}>
              <WeightChart registros={registros} baseline={baseline} semana={semana} />
              <View style={styles.leyendaRow}>
                <View style={styles.leyendaItem}>
                  <View style={[styles.leyendaDot, { backgroundColor: 'rgba(76,175,80,0.4)' }]} />
                  <Text style={styles.leyendaText}>Rango recomendado (IOM)</Text>
                </View>
                <View style={styles.leyendaItem}>
                  <View style={[styles.leyendaDot, { backgroundColor: '#C2185B' }]} />
                  <Text style={styles.leyendaText}>Tu peso</Text>
                </View>
              </View>
            </View>

            {/* ── Historial ── */}
            {registros.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyText}>Aún no hay registros.</Text>
                <Text style={styles.emptySub}>Toca "+ Agregar" para empezar.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Historial</Text>
                {[...registros].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(r => {
                  const diff = baseline ? Math.round((r.peso - baseline.peso) * 10) / 10 : null;
                  const [recL, recH] = gananciaAcum(r.semana, rL, rH);
                  const enRango = diff !== null && diff >= recL - 0.5 && diff <= recH + 0.5;
                  const sobreRango = diff !== null && diff > recH + 0.5;
                  return (
                    <View key={r.id} style={styles.card}>
                      <View style={styles.cardRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardFecha}>{formatFecha(r.fecha)}</Text>
                          <Text style={styles.cardSemana}>Semana {r.semana}</Text>
                        </View>
                        <View style={styles.cardCenter}>
                          <Text style={styles.cardPeso}>{r.peso} kg</Text>
                          {diff !== null && (
                            <Text style={[
                              styles.cardDiff,
                              sobreRango ? { color: '#F44336' } : enRango ? { color: '#4CAF50' } : { color: '#FF9800' },
                            ]}>
                              {diff >= 0 ? '+' : ''}{diff} kg
                            </Text>
                          )}
                        </View>
                        <View style={styles.cardActions}>
                          <TouchableOpacity onPress={() => abrirEditar(r)} style={styles.iconBtn}>
                            <Text>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => eliminar(r.id)} style={styles.iconBtn}>
                            <Text>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal: setup baseline ── */}
      <Modal visible={setupVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⚖️ Datos de referencia</Text>
            <Text style={styles.fieldLabel}>Peso pre-embarazo (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 58.5"
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
              value={setupPeso}
              onChangeText={setSetupPeso}
            />
            <Text style={styles.fieldLabel}>Talla (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 162"
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
              value={setupTalla}
              onChangeText={setSetupTalla}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setSetupVisible(false)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarBaseline}>
                <Text style={styles.btnGuardarText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: agregar/editar peso ── */}
      <Modal visible={formVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editando ? 'Editar registro' : 'Nuevo registro'}</Text>

            <Text style={styles.fieldLabel}>Fecha</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPickerVisible(true)}>
              <Text style={styles.dateBtnIcon}>📅</Text>
              <Text style={styles.dateBtnText}>{formatFecha(formFecha)}</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 62.3"
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
              value={formPeso}
              onChangeText={setFormPeso}
              autoFocus
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setFormVisible(false)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarRegistro}>
                <Text style={styles.btnGuardarText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {pickerVisible && (
        <DateTimePicker
          value={new Date(formFecha + 'T00:00:00')}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setPickerVisible(false);
            if (date) setFormFecha(toDateStr(date));
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#C2185B' },
  btnNuevo: { backgroundColor: '#C2185B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  btnNuevoText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Setup
  setupPrompt: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 16 },
  setupEmoji: { fontSize: 56, marginBottom: 16 },
  setupTitle: { fontSize: 20, fontWeight: '800', color: '#333', textAlign: 'center' },
  setupSub: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  btnConfigurar: { marginTop: 28, backgroundColor: '#C2185B', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14 },
  btnConfigurarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // IMC card
  imcCard: {
    borderRadius: 16, padding: 16, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  imcCat:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  imcBMI:  { fontSize: 22, fontWeight: '900', marginTop: 2 },
  imcRango:{ fontSize: 13, color: '#555', marginTop: 4 },
  imcBase: { fontSize: 11, color: '#888', marginTop: 4 },
  editarBaselineText: { fontSize: 13, color: '#888' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
  },
  statLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 26, fontWeight: '900', color: '#C2185B', marginTop: 4 },
  statUnit:  { fontSize: 11, color: '#bbb', marginTop: 2 },

  // Chart
  chartCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
  },
  leyendaRow: { flexDirection: 'row', gap: 16, marginTop: 10, justifyContent: 'center' },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaDot: { width: 10, height: 10, borderRadius: 5 },
  leyendaText: { fontSize: 11, color: '#888' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyEmoji: { fontSize: 42 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 12, fontWeight: '600' },
  emptySub:  { fontSize: 13, color: '#bbb', marginTop: 4 },

  // Historial
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardFecha: { fontSize: 14, fontWeight: '700', color: '#222' },
  cardSemana: { fontSize: 12, color: '#bbb', marginTop: 2 },
  cardCenter: { flex: 1, alignItems: 'flex-end', marginRight: 8 },
  cardPeso: { fontSize: 18, fontWeight: '800', color: '#C2185B' },
  cardDiff: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 2 },
  iconBtn: { padding: 4 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#C2185B', marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#F7F7F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#222' },
  dateBtn: { backgroundColor: '#F7F7F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBtnIcon: { fontSize: 18 },
  dateBtnText: { fontSize: 15, color: '#222', fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  btnCancelar: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnCancelarText: { color: '#888', fontWeight: '600' },
  btnGuardar: { flex: 1, backgroundColor: '#C2185B', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
