import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ordersService } from '../../services/ordersService';

export default function RateOrderScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const oid = useMemo(() => String(orderId ?? ''), [orderId]);
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!oid) return;
        const o = await ordersService.getOrderById(oid);
        if (!mounted) return;
        setOrder(o);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [oid]);

  const titleLine = useMemo(() => {
    const firstItem = order?.items?.[0];
    const name = firstItem?.name ? String(firstItem.name) : '';
    if (!name) return 'Calificá tu compra';
    return `¿Qué te pareció ${name}?`;
  }, [order?.items]);

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Iniciá sesión', 'Necesitás iniciar sesión para calificar');
      return;
    }

    if (!oid) {
      Alert.alert('Error', 'No se pudo identificar el pedido');
      return;
    }

    if (rating < 1) {
      Alert.alert('Falta la puntuación', 'Elegí una cantidad de estrellas para continuar');
      return;
    }

    try {
      setSubmitting(true);

      const { ref, set } = await import('firebase/database');
      const { database } = await import('../../config/firebase');

      const now = new Date().toISOString();
      const items = Array.isArray(order?.items) ? order.items : [];

      const payload = {
        orderId: oid,
        userId: user.uid,
        rating,
        createdAt: now,
        items: items.map((i) => ({
          id: i?.id ?? null,
          name: i?.name ?? null,
          quantity: i?.quantity ?? null,
        })),
      };

      await set(ref(database, `ratings/${user.uid}/${oid}`), payload);
      setSubmitted(true);
    } catch (e) {
      console.error('Rating submit error:', e);
      Alert.alert('Error', 'No se pudo enviar tu puntuación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.thanksCard}>
          <View style={styles.thanksIconWrap}>
            <Ionicons name="checkmark" size={22} color="#fff" />
          </View>
          <Text style={styles.thanksTitle}>¡Gracias por tu opinión!</Text>
          <Text style={styles.thanksBody}>Tu puntuación nos ayuda a mejorar la experiencia.</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{titleLine}</Text>
        {!!order?.id && <Text style={styles.subtitle}>Pedido #{String(order.id).slice(-6)}</Text>}

        <View style={styles.starsRow}>
          {Array.from({ length: 5 }).map((_, idx) => {
            const value = idx + 1;
            const filled = value <= rating;
            return (
              <Pressable
                key={value}
                onPress={() => setRating(value)}
                style={styles.starButton}
                hitSlop={10}
              >
                <Ionicons name={filled ? 'star' : 'star-outline'} size={34} color={filled ? '#F9A825' : '#999'} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.helperText}>
          {rating === 0
            ? 'Tocá las estrellas para puntuar'
            : rating === 1
              ? 'Muy malo'
              : rating === 2
                ? 'Malo'
                : rating === 3
                  ? 'Regular'
                  : rating === 4
                    ? 'Muy bueno'
                    : 'Excelente'}
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Enviar puntuación</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryButtonText}>Más tarde</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8f8' },
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 16, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'center' },
  subtitle: { marginTop: 8, color: '#666', fontWeight: '700', textAlign: 'center' },
  starsRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  starButton: { paddingHorizontal: 4, paddingVertical: 6 },
  helperText: { marginTop: 10, color: '#555', fontWeight: '700', textAlign: 'center' },
  primaryButton: { marginTop: 18, backgroundColor: '#2F6FED', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '900' },
  secondaryButton: { marginTop: 10, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f1f1' },
  secondaryButtonText: { color: '#111', fontWeight: '900' },
  thanksCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  thanksIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  thanksTitle: { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'center' },
  thanksBody: { marginTop: 8, marginBottom: 8, color: '#555', fontWeight: '600', textAlign: 'center' },
});
