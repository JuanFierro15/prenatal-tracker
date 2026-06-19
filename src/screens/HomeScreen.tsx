import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DESARROLLO_POR_SEMANA } from '../constants/desarrolloData';
import { ConfigEmbarazo } from '../types';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const DESTACADAS = [
  { icon: '📅', label: 'Citas médicas', color: '#E8F4FD', tab: 'Citas' },
  { icon: '📖', label: 'Diario',        color: '#FEF3E2', tab: 'Diario' },
  { icon: '🦵', label: 'Patadas',       color: '#FDF2F8', tab: 'Patadas' },
  { icon: '👶', label: 'Desarrollo',    color: '#F0FDF4', tab: 'Desarrollo' },
];

const SECCIONES = [
  {
    titulo: 'Seguimiento',
    items: [
      { icon: '⚖️', label: 'Peso',          color: '#F3E5F5', tab: 'Peso' },
      { icon: '📊', label: 'Síntomas',      color: '#FFF7ED', tab: 'Síntomas' },
      { icon: '⏱️', label: 'Contracciones', color: '#FFF1F2', tab: 'Contracciones' },
      { icon: '✅', label: 'Checklist',     color: '#F7F7FF', tab: 'Checklist' },
    ],
  },
  {
    titulo: 'Mis registros',
    items: [
      { icon: '📷', label: 'Fotos',       color: '#F0F9FF', tab: 'Fotos' },
      { icon: '💝', label: 'Nombres',     color: '#FDF4FF', tab: 'Nombres' },
      { icon: '🗂️', label: 'Documentos', color: '#E3F2FD', tab: 'Documentos' },
    ],
  },
  {
    titulo: 'Herramientas',
    items: [
      { icon: '🚨', label: 'Emergencia', color: '#FFF5F5', tab: 'Emergencia' },
      { icon: '💾', label: 'Backup',     color: '#E8F5E9', tab: 'Backup' },
    ],
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [config, setConfig] = useState<ConfigEmbarazo | null>(null);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('@config_embarazo').then(val => {
      if (val) setConfig(JSON.parse(val));
    });
  }, []));

  const today = new Date();
  const pregnancyStart = config ? new Date(config.fechaInicio) : new Date();
  const diffDays = Math.floor((today.getTime() - pregnancyStart.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.max(0, Math.floor(diffDays / 7));
  const dueDate = new Date(pregnancyStart.getTime() + 280 * 86400000);
  const earlyDate = new Date(pregnancyStart.getTime() + 258 * 86400000); // 37 semanas
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const weeksLeft = Math.max(0, 40 - currentWeek);

  const dueDateStr = `${dueDate.getDate()} ${MESES[dueDate.getMonth()]} ${dueDate.getFullYear()}`;
  const earlyDateStr = `${earlyDate.getDate()} ${MESES[earlyDate.getMonth()]} ${earlyDate.getFullYear()}`;

  const appTitle = config?.nombreBebe || 'Mi Bebé';
  const appSubtitle = config
    ? config.nombrePapa
      ? `Hola ${config.nombreMama} y ${config.nombrePapa} 💕`
      : `Hola ${config.nombreMama} 💕`
    : 'El camino de ser buenos padres 💕';

  const fruitInfo = DESARROLLO_POR_SEMANA[currentWeek] ?? { fruta: 'bebé creciendo', frutaEmoji: '🌱', articulo: 'un' };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.ajustesBtn} onPress={() => navigation.navigate('Ajustes')}>
            <Text style={styles.ajustesBtnText}>⚙️</Text>
          </TouchableOpacity>
          <Text style={styles.appName}>{appTitle}</Text>
          <Text style={styles.subtitle}>{appSubtitle}</Text>
        </View>

        {/* Tarjeta de semana */}
        <View style={styles.weekCard}>
          <View style={styles.weekCardLeft}>
            <Text style={styles.weekLabel}>Semana</Text>
            <Text style={styles.weekNumber}>{currentWeek}</Text>
            <Text style={styles.weekSub}>de 40 semanas</Text>
            <View style={styles.pillContainer}>
              <Text style={styles.pill}>{weeksLeft} semanas restantes</Text>
            </View>
          </View>
          <View style={styles.weekCardRight}>
            <Text style={styles.fruitEmoji}>{fruitInfo.frutaEmoji}</Text>
            <Text style={styles.fruitLabel}>Tu bebé mide como</Text>
            <Text style={styles.fruitName}>{fruitInfo.articulo} {fruitInfo.fruta}</Text>
          </View>
        </View>

        {/* Fecha probable */}
        <View style={styles.dueDateCard}>
          <Text style={styles.dueDateLabel}>📆  Fecha probable de parto</Text>
          <Text style={styles.dueDateRange}>{earlyDateStr} – {dueDateStr}</Text>
          <Text style={styles.dueDateSub}>
            {daysUntilDue > 0 ? `Faltan aproximadamente ${daysUntilDue} días` : '¡El bebé ya llegó! 🎉'}
          </Text>
        </View>

        {/* Accesos destacados */}
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.gridDestacadas}>
          {DESTACADAS.map((f) => (
            <TouchableOpacity
              key={f.label}
              style={[styles.cardDestacada, { backgroundColor: f.color }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(f.tab)}
            >
              <Text style={styles.iconDestacada}>{f.icon}</Text>
              <Text style={styles.labelDestacada}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Secciones secundarias */}
        {SECCIONES.map((sec) => (
          <View key={sec.titulo} style={styles.seccionBloque}>
            <View style={styles.seccionHeader}>
              <View style={styles.seccionLinea} />
              <Text style={styles.seccionTitulo}>{sec.titulo}</Text>
              <View style={styles.seccionLinea} />
            </View>
            <View style={styles.gridSecundario}>
              {sec.items.map((f) => (
                <TouchableOpacity
                  key={f.label}
                  style={[styles.cardSecundaria, { backgroundColor: f.color }]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(f.tab)}
                >
                  <Text style={styles.iconSecundaria}>{f.icon}</Text>
                  <Text style={styles.labelSecundaria}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },

  header: { paddingTop: 24, paddingBottom: 20, alignItems: 'center' },
  ajustesBtn: { position: 'absolute', top: 24, right: 0, padding: 6 },
  ajustesBtnText: { fontSize: 22 },
  appName: { fontSize: 30, fontWeight: '800', color: '#C2185B', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#999', marginTop: 4 },

  weekCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 22, flexDirection: 'row',
    shadowColor: '#C2185B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12,
    shadowRadius: 14, elevation: 8, marginBottom: 14,
  },
  weekCardLeft: { flex: 1 },
  weekLabel: { fontSize: 13, color: '#aaa', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  weekNumber: { fontSize: 56, fontWeight: '900', color: '#C2185B', lineHeight: 64 },
  weekSub: { fontSize: 13, color: '#bbb' },
  pillContainer: { marginTop: 12 },
  pill: {
    backgroundColor: '#FCE4EC', color: '#C2185B', fontSize: 12, fontWeight: '600',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start',
  },
  weekCardRight: { alignItems: 'center', justifyContent: 'center', paddingLeft: 16, minWidth: 110 },
  fruitEmoji: { fontSize: 56 },
  fruitLabel: { fontSize: 11, color: '#bbb', marginTop: 8, textAlign: 'center' },
  fruitName: { fontSize: 13, color: '#555', fontWeight: '700', textAlign: 'center', marginTop: 2 },

  dueDateCard: {
    backgroundColor: '#FCE4EC', borderRadius: 18, padding: 16,
    alignItems: 'center', marginBottom: 28,
  },
  dueDateLabel: { fontSize: 13, color: '#C2185B', fontWeight: '600' },
  dueDateRange: { fontSize: 18, color: '#880E4F', fontWeight: '800', marginTop: 6 },
  dueDateSub: { fontSize: 12, color: '#E91E8C', marginTop: 4 },

  // Accesos destacados — 2 columnas, cards más grandes
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  gridDestacadas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  cardDestacada: {
    width: '47%', borderRadius: 20, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  iconDestacada: { fontSize: 40 },
  labelDestacada: { fontSize: 14, color: '#333', marginTop: 10, fontWeight: '700', textAlign: 'center' },

  // Secciones secundarias
  seccionBloque: { marginBottom: 24 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  seccionLinea: { flex: 1, height: 1, backgroundColor: '#F0E0E6' },
  seccionTitulo: { fontSize: 12, fontWeight: '700', color: '#C2185B', textTransform: 'uppercase', letterSpacing: 1 },

  // Cards secundarias — 4 por fila (25% aprox)
  gridSecundario: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardSecundaria: {
    width: '22%', borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  iconSecundaria: { fontSize: 26 },
  labelSecundaria: { fontSize: 10, color: '#555', marginTop: 6, fontWeight: '600', textAlign: 'center' },
});
