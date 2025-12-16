import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const BENEFITS = [
  {
    id: 'f-1',
    title: 'Entrega prioritaria',
    desc: 'Procesamos tu pedido primero. (Inventado)',
    icon: 'flash',
  },
  {
    id: 'f-2',
    title: 'Tracking en tiempo real',
    desc: 'Seguimiento detallado del envío. (Inventado)',
    icon: 'locate',
  },
  {
    id: 'f-3',
    title: 'Devolución rápida',
    desc: 'Gestión simple desde la app. (Inventado)',
    icon: 'repeat',
  },
];

export default function FullScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="flash" size={22} color="#fff" />
        </View>
        <Text style={styles.title}>Full</Text>
        <Text style={styles.subtitle}>La experiencia premium (modo demo).</Text>

        <Pressable style={styles.primaryBtn} onPress={() => router.push('/shipping')}>
          <Text style={styles.primaryBtnText}>Ver planes Full</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Beneficios</Text>

      <FlatList
        data={BENEFITS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.benefitIcon}>
                <Ionicons name={item.icon} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.desc}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f3f3' },
  hero: {
    backgroundColor: '#111',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  subtitle: { marginTop: 6, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: '#8B0000',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    color: '#111',
    fontWeight: '900',
    fontSize: 16,
  },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#111' },
  cardSubtitle: { marginTop: 3, color: '#555', fontWeight: '600' },
});
