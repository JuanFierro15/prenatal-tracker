import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { DocumentoPDF } from '../types';

const KEY = '@documentos_pdf';
const PREGNANCY_START = new Date(2026, 2, 29);

const CATEGORIAS = [
  { id: 'todos',      label: 'Todos',      emoji: '📁' },
  { id: 'controles',  label: 'Controles',  emoji: '📋' },
  { id: 'ecografias', label: 'Ecografías', emoji: '🩻' },
  { id: 'examenes',   label: 'Exámenes',   emoji: '🔬' },
  { id: 'recetas',    label: 'Recetas',    emoji: '💊' },
  { id: 'otros',      label: 'Otros',      emoji: '📄' },
];

function semanaActual(): number {
  const dias = Math.floor((Date.now() - PREGNANCY_START.getTime()) / 86400000);
  return Math.floor(dias / 7);
}

function hoyStr(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

function formatFecha(s: string): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

export default function DocumentosScreen() {
  const [documentos, setDocumentos] = useState<DocumentoPDF[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [modalVisible, setModalVisible] = useState(false);

  // Campos del formulario
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState('controles');
  const [formUri, setFormUri] = useState('');
  const [formArchivo, setFormArchivo] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    const data = await AsyncStorage.getItem(KEY);
    if (data) setDocumentos(JSON.parse(data));
  }

  async function guardar(docs: DocumentoPDF[]) {
    setDocumentos(docs);
    await AsyncStorage.setItem(KEY, JSON.stringify(docs));
  }

  // ── Seleccionar PDF ──────────────────────────────────────────────────────────

  async function seleccionarPDF() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const ext = asset.name.split('.').pop() ?? 'pdf';
      const permanentUri = `${FileSystem.documentDirectory}doc_${Date.now()}.${ext}`;
      await FileSystem.copyAsync({ from: asset.uri, to: permanentUri });

      setFormUri(permanentUri);
      setFormArchivo(asset.name);
      if (!formNombre) setFormNombre(asset.name.replace(/\.pdf$/i, ''));
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el archivo.');
    }
  }

  // ── Guardar documento ────────────────────────────────────────────────────────

  async function guardarDocumento() {
    if (!formUri || !formNombre.trim()) return;
    setCargando(true);
    const nuevo: DocumentoPDF = {
      id: String(Date.now()),
      nombre: formNombre.trim(),
      archivo: formArchivo,
      uri: formUri,
      categoria: formCategoria,
      fecha: hoyStr(),
      semana: semanaActual(),
    };
    await guardar([nuevo, ...documentos]);
    cerrarModal();
    setCargando(false);
  }

  function abrirModal() {
    setFormNombre('');
    setFormCategoria('controles');
    setFormUri('');
    setFormArchivo('');
    setModalVisible(true);
  }

  function cerrarModal() {
    setModalVisible(false);
    setFormNombre('');
    setFormUri('');
    setFormArchivo('');
  }

  // ── Abrir PDF ────────────────────────────────────────────────────────────────

  async function abrirPDF(doc: DocumentoPDF) {
    try {
      const info = await FileSystem.getInfoAsync(doc.uri);
      if (!info.exists) {
        Alert.alert('Archivo no encontrado', 'El archivo fue eliminado del teléfono.');
        return;
      }
      await Sharing.shareAsync(doc.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: doc.nombre,
      });
    } catch {
      Alert.alert('Error', 'No se pudo abrir el archivo.');
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────

  async function eliminar(doc: DocumentoPDF) {
    Alert.alert('Eliminar documento', `¿Eliminar "${doc.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            const info = await FileSystem.getInfoAsync(doc.uri);
            if (info.exists) await FileSystem.deleteAsync(doc.uri, { idempotent: true });
          } catch {}
          await guardar(documentos.filter(d => d.id !== doc.id));
        },
      },
    ]);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const docsFiltrados = categoriaActiva === 'todos'
    ? documentos
    : documentos.filter(d => d.categoria === categoriaActiva);

  const catInfo = (id: string) => CATEGORIAS.find(c => c.id === id) ?? CATEGORIAS[5];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.topRow}>
          <Text style={styles.title}>Documentos médicos</Text>
          <TouchableOpacity style={styles.btnNuevo} onPress={abrirModal}>
            <Text style={styles.btnNuevoText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Filtro de categorías */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasScroll}
        >
          {CATEGORIAS.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, categoriaActiva === cat.id && styles.catChipActivo]}
              onPress={() => setCategoriaActiva(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, categoriaActiva === cat.id && styles.catLabelActivo]}>
                {cat.label}
              </Text>
              {cat.id !== 'todos' && (
                <Text style={[styles.catCount, categoriaActiva === cat.id && { color: '#fff' }]}>
                  {documentos.filter(d => d.categoria === cat.id).length}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de documentos */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {docsFiltrados.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📂</Text>
              <Text style={styles.emptyText}>No hay documentos aquí.</Text>
              <Text style={styles.emptySub}>Toca "+ Agregar" para subir un PDF.</Text>
            </View>
          ) : (
            <View style={styles.lista}>
              {docsFiltrados.map(doc => {
                const cat = catInfo(doc.categoria);
                return (
                  <View key={doc.id} style={styles.card}>
                    <View style={styles.cardIconCol}>
                      <Text style={styles.cardEmoji}>{cat.emoji}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardNombre} numberOfLines={2}>{doc.nombre}</Text>
                      <Text style={styles.cardMeta}>
                        {cat.label}  ·  Sem. {doc.semana}  ·  {formatFecha(doc.fecha)}
                      </Text>
                      <Text style={styles.cardArchivo} numberOfLines={1}>{doc.archivo}</Text>
                    </View>
                    <View style={styles.cardAcciones}>
                      <TouchableOpacity style={styles.btnAbrir} onPress={() => abrirPDF(doc)}>
                        <Text style={styles.btnAbrirText}>Abrir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnEliminar} onPress={() => eliminar(doc)}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>

      {/* ── Modal: agregar documento ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nuevo documento</Text>

            {/* Selector de PDF */}
            <TouchableOpacity
              style={[styles.pdfPicker, formUri && styles.pdfPickerOk]}
              onPress={seleccionarPDF}
              activeOpacity={0.8}
            >
              {formUri ? (
                <>
                  <Text style={styles.pdfPickerEmoji}>✅</Text>
                  <Text style={styles.pdfPickerNombre} numberOfLines={2}>{formArchivo}</Text>
                  <Text style={styles.pdfPickerCambiar}>Cambiar</Text>
                </>
              ) : (
                <>
                  <Text style={styles.pdfPickerEmoji}>📎</Text>
                  <Text style={styles.pdfPickerText}>Seleccionar archivo PDF</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Nombre del documento */}
            <Text style={styles.fieldLabel}>Nombre del documento</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Eco semana 12"
              placeholderTextColor="#bbb"
              value={formNombre}
              onChangeText={setFormNombre}
            />

            {/* Categoría */}
            <Text style={styles.fieldLabel}>Categoría</Text>
            <View style={styles.catGrid}>
              {CATEGORIAS.filter(c => c.id !== 'todos').map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catOption, formCategoria === cat.id && styles.catOptionActiva]}
                  onPress={() => setFormCategoria(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.catOptionEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catOptionLabel, formCategoria === cat.id && { color: '#C2185B', fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botones */}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancelar} onPress={cerrarModal}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnGuardar, (!formUri || !formNombre.trim() || cargando) && styles.btnGuardarDisabled]}
                onPress={guardarDocumento}
                disabled={!formUri || !formNombre.trim() || cargando}
              >
                <Text style={styles.btnGuardarText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#C2185B' },
  btnNuevo: { backgroundColor: '#C2185B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  btnNuevoText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Categorías
  categoriasScroll: { gap: 8, paddingBottom: 16, paddingRight: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#f0f0f0',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  catChipActivo: { backgroundColor: '#C2185B', borderColor: '#C2185B' },
  catEmoji: { fontSize: 15 },
  catLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  catLabelActivo: { color: '#fff' },
  catCount: { fontSize: 11, fontWeight: '700', color: '#bbb', marginLeft: 2 },

  // Lista
  lista: { gap: 10, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888' },
  emptySub: { fontSize: 13, color: '#bbb', marginTop: 4 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardIconCol: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF5F7',
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 3 },
  cardMeta: { fontSize: 11, color: '#C2185B', fontWeight: '600', marginBottom: 2 },
  cardArchivo: { fontSize: 11, color: '#bbb' },
  cardAcciones: { alignItems: 'center', gap: 6 },
  btnAbrir: { backgroundColor: '#C2185B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  btnAbrirText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  btnEliminar: { padding: 4 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#C2185B', marginBottom: 16 },

  pdfPicker: {
    borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', borderRadius: 14,
    padding: 20, alignItems: 'center', gap: 8, marginBottom: 16, backgroundColor: '#fafafa',
  },
  pdfPickerOk: { borderColor: '#C2185B', borderStyle: 'solid', backgroundColor: '#FFF5F7' },
  pdfPickerEmoji: { fontSize: 28 },
  pdfPickerText: { fontSize: 14, color: '#bbb', fontWeight: '600' },
  pdfPickerNombre: { fontSize: 13, color: '#333', fontWeight: '600', textAlign: 'center' },
  pdfPickerCambiar: { fontSize: 11, color: '#C2185B', fontWeight: '600' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: {
    backgroundColor: '#F7F7F7', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: '#222', marginBottom: 16,
  },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#eee', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fafafa',
  },
  catOptionActiva: { borderColor: '#C2185B', backgroundColor: '#FFF0F5' },
  catOptionEmoji: { fontSize: 16 },
  catOptionLabel: { fontSize: 13, color: '#666' },

  modalBtns: { flexDirection: 'row', gap: 12 },
  btnCancelar: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnCancelarText: { color: '#888', fontWeight: '600' },
  btnGuardar: { flex: 1, backgroundColor: '#C2185B', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnGuardarDisabled: { backgroundColor: '#ddd' },
  btnGuardarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
