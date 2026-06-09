import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contraccion, SesionContracciones } from '../types';

const STORAGE_KEY = '@sesion_contracciones';

function hoyStr(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

function formatHora(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTimer(ms: number): string {
  const seg = Math.floor(Math.max(0, ms) / 1000);
  const min = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type Metricas = {
  promDuracion: number;
  promIntervaloSS: number | null; // start-to-start (regla 5-1-1)
  promIntervaloDescanso: number | null; // fin-to-start (para mostrar)
  total: number;
  regla511: boolean;
};

// Regla 5-1-1 (ACOG): contracciones cada 5 min (inicio-a-inicio),
// duración ≥ 1 min, durante al menos 3 contracciones consecutivas
function calcularMetricas(contracciones: Contraccion[]): Metricas | null {
  const completas = contracciones.filter(c => c.fin !== null);
  if (completas.length === 0) return null;

  const duraciones = completas.map(c => c.fin! - c.inicio);
  const ultimas3Dur = duraciones.slice(-3);
  const promDuracion = ultimas3Dur.reduce((a, b) => a + b, 0) / ultimas3Dur.length;

  const intervalosSS: number[] = [];
  const intervalosDescanso: number[] = [];
  for (let i = 1; i < completas.length; i++) {
    intervalosSS.push(completas[i].inicio - completas[i - 1].inicio);
    intervalosDescanso.push(completas[i].inicio - completas[i - 1].fin!);
  }

  const ultimas3SS = intervalosSS.slice(-3);
  const ultimas3Des = intervalosDescanso.slice(-3);
  const promIntervaloSS = ultimas3SS.length > 0
    ? ultimas3SS.reduce((a, b) => a + b, 0) / ultimas3SS.length
    : null;
  const promIntervaloDescanso = ultimas3Des.length > 0
    ? ultimas3Des.reduce((a, b) => a + b, 0) / ultimas3Des.length
    : null;

  const regla511 =
    completas.length >= 3 &&
    ultimas3Dur.every(d => d >= 60_000) &&          // ≥ 1 min de duración
    ultimas3SS.length >= 2 &&
    ultimas3SS.every(i => i <= 300_000);              // cada ≤ 5 min inicio-a-inicio

  return { promDuracion, promIntervaloSS, promIntervaloDescanso, total: completas.length, regla511 };
}

export default function ContraccionesScreen() {
  const [sesion, setSesion] = useState<SesionContracciones | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const sesionRef = useRef<SesionContracciones | null>(null);

  useEffect(() => { sesionRef.current = sesion; }, [sesion]);
  useEffect(() => { cargarDatos(); }, []);

  // Timer: 100 ms para suavidad
  useEffect(() => {
    const intervalo = setInterval(() => {
      const s = sesionRef.current;
      if (!s) return;
      const activa = s.contracciones.find(c => c.fin === null);
      if (activa) {
        setElapsed(Date.now() - activa.inicio);
      } else {
        const ultima = [...s.contracciones].reverse().find(c => c.fin !== null);
        setElapsed(ultima ? Date.now() - ultima.fin! : 0);
      }
    }, 100);
    return () => clearInterval(intervalo);
  }, []);

  const contraccionActiva = sesion?.contracciones.find(c => c.fin === null) ?? null;

  // Pulso animado cuando hay contracción activa
  useEffect(() => {
    if (contraccionActiva) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.07, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    }
  }, [!!contraccionActiva]);

  async function cargarDatos() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return;
      const guardada: SesionContracciones = JSON.parse(data);
      if (guardada.fecha !== hoyStr()) return;
      // Cerrar cualquier contracción abierta si la app se cerró en medio
      const contracciones = guardada.contracciones.map(c =>
        c.fin === null ? { ...c, fin: Date.now() } : c
      );
      const restaurada = { ...guardada, contracciones };
      setSesion(restaurada);
      sesionRef.current = restaurada;
    } catch {}
  }

  async function guardar(s: SesionContracciones) {
    setSesion(s);
    sesionRef.current = s;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function iniciarSesion() {
    const nueva: SesionContracciones = {
      id: String(Date.now()),
      fecha: hoyStr(),
      inicio: Date.now(),
      contracciones: [],
    };
    guardar(nueva);
  }

  async function toggleContraccion() {
    const s = sesionRef.current;
    if (!s) return;
    const activa = s.contracciones.find(c => c.fin === null);
    if (activa) {
      const actualizadas = s.contracciones.map(c =>
        c.id === activa.id ? { ...c, fin: Date.now() } : c
      );
      await guardar({ ...s, contracciones: actualizadas });
    } else {
      const nueva: Contraccion = { id: String(Date.now()), inicio: Date.now(), fin: null };
      await guardar({ ...s, contracciones: [...s.contracciones, nueva] });
    }
  }

  function confirmarNuevaSesion() {
    Alert.alert(
      'Nueva sesión',
      '¿Quieres reiniciar? Se perderán los datos de esta sesión.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', style: 'destructive', onPress: iniciarSesion },
      ]
    );
  }

  async function eliminarContraccion(id: string) {
    const s = sesionRef.current;
    if (!s) return;
    await guardar({ ...s, contracciones: s.contracciones.filter(c => c.id !== id) });
  }

  const completas = sesion?.contracciones.filter(c => c.fin !== null) ?? [];
  const metricas = sesion ? calcularMetricas(sesion.contracciones) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Contracciones</Text>
        <Text style={styles.subtitle}>Regla 5-1-1 · {formatHora(Date.now())}</Text>

        {/* Explicación regla 5-1-1 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🩺</Text>
          <Text style={styles.infoTexto}>
            <Text style={styles.infoBold}>Regla 5-1-1 (ACOG):</Text> ir al hospital cuando las contracciones ocurren cada <Text style={styles.infoBold}>5 min</Text>, duran <Text style={styles.infoBold}>1 min</Text> cada una, durante al menos <Text style={styles.infoBold}>3 seguidas</Text>.
          </Text>
        </View>

        {!sesion ? (
          <View style={styles.panel}>
            <Text style={styles.panelEmoji}>⏱️</Text>
            <Text style={styles.panelTitulo}>¿Lista para medir?</Text>
            <Text style={styles.panelDesc}>
              Toca el botón al inicio de cada contracción y de nuevo cuando termine. La app calcula la duración y frecuencia automáticamente.
            </Text>
            <TouchableOpacity style={styles.btnIniciar} onPress={iniciarSesion}>
              <Text style={styles.btnIniciarText}>▶  Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Botón principal */}
            <View style={styles.btnContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.btnContraccion, contraccionActiva && styles.btnContraccionActiva]}
                  onPress={toggleContraccion}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnEstadoLabel}>
                    {contraccionActiva
                      ? 'Contracción activa'
                      : completas.length === 0
                      ? 'Sin contracciones aún'
                      : 'Tiempo desde última'}
                  </Text>
                  {(contraccionActiva || completas.length > 0) && (
                    <Text style={[styles.btnTimer, contraccionActiva && styles.btnTimerActivo]}>
                      {formatTimer(elapsed)}
                    </Text>
                  )}
                  <Text style={styles.btnAccionLabel}>
                    {contraccionActiva ? 'Toca cuando termine' : 'Toca al sentir una contracción'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Métricas */}
            {metricas && (
              <View style={styles.metricasRow}>
                <View style={styles.metricaBox}>
                  <Text style={[styles.metricaValor, metricas.promDuracion >= 60_000 && styles.valorOk]}>
                    {formatTimer(metricas.promDuracion)}
                  </Text>
                  <Text style={styles.metricaLabel}>Duración{'\n'}promedio</Text>
                </View>
                <View style={styles.metricaDivider} />
                <View style={styles.metricaBox}>
                  <Text style={[
                    styles.metricaValor,
                    metricas.promIntervaloSS !== null && metricas.promIntervaloSS <= 300_000 && styles.valorAlerta,
                  ]}>
                    {metricas.promIntervaloSS ? formatTimer(metricas.promIntervaloSS) : '—'}
                  </Text>
                  <Text style={styles.metricaLabel}>Frecuencia{'\n'}(inicio a inicio)</Text>
                </View>
                <View style={styles.metricaDivider} />
                <View style={styles.metricaBox}>
                  <Text style={styles.metricaValor}>{metricas.total}</Text>
                  <Text style={styles.metricaLabel}>Contracciones{'\n'}registradas</Text>
                </View>
              </View>
            )}

            {/* Alerta 5-1-1 */}
            {metricas?.regla511 && (
              <View style={styles.alertaCard}>
                <Text style={styles.alertaEmoji}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertaTitulo}>¡Regla 5-1-1 alcanzada!</Text>
                  <Text style={styles.alertaTexto}>
                    Es momento de ir al hospital o llamar a tu médico de inmediato.
                  </Text>
                </View>
              </View>
            )}

            {/* Tabla historial */}
            {completas.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Registro de esta sesión</Text>
                <View style={styles.tabla}>
                  <View style={[styles.tablaFila, styles.tablaHeader]}>
                    <Text style={[styles.tablaCell, styles.tablaCellH, { flex: 0.5 }]}>#</Text>
                    <Text style={[styles.tablaCell, styles.tablaCellH]}>Hora</Text>
                    <Text style={[styles.tablaCell, styles.tablaCellH]}>Duración</Text>
                    <Text style={[styles.tablaCell, styles.tablaCellH]}>Descanso</Text>
                    <Text style={{ flex: 0.5 }} />
                  </View>
                  {[...completas].reverse().map((c, i) => {
                    const duracion = c.fin! - c.inicio;
                    const idxOriginal = completas.length - 1 - i;
                    const prev = completas[idxOriginal - 1];
                    const descanso = prev ? c.inicio - prev.fin! : null;
                    const durOk = duracion >= 60_000;

                    return (
                      <View key={c.id} style={[styles.tablaFila, i % 2 !== 0 && styles.tablaFilaPar]}>
                        <Text style={[styles.tablaCell, { flex: 0.5 }]}>{completas.length - i}</Text>
                        <Text style={styles.tablaCell}>{formatHora(c.inicio)}</Text>
                        <Text style={[styles.tablaCell, durOk && styles.valorOk]}>{formatTimer(duracion)}</Text>
                        <Text style={styles.tablaCell}>
                          {descanso !== null ? formatTimer(descanso) : '—'}
                        </Text>
                        <TouchableOpacity
                          style={{ flex: 0.5, alignItems: 'center' }}
                          onPress={() => eliminarContraccion(c.id)}
                        >
                          <Text>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.btnNueva} onPress={confirmarNuevaSesion}>
              <Text style={styles.btnNuevaText}>↺  Nueva sesión</Text>
            </TouchableOpacity>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },

  infoCard: {
    backgroundColor: '#F3E5F5', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16,
  },
  infoEmoji: { fontSize: 18, marginTop: 1 },
  infoTexto: { flex: 1, fontSize: 13, color: '#6A1B9A', lineHeight: 20 },
  infoBold: { fontWeight: '700' },

  panel: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 16,
    elevation: 3, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10,
  },
  panelEmoji: { fontSize: 48, marginBottom: 12 },
  panelTitulo: { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 10 },
  panelDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btnIniciar: {
    backgroundColor: '#C2185B', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40,
    elevation: 4, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnIniciarText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  btnContainer: { alignItems: 'center', marginBottom: 20 },
  btnContraccion: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#E8F5E9', borderWidth: 5, borderColor: '#4CAF50',
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 14,
  },
  btnContraccionActiva: {
    backgroundColor: '#FFEBEE', borderColor: '#F44336',
    shadowColor: '#F44336',
  },
  btnEstadoLabel: { fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  btnTimer: { fontSize: 48, fontWeight: '900', color: '#4CAF50', lineHeight: 54 },
  btnTimerActivo: { color: '#F44336' },
  btnAccionLabel: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 6, paddingHorizontal: 20 },

  metricasRow: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  metricaBox: { flex: 1, alignItems: 'center' },
  metricaDivider: { width: 1, height: 40, backgroundColor: '#f0f0f0' },
  metricaValor: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 4 },
  metricaLabel: { fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 16 },

  valorOk: { color: '#4CAF50' },
  valorAlerta: { color: '#F44336' },

  alertaCard: {
    backgroundColor: '#FFEBEE', borderRadius: 16, padding: 16, marginBottom: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderLeftWidth: 5, borderLeftColor: '#F44336',
    elevation: 2,
  },
  alertaEmoji: { fontSize: 24 },
  alertaTitulo: { fontSize: 15, fontWeight: '800', color: '#B71C1C', marginBottom: 4 },
  alertaTexto: { fontSize: 13, color: '#C62828', lineHeight: 20 },

  tabla: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  tablaFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  tablaFilaPar: { backgroundColor: '#FFF5F7' },
  tablaHeader: { backgroundColor: '#FCE4EC', paddingVertical: 8 },
  tablaCell: { flex: 1, fontSize: 13, color: '#333', textAlign: 'center' },
  tablaCellH: { fontWeight: '700', color: '#C2185B', fontSize: 12 },

  btnNueva: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 24, marginBottom: 8 },
  btnNuevaText: { fontSize: 14, color: '#bbb', textDecorationLine: 'underline' },
});
