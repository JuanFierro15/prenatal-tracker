import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
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

export default function AjustesScreen() {
  const navigation = useNavigation<any>();

  const [nombreBebe, setNombreBebe] = useState('');
  const [nombreMama, setNombreMama] = useState('');
  const [nombrePapa, setNombrePapa] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [sexoBebe, setSexoBebe] = useState<'niño' | 'niña' | 'desconocido'>('desconocido');
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@config_embarazo').then(val => {
      if (!val) return;
      const cfg: ConfigEmbarazo = JSON.parse(val);
      setNombreBebe(cfg.nombreBebe);
      setNombreMama(cfg.nombreMama);
      setNombrePapa(cfg.nombrePapa);
      setFechaInicio(new Date(cfg.fechaInicio));
      setSexoBebe(cfg.sexoBebe);
    });
  }, []);

  async function guardar() {
    if (!nombreMama.trim()) {
      Alert.alert('Campo requerido', 'El nombre de mamá es obligatorio.');
      return;
    }
    setGuardando(true);
    const config: ConfigEmbarazo = {
      nombreBebe: nombreBebe.trim(),
      nombreMama: nombreMama.trim(),
      nombrePapa: nombrePapa.trim(),
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      sexoBebe,
    };
    await AsyncStorage.setItem('@config_embarazo', JSON.stringify(config));
    setGuardando(false);
    navigation.goBack();
  }

  async function confirmarReset() {
    Alert.alert(
      'Borrar todos los datos',
      'Esta acción eliminará toda la información de la app (citas, diario, fotos, etc.) y no se puede deshacer. ¿Estás segura?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          },
        },
      ],
    );
  }

  const semanaEstimada = calcularSemana(fechaInicio);
  const partoEstimado = calcularParto(fechaInicio);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.titulo}>Ajustes</Text>
          <Text style={styles.subtitulo}>Edita la información del embarazo</Text>

          {/* ── Nombre del bebé ── */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>💝  Bebé</Text>
            <Text style={styles.fieldLabel}>Nombre del bebé (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del bebé"
              placeholderTextColor="#ccc"
              value={nombreBebe}
              onChangeText={setNombreBebe}
              autoCapitalize="words"
            />
          </View>

          {/* ── Nombres papás ── */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>👨‍👩‍👶  Papás</Text>
            <Text style={styles.fieldLabel}>Nombre de mamá *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de mamá"
              placeholderTextColor="#ccc"
              value={nombreMama}
              onChangeText={setNombreMama}
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>Nombre de papá (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de papá"
              placeholderTextColor="#ccc"
              value={nombrePapa}
              onChangeText={setNombrePapa}
              autoCapitalize="words"
            />
          </View>

          {/* ── Fecha de inicio ── */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>📅  Fecha de inicio (FUR)</Text>
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
                <Text style={styles.calculoLabel}>Semana actual</Text>
                <Text style={styles.calculoValor}>Semana {semanaEstimada}</Text>
              </View>
              <View style={styles.calculoSep} />
              <View style={styles.calculoFila}>
                <Text style={styles.calculoLabel}>Fecha probable de parto</Text>
                <Text style={styles.calculoValor}>{partoEstimado}</Text>
              </View>
            </View>
          </View>

          {/* ── Sexo del bebé ── */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>🔮  Sexo del bebé</Text>
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
          </View>

          {/* ── Guardar ── */}
          <TouchableOpacity
            style={[styles.btnGuardar, guardando && styles.btnGuardarDisabled]}
            onPress={guardar}
            disabled={guardando}
          >
            <Text style={styles.btnGuardarText}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>

          {/* ── Zona de peligro ── */}
          <View style={styles.peligroBox}>
            <Text style={styles.peligroTitulo}>Zona de peligro</Text>
            <Text style={styles.peligroSub}>
              Borra toda la información de la app de forma permanente.
            </Text>
            <TouchableOpacity style={styles.btnReset} onPress={confirmarReset}>
              <Text style={styles.btnResetText}>🗑️  Borrar todos los datos</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },

  titulo: { fontSize: 28, fontWeight: '900', color: '#C2185B', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#aaa', marginBottom: 28 },

  seccion: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  seccionTitulo: { fontSize: 14, fontWeight: '700', color: '#C2185B', marginBottom: 14 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FAFAFA', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 13, fontSize: 15, color: '#222', marginBottom: 14,
    borderWidth: 1.5, borderColor: '#F0E0E6',
  },

  fechaBtn: {
    backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 14, borderWidth: 1.5, borderColor: '#F0E0E6',
  },
  fechaBtnEmoji: { fontSize: 24 },
  fechaBtnTexto: { flex: 1, fontSize: 16, fontWeight: '700', color: '#333' },
  fechaBtnEditar: { fontSize: 13, color: '#C2185B', fontWeight: '600' },

  calculoBox: { backgroundColor: '#FCE4EC', borderRadius: 12, padding: 14 },
  calculoFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calculoSep: { height: 1, backgroundColor: '#F8B8CC', marginVertical: 10 },
  calculoLabel: { fontSize: 12, color: '#C2185B', fontWeight: '500' },
  calculoValor: { fontSize: 14, color: '#880E4F', fontWeight: '800' },

  sexoGrid: { gap: 8 },
  sexoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: '#f0f0f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAFA',
  },
  sexoCardActiva: { borderColor: '#C2185B', backgroundColor: '#FFF0F5' },
  sexoEmoji: { fontSize: 26 },
  sexoLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  sexoLabelActivo: { color: '#C2185B', fontWeight: '800' },

  btnGuardar: {
    backgroundColor: '#C2185B', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', marginBottom: 24,
    elevation: 4, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  btnGuardarDisabled: { backgroundColor: '#ddd', shadowOpacity: 0 },
  btnGuardarText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  peligroBox: {
    borderWidth: 1.5, borderColor: '#FFCDD2', borderRadius: 18,
    padding: 18, backgroundColor: '#FFF8F8',
  },
  peligroTitulo: { fontSize: 14, fontWeight: '700', color: '#C62828', marginBottom: 6 },
  peligroSub: { fontSize: 13, color: '#E57373', marginBottom: 14, lineHeight: 18 },
  btnReset: {
    borderWidth: 1.5, borderColor: '#EF9A9A', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  btnResetText: { color: '#C62828', fontWeight: '700', fontSize: 14 },
});
