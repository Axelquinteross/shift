import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const STORES = [
  {
    id: 'st-1',
    name: 'Shift Tech',
    rating: 4.8,
    location: 'CABA',
    tags: ['Electrónica', 'Accesorios'],
  },
  {
    id: 'st-2',
    name: 'Casa & Hogar',
    rating: 4.6,
    location: 'La Plata',
    tags: ['Hogar', 'Cocina'],
  },
  {
    id: 'st-3',
    name: 'Sport Zone',
    rating: 4.7,
    location: 'Rosario',
    tags: ['Deportes', 'Indumentaria'],
  },
];

export default function StoresScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tiendas</Text>
        <Text style={styles.subtitle}>Listado inventado para navegación completa.</Text>
      </View>

      <FlatList
        data={STORES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push('/(tabs)')}>
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <Ionicons name="storefront" size={18} color="#fff" />
              </View>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={14} color="#fff" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.location}</Text>

            <View style={styles.tagsRow}>
              {item.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>

            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Ver productos</Text>
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
  ratingPill: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
  cardSubtitle: { marginTop: 4, color: '#555', fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: {
    backgroundColor: '#f1f1f1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: { color: '#111', fontWeight: '800', fontSize: 12 },
  ctaRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaText: { color: '#8B0000', fontWeight: '900' },
});
