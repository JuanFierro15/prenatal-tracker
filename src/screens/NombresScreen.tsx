import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Nombre, VotoNombre } from '../types';

const STORAGE_KEY = '@nombres_bebe';

type Filtro = 'todos' | 'niño' | 'niña' | 'favoritos';
type Genero = 'niño' | 'niña' | 'ambos';

const GENERO_EMOJI: Record<Genero, string> = { niño: '👦', niña: '👧', ambos: '🌟' };
const GENERO_LABEL: Record<Genero, string> = { niño: 'Niño', niña: 'Niña', ambos: 'Ambos' };

async function leerNombres(): Promise<Nombre[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

async function guardarNombres(nombres: Nombre[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nombres));
}

export default function NombresScreen() {
  const [nombres, setNombres] = useState<Nombre[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoGenero, setNuevoGenero] = useState<Genero>('ambos');
  const [nuevaNota, setNuevaNota] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try { setNombres(await leerNombres()); } catch {}
  }

  async function agregar() {
    const texto = nuevoNombre.trim();
    if (!texto) return;
    const nuevo: Nombre = {
      id: String(Date.now()),
      nombre: texto,
      genero: nuevoGenero,
      votaMama: null,
      votaPapa: null,
      nota: nuevaNota.trim(),
    };
    const actualizados = [nuevo, ...nombres];
    setNombres(actualizados);
    await guardarNombres(actualizados);
    setNuevoNombre('');
    setNuevaNota('');
    setNuevoGenero('ambos');
    setFormAbierto(false);
  }

  async function votar(id: string, quien: 'mama' | 'papa', voto: 'si' | 'no') {
    const actualizados = nombres.map(n => {
      if (n.id !== id) return n;
      if (quien === 'mama') {
        return { ...n, votaMama: n.votaMama === voto ? null : voto };
      } else {
        return { ...n, votaPapa: n.votaPapa === voto ? null : voto };
      }
    });
    setNombres(actualizados);
    await guardarNombres(actualizados);
  }

  async function eliminar(id: string) {
    Alert.alert('Eliminar nombre', '¿Seguro que quieres eliminar este nombre?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const actualizados = nombres.filter(n => n.id !== id);
          setNombres(actualizados);
          await guardarNombres(actualizados);
        },
      },
    ]);
  }

  const filtrados = nombres.filter(n => {
    if (filtro === 'niño') return n.genero === 'niño' || n.genero === 'ambos';
    if (filtro === 'niña') return n.genero === 'niña' || n.genero === 'ambos';
    if (filtro === 'favoritos') return n.votaMama === 'si' && n.votaPapa === 'si';
    return true;
  });

  const totalElegidos = nombres.filter(n => n.votaMama === 'si' && n.votaPapa === 'si').length;

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todos',     label: '✨ Todos' },
    { key: 'niño',      label: '👦 Niño' },
    { key: 'niña',      label: '👧 Niña' },
    { key: 'favoritos', label: `🏆 Elegidos${totalElegidos > 0 ? ` (${totalElegidos})` : ''}` },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={styles.title}>Nombres del bebé</Text>
          <Text style={styles.subtitle}>Vota con ❤️ o 💔 — si los dos eligen ❤️, es el elegido 🏆</Text>

          {/* Filtros */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosRow} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
            {FILTROS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filtroChip, filtro === f.key && styles.filtroChipActivo]}
                onPress={() => setFiltro(f.key)}
              >
                <Text style={[styles.filtroText, filtro === f.key && styles.filtroTextActivo]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Formulario agregar */}
          {formAbierto ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitulo}>Agregar nombre</Text>

              <TextInput
                style={styles.input}
                placeholder="Nombre del bebé..."
                placeholderTextColor="#bbb"
                value={nuevoNombre}
                onChangeText={setNuevoNombre}
                autoFocus
              />

              <Text style={styles.formLabel}>Género</Text>
              <View style={styles.generoRow}>
                {(['niño', 'niña', 'ambos'] as Genero[]).map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.generoBtn, nuevoGenero === g && styles.generoBtnActivo]}
                    onPress={() => setNuevoGenero(g)}
                  >
                    <Text style={styles.generoEmoji}>{GENERO_EMOJI[g]}</Text>
                    <Text style={[styles.generoLabel, nuevoGenero === g && styles.generoLabelActivo]}>
                      {GENERO_LABEL[g]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.input, { marginBottom: 16 }]}
                placeholder="Nota opcional (significado, origen...)"
                placeholderTextColor="#bbb"
                value={nuevaNota}
                onChangeText={setNuevaNota}
              />

              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setFormAbierto(false)}>
                  <Text style={styles.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnAgregar, !nuevoNombre.trim() && styles.btnAgregarDisabled]}
                  onPress={agregar}
                  disabled={!nuevoNombre.trim()}
                >
                  <Text style={styles.btnAgregarText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnNuevo} onPress={() => setFormAbierto(true)}>
              <Text style={styles.btnNuevoText}>＋  Agregar nombre</Text>
            </TouchableOpacity>
          )}

          {/* Lista de nombres */}
          {filtrados.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>
                {filtro === 'favoritos' ? '🏆' : '💝'}
              </Text>
              <Text style={styles.emptyText}>
                {filtro === 'favoritos'
                  ? 'Aún no hay nombres en los que los dos estén de acuerdo.'
                  : 'Agrega el primer nombre con el botón de arriba.'}
              </Text>
            </View>
          )}

          {filtrados.map(n => {
            const elegido = n.votaMama === 'si' && n.votaPapa === 'si';
            return (
              <View key={n.id} style={[styles.card, elegido && styles.cardElegido]}>

                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardGeneroEmoji}>{GENERO_EMOJI[n.genero]}</Text>
                    <Text style={styles.cardNombre}>{n.nombre}</Text>
                    {elegido && (
                      <View style={styles.badgeElegido}>
                        <Text style={styles.badgeElegidoText}>🏆 Elegido</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => eliminar(n.id)} style={styles.btnEliminar}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Votos */}
                <View style={styles.votosRow}>
                  <VotoBloque
                    label="Mamá 👩"
                    voto={n.votaMama}
                    onVotar={(v) => votar(n.id, 'mama', v)}
                  />
                  <View style={styles.votosDivider} />
                  <VotoBloque
                    label="Papá 👨"
                    voto={n.votaPapa}
                    onVotar={(v) => votar(n.id, 'papa', v)}
                  />
                </View>

                {/* Nota */}
                {n.nota ? (
                  <Text style={styles.cardNota}>📝 {n.nota}</Text>
                ) : null}
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function VotoBloque({
  label, voto, onVotar,
}: {
  label: string;
  voto: VotoNombre;
  onVotar: (v: 'si' | 'no') => void;
}) {
  return (
    <View style={styles.votoBloque}>
      <Text style={styles.votoLabel}>{label}</Text>
      <View style={styles.votoBtns}>
        <TouchableOpacity
          style={[styles.votoBtn, voto === 'si' && styles.votoBtnSi]}
          onPress={() => onVotar('si')}
        >
          <Text style={styles.votoBtnEmoji}>{voto === 'si' ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.votoBtn, voto === 'no' && styles.votoBtnNo]}
          onPress={() => onVotar('no')}
        >
          <Text style={styles.votoBtnEmoji}>{voto === 'no' ? '💔' : '🩶'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#C2185B', paddingTop: 24 },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 4, marginBottom: 16 },

  filtrosRow: { marginBottom: 16 },
  filtroChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#eee',
  },
  filtroChipActivo: { backgroundColor: '#FCE4EC', borderColor: '#C2185B' },
  filtroText: { fontSize: 13, color: '#888', fontWeight: '600' },
  filtroTextActivo: { color: '#C2185B' },

  // Formulario
  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    elevation: 3, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 10,
  },
  formTitulo: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: {
    backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: '#333',
    borderWidth: 1.5, borderColor: '#eee', marginBottom: 14,
  },
  generoRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  generoBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#eee',
  },
  generoBtnActivo: { backgroundColor: '#FCE4EC', borderColor: '#C2185B' },
  generoEmoji: { fontSize: 22, marginBottom: 4 },
  generoLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  generoLabelActivo: { color: '#C2185B' },
  formBtns: { flexDirection: 'row', gap: 10 },
  btnCancelar: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f5f5f5', alignItems: 'center',
  },
  btnCancelarText: { fontSize: 14, color: '#888', fontWeight: '700' },
  btnAgregar: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#C2185B', alignItems: 'center',
    elevation: 3, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  btnAgregarDisabled: { backgroundColor: '#ddd', elevation: 0, shadowOpacity: 0 },
  btnAgregarText: { fontSize: 14, color: '#fff', fontWeight: '800' },

  btnNuevo: {
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#FCE4EC',
    borderStyle: 'dashed',
  },
  btnNuevoText: { fontSize: 15, color: '#C2185B', fontWeight: '700' },

  // Cards de nombres
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  cardElegido: {
    borderWidth: 2, borderColor: '#FFC107',
    elevation: 5, shadowColor: '#FFC107', shadowOpacity: 0.2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' },
  cardGeneroEmoji: { fontSize: 24 },
  cardNombre: { fontSize: 22, fontWeight: '900', color: '#222' },
  badgeElegido: {
    backgroundColor: '#FFF9C4', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: '#FFC107',
  },
  badgeElegidoText: { fontSize: 12, fontWeight: '700', color: '#F57F17' },
  btnEliminar: { padding: 4 },

  // Votos
  votosRow: {
    flexDirection: 'row', backgroundColor: '#FFF5F7', borderRadius: 14,
    padding: 12, marginBottom: 10,
  },
  votoBloque: { flex: 1, alignItems: 'center', gap: 8 },
  votosDivider: { width: 1, backgroundColor: '#f0e0e0', marginVertical: 4 },
  votoLabel: { fontSize: 13, fontWeight: '700', color: '#555' },
  votoBtns: { flexDirection: 'row', gap: 12 },
  votoBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#eee',
  },
  votoBtnSi: { backgroundColor: '#FCE4EC', borderColor: '#E91E63' },
  votoBtnNo: { backgroundColor: '#f0f0f0', borderColor: '#bbb' },
  votoBtnEmoji: { fontSize: 20 },

  cardNota: { fontSize: 13, color: '#888', lineHeight: 20, marginTop: 4 },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32,
    alignItems: 'center', marginTop: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', lineHeight: 22 },
});
