import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const OFFERS = [
  {
    id: 'of-1',
    title: 'Electrónica con 35% OFF',
    subtitle: 'Solo por hoy en auriculares, teclados y más.',
    badge: 'HOT',
    discountText: '35% OFF',
  },
  {
    id: 'of-2',
    title: 'Hogar con 2x1',
    subtitle: 'Seleccionados de cocina y organización.',
    badge: '2x1',
    discountText: '2x1',
  },
  {
    id: 'of-3',
    title: 'Deportes -20%',
    subtitle: 'Indumentaria y accesorios.',
    badge: 'SALE',
    discountText: '20% OFF',
  },
];

export default function OffersScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ofertas</Text>
        <Text style={styles.subtitle}>Promos inventadas para que el Home sea full.</Text>
      </View>

      <FlatList
        data={OFFERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push('/(tabs)')}
          >
            <View style={styles.cardTop}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
              <View style={styles.discountPill}>
                <Ionicons name="pricetag" size={14} color="#fff" />
                <Text style={styles.discountText}>{item.discountText}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Explorar productos</Text>
              <Ionicons name="chevron-forward" size={18} color="#8B0000" />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },
  subtitle: {
    marginTop: 6,
    color: '#555',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  discountPill: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  cardSubtitle: {
    marginTop: 4,
    color: '#555',
    fontWeight: '600',
  },
  ctaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: {
    color: '#8B0000',
    fontWeight: '900',
  },
});
