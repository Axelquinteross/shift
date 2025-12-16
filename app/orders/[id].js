import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { notificationsService } from '../../services/notificationsService';
import { ordersService } from '../../services/ordersService';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orderId = useMemo(() => String(id ?? ''), [id]);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);
  const inFlightRef = useRef(false);

  const loadOrder = async ({ silent } = { silent: false }) => {
    if (!orderId) return;
    if (inFlightRef.current) return;
    try {
      inFlightRef.current = true;
      if (!silent) setLoading(true);
      const o = await ordersService.getOrderById(orderId);
      setOrder(o);

      const status = o?.shipping?.status;
      if (!o?.id || !status) return;

      if (status === 'Preparando') {
        await notificationsService.ensureOrderNotification({
          orderId: o.id,
          type: 'preparing',
          title: 'Pedido confirmado',
          body: 'Estamos preparando tu pedido',
        });
      }

      if (status === 'Despachado') {
        await notificationsService.ensureOrderNotification({
          orderId: o.id,
          type: 'dispatched',
          title: 'Pedido despachado',
          body: 'Tu pedido fue despachado',
        });
      }

      if (status === 'En camino') {
        await notificationsService.ensureOrderNotification({
          orderId: o.id,
          type: 'on_the_way',
          title: 'En camino',
          body: 'Tu pedido está en camino',
        });
      }

      if (status === 'En la puerta') {
        await notificationsService.ensureOrderNotification({
          orderId: o.id,
          type: 'door',
          title: 'Repartidor',
          body: 'El repartidor está en la puerta',
        });
      }

      if (status === 'Entregado') {
        await notificationsService.ensureOrderNotification({
          orderId: o.id,
          type: 'delivered',
          title: 'Entrega exitosa',
          body: 'Tu entrega fue un éxito',
        });

        await notificationsService.ensureOrderNotification({
          orderId: o.id,
          type: 'rate',
          title: '¿Cómo fue tu compra?',
          body: 'Calificá tu pedido con estrellas',
        });
      }
    } finally {
      if (!silent) setLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    loadOrder({ silent: false });
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    pollRef.current = setInterval(() => {
      loadOrder({ silent: true });
    }, 1000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [orderId]);

  const addressLine = useMemo(() => {
    const addr = order?.address;
    if (!addr?.address) return null;
    return `${addr.address}${addr.city ? `, ${addr.city}` : ''}`;
  }, [order?.address]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Cargando pedido...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pedido no encontrado</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/orders')}>
          <Text style={styles.buttonText}>Ir a Mis Pedidos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const status = order?.shipping?.status ?? 'Preparando';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seguimiento</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado</Text>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.meta}>Pedido: {order.id}</Text>
        <Text style={styles.meta}>Creado: {String(order.createdAt).slice(0, 19).replace('T', ' ')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Envío a</Text>
        <Text style={styles.meta}>{addressLine ?? 'Sin dirección'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Productos</Text>
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/orders')}>
          <Text style={styles.buttonText}>Ver mis pedidos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    color: '#111',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },
  status: {
    fontSize: 18,
    fontWeight: '900',
    color: '#8B0000',
  },
  meta: {
    color: '#333',
    marginTop: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    flex: 1,
    fontWeight: '700',
    color: '#111',
  },
  itemQty: {
    color: '#666',
    width: 50,
    textAlign: 'right',
  },
  footer: {
    marginTop: 'auto',
  },
  button: {
    backgroundColor: '#8B0000',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
