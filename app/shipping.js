import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const PLANS = [
  {
    id: 'ship-1',
    name: 'Envío Estándar',
    eta: '3 a 5 días hábiles',
    price: '$2.990',
    desc: 'Ideal si no tenés apuro. (Inventado)',
  },
  {
    id: 'ship-2',
    name: 'Envío Express',
    eta: '24 a 48 hs',
    price: '$5.990',
    desc: 'Prioridad media, llega rápido. (Inventado)',
  },
  {
    id: 'ship-3',
    name: 'Envío Full',
    eta: 'Hoy / Mañana',
    price: '$7.990',
    desc: 'Entrega ultra rápida con tracking. (Inventado)',
  },
];

export default function ShippingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Planes de envío</Text>
        <Text style={styles.subtitle}>Elegí un plan (demo). No afecta compras reales.</Text>
      </View>

      <FlatList
        data={PLANS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push('/checkout')}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <Ionicons name="rocket" size={18} color="#fff" />
              </View>
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>{item.price}</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.eta}</Text>
            <Text style={styles.cardSubtitle}>{item.desc}</Text>

            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Ir al checkout</Text>
              <Ionicons name="chevron-forward" size={18} color="#8B0000" />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f3f3' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '900', color: '#111' },
  subtitle: { marginTop: 6, color: '#555', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePill: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priceText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
  cardMeta: { marginTop: 2, color: '#111', fontWeight: '800' },
  cardSubtitle: { marginTop: 6, color: '#555', fontWeight: '600' },
  ctaRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaText: { color: '#8B0000', fontWeight: '900' },
});
