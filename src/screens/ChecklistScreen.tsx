import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TareaPersonal } from '../types';
import { CHECKLIST_PREDEFINIDA } from '../constants/checklistData';

const STORAGE_KEY = '@checklist_state';
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

type Estado = { completados: string[]; personal: TareaPersonal[] };

async function leerEstado(): Promise<Estado> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { completados: [], personal: [] };
}

async function guardarEstado(estado: Estado): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

const TRIMESTRES = [
  { num: 1 as const, label: 'Primer trimestre',   rango: 'Semanas 1–13',  emoji: '🌱' },
  { num: 2 as const, label: 'Segundo trimestre',  rango: 'Semanas 14–27', emoji: '🌸' },
  { num: 3 as const, label: 'Tercer trimestre',   rango: 'Semanas 28–40', emoji: '🌟' },
];

export default function ChecklistScreen() {
  const [completados, setCompletados] = useState<Set<string>>(new Set());
  const [personal, setPersonal] = useState<TareaPersonal[]>([]);
  const [nuevaTarea, setNuevaTarea] = useState('');
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({
    '1': false, '2': false, '3': false, personal: true,
  });

  const semana = semanaActual();
  const trimestre = trimestreActual(semana);

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    setAbiertas(prev => ({ ...prev, [String(trimestre)]: true }));
  }, [trimestre]);

  async function cargarDatos() {
    try {
      const estado = await leerEstado();
      setCompletados(new Set(estado.completados));
      setPersonal(estado.personal);
    } catch {}
  }

  async function togglePredefinido(id: string) {
    const nuevos = new Set(completados);
    nuevos.has(id) ? nuevos.delete(id) : nuevos.add(id);
    setCompletados(nuevos);
    const estado = await leerEstado();
    await guardarEstado({ ...estado, completados: Array.from(nuevos) });
  }

  async function agregarPersonal() {
    const texto = nuevaTarea.trim();
    if (!texto) return;
    const nueva: TareaPersonal = { id: `P_${Date.now()}`, texto, completado: false };
    const actualizadas = [...personal, nueva];
    setPersonal(actualizadas);
    setNuevaTarea('');
    const estado = await leerEstado();
    await guardarEstado({ ...estado, personal: actualizadas });
  }

  async function togglePersonal(id: string) {
    const actualizadas = personal.map(p => p.id === id ? { ...p, completado: !p.completado } : p);
    setPersonal(actualizadas);
    const estado = await leerEstado();
    await guardarEstado({ ...estado, personal: actualizadas });
  }

  async function eliminarPersonal(id: string) {
    Alert.alert('Eliminar tarea', '¿Seguro que quieres eliminar esta tarea?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const actualizadas = personal.filter(p => p.id !== id);
          setPersonal(actualizadas);
          const estado = await leerEstado();
          await guardarEstado({ ...estado, personal: actualizadas });
        },
      },
    ]);
  }

  function toggleSeccion(key: string) {
    setAbiertas(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const totalPred = CHECKLIST_PREDEFINIDA.length;
  const hechasPred = CHECKLIST_PREDEFINIDA.filter(i => completados.has(i.id)).length;
  const hechasPersonal = personal.filter(p => p.completado).length;
  const totalGlobal = totalPred + personal.length;
  const hechasGlobal = hechasPred + hechasPersonal;
  const pct = totalGlobal > 0 ? hechasGlobal / totalGlobal : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>Checklist del embarazo</Text>
        <Text style={styles.subtitle}>Semana {semana} · Trimestre {trimestre}</Text>

        {/* Progreso global */}
        <View style={styles.progresoCard}>
          <View style={styles.progresoHeader}>
            <Text style={styles.progresoLabel}>Progreso total</Text>
            <Text style={styles.progresoNum}>{hechasGlobal}/{totalGlobal} tareas</Text>
          </View>
          <View style={styles.progresoBar}>
            <View style={[styles.progresoFill, { width: `${pct * 100}%` }]} />
          </View>
          <Text style={styles.progresoPct}>{Math.round(pct * 100)}% completado 🎯</Text>
        </View>

        {/* Secciones por trimestre */}
        {TRIMESTRES.map(({ num, label, rango, emoji }) => {
          const items = CHECKLIST_PREDEFINIDA.filter(i => i.trimestre === num);
          const hechas = items.filter(i => completados.has(i.id)).length;
          const esActual = num === trimestre;
          const abierta = abiertas[String(num)];

          return (
            <View key={num} style={[styles.seccion, esActual && styles.seccionActual]}>
              <TouchableOpacity
                style={styles.seccionHeader}
                onPress={() => toggleSeccion(String(num))}
                activeOpacity={0.7}
              >
                <View style={styles.seccionLeft}>
                  <Text style={styles.seccionEmoji}>{emoji}</Text>
                  <View>
                    <View style={styles.seccionTitleRow}>
                      <Text style={[styles.seccionTitulo, esActual && styles.seccionTituloActual]}>
                        {label}
                      </Text>
                      {esActual && (
                        <View style={styles.badgeActual}>
                          <Text style={styles.badgeText}>Actual</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.seccionRango}>{rango} · {hechas}/{items.length} hechas</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>{abierta ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* Mini barra de progreso de la sección */}
              <View style={styles.seccionBar}>
                <View style={[
                  styles.seccionBarFill,
                  { width: `${items.length > 0 ? (hechas / items.length) * 100 : 0}%` },
                  esActual && styles.seccionBarFillActual,
                ]} />
              </View>

              {abierta && (
                <View style={styles.itemsContainer}>
                  {items.map(item => {
                    const hecho = completados.has(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.itemRow}
                        onPress={() => togglePredefinido(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, hecho && styles.checkboxHecho]}>
                          {hecho && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[styles.itemTexto, hecho && styles.itemTextoCruzado]}>
                          {item.texto}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Sección de tareas personales */}
        <View style={styles.seccion}>
          <TouchableOpacity
            style={styles.seccionHeader}
            onPress={() => toggleSeccion('personal')}
            activeOpacity={0.7}
          >
            <View style={styles.seccionLeft}>
              <Text style={styles.seccionEmoji}>💝</Text>
              <View>
                <Text style={styles.seccionTitulo}>Mis tareas personales</Text>
                <Text style={styles.seccionRango}>
                  {personal.length === 0
                    ? 'Agrega tus propias tareas'
                    : `${hechasPersonal}/${personal.length} hechas`}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>{abiertas['personal'] ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {abiertas['personal'] && (
            <View style={styles.itemsContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Escribe una tarea..."
                  placeholderTextColor="#bbb"
                  value={nuevaTarea}
                  onChangeText={setNuevaTarea}
                  onSubmitEditing={agregarPersonal}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.btnAgregar, !nuevaTarea.trim() && styles.btnAgregarDisabled]}
                  onPress={agregarPersonal}
                  disabled={!nuevaTarea.trim()}
                >
                  <Text style={styles.btnAgregarText}>+</Text>
                </TouchableOpacity>
              </View>

              {personal.length === 0 && (
                <Text style={styles.emptyText}>Aún no tienes tareas personales. ¡Agrega la primera!</Text>
              )}

              {personal.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <TouchableOpacity onPress={() => togglePersonal(item.id)}>
                    <View style={[styles.checkbox, item.completado && styles.checkboxHecho]}>
                      {item.completado && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <Text
                    style={[styles.itemTexto, item.completado && styles.itemTextoCruzado, { flex: 1 }]}
                    onPress={() => togglePersonal(item.id)}
                  >
                    {item.texto}
                  </Text>
                  <TouchableOpacity onPress={() => eliminarPersonal(item.id)} style={styles.btnEliminar}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#C2185B', paddingTop: 24 },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 4, marginBottom: 20 },

  progresoCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20,
    elevation: 3, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 10,
  },
  progresoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progresoLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  progresoNum: { fontSize: 14, fontWeight: '700', color: '#C2185B' },
  progresoBar: { height: 12, backgroundColor: '#FCE4EC', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progresoFill: { height: '100%', backgroundColor: '#C2185B', borderRadius: 6 },
  progresoPct: { fontSize: 13, color: '#aaa', textAlign: 'right' },

  seccion: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  seccionActual: {
    borderWidth: 2, borderColor: '#C2185B',
    elevation: 4, shadowColor: '#C2185B', shadowOpacity: 0.15,
  },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  seccionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  seccionEmoji: { fontSize: 28 },
  seccionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: '#333' },
  seccionTituloActual: { color: '#C2185B' },
  seccionRango: { fontSize: 12, color: '#aaa', marginTop: 2 },
  badgeActual: { backgroundColor: '#FCE4EC', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#C2185B', fontWeight: '700' },
  chevron: { fontSize: 12, color: '#aaa', paddingLeft: 8 },

  seccionBar: { height: 4, backgroundColor: '#f5f5f5', marginHorizontal: 16, borderRadius: 2, marginBottom: 4 },
  seccionBarFill: { height: '100%', backgroundColor: '#ddd', borderRadius: 2 },
  seccionBarFillActual: { backgroundColor: '#C2185B' },

  itemsContainer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ddd',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxHecho: { backgroundColor: '#C2185B', borderColor: '#C2185B' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  itemTexto: { fontSize: 14, color: '#333', flex: 1, lineHeight: 20 },
  itemTextoCruzado: { textDecorationLine: 'line-through', color: '#bbb' },

  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: {
    flex: 1, backgroundColor: '#f9f9f9', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#333',
    borderWidth: 1.5, borderColor: '#eee',
  },
  btnAgregar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#C2185B', alignItems: 'center', justifyContent: 'center',
  },
  btnAgregarDisabled: { backgroundColor: '#ddd' },
  btnAgregarText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },
  btnEliminar: { padding: 4 },

  emptyText: { fontSize: 13, color: '#bbb', textAlign: 'center', paddingVertical: 12 },
});
