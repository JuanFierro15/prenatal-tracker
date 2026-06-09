import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SesionPatadas } from '../types';

const STORAGE_KEY = '@sesiones_patadas';
const PREGNANCY_START = new Date(2026, 2, 29);
const DURACION_MS = 120 * 60 * 1000; // 120 minutos Cardiff

function semanaActual(): number {
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - PREGNANCY_START.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(dias / 7);
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

function formatTimer(ms: number): string {
  const totalSeg = Math.floor(Math.max(0, ms) / 1000);
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

type Guia = { meta: number; alerta: number; metodo: string; descripcion: string };

// Guías por semana basadas en ACOG / Cardiff Count-to-Ten (Pearson 1977)
function guiaPorSemana(semana: number): Guia {
  if (semana < 20) return {
    meta: 4, alerta: 0,
    metodo: 'Observación libre',
    descripcion: 'Antes de la semana 20 el conteo formal no es necesario. Registra los movimientos que sientas para ir conociendo los patrones de tu bebé.',
  };
  if (semana < 24) return {
    meta: 4, alerta: 2,
    metodo: 'Conteo orientativo (quickening)',
    descripcion: 'Semanas 20–23: el bebé empieza a moverse más activamente. Meta orientativa: al menos 4 movimientos en 2 horas.',
  };
  if (semana < 28) return {
    meta: 6, alerta: 3,
    metodo: 'Conteo temprano',
    descripcion: 'Semanas 24–27: los movimientos se vuelven más regulares. Meta: al menos 6 movimientos en 2 horas.',
  };
  return {
    meta: 10, alerta: 6,
    metodo: 'Cardiff Count-to-Ten (ACOG)',
    descripcion: 'Semana 28+: debes sentir 10 movimientos en máximo 2 horas. Si no los logras, contacta a tu médico de inmediato.',
  };
}

async function leerSesiones(): Promise<SesionPatadas[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

async function guardarSesiones(sesiones: SesionPatadas[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sesiones));
}

export default function PatadosScreen() {
  const [sesiones, setSesiones] = useState<SesionPatadas[]>([]);
  const [sesionActiva, setSesionActiva] = useState<SesionPatadas | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sesionActivaRef = useRef<SesionPatadas | null>(null);

  const semana = semanaActual();
  const guia = guiaPorSemana(semana);

  // Mantener ref sincronizada con el estado para usarla en el intervalo
  useEffect(() => { sesionActivaRef.current = sesionActiva; }, [sesionActiva]);

  useEffect(() => { cargarDatos(); }, []);

  // Intervalo del timer — usa ref para siempre tener la sesión más reciente
  useEffect(() => {
    if (!sesionActiva) return;
    const intervalo = setInterval(() => {
      const s = sesionActivaRef.current;
      if (!s) return;
      const t = Date.now() - s.inicio;
      setElapsed(t);
      if (t >= DURACION_MS) {
        clearInterval(intervalo);
        finalizarSesion(s);
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [sesionActiva?.id]); // reiniciar solo si cambia la sesión, no en cada patada

  async function cargarDatos() {
    try {
      const todas = await leerSesiones();
      const incompleta = todas.find(s => s.fin === null);
      if (incompleta) {
        if (Date.now() - incompleta.inicio < DURACION_MS) {
          setSesionActiva(incompleta);
          setElapsed(Date.now() - incompleta.inicio);
        } else {
          // Sesión expiró mientras la app estaba cerrada
          const finalizada = { ...incompleta, fin: incompleta.inicio + DURACION_MS };
          const actualizadas = todas.map(s => s.id === incompleta.id ? finalizada : s);
          await guardarSesiones(actualizadas);
          setSesiones(actualizadas.filter(s => s.fin !== null));
        }
      } else {
        setSesiones(todas.filter(s => s.fin !== null));
      }
    } catch {}
  }

  async function iniciarSesion() {
    if (sesionActiva) return;
    const nueva: SesionPatadas = {
      id: String(Date.now()),
      fecha: hoyStr(),
      semana,
      inicio: Date.now(),
      fin: null,
      patadas: 0,
      meta: guia.meta,
      alerta: guia.alerta,
      timestamps: [],
    };
    const todas = await leerSesiones();
    await guardarSesiones([nueva, ...todas]);
    setSesionActiva(nueva);
    setElapsed(0);
  }

  async function registrarPatada() {
    const s = sesionActivaRef.current;
    if (!s) return;

    const actualizada: SesionPatadas = {
      ...s,
      patadas: s.patadas + 1,
      timestamps: [...s.timestamps, Date.now()],
    };

    // Actualizar estado y ref antes de cualquier await
    setSesionActiva(actualizada);
    sesionActivaRef.current = actualizada;

    const todas = await leerSesiones();
    const guardadas = todas.map(x => x.id === actualizada.id ? actualizada : x);
    await guardarSesiones(guardadas);

    Animated.sequence([
      Animated.spring(pulseAnim, { toValue: 1.15, useNativeDriver: true, speed: 40 }),
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 25 }),
    ]).start();

    if (actualizada.patadas >= guia.meta) {
      await finalizarSesion(actualizada);
    }
  }

  async function finalizarSesion(sesion: SesionPatadas) {
    const finalizada: SesionPatadas = { ...sesion, fin: Date.now() };
    const todas = await leerSesiones();
    const actualizadas = todas.map(s => s.id === sesion.id ? finalizada : s);
    await guardarSesiones(actualizadas);
    setSesiones(actualizadas.filter(s => s.fin !== null));
    setSesionActiva(null);
    setElapsed(0);
  }

  function confirmarTerminar() {
    const s = sesionActivaRef.current;
    if (!s) return;
    Alert.alert('Terminar sesión', '¿Deseas terminar la sesión antes de los 120 minutos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Terminar', onPress: () => finalizarSesion(s) },
    ]);
  }

  async function eliminarSesion(id: string) {
    Alert.alert('Eliminar sesión', '¿Seguro que quieres eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const todas = await leerSesiones();
          const filtradas = todas.filter(s => s.id !== id);
          await guardarSesiones(filtradas);
          setSesiones(filtradas.filter(s => s.fin !== null));
        },
      },
    ]);
  }

  const patadasHoy = sesionActiva?.patadas ?? 0;
  const progreso = Math.min(patadasHoy / guia.meta, 1);
  const metaCumplida = patadasHoy >= guia.meta;
  const enAlerta = guia.alerta > 0 && patadasHoy > 0 && patadasHoy < guia.alerta;
  const tiempoRestante = DURACION_MS - elapsed;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Contador de patadas</Text>
        <Text style={styles.semana}>Semana {semana} · {formatFecha(hoyStr())}</Text>

        {/* Guía médica de la semana */}
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🩺</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoMetodo}>{guia.metodo}</Text>
            <Text style={styles.infoTexto}>{guia.descripcion}</Text>
          </View>
        </View>

        {sesionActiva ? (
          <View style={styles.panel}>
            {/* Timers */}
            <View style={styles.timerRow}>
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>Transcurrido</Text>
                <Text style={styles.timerValue}>{formatTimer(elapsed)}</Text>
              </View>
              <View style={styles.timerDivider} />
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>Restante</Text>
                <Text style={[styles.timerValue, tiempoRestante < 600_000 && styles.timerWarning]}>
                  {formatTimer(tiempoRestante)}
                </Text>
              </View>
            </View>

            {/* Botón principal */}
            <View style={styles.btnContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.btnPatada, metaCumplida && styles.btnPatadaOk]}
                  onPress={registrarPatada}
                  activeOpacity={0.75}
                >
                  <Text style={styles.btnEmoji}>🦵</Text>
                  <Text style={[styles.btnNum, metaCumplida && styles.btnNumOk]}>{patadasHoy}</Text>
                  <Text style={styles.btnLabel}>Toca cada vez{'\n'}que el bebé patee</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Barra de progreso */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { width: `${progreso * 100}%` },
                  metaCumplida && styles.progressFillOk,
                  enAlerta && styles.progressFillAlerta,
                ]} />
              </View>
              <Text style={[
                styles.progressLabel,
                metaCumplida && styles.progressLabelOk,
                enAlerta && styles.progressLabelAlerta,
              ]}>
                {metaCumplida
                  ? `✅ ¡Meta alcanzada! ${patadasHoy}/${guia.meta} patadas`
                  : enAlerta
                  ? `⚠️ Pocas patadas (${patadasHoy}/${guia.meta})`
                  : `${patadasHoy} de ${guia.meta} patadas`}
              </Text>
            </View>

            <TouchableOpacity style={styles.btnTerminar} onPress={confirmarTerminar}>
              <Text style={styles.btnTerminarText}>Terminar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Sesión de 120 minutos</Text>
            <Text style={styles.panelSub}>
              Siéntate cómodamente y registra cada movimiento{'\n'}que sientas durante las próximas 2 horas.
            </Text>
            <TouchableOpacity style={styles.btnIniciar} onPress={iniciarSesion}>
              <Text style={styles.btnIniciarText}>▶  Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Alerta médica semana 28+ */}
        {semana >= 28 && sesionActiva && enAlerta && (
          <View style={styles.alertaCard}>
            <Text style={styles.alertaEmoji}>⚠️</Text>
            <Text style={styles.alertaTexto}>
              Si el bebé no alcanza {guia.meta} movimientos en 2 horas, contacta a tu médico de inmediato.
            </Text>
          </View>
        )}

        {/* Historial de sesiones */}
        {sesiones.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Historial de sesiones</Text>
            {sesiones.map(s => {
              const cumplida = s.patadas >= s.meta;
              const alerta = s.alerta > 0 && s.patadas < s.alerta;
              const duracion = s.fin ? s.fin - s.inicio : 0;
              return (
                <View key={s.id} style={[
                  styles.card,
                  cumplida && styles.cardOk,
                  alerta && !cumplida && styles.cardAlerta,
                ]}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardFecha}>{formatFecha(s.fecha)}</Text>
                      <Text style={styles.cardSemana}>Sem. {s.semana}  ·  {formatTimer(duracion)} de sesión</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={[
                        styles.cardPatadas,
                        cumplida && { color: '#4CAF50' },
                        alerta && !cumplida && { color: '#FF9800' },
                      ]}>
                        {s.patadas}/{s.meta}
                      </Text>
                      <Text style={styles.cardEstado}>
                        {cumplida ? '✅' : alerta ? '⚠️' : '⏳'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => eliminarSesion(s.id)} style={styles.iconBtn}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
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
  semana: { fontSize: 13, color: '#aaa', marginTop: 4, marginBottom: 16 },

  infoCard: {
    backgroundColor: '#F3E5F5', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16,
  },
  infoEmoji: { fontSize: 20 },
  infoMetodo: { fontSize: 11, color: '#9C27B0', fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoTexto: { fontSize: 13, color: '#6A1B9A', lineHeight: 20 },

  panel: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20,
    elevation: 4, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, marginBottom: 16,
  },

  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 24 },
  timerBox: { alignItems: 'center', flex: 1 },
  timerDivider: { width: 1, height: 40, backgroundColor: '#f0f0f0' },
  timerLabel: { fontSize: 11, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  timerValue: { fontSize: 32, fontWeight: '800', color: '#C2185B' },
  timerWarning: { color: '#FF9800' },

  btnContainer: { alignItems: 'center', marginBottom: 24 },
  btnPatada: {
    width: 190, height: 190, borderRadius: 95,
    backgroundColor: '#FCE4EC', alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#C2185B',
    elevation: 6, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12,
  },
  btnPatadaOk: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  btnEmoji: { fontSize: 44 },
  btnNum: { fontSize: 52, fontWeight: '900', color: '#C2185B', lineHeight: 58 },
  btnNumOk: { color: '#4CAF50' },
  btnLabel: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4, paddingHorizontal: 16 },

  progressContainer: { marginBottom: 16 },
  progressBar: { height: 10, backgroundColor: '#FCE4EC', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#C2185B', borderRadius: 5 },
  progressFillOk: { backgroundColor: '#4CAF50' },
  progressFillAlerta: { backgroundColor: '#FF9800' },
  progressLabel: { fontSize: 13, color: '#C2185B', textAlign: 'center', fontWeight: '600' },
  progressLabelOk: { color: '#4CAF50' },
  progressLabelAlerta: { color: '#FF9800' },

  btnTerminar: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20 },
  btnTerminarText: { fontSize: 13, color: '#bbb', textDecorationLine: 'underline' },

  panelTitle: { fontSize: 18, fontWeight: '800', color: '#333', textAlign: 'center', marginBottom: 8 },
  panelSub: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnIniciar: {
    backgroundColor: '#C2185B', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', elevation: 4,
    shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnIniciarText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  alertaCard: {
    backgroundColor: '#FFF3E0', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderLeftWidth: 4, borderLeftColor: '#FF9800', marginBottom: 16,
  },
  alertaEmoji: { fontSize: 20 },
  alertaTexto: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 20 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardOk: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  cardAlerta: { borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardFecha: { fontSize: 15, fontWeight: '700', color: '#222' },
  cardSemana: { fontSize: 12, color: '#aaa', marginTop: 2 },
  cardRight: { alignItems: 'center', minWidth: 60 },
  cardPatadas: { fontSize: 18, fontWeight: '900', color: '#C2185B' },
  cardEstado: { fontSize: 16, marginTop: 2 },
  iconBtn: { padding: 4 },
});
