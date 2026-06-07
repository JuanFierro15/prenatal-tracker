import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cita } from '../types';
import CalendarioCitas from '../components/CalendarioCitas';
import { ESPECIALIDAD_COLORS } from '../constants/especialidadColors';

const STORAGE_KEY = '@citas';

const ESPECIALIDADES = [
  'Ginecología', 'Obstetricia', 'Ecografía', 'Nutrición',
  'Odontología', 'Medicina general', 'Laboratorio', 'Otro',
];

const EMPTY_FORM: Omit<Cita, 'id'> = {
  fecha: '',
  hora: '',
  medico: '',
  especialidad: '',
  resultado: '',
  proximaCita: '',
};

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatFecha(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

function esFutura(dateStr: string): boolean {
  if (!dateStr) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(dateStr + 'T00:00:00');
  return fecha >= hoy;
}

type PickerTarget = 'fecha' | 'hora' | 'proximaCita';

export default function CitasScreen() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Cita | null>(null);
  const [form, setForm] = useState<Omit<Cita, 'id'>>(EMPTY_FORM);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('fecha');
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => { cargarCitas(); }, []);

  async function cargarCitas() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setCitas(JSON.parse(data));
    } catch {}
  }

  async function guardarCitas(nuevas: Cita[]) {
    setCitas(nuevas);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevas));
  }

  function abrirPicker(target: PickerTarget) {
    setPickerTarget(target);
    const mode = target === 'hora' ? 'time' : 'date';
    setPickerMode(mode);

    if (target === 'fecha' && form.fecha) {
      setPickerDate(new Date(form.fecha + 'T00:00:00'));
    } else if (target === 'proximaCita' && form.proximaCita) {
      setPickerDate(new Date(form.proximaCita + 'T00:00:00'));
    } else if (target === 'hora' && form.hora) {
      const [h, m] = form.hora.split(':');
      const d = new Date();
      d.setHours(parseInt(h), parseInt(m));
      setPickerDate(d);
    } else {
      setPickerDate(new Date());
    }
    setPickerVisible(true);
  }

  function onPickerChange(_: any, selected?: Date) {
    setPickerVisible(false);
    if (!selected) return;
    if (pickerTarget === 'fecha') setForm(f => ({ ...f, fecha: toDateStr(selected) }));
    else if (pickerTarget === 'hora') setForm(f => ({ ...f, hora: toTimeStr(selected) }));
    else if (pickerTarget === 'proximaCita') setForm(f => ({ ...f, proximaCita: toDateStr(selected) }));
  }

  function abrirNueva() {
    setEditando(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }

  function abrirEditar(cita: Cita) {
    setEditando(cita);
    setForm({ fecha: cita.fecha, hora: cita.hora, medico: cita.medico, especialidad: cita.especialidad, resultado: cita.resultado, proximaCita: cita.proximaCita });
    setModalVisible(true);
  }

  async function guardar() {
    if (!form.fecha || !form.medico || !form.especialidad) {
      Alert.alert('Campos requeridos', 'Completa la fecha, médico y especialidad.');
      return;
    }
    let nuevas: Cita[];
    if (editando) {
      nuevas = citas.map(c => c.id === editando.id ? { ...form, id: editando.id } : c);
    } else {
      const nueva: Cita = { ...form, id: Date.now().toString() };
      nuevas = [...citas, nueva];
    }
    nuevas.sort((a, b) => b.fecha.localeCompare(a.fecha));
    await guardarCitas(nuevas);
    setModalVisible(false);
  }

  async function eliminar(id: string) {
    Alert.alert('Eliminar cita', '¿Seguro que deseas eliminar esta cita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const nuevas = citas.filter(c => c.id !== id);
          await guardarCitas(nuevas);
        },
      },
    ]);
  }

  const proximas = citas.filter(c => esFutura(c.fecha));
  const pasadas  = citas.filter(c => !esFutura(c.fecha));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.topRow}>
          <Text style={styles.title}>Citas médicas</Text>
          <TouchableOpacity style={styles.btnNueva} onPress={abrirNueva}>
            <Text style={styles.btnNuevaText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {citas.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>No hay citas registradas.</Text>
            <Text style={styles.emptySubtext}>Toca "+ Nueva" para agregar una.</Text>
          </View>
        )}

        {proximas.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Próximas</Text>
            {proximas.map(c => (
              <CitaCard key={c.id} cita={c} onEdit={() => abrirEditar(c)} onDelete={() => eliminar(c.id)} futura />
            ))}
          </>
        )}

        {pasadas.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Historial</Text>
            {pasadas.map(c => (
              <CitaCard key={c.id} cita={c} onEdit={() => abrirEditar(c)} onDelete={() => eliminar(c.id)} futura={false} />
            ))}
          </>
        )}

        <Text style={styles.sectionLabel}>Calendario</Text>
        <CalendarioCitas citas={citas} />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Calendario nativo de Android */}
      {pickerVisible && (
        <DateTimePicker
          value={pickerDate}
          mode={pickerMode}
          display="default"
          onChange={onPickerChange}
          locale="es-CO"
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editando ? 'Editar cita' : 'Nueva cita'}</Text>

              <Text style={styles.fieldLabel}>Fecha *</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => abrirPicker('fecha')}>
                <Text style={styles.dateBtnIcon}>📅</Text>
                <Text style={[styles.dateBtnText, !form.fecha && styles.dateBtnPlaceholder]}>
                  {form.fecha ? formatFecha(form.fecha) : 'Seleccionar fecha'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Hora</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => abrirPicker('hora')}>
                <Text style={styles.dateBtnIcon}>🕐</Text>
                <Text style={[styles.dateBtnText, !form.hora && styles.dateBtnPlaceholder]}>
                  {form.hora || 'Seleccionar hora'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Médico *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del médico"
                placeholderTextColor="#bbb"
                value={form.medico}
                onChangeText={v => setForm(f => ({ ...f, medico: v }))}
              />

              <Text style={styles.fieldLabel}>Especialidad *</Text>
              <View style={styles.chips}>
                {ESPECIALIDADES.map(e => {
                  const color = ESPECIALIDAD_COLORS[e] ?? '#9E9E9E';
                  const selected = form.especialidad === e;
                  return (
                    <TouchableOpacity
                      key={e}
                      style={[styles.chip, { borderColor: color }, selected && { backgroundColor: color }]}
                      onPress={() => setForm(f => ({ ...f, especialidad: e }))}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{e}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Resultado / Notas</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="¿Qué dijo el médico?"
                placeholderTextColor="#bbb"
                value={form.resultado}
                onChangeText={v => setForm(f => ({ ...f, resultado: v }))}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Próxima cita</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => abrirPicker('proximaCita')}>
                <Text style={styles.dateBtnIcon}>📅</Text>
                <Text style={[styles.dateBtnText, !form.proximaCita && styles.dateBtnPlaceholder]}>
                  {form.proximaCita ? formatFecha(form.proximaCita) : 'Seleccionar fecha (opcional)'}
                </Text>
              </TouchableOpacity>
              {!!form.proximaCita && (
                <TouchableOpacity onPress={() => setForm(f => ({ ...f, proximaCita: '' }))}>
                  <Text style={styles.clearDate}>Quitar fecha</Text>
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

function CitaCard({ cita, onEdit, onDelete, futura }: { cita: Cita; onEdit: () => void; onDelete: () => void; futura: boolean }) {
  return (
    <View style={[styles.card, futura && styles.cardFutura]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardFecha}>{formatFecha(cita.fecha)}{cita.hora ? `  ·  ${cita.hora}` : ''}</Text>
          <Text style={styles.cardMedico}>{cita.medico}</Text>
          <Text style={styles.cardEsp}>{cita.especialidad}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!!cita.resultado && (
        <Text style={styles.cardResultado} numberOfLines={2}>{cita.resultado}</Text>
      )}
      {!!cita.proximaCita && (
        <Text style={styles.cardProxima}>Próxima cita: {formatFecha(cita.proximaCita)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#C2185B' },
  btnNueva: { backgroundColor: '#C2185B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  btnNuevaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 12, fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#bbb', marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardFutura: { borderLeftWidth: 4, borderLeftColor: '#C2185B' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardFecha: { fontSize: 13, color: '#E91E8C', fontWeight: '600' },
  cardMedico: { fontSize: 16, fontWeight: '700', color: '#222', marginTop: 2 },
  cardEsp: { fontSize: 13, color: '#888', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 4 },
  iconBtnText: { fontSize: 18 },
  cardResultado: { fontSize: 13, color: '#555', marginTop: 10, lineHeight: 18 },
  cardProxima: { fontSize: 12, color: '#C2185B', marginTop: 8, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalScroll: { justifyContent: 'flex-end', flexGrow: 1 },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#C2185B', marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F7F7F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#222' },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  dateBtn: { backgroundColor: '#F7F7F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBtnIcon: { fontSize: 18 },
  dateBtnText: { fontSize: 15, color: '#222', fontWeight: '500' },
  dateBtnPlaceholder: { color: '#bbb', fontWeight: '400' },
  clearDate: { fontSize: 12, color: '#E91E8C', marginTop: 6, marginLeft: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipSelected: { backgroundColor: '#C2185B', borderColor: '#C2185B' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  btnCancelar: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnCancelarText: { color: '#888', fontWeight: '600' },
  btnGuardar: { flex: 1, backgroundColor: '#C2185B', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
