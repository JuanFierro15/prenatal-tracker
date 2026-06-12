import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportarBackup, importarBackup } from '../utils/backup';

type Estado = 'idle' | 'exportando' | 'importando';

export default function BackupScreen() {
  const [estado, setEstado] = useState<Estado>('idle');

  async function handleExportar() {
    setEstado('exportando');
    const { ok, mensaje } = await exportarBackup();
    setEstado('idle');
    if (!ok) Alert.alert('Error', mensaje);
  }

  async function handleImportar() {
    Alert.alert(
      'Restaurar backup',
      'Esto reemplazará todos los datos actuales con los del archivo seleccionado. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: async () => {
            setEstado('importando');
            const { ok, mensaje } = await importarBackup();
            setEstado('idle');
            Alert.alert(ok ? '✅ Listo' : 'Error', mensaje);
          },
        },
      ],
    );
  }

  const cargando = estado !== 'idle';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <Text style={styles.title}>Copia de seguridad</Text>
        <Text style={styles.subtitle}>
          Exporta tus datos a un archivo JSON y guárdalos donde prefieras:
          Google Drive, WhatsApp, correo, etc. Para restaurar, selecciona el archivo desde el teléfono.
        </Text>

        {/* Exportar */}
        <View style={styles.card}>
          <Text style={styles.cardEmoji}>📤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Exportar backup</Text>
            <Text style={styles.cardSub}>
              Crea un archivo con toda tu información y compártelo donde quieras.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, cargando && styles.btnDisabled]}
            onPress={handleExportar}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {estado === 'exportando'
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Exportar</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Importar */}
        <View style={styles.card}>
          <Text style={styles.cardEmoji}>📥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Importar backup</Text>
            <Text style={styles.cardSub}>
              Selecciona un archivo de backup para restaurar tus datos.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, styles.btnImportar, cargando && styles.btnDisabled]}
            onPress={handleImportar}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {estado === 'importando'
              ? <ActivityIndicator color="#C2185B" size="small" />
              : <Text style={[styles.btnText, { color: '#C2185B' }]}>Importar</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 ¿Cómo hacer un backup a Google Drive?</Text>
          <Text style={styles.infoStep}>1. Toca <Text style={styles.bold}>Exportar</Text></Text>
          <Text style={styles.infoStep}>2. En el menú de compartir elige <Text style={styles.bold}>Guardar en Drive</Text></Text>
          <Text style={styles.infoStep}>3. Selecciona la carpeta y toca <Text style={styles.bold}>Guardar</Text></Text>
          <Text style={styles.infoSep}>Para restaurar en otro teléfono:</Text>
          <Text style={styles.infoStep}>1. Descarga el archivo desde Drive</Text>
          <Text style={styles.infoStep}>2. Toca <Text style={styles.bold}>Importar</Text> y selecciónalo</Text>
          <Text style={styles.infoStep}>3. Cierra y vuelve a abrir la app</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#C2185B', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', lineHeight: 22, marginBottom: 24 },

  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#888', lineHeight: 18 },

  btn: {
    backgroundColor: '#C2185B', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10, minWidth: 84, alignItems: 'center',
  },
  btnImportar: {
    backgroundColor: '#FCE4EC',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  infoBox: {
    backgroundColor: '#F3E5F5', borderRadius: 16, padding: 16, marginTop: 8,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#7B1FA2', marginBottom: 12 },
  infoStep: { fontSize: 13, color: '#555', marginBottom: 6, lineHeight: 20 },
  infoSep: { fontSize: 13, fontWeight: '700', color: '#7B1FA2', marginTop: 8, marginBottom: 6 },
  bold: { fontWeight: '700', color: '#333' },
});
