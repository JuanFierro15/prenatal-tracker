import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContactoEmergencia, DatosMedicos } from '../types';

const KEY_JUAN      = '@emergencia_juan_tel';
const KEY_CONTACTOS = '@emergencia_contactos';
const KEY_DATOS     = '@emergencia_datos';

const PREGNANCY_START = new Date(2026, 2, 29);

function semanaActual(): number {
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - PREGNANCY_START.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(dias / 7);
}

const DATOS_DEFAULT: DatosMedicos = {
  tipoSangre: '',
  medico: '',
  clinica: '',
  direccionClinica: '',
  alergias: '',
  notas: '',
};

const SENALES_ALARMA = [
  'Sangrado vaginal abundante',
  'Dolor abdominal severo o agudo',
  'No sientes movimientos del bebé (semana 28+)',
  'Contracciones regulares antes de la semana 37',
  'Fiebre mayor a 38.5 °C',
  'Visión borrosa o destellos de luz',
  'Hinchazón severa de cara o manos',
  'Pérdida de líquido amniótico',
  'Dolor de cabeza intenso que no cede',
  'Dificultad severa para respirar',
];

function llamar(telefono: string, nombre: string) {
  if (!telefono.trim()) {
    Alert.alert('Sin número', `Agrega el teléfono de ${nombre} tocando el ícono ✏️.`);
    return;
  }
  Linking.openURL(`tel:${telefono.trim()}`);
}

function abrirMaps(direccion: string) {
  if (!direccion.trim()) return;
  Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(direccion)}`);
}

export default function EmergenciaScreen() {
  const [juanTel, setJuanTel] = useState('');
  const [contactos, setContactos] = useState<ContactoEmergencia[]>([]);
  const [datos, setDatos] = useState<DatosMedicos>(DATOS_DEFAULT);

  // Edit states
  const [editandoJuan, setEditandoJuan] = useState(false);
  const [tempJuanTel, setTempJuanTel] = useState('');
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [tempDatos, setTempDatos] = useState<DatosMedicos>(DATOS_DEFAULT);
  const [agregandoContacto, setAgregandoContacto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRelacion, setNuevoRelacion] = useState('');
  const [nuevoTel, setNuevoTel] = useState('');
  const [señalesAbiertas, setSeñalesAbiertas] = useState(false);

  const semana = semanaActual();

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      const [jt, ct, dt] = await Promise.all([
        AsyncStorage.getItem(KEY_JUAN),
        AsyncStorage.getItem(KEY_CONTACTOS),
        AsyncStorage.getItem(KEY_DATOS),
      ]);
      if (jt) setJuanTel(jt);
      if (ct) setContactos(JSON.parse(ct));
      if (dt) setDatos(JSON.parse(dt));
    } catch {}
  }

  // ── Juan ────────────────────────────────────────────────────────────

  function abrirEditJuan() {
    setTempJuanTel(juanTel);
    setEditandoJuan(true);
  }

  async function guardarJuan() {
    setJuanTel(tempJuanTel);
    await AsyncStorage.setItem(KEY_JUAN, tempJuanTel);
    setEditandoJuan(false);
  }

  // ── Contactos ────────────────────────────────────────────────────────

  async function agregarContacto() {
    if (!nuevoNombre.trim() || !nuevoTel.trim()) return;
    const nuevo: ContactoEmergencia = {
      id: String(Date.now()),
      nombre: nuevoNombre.trim(),
      relacion: nuevoRelacion.trim(),
      telefono: nuevoTel.trim(),
    };
    const actualizados = [...contactos, nuevo];
    setContactos(actualizados);
    await AsyncStorage.setItem(KEY_CONTACTOS, JSON.stringify(actualizados));
    setNuevoNombre(''); setNuevoRelacion(''); setNuevoTel('');
    setAgregandoContacto(false);
  }

  async function eliminarContacto(id: string) {
    Alert.alert('Eliminar contacto', '¿Seguro que quieres eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const actualizados = contactos.filter(c => c.id !== id);
          setContactos(actualizados);
          await AsyncStorage.setItem(KEY_CONTACTOS, JSON.stringify(actualizados));
        },
      },
    ]);
  }

  // ── Datos médicos ─────────────────────────────────────────────────────

  function abrirEditDatos() {
    setTempDatos({ ...datos });
    setEditandoDatos(true);
  }

  async function guardarDatos() {
    setDatos(tempDatos);
    await AsyncStorage.setItem(KEY_DATOS, JSON.stringify(tempDatos));
    setEditandoDatos(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={styles.title}>🚨 Emergencias</Text>
          <Text style={styles.subtitle}>Semana {semana} · Acceso rápido</Text>

          {/* ── Botón principal Juan ── */}
          <View style={styles.jaunCard}>
            <Text style={styles.juanLabel}>Llamar a</Text>
            <Text style={styles.juanNombre}>Esposo ❤️</Text>
            {!editandoJuan ? (
              <>
                <TouchableOpacity
                  style={styles.btnLlamarJuan}
                  onPress={() => llamar(juanTel, 'Esposo')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnLlamarIcon}>📞</Text>
                  <Text style={styles.btnLlamarText}>
                    {juanTel.trim() ? juanTel : 'Toca para llamar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnEditarTel} onPress={abrirEditJuan}>
                  <Text style={styles.btnEditarTelText}>✏️ {juanTel ? 'Cambiar número' : 'Agregar número'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.editInline}>
                <TextInput
                  style={styles.inputBlanco}
                  placeholder="Número de teléfono"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={tempJuanTel}
                  onChangeText={setTempJuanTel}
                  keyboardType="phone-pad"
                  autoFocus
                />
                <View style={styles.editBtns}>
                  <TouchableOpacity style={styles.btnEditCancelar} onPress={() => setEditandoJuan(false)}>
                    <Text style={styles.btnEditCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnEditGuardar} onPress={guardarJuan}>
                    <Text style={styles.btnEditGuardarText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ── Señales de alarma ── */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setSeñalesAbiertas(v => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionEmoji}>⚠️</Text>
              <Text style={styles.sectionTitulo}>Señales de alarma</Text>
            </View>
            <Text style={styles.chevron}>{señalesAbiertas ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {señalesAbiertas && (
            <View style={styles.señalesCard}>
              {SENALES_ALARMA.map((s, i) => (
                <View key={i} style={styles.señalaRow}>
                  <Text style={styles.señalaDot}>🔴</Text>
                  <Text style={styles.señalaTexto}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Contactos de emergencia ── */}
          <Text style={styles.sectionTituloPlano}>📋 Contactos de emergencia</Text>

          {contactos.map(c => (
            <View key={c.id} style={styles.contactoCard}>
              <View style={styles.contactoInfo}>
                <Text style={styles.contactoNombre}>{c.nombre}</Text>
                {c.relacion ? <Text style={styles.contactoRelacion}>{c.relacion}</Text> : null}
                <Text style={styles.contactoTel}>{c.telefono}</Text>
              </View>
              <View style={styles.contactoBtns}>
                <TouchableOpacity
                  style={styles.btnLlamarSmall}
                  onPress={() => llamar(c.telefono, c.nombre)}
                >
                  <Text style={styles.btnLlamarSmallText}>📞 Llamar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => eliminarContacto(c.id)} style={styles.btnEliminar}>
                  <Text>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {agregandoContacto ? (
            <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#bbb"
                value={nuevoNombre} onChangeText={setNuevoNombre} />
              <TextInput style={styles.input} placeholder="Relación (ej: mamá, hermana)"
                placeholderTextColor="#bbb" value={nuevoRelacion} onChangeText={setNuevoRelacion} />
              <TextInput style={[styles.input, { marginBottom: 16 }]} placeholder="Teléfono"
                placeholderTextColor="#bbb" value={nuevoTel} onChangeText={setNuevoTel}
                keyboardType="phone-pad" />
              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setAgregandoContacto(false)}>
                  <Text style={styles.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnAgregar, (!nuevoNombre.trim() || !nuevoTel.trim()) && styles.btnAgregarDisabled]}
                  onPress={agregarContacto}
                  disabled={!nuevoNombre.trim() || !nuevoTel.trim()}
                >
                  <Text style={styles.btnAgregarText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.btnNuevo} onPress={() => setAgregandoContacto(true)}>
              <Text style={styles.btnNuevoText}>＋  Agregar contacto</Text>
            </TouchableOpacity>
          )}

          {/* ── Datos médicos ── */}
          <View style={styles.datosTituloRow}>
            <Text style={styles.sectionTituloPlano}>🏥 Datos médicos</Text>
            {!editandoDatos && (
              <TouchableOpacity onPress={abrirEditDatos}>
                <Text style={styles.btnEditarTexto}>✏️ Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {editandoDatos ? (
            <View style={styles.formCard}>
              {([
                { key: 'tipoSangre',       label: 'Tipo de sangre',       kb: 'default' },
                { key: 'medico',            label: 'Nombre del médico',    kb: 'default' },
                { key: 'clinica',           label: 'Clínica / Hospital',   kb: 'default' },
                { key: 'direccionClinica',  label: 'Dirección',            kb: 'default' },
                { key: 'alergias',          label: 'Alergias conocidas',   kb: 'default' },
                { key: 'notas',             label: 'Notas adicionales',    kb: 'default' },
              ] as { key: keyof DatosMedicos; label: string; kb: any }[]).map(({ key, label, kb }) => (
                <TextInput
                  key={key}
                  style={styles.input}
                  placeholder={label}
                  placeholderTextColor="#bbb"
                  value={tempDatos[key]}
                  onChangeText={v => setTempDatos(prev => ({ ...prev, [key]: v }))}
                  keyboardType={kb}
                />
              ))}
              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setEditandoDatos(false)}>
                  <Text style={styles.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAgregar} onPress={guardarDatos}>
                  <Text style={styles.btnAgregarText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.datosCard}>
              {[
                { label: '🩸 Tipo de sangre',   value: datos.tipoSangre },
                { label: '🤰 Semana actual',    value: `Semana ${semana}` },
                { label: '👩‍⚕️ Médico',          value: datos.medico },
                { label: '🏥 Clínica',           value: datos.clinica },
                { label: '💊 Alergias',          value: datos.alergias },
                { label: '📝 Notas',             value: datos.notas },
              ].map(({ label, value }) =>
                value ? (
                  <View key={label} style={styles.datoRow}>
                    <Text style={styles.datoLabel}>{label}</Text>
                    <Text style={styles.datoValor}>{value}</Text>
                  </View>
                ) : null
              )}
              {!datos.tipoSangre && !datos.medico && !datos.clinica && (
                <Text style={styles.datosVacio}>Toca "Editar" para completar tu información médica.</Text>
              )}

              {/* Dirección con botón Maps */}
              {datos.direccionClinica ? (
                <TouchableOpacity
                  style={styles.btnMaps}
                  onPress={() => abrirMaps(datos.direccionClinica)}
                >
                  <Text style={styles.btnMapsText}>🗺️  Abrir en Google Maps</Text>
                  <Text style={styles.btnMapsDireccion}>{datos.direccionClinica}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F5' },
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#B71C1C', paddingTop: 24 },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 4, marginBottom: 20 },

  // Juan card
  jaunCard: {
    backgroundColor: '#B71C1C', borderRadius: 24, padding: 24,
    alignItems: 'center', marginBottom: 20,
    elevation: 6, shadowColor: '#B71C1C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14,
  },
  juanLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  juanNombre: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 4, marginBottom: 18 },
  btnLlamarJuan: {
    backgroundColor: '#fff', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 36,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6,
  },
  btnLlamarIcon: { fontSize: 22 },
  btnLlamarText: { fontSize: 18, fontWeight: '800', color: '#B71C1C' },
  btnEditarTel: { marginTop: 14 },
  btnEditarTelText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecorationLine: 'underline' },
  editInline: { width: '100%', gap: 10 },
  inputBlanco: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, color: '#fff', textAlign: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  editBtns: { flexDirection: 'row', gap: 10 },
  btnEditCancelar: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
  },
  btnEditCancelarText: { color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  btnEditGuardar: {
    flex: 2, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center',
  },
  btnEditGuardarText: { color: '#B71C1C', fontWeight: '800' },

  // Señales de alarma
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionEmoji: { fontSize: 22 },
  sectionTitulo: { fontSize: 16, fontWeight: '700', color: '#333' },
  chevron: { fontSize: 12, color: '#aaa' },
  señalesCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  señalaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#FFF5F5' },
  señalaDot: { fontSize: 12, marginTop: 2 },
  señalaTexto: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },

  // Contactos
  sectionTituloPlano: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 4 },
  contactoCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  contactoInfo: { flex: 1 },
  contactoNombre: { fontSize: 15, fontWeight: '700', color: '#222' },
  contactoRelacion: { fontSize: 12, color: '#aaa', marginTop: 1 },
  contactoTel: { fontSize: 13, color: '#C2185B', marginTop: 3, fontWeight: '600' },
  contactoBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnLlamarSmall: {
    backgroundColor: '#B71C1C', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14,
  },
  btnLlamarSmallText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnEliminar: { padding: 4 },

  // Formulario agregar contacto
  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  input: {
    backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: '#333',
    borderWidth: 1.5, borderColor: '#eee', marginBottom: 10,
  },
  formBtns: { flexDirection: 'row', gap: 10 },
  btnCancelar: { flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: '#f5f5f5', alignItems: 'center' },
  btnCancelarText: { fontSize: 14, color: '#888', fontWeight: '700' },
  btnAgregar: {
    flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: '#B71C1C', alignItems: 'center',
    elevation: 2, shadowColor: '#B71C1C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  btnAgregarDisabled: { backgroundColor: '#ddd', elevation: 0, shadowOpacity: 0 },
  btnAgregarText: { fontSize: 14, color: '#fff', fontWeight: '800' },

  btnNuevo: {
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: '#FFCDD2', borderStyle: 'dashed',
  },
  btnNuevoText: { fontSize: 15, color: '#B71C1C', fontWeight: '700' },

  // Datos médicos
  datosTituloRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  btnEditarTexto: { fontSize: 13, color: '#C2185B', fontWeight: '600' },
  datosCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  datoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FFF5F5' },
  datoLabel: { fontSize: 13, color: '#888', flex: 1 },
  datoValor: { fontSize: 14, fontWeight: '700', color: '#333', flex: 1.5, textAlign: 'right' },
  datosVacio: { fontSize: 13, color: '#bbb', textAlign: 'center', paddingVertical: 12 },
  btnMaps: {
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, marginTop: 12,
    borderWidth: 1.5, borderColor: '#4CAF50',
  },
  btnMapsText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  btnMapsDireccion: { fontSize: 12, color: '#555', marginTop: 4 },
});
