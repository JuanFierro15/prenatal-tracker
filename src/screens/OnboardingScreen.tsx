import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { importarBackup } from '../utils/backup';
import { ConfigEmbarazo } from '../types';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatFecha(d: Date): string {
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function calcularSemana(fur: Date): number {
  return Math.max(0, Math.floor((Date.now() - fur.getTime()) / (1000 * 60 * 60 * 24 * 7)));
}

function calcularParto(fur: Date): string {
  const parto = new Date(fur.getTime() + 280 * 86400000);
  return `${parto.getDate()} ${MESES[parto.getMonth()]} ${parto.getFullYear()}`;
}

function fechaDefault(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 84); // ~12 semanas atrás como punto de partida
  return d;
}

type Props = { onComplete: () => void };

export default function OnboardingScreen({ onComplete }: Props) {
  const [paso, setPaso] = useState(0);
  const [nombreBebe, setNombreBebe] = useState('');
  const [nombreMama, setNombreMama] = useState('');
  const [nombrePapa, setNombrePapa] = useState('');
  const [fechaInicio, setFechaInicio] = useState(fechaDefault);
  const [sexoBebe, setSexoBebe] = useState<'niño' | 'niña' | 'desconocido'>('desconocido');
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [importando, setImportando] = useState(false);

  async function handleImportar() {
    setImportando(true);
    const res = await importarBackup();
    setImportando(false);
    if (res.ok) {
      const config = await AsyncStorage.getItem('@config_embarazo');
      if (config) {
        onComplete();
      } else {
        Alert.alert(
          'Datos importados',
          'Tus datos fueron restaurados. Completa la configuración inicial para continuar.',
          [{ text: 'Continuar', onPress: () => setPaso(1) }],
        );
      }
    } else if (res.mensaje !== 'Cancelado.') {
      Alert.alert('Error al importar', res.mensaje);
    }
  }

  async function guardar() {
    const config: ConfigEmbarazo = {
      nombreBebe: nombreBebe.trim(),
      nombreMama: nombreMama.trim(),
      nombrePapa: nombrePapa.trim(),
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      sexoBebe,
    };
    await AsyncStorage.setItem('@config_embarazo', JSON.stringify(config));
    onComplete();
  }

  const semanaEstimada = calcularSemana(fechaInicio);
  const partoEstimado = calcularParto(fechaInicio);

  // ── Pantalla de bienvenida ───────────────────────────────────────────────────

  if (paso === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeEmoji}>🤰</Text>
          <Text style={styles.welcomeTitle}>¡Bienvenida!</Text>
          <Text style={styles.welcomeSub}>
            Tu compañero durante{'\n'}el camino al bebé 💕
          </Text>
          <View style={styles.welcomeBtns}>
            <TouchableOpacity style={styles.btnPrimario} onPress={() => setPaso(1)}>
              <Text style={styles.btnPrimarioText}>Comenzar  ✨</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecundario}
              onPress={handleImportar}
              disabled={importando}
            >
              <Text style={styles.btnSecundarioText}>
                {importando ? 'Importando...' : '💾  Ya usé la app antes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Resumen final ────────────────────────────────────────────────────────────

  if (paso === 5) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.pasoWrap}>
          <Text style={styles.pasoEmoji}>🎉</Text>
          <Text style={styles.pasoTitulo}>¡Todo listo!</Text>
          <Text style={styles.pasoSub}>Así quedó tu perfil</Text>

          <View style={styles.resumenBox}>
            {nombreBebe ? <FilaResumen emoji="💝" label="Bebé" valor={nombreBebe} /> : null}
            <FilaResumen emoji="👩" label="Mamá" valor={nombreMama} />
            {nombrePapa ? <FilaResumen emoji="👨" label="Papá" valor={nombrePapa} /> : null}
            <FilaResumen emoji="📅" label="Semana actual" valor={`Semana ${semanaEstimada}`} />
            <FilaResumen emoji="🍼" label="Fecha probable de parto" valor={partoEstimado} />
            <FilaResumen
              emoji={sexoBebe === 'niño' ? '👦' : sexoBebe === 'niña' ? '👧' : '🤷'}
              label="Sexo"
              valor={sexoBebe === 'niño' ? 'Niño' : sexoBebe === 'niña' ? 'Niña' : 'Aún no sabemos'}
            />
          </View>

          <TouchableOpacity style={[styles.btnPrimario, { marginTop: 24 }]} onPress={guardar}>
            <Text style={styles.btnPrimarioText}>¡Empecemos!  💕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAtras} onPress={() => setPaso(4)}>
            <Text style={styles.btnAtrasText}>← Atrás</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Pasos 1–4 ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.pasoWrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progreso */}
          <View style={styles.progreso}>
            {[1, 2, 3, 4].map(n => (
              <View key={n} style={[styles.progresoDot, paso >= n && styles.progresoDotActivo]} />
            ))}
          </View>

          {/* ── Paso 1: nombre del bebé ── */}
          {paso === 1 && (
            <>
              <Text style={styles.pasoEmoji}>💝</Text>
              <Text style={styles.pasoTitulo}>¿Ya tienen{'\n'}un nombre?</Text>
              <Text style={styles.pasoSub}>Puedes omitirlo si todavía no lo deciden</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del bebé"
                placeholderTextColor="#ccc"
                value={nombreBebe}
                onChangeText={setNombreBebe}
                autoCapitalize="words"
              />
              <TouchableOpacity style={styles.btnPrimario} onPress={() => setPaso(2)}>
                <Text style={styles.btnPrimarioText}>Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAtras} onPress={() => { setNombreBebe(''); setPaso(2); }}>
                <Text style={styles.btnAtrasText}>Omitir por ahora</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Paso 2: nombres papás ── */}
          {paso === 2 && (
            <>
              <Text style={styles.pasoEmoji}>👨‍👩‍👶</Text>
              <Text style={styles.pasoTitulo}>¿Cómo se llaman{'\n'}los papás?</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de mamá *"
                placeholderTextColor="#ccc"
                value={nombreMama}
                onChangeText={setNombreMama}
                autoCapitalize="words"
              />
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Nombre de papá (opcional)"
                placeholderTextColor="#ccc"
                value={nombrePapa}
                onChangeText={setNombrePapa}
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.btnPrimario, !nombreMama.trim() && styles.btnDisabled]}
                onPress={() => setPaso(3)}
                disabled={!nombreMama.trim()}
              >
                <Text style={styles.btnPrimarioText}>Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAtras} onPress={() => setPaso(1)}>
                <Text style={styles.btnAtrasText}>← Atrás</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Paso 3: fecha de inicio ── */}
          {paso === 3 && (
            <>
              <Text style={styles.pasoEmoji}>📅</Text>
              <Text style={styles.pasoTitulo}>¿Cuándo comenzó{'\n'}el embarazo?</Text>
              <Text style={styles.pasoSub}>Fecha de tu última regla (FUR)</Text>

              <TouchableOpacity
                style={styles.fechaBtn}
                onPress={() => setMostrarPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.fechaBtnEmoji}>📆</Text>
                <Text style={styles.fechaBtnTexto}>{formatFecha(fechaInicio)}</Text>
                <Text style={styles.fechaBtnEditar}>Cambiar</Text>
              </TouchableOpacity>

              {mostrarPicker && (
                <DateTimePicker
                  value={fechaInicio}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setMostrarPicker(false);
                    if (date) setFechaInicio(date);
                  }}
                />
              )}

              <View style={styles.calculoBox}>
                <View style={styles.calculoFila}>
                  <Text style={styles.calculoLabel}>Semana actual estimada</Text>
                  <Text style={styles.calculoValor}>Semana {semanaEstimada}</Text>
                </View>
                <View style={styles.calculoSep} />
                <View style={styles.calculoFila}>
                  <Text style={styles.calculoLabel}>Fecha probable de parto</Text>
                  <Text style={styles.calculoValor}>{partoEstimado}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.btnPrimario} onPress={() => setPaso(4)}>
                <Text style={styles.btnPrimarioText}>Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAtras} onPress={() => setPaso(2)}>
                <Text style={styles.btnAtrasText}>← Atrás</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Paso 4: sexo del bebé ── */}
          {paso === 4 && (
            <>
              <Text style={styles.pasoEmoji}>🔮</Text>
              <Text style={styles.pasoTitulo}>¿Ya saben{'\n'}el sexo?</Text>

              <View style={styles.sexoGrid}>
                {([
                  { val: 'niño',        emoji: '👦', label: 'Niño' },
                  { val: 'niña',        emoji: '👧', label: 'Niña' },
                  { val: 'desconocido', emoji: '🤷', label: 'Aún no sabemos' },
                ] as const).map(op => (
                  <TouchableOpacity
                    key={op.val}
                    style={[styles.sexoCard, sexoBebe === op.val && styles.sexoCardActiva]}
                    onPress={() => setSexoBebe(op.val)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sexoEmoji}>{op.emoji}</Text>
                    <Text style={[styles.sexoLabel, sexoBebe === op.val && styles.sexoLabelActivo]}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.btnPrimario} onPress={() => setPaso(5)}>
                <Text style={styles.btnPrimarioText}>Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAtras} onPress={() => setPaso(3)}>
                <Text style={styles.btnAtrasText}>← Atrás</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FilaResumen({ emoji, label, valor }: { emoji: string; label: string; valor: string }) {
  return (
    <View style={styles.resumenFila}>
      <Text style={styles.resumenEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.resumenLabel}>{label}</Text>
        <Text style={styles.resumenValor}>{valor}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },

  // Bienvenida
  welcomeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  welcomeEmoji: { fontSize: 80, marginBottom: 20 },
  welcomeTitle: { fontSize: 36, fontWeight: '900', color: '#C2185B', marginBottom: 12 },
  welcomeSub: { fontSize: 16, color: '#aaa', textAlign: 'center', lineHeight: 24, marginBottom: 48 },
  welcomeBtns: { width: '100%', gap: 14 },

  // Pasos
  pasoWrap: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40 },
  pasoEmoji: { fontSize: 64, textAlign: 'center', marginBottom: 16, marginTop: 8 },
  pasoTitulo: { fontSize: 28, fontWeight: '900', color: '#C2185B', textAlign: 'center', lineHeight: 36, marginBottom: 8 },
  pasoSub: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 28, lineHeight: 20 },

  // Progreso
  progreso: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 32 },
  progresoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F0D0DA' },
  progresoDotActivo: { backgroundColor: '#C2185B', width: 24 },

  // Input
  input: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
    fontSize: 16, color: '#222', marginBottom: 16,
    borderWidth: 1.5, borderColor: '#F0E0E6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },

  // Botones
  btnPrimario: {
    backgroundColor: '#C2185B', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
    shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnPrimarioText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { backgroundColor: '#ddd', shadowOpacity: 0 },
  btnSecundario: {
    borderWidth: 2, borderColor: '#C2185B', borderRadius: 18,
    paddingVertical: 14, alignItems: 'center',
  },
  btnSecundarioText: { color: '#C2185B', fontWeight: '700', fontSize: 15 },
  btnAtras: { alignItems: 'center', paddingVertical: 8 },
  btnAtrasText: { color: '#bbb', fontSize: 14, fontWeight: '600' },

  // Fecha
  fechaBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#F0E0E6',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
  },
  fechaBtnEmoji: { fontSize: 28 },
  fechaBtnTexto: { flex: 1, fontSize: 17, fontWeight: '700', color: '#333' },
  fechaBtnEditar: { fontSize: 13, color: '#C2185B', fontWeight: '600' },

  calculoBox: {
    backgroundColor: '#FCE4EC', borderRadius: 16, padding: 16, marginBottom: 24,
  },
  calculoFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calculoSep: { height: 1, backgroundColor: '#F8B8CC', marginVertical: 12 },
  calculoLabel: { fontSize: 13, color: '#C2185B', fontWeight: '500' },
  calculoValor: { fontSize: 15, color: '#880E4F', fontWeight: '800' },

  // Sexo
  sexoGrid: { gap: 10, marginBottom: 24 },
  sexoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 2, borderColor: '#f0f0f0',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
  },
  sexoCardActiva: { borderColor: '#C2185B', backgroundColor: '#FFF0F5' },
  sexoEmoji: { fontSize: 32 },
  sexoLabel: { fontSize: 15, color: '#666', fontWeight: '600' },
  sexoLabelActivo: { color: '#C2185B', fontWeight: '800' },

  // Resumen
  resumenBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 8, marginTop: 8,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10,
  },
  resumenFila: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#FFF0F5',
  },
  resumenEmoji: { fontSize: 26 },
  resumenLabel: { fontSize: 11, color: '#C2185B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  resumenValor: { fontSize: 15, color: '#222', fontWeight: '700', marginTop: 2 },
});
