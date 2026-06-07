import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DESARROLLO_POR_SEMANA } from '../constants/desarrolloData';

const PREGNANCY_START = new Date(2026, 2, 29);

function semanaActual(): number {
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - PREGNANCY_START.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(dias / 7);
}

const SEMANA_MIN = 4;
const SEMANA_MAX = 40;

export default function DesarrolloScreen() {
  const [semana, setSemana] = useState(semanaActual());
  const data = DESARROLLO_POR_SEMANA[semana];
  const esActual = semana === semanaActual();

  function anterior() { if (semana > SEMANA_MIN) setSemana(s => s - 1); }
  function siguiente() { if (semana < SEMANA_MAX) setSemana(s => s + 1); }
  function irAHoy() { setSemana(semanaActual()); }

  const progreso = ((semana - SEMANA_MIN) / (SEMANA_MAX - SEMANA_MIN)) * 100;

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.noData}>
          <Text style={styles.noDataText}>No hay datos para la semana {semana}.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Navegación de semanas */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, semana <= SEMANA_MIN && styles.navBtnDisabled]}
            onPress={anterior}
            disabled={semana <= SEMANA_MIN}
          >
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.navCenter}>
            <Text style={styles.navSemana}>Semana {semana}</Text>
            <Text style={styles.navDe}>de 40 semanas</Text>
          </View>

          <TouchableOpacity
            style={[styles.navBtn, semana >= SEMANA_MAX && styles.navBtnDisabled]}
            onPress={siguiente}
            disabled={semana >= SEMANA_MAX}
          >
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progreso}%` }]} />
        </View>
        {!esActual && (
          <TouchableOpacity style={styles.btnHoy} onPress={irAHoy}>
            <Text style={styles.btnHoyText}>Ir a la semana actual →</Text>
          </TouchableOpacity>
        )}

        {/* Tarjeta del bebé */}
        <View style={styles.bebeCard}>
          <Text style={styles.bebeEmoji}>{data.frutaEmoji}</Text>
          <View style={styles.bebeInfo}>
            <Text style={styles.bebeTitulo}>Tu bebé mide como</Text>
            <Text style={styles.bebeNombreFruta}>una {data.fruta}</Text>
            <View style={styles.medidas}>
              <View style={styles.medida}>
                <Text style={styles.medidaValor}>{data.peso}</Text>
                <Text style={styles.medidaLabel}>Peso aprox.</Text>
              </View>
              <View style={styles.medidaSep} />
              <View style={styles.medida}>
                <Text style={styles.medidaValor}>{data.talla}</Text>
                <Text style={styles.medidaLabel}>Talla aprox.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Desarrollo del bebé */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionEmoji}>👶</Text>
            <Text style={styles.seccionTitulo}>¿Qué está pasando esta semana?</Text>
          </View>
          {data.desarrollo.map((item, i) => (
            <View key={i} style={styles.listaItem}>
              <View style={styles.listaPunto} />
              <Text style={styles.listaTexto}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Síntomas de mamá */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionEmoji}>🤰</Text>
            <Text style={styles.seccionTitulo}>Cómo puede sentirse mamá</Text>
          </View>
          {data.sintomas.map((item, i) => (
            <View key={i} style={styles.listaItem}>
              <View style={[styles.listaPunto, { backgroundColor: '#E91E8C' }]} />
              <Text style={styles.listaTexto}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Curiosidad */}
        <View style={styles.curiosidadCard}>
          <Text style={styles.curiosidadEmoji}>💡</Text>
          <Text style={styles.curiosidadTitulo}>Dato de la semana</Text>
          <Text style={styles.curiosidadTexto}>{data.curiosidad}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  noData: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noDataText: { fontSize: 16, color: '#aaa' },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { backgroundColor: '#f5f5f5' },
  navArrow: { fontSize: 26, color: '#C2185B', fontWeight: '700' },
  navCenter: { alignItems: 'center' },
  navSemana: { fontSize: 26, fontWeight: '900', color: '#C2185B' },
  navDe: { fontSize: 13, color: '#aaa', marginTop: 2 },

  progressBar: {
    height: 6,
    backgroundColor: '#FCE4EC',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#C2185B', borderRadius: 3 },
  btnHoy: { alignSelf: 'center', marginBottom: 16 },
  btnHoyText: { fontSize: 13, color: '#C2185B', fontWeight: '600' },

  bebeCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  bebeEmoji: { fontSize: 64, marginRight: 16 },
  bebeInfo: { flex: 1 },
  bebeTitulo: { fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  bebeNombreFruta: { fontSize: 18, fontWeight: '800', color: '#C2185B', marginTop: 4, marginBottom: 12 },
  medidas: { flexDirection: 'row', alignItems: 'center' },
  medida: { alignItems: 'center' },
  medidaValor: { fontSize: 16, fontWeight: '800', color: '#333' },
  medidaLabel: { fontSize: 11, color: '#aaa', marginTop: 2 },
  medidaSep: { width: 1, height: 30, backgroundColor: '#eee', marginHorizontal: 16 },

  seccion: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  seccionEmoji: { fontSize: 22, marginRight: 10 },
  seccionTitulo: { fontSize: 15, fontWeight: '800', color: '#333', flex: 1 },
  listaItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  listaPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C2185B',
    marginTop: 6,
    marginRight: 10,
    flexShrink: 0,
  },
  listaTexto: { fontSize: 14, color: '#444', lineHeight: 21, flex: 1 },

  curiosidadCard: {
    backgroundColor: '#FCE4EC',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  curiosidadEmoji: { fontSize: 32, marginBottom: 8 },
  curiosidadTitulo: { fontSize: 14, fontWeight: '800', color: '#C2185B', marginBottom: 10 },
  curiosidadTexto: { fontSize: 14, color: '#880E4F', textAlign: 'center', lineHeight: 22 },
});
