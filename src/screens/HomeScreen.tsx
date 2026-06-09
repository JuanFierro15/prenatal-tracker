import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DESARROLLO_POR_SEMANA } from '../constants/desarrolloData';

const PREGNANCY_START = new Date(2026, 2, 29);
const DUE_DATE_EARLY = new Date(2026, 11, 13);

const FEATURES = [
  { icon: '📅', label: 'Citas médicas',  color: '#E8F4FD', tab: 'Citas' },
  { icon: '📖', label: 'Diario',         color: '#FEF3E2', tab: 'Diario' },
  { icon: '👶', label: 'Desarrollo',     color: '#F0FDF4', tab: 'Desarrollo' },
  { icon: '🦵', label: 'Patadas',        color: '#FDF2F8', tab: 'Patadas' },
  { icon: '📊', label: 'Síntomas',       color: '#FFF7ED', tab: 'Síntomas' },
  { icon: '📷', label: 'Fotos',          color: '#F0F9FF', tab: null },
  { icon: '✅', label: 'Checklist',      color: '#F7F7FF', tab: 'Checklist' },
  { icon: '⏱️', label: 'Contracciones', color: '#FFF1F2', tab: 'Contracciones' },
  { icon: '💝', label: 'Nombres',        color: '#FDF4FF', tab: null },
  { icon: '🚨', label: 'Emergencia',     color: '#FFF5F5', tab: null },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - PREGNANCY_START.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(diffDays / 7);
  const daysUntilDue = Math.ceil((DUE_DATE_EARLY.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const weeksLeft = 40 - currentWeek;

  const fruitInfo = DESARROLLO_POR_SEMANA[currentWeek] ?? { fruta: 'bebé creciendo', frutaEmoji: '🌱', articulo: 'un' };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.appName}>Bebe Totodrilo</Text>
          <Text style={styles.subtitle}>El camino de ser buenos padres 💕</Text>
        </View>

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

        <View style={styles.dueDateCard}>
          <Text style={styles.dueDateLabel}>📆  Fecha probable de parto</Text>
          <Text style={styles.dueDateRange}>13 Dic 2026 – 3 Ene 2027</Text>
          <Text style={styles.dueDateSub}>
            {daysUntilDue > 0 ? `Faltan aproximadamente ${daysUntilDue} días` : '¡El bebé ya llegó! 🎉'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>¿Qué deseas registrar?</Text>
        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <TouchableOpacity
              key={f.label}
              style={[styles.featureCard, { backgroundColor: f.color }]}
              activeOpacity={0.7}
              onPress={() => f.tab && navigation.navigate(f.tab)}
            >
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
              {!f.tab && <Text style={styles.comingSoon}>Próximamente</Text>}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 24, paddingBottom: 20, alignItems: 'center' },
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
  pill: { backgroundColor: '#FCE4EC', color: '#C2185B', fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  weekCardRight: { alignItems: 'center', justifyContent: 'center', paddingLeft: 16, minWidth: 110 },
  fruitEmoji: { fontSize: 56 },
  fruitLabel: { fontSize: 11, color: '#bbb', marginTop: 8, textAlign: 'center' },
  fruitName: { fontSize: 13, color: '#555', fontWeight: '700', textAlign: 'center', marginTop: 2 },
  dueDateCard: { backgroundColor: '#FCE4EC', borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 28 },
  dueDateLabel: { fontSize: 13, color: '#C2185B', fontWeight: '600' },
  dueDateRange: { fontSize: 18, color: '#880E4F', fontWeight: '800', marginTop: 6 },
  dueDateSub: { fontSize: 12, color: '#E91E8C', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 40 },
  featureCard: {
    width: '47%', borderRadius: 18, padding: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  featureIcon: { fontSize: 34 },
  featureLabel: { fontSize: 13, color: '#444', marginTop: 10, fontWeight: '600', textAlign: 'center' },
  comingSoon: { fontSize: 10, color: '#bbb', marginTop: 4 },
});
