import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { FotoSemana, Momento } from '../types';

const KEY_SEMANAS  = '@fotos_semanas';
const KEY_MOMENTOS = '@momentos_especiales';
const PREGNANCY_START = new Date(2026, 2, 29);
const { width } = Dimensions.get('window');
const MOMENTO_SIZE = (width - 40 - 10) / 2; // 2 cols, padding 20 c/lado, gap 10

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
  const [, m, d] = dateStr.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m) - 1]}`;
}

async function pedirPermiso(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para agregar fotos.');
    return false;
  }
  return true;
}

async function elegirFoto(): Promise<string | null> {
  if (!(await pedirPermiso())) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  if (result.canceled) return null;

  // Copiar al directorio permanente de la app para que no dependa del caché
  const tempUri = result.assets[0].uri;
  const ext = tempUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const permanentUri = `${FileSystem.documentDirectory}foto_${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
  return permanentUri;
}

async function borrarArchivoFoto(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {}
}

type Vista = 'progresion' | 'momentos';

export default function FotosScreen() {
  const [vista, setVista] = useState<Vista>('progresion');
  const [semanas, setSemanas] = useState<FotoSemana[]>([]);
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevoUri, setNuevoUri] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaNota, setNuevaNota] = useState('');

  const semana = semanaActual();
  // Show weeks 4 through current + 2, capped at 40
  const semanasMostradas = Array.from(
    { length: Math.min(Math.max(semana + 2, 12), 40) - 3 },
    (_, i) => i + 4
  );

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      const [ds, dm] = await Promise.all([
        AsyncStorage.getItem(KEY_SEMANAS),
        AsyncStorage.getItem(KEY_MOMENTOS),
      ]);
      setSemanas(ds ? JSON.parse(ds) : []);
      setMomentos(dm ? JSON.parse(dm) : []);
    } catch {}
  }

  // ── Progresión semanal ───────────────────────────────────────────────

  async function agregarFotoSemana(num: number) {
    const uri = await elegirFoto();
    if (!uri) return;
    const actualizadas = semanas.filter(s => s.semana !== num);
    actualizadas.push({ semana: num, uri, fecha: hoyStr() });
    setSemanas(actualizadas);
    await AsyncStorage.setItem(KEY_SEMANAS, JSON.stringify(actualizadas));
  }

  async function eliminarFotoSemana(num: number) {
    Alert.alert('Eliminar foto', `¿Eliminar la foto de la semana ${num}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const foto = semanas.find(s => s.semana === num);
          if (foto) await borrarArchivoFoto(foto.uri);
          const actualizadas = semanas.filter(s => s.semana !== num);
          setSemanas(actualizadas);
          await AsyncStorage.setItem(KEY_SEMANAS, JSON.stringify(actualizadas));
        },
      },
    ]);
  }

  // ── Momentos especiales ──────────────────────────────────────────────

  async function elegirFotoMomento() {
    const uri = await elegirFoto();
    if (uri) setNuevoUri(uri);
  }

  async function guardarMomento() {
    if (!nuevoUri || !nuevoTitulo.trim()) return;
    const nuevo: Momento = {
      id: String(Date.now()),
      uri: nuevoUri,
      titulo: nuevoTitulo.trim(),
      fecha: hoyStr(),
      nota: nuevaNota.trim(),
    };
    const actualizados = [nuevo, ...momentos];
    setMomentos(actualizados);
    await AsyncStorage.setItem(KEY_MOMENTOS, JSON.stringify(actualizados));
    setFormAbierto(false);
    setNuevoUri('');
    setNuevoTitulo('');
    setNuevaNota('');
  }

  function cancelarForm() {
    setFormAbierto(false);
    setNuevoUri('');
    setNuevoTitulo('');
    setNuevaNota('');
  }

  async function eliminarMomento(id: string) {
    Alert.alert('Eliminar foto', '¿Seguro que quieres eliminar este momento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const momento = momentos.find(m => m.id === id);
          if (momento) await borrarArchivoFoto(momento.uri);
          const actualizados = momentos.filter(m => m.id !== id);
          setMomentos(actualizados);
          await AsyncStorage.setItem(KEY_MOMENTOS, JSON.stringify(actualizados));
        },
      },
    ]);
  }

  const totalFotos = semanas.length + momentos.length;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={styles.title}>Álbum del embarazo</Text>
          <Text style={styles.subtitle}>{totalFotos} foto{totalFotos !== 1 ? 's' : ''} guardada{totalFotos !== 1 ? 's' : ''}</Text>

          {/* Toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, vista === 'progresion' && styles.toggleBtnActivo]}
              onPress={() => setVista('progresion')}
            >
              <Text style={[styles.toggleText, vista === 'progresion' && styles.toggleTextActivo]}>
                📅 Progresión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, vista === 'momentos' && styles.toggleBtnActivo]}
              onPress={() => setVista('momentos')}
            >
              <Text style={[styles.toggleText, vista === 'momentos' && styles.toggleTextActivo]}>
                ✨ Momentos
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Progresión semanal ── */}
          {vista === 'progresion' && (
            <>
              <Text style={styles.sectionDesc}>
                Una foto por semana · Semana actual: <Text style={{ fontWeight: '800', color: '#C2185B' }}>{semana}</Text>
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.semanasScroll}>
                {semanasMostradas.map(num => {
                  const foto = semanas.find(s => s.semana === num);
                  const esActual = num === semana;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[styles.semanaCard, esActual && styles.semanaCardActual]}
                      onPress={() => agregarFotoSemana(num)}
                      onLongPress={() => foto && eliminarFotoSemana(num)}
                      activeOpacity={0.8}
                    >
                      {foto ? (
                        <Image source={{ uri: foto.uri }} style={styles.semanaFoto} />
                      ) : (
                        <View style={[styles.semanaPlaceholder, esActual && styles.semanaPlaceholderActual]}>
                          <Text style={styles.semanaPlaceholderIcon}>📷</Text>
                        </View>
                      )}
                      <View style={styles.semanaFooter}>
                        <Text style={[styles.semanaNum, esActual && styles.semanaNumActual]}>
                          Sem. {num}
                        </Text>
                        {esActual && <View style={styles.semanaActualDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.hintText}>Toca para agregar foto · Mantén presionado para eliminar</Text>

              {semanas.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🤰</Text>
                  <Text style={styles.emptyText}>Toca cualquier semana para agregar{'\n'}tu primera foto de progresión.</Text>
                </View>
              )}

              {semanas.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Semanas con foto</Text>
                  <View style={styles.grid}>
                    {[...semanas].sort((a, b) => b.semana - a.semana).map(f => (
                      <TouchableOpacity
                        key={f.semana}
                        style={styles.gridItem}
                        onLongPress={() => eliminarFotoSemana(f.semana)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: f.uri }} style={styles.gridFoto} />
                        <View style={styles.gridOverlay}>
                          <Text style={styles.gridLabel}>Sem. {f.semana}</Text>
                          <Text style={styles.gridFecha}>{formatFecha(f.fecha)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {/* ── Momentos especiales ── */}
          {vista === 'momentos' && (
            <>
              {formAbierto ? (
                <View style={styles.formCard}>
                  <Text style={styles.formTitulo}>Nuevo momento</Text>

                  <TouchableOpacity style={styles.fotoPickerBtn} onPress={elegirFotoMomento}>
                    {nuevoUri ? (
                      <Image source={{ uri: nuevoUri }} style={styles.fotoPreview} />
                    ) : (
                      <View style={styles.fotoPickerPlaceholder}>
                        <Text style={styles.fotoPickerIcon}>📷</Text>
                        <Text style={styles.fotoPickerText}>Elegir foto</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TextInput
                    style={styles.input}
                    placeholder="Título (ej: Primera ecografía)"
                    placeholderTextColor="#bbb"
                    value={nuevoTitulo}
                    onChangeText={setNuevoTitulo}
                  />
                  <TextInput
                    style={[styles.input, { marginBottom: 16 }]}
                    placeholder="Nota opcional..."
                    placeholderTextColor="#bbb"
                    value={nuevaNota}
                    onChangeText={setNuevaNota}
                  />

                  <View style={styles.formBtns}>
                    <TouchableOpacity style={styles.btnCancelar} onPress={cancelarForm}>
                      <Text style={styles.btnCancelarText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnGuardar, (!nuevoUri || !nuevoTitulo.trim()) && styles.btnGuardarDisabled]}
                      onPress={guardarMomento}
                      disabled={!nuevoUri || !nuevoTitulo.trim()}
                    >
                      <Text style={styles.btnGuardarText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.btnNuevo} onPress={() => setFormAbierto(true)}>
                  <Text style={styles.btnNuevoText}>＋  Agregar momento</Text>
                </TouchableOpacity>
              )}

              {momentos.length === 0 && !formAbierto && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>✨</Text>
                  <Text style={styles.emptyText}>Guarda tus momentos especiales:{'\n'}ecografías, baby shower, antojos...</Text>
                </View>
              )}

              {momentos.length > 0 && (
                <View style={styles.grid}>
                  {momentos.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.gridItem}
                      onLongPress={() => eliminarMomento(m.id)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: m.uri }} style={styles.gridFoto} />
                      <View style={styles.gridOverlay}>
                        <Text style={styles.gridLabel} numberOfLines={1}>{m.titulo}</Text>
                        <Text style={styles.gridFecha}>{formatFecha(m.fecha)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

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
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 4, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 8 },
  sectionDesc: { fontSize: 13, color: '#888', marginBottom: 14 },
  hintText: { fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 8, marginBottom: 16 },

  toggle: {
    flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 14,
    padding: 4, marginBottom: 20,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  toggleBtnActivo: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#aaa' },
  toggleTextActivo: { color: '#C2185B' },

  // Progresión semanal — scroll horizontal
  semanasScroll: { paddingBottom: 8, gap: 10, paddingRight: 4 },
  semanaCard: {
    width: 90, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6,
  },
  semanaCardActual: { borderWidth: 2, borderColor: '#C2185B' },
  semanaFoto: { width: 90, height: 110, resizeMode: 'cover' },
  semanaPlaceholder: {
    width: 90, height: 110, backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
  },
  semanaPlaceholderActual: { backgroundColor: '#FCE4EC' },
  semanaPlaceholderIcon: { fontSize: 28 },
  semanaFooter: {
    paddingVertical: 6, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 4,
  },
  semanaNum: { fontSize: 12, fontWeight: '700', color: '#666' },
  semanaNumActual: { color: '#C2185B' },
  semanaActualDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C2185B' },

  // Grid 2 columnas (progresión guardada + momentos)
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    width: MOMENTO_SIZE, borderRadius: 16, overflow: 'hidden',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  gridFoto: { width: MOMENTO_SIZE, height: MOMENTO_SIZE, resizeMode: 'cover' },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', padding: 8,
  },
  gridLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  gridFecha: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Formulario momentos
  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    elevation: 3, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 10,
  },
  formTitulo: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 14 },
  fotoPickerBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 14, backgroundColor: '#f5f5f5' },
  fotoPreview: { width: '100%', height: 180, resizeMode: 'cover' },
  fotoPickerPlaceholder: {
    height: 140, alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', borderRadius: 14,
  },
  fotoPickerIcon: { fontSize: 32 },
  fotoPickerText: { fontSize: 14, color: '#bbb', fontWeight: '600' },
  input: {
    backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: '#333',
    borderWidth: 1.5, borderColor: '#eee', marginBottom: 12,
  },
  formBtns: { flexDirection: 'row', gap: 10 },
  btnCancelar: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f5f5f5', alignItems: 'center',
  },
  btnCancelarText: { fontSize: 14, color: '#888', fontWeight: '700' },
  btnGuardar: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#C2185B', alignItems: 'center',
    elevation: 3, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  btnGuardarDisabled: { backgroundColor: '#ddd', elevation: 0, shadowOpacity: 0 },
  btnGuardarText: { fontSize: 14, color: '#fff', fontWeight: '800' },

  btnNuevo: {
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: '#FCE4EC', borderStyle: 'dashed',
  },
  btnNuevoText: { fontSize: 15, color: '#C2185B', fontWeight: '700' },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32,
    alignItems: 'center', marginTop: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', lineHeight: 22 },
});
