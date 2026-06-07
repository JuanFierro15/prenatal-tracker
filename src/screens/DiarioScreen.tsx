import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { EntradaDiario } from '../types';

const STORAGE_KEY = '@diario';
const PREGNANCY_START = new Date(2026, 2, 29);

const ANIMOS = [
  { emoji: '😊', label: 'Feliz' },
  { emoji: '🥰', label: 'Emocionada' },
  { emoji: '😌', label: 'Tranquila' },
  { emoji: '🤩', label: 'Increíble' },
  { emoji: '😴', label: 'Cansada' },
  { emoji: '🤢', label: 'Con náuseas' },
  { emoji: '😰', label: 'Ansiosa' },
  { emoji: '😢', label: 'Triste' },
];

function semanaActual(): number {
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - PREGNANCY_START.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(dias / 7);
}

function formatFecha(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

function hoyStr(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`;
}

export default function DiarioScreen() {
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<EntradaDiario | null>(null);
  const [animo, setAnimo] = useState('');
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);

  useEffect(() => { cargarEntradas(); }, []);

  async function cargarEntradas() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setEntradas(JSON.parse(data));
    } catch {}
  }

  async function guardarEntradas(nuevas: EntradaDiario[]) {
    setEntradas(nuevas);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevas));
  }

  function abrirNueva() {
    setEditando(null);
    setAnimo('');
    setTexto('');
    setFoto(null);
    setModalVisible(true);
  }

  function abrirEditar(e: EntradaDiario) {
    setEditando(e);
    setAnimo(e.animo);
    setTexto(e.texto);
    setFoto(e.foto);
    setModalVisible(true);
  }

  async function seleccionarFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para agregar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setFoto(result.assets[0].uri);
  }

  async function guardar() {
    if (!animo) { Alert.alert('Estado de ánimo', 'Selecciona cómo se siente mamá hoy.'); return; }
    if (!texto.trim()) { Alert.alert('Texto vacío', 'Escribe algo en el diario.'); return; }

    let nuevas: EntradaDiario[];
    if (editando) {
      nuevas = entradas.map(e => e.id === editando.id
        ? { ...editando, animo, texto: texto.trim(), foto }
        : e
      );
    } else {
      const nueva: EntradaDiario = {
        id: Date.now().toString(),
        fecha: hoyStr(),
        semana: semanaActual(),
        animo,
        texto: texto.trim(),
        foto,
      };
      nuevas = [nueva, ...entradas];
    }
    await guardarEntradas(nuevas);
    setModalVisible(false);
  }

  async function eliminar(id: string) {
    Alert.alert('Eliminar entrada', '¿Seguro que quieres eliminar esta entrada del diario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await guardarEntradas(entradas.filter(e => e.id !== id));
        },
      },
    ]);
  }

  // Agrupar por semana
  const porSemana = entradas.reduce<Record<number, EntradaDiario[]>>((acc, e) => {
    if (!acc[e.semana]) acc[e.semana] = [];
    acc[e.semana].push(e);
    return acc;
  }, {});
  const semanas = Object.keys(porSemana).map(Number).sort((a, b) => b - a);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Diario de mamá</Text>
            <Text style={styles.subtitle}>Semana {semanaActual()} · {formatFecha(hoyStr())}</Text>
          </View>
          <TouchableOpacity style={styles.btnNueva} onPress={abrirNueva}>
            <Text style={styles.btnNuevaText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {entradas.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyText}>El diario está vacío.</Text>
            <Text style={styles.emptySubtext}>Toca "+ Nueva" para escribir la primera entrada.</Text>
          </View>
        )}

        {semanas.map(semana => (
          <View key={semana}>
            <View style={styles.semanaHeader}>
              <View style={styles.semanaBadge}>
                <Text style={styles.semanaBadgeText}>Semana {semana}</Text>
              </View>
              <View style={styles.semanaLine} />
            </View>

            {porSemana[semana].map(entrada => {
              const abierta = expandida === entrada.id;
              return (
                <TouchableOpacity
                  key={entrada.id}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => setExpandida(abierta ? null : entrada.id)}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardEmoji}>{entrada.animo}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardFecha}>{formatFecha(entrada.fecha)}</Text>
                      <Text style={styles.cardAnimo}>
                        {ANIMOS.find(a => a.emoji === entrada.animo)?.label ?? ''}
                      </Text>
                    </View>
                    <View style={styles.cardBtns}>
                      <TouchableOpacity onPress={() => abrirEditar(entrada)} style={styles.iconBtn}>
                        <Text style={styles.iconBtnText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => eliminar(entrada.id)} style={styles.iconBtn}>
                        <Text style={styles.iconBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.cardTexto} numberOfLines={abierta ? undefined : 2}>
                    {entrada.texto}
                  </Text>

                  {abierta && entrada.foto && (
                    <Image source={{ uri: entrada.foto }} style={styles.cardFoto} resizeMode="cover" />
                  )}

                  {!abierta && entrada.foto && (
                    <Text style={styles.fotoIndicador}>📷 Foto adjunta · toca para ver</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>

              <Text style={styles.modalTitle}>
                {editando ? 'Editar entrada' : `Semana ${semanaActual()} · ${formatFecha(hoyStr())}`}
              </Text>

              <Text style={styles.fieldLabel}>¿Cómo se siente mamá hoy? *</Text>
              <View style={styles.animosGrid}>
                {ANIMOS.map(a => (
                  <TouchableOpacity
                    key={a.emoji}
                    style={[styles.animoBtn, animo === a.emoji && styles.animoBtnSelected]}
                    onPress={() => setAnimo(a.emoji)}
                  >
                    <Text style={styles.animoEmoji}>{a.emoji}</Text>
                    <Text style={[styles.animoLabel, animo === a.emoji && styles.animoLabelSelected]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Escribe cómo fue tu día *</Text>
              <TextInput
                style={styles.inputTexto}
                placeholder="¿Cómo te sentiste hoy? ¿Algo especial que quieras recordar?"
                placeholderTextColor="#bbb"
                value={texto}
                onChangeText={setTexto}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Foto del día</Text>
              <TouchableOpacity style={styles.fotoBtn} onPress={seleccionarFoto}>
                {foto ? (
                  <Image source={{ uri: foto }} style={styles.fotoPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.fotoBtnInner}>
                    <Text style={styles.fotoBtnEmoji}>📷</Text>
                    <Text style={styles.fotoBtnText}>Agregar foto</Text>
                  </View>
                )}
              </TouchableOpacity>
              {foto && (
                <TouchableOpacity onPress={() => setFoto(null)}>
                  <Text style={styles.quitarFoto}>Quitar foto</Text>
                </TouchableOpacity>
              )}

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGuardar} onPress={guardar}>
                  <Text style={styles.btnGuardarText}>Guardar</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#C2185B' },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 2 },
  btnNueva: { backgroundColor: '#C2185B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  btnNuevaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 12, fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#bbb', marginTop: 4, textAlign: 'center' },
  semanaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  semanaBadge: { backgroundColor: '#FCE4EC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  semanaBadgeText: { fontSize: 13, fontWeight: '700', color: '#C2185B' },
  semanaLine: { flex: 1, height: 1, backgroundColor: '#FCE4EC', marginLeft: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardEmoji: { fontSize: 36, marginRight: 12 },
  cardMeta: { flex: 1 },
  cardFecha: { fontSize: 13, color: '#E91E8C', fontWeight: '600' },
  cardAnimo: { fontSize: 14, color: '#555', fontWeight: '500', marginTop: 2 },
  cardBtns: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 4 },
  iconBtnText: { fontSize: 18 },
  cardTexto: { fontSize: 14, color: '#444', lineHeight: 21 },
  cardFoto: { width: '100%', height: 180, borderRadius: 12, marginTop: 12 },
  fotoIndicador: { fontSize: 12, color: '#bbb', marginTop: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll: { justifyContent: 'flex-end', flexGrow: 1 },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#C2185B', marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 16 },
  animosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  animoBtn: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#eee', minWidth: 72 },
  animoBtnSelected: { backgroundColor: '#FCE4EC', borderColor: '#C2185B' },
  animoEmoji: { fontSize: 28 },
  animoLabel: { fontSize: 11, color: '#aaa', marginTop: 4 },
  animoLabelSelected: { color: '#C2185B', fontWeight: '700' },
  inputTexto: { backgroundColor: '#F7F7F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#222', minHeight: 120 },
  fotoBtn: { backgroundColor: '#F7F7F7', borderRadius: 12, overflow: 'hidden' },
  fotoBtnInner: { alignItems: 'center', paddingVertical: 20 },
  fotoBtnEmoji: { fontSize: 32 },
  fotoBtnText: { fontSize: 14, color: '#aaa', marginTop: 8 },
  fotoPreview: { width: '100%', height: 160 },
  quitarFoto: { fontSize: 12, color: '#E91E8C', marginTop: 6, marginLeft: 4 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  btnCancelar: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnCancelarText: { color: '#888', fontWeight: '600' },
  btnGuardar: { flex: 1, backgroundColor: '#C2185B', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
