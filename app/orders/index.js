import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ordersService } from '../../services/ordersService';

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const inFlightRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let intervalId;

      const load = async () => {
        const list = await ordersService.getOrders();
        if (!active) return;
        setOrders((prev) => {
          try {
            const nextStr = JSON.stringify(list ?? []);
            const prevStr = JSON.stringify(prev ?? []);
            return nextStr === prevStr ? prev : list;
          } catch {
            return list;
          }
        });
      };

      const tick = async () => {
        if (!active) return;
        if (inFlightRef.current) return;
        try {
          inFlightRef.current = true;
          await load();
        } finally {
          inFlightRef.current = false;
        }
      };

      tick();
      intervalId = setInterval(() => {
        tick();
      }, 1000);

      return () => {
        active = false;
        if (intervalId) clearInterval(intervalId);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/orders/${item.id}`)}
          >
            <Text style={styles.orderDate}>{String(item.createdAt ?? '').slice(0, 10)}</Text>
            <Text style={styles.orderTotal}>
              ${(() => {
                const direct =
                  Number.isFinite(Number(item?.total)) ? Number(item.total)
                    : Number.isFinite(Number(item?.totalAmount)) ? Number(item.totalAmount)
                      : NaN;
                if (Number.isFinite(direct) && direct > 0) return direct.toFixed(2);

                const items = Array.isArray(item?.items) ? item.items : [];
                const computed = items.reduce((acc, it) => {
                  const price = Number.isFinite(Number(it?.price)) ? Number(it.price) : 0;
                  const qty = Number.isFinite(Number(it?.quantity)) ? Number(it.quantity) : 0;
                  return acc + price * qty;
                }, 0);

                return computed.toFixed(2);
              })()}
            </Text>
            <Text
              style={[
                styles.orderStatus,
                { color: item?.shipping?.status === 'Entregado' ? '#4CAF50' : '#FFA000' }
              ]}
            >
              {item?.shipping?.status ?? 'Preparando'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Todavía no tenés pedidos</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 16,
  },
  orderTotal: {
    fontWeight: 'bold',
  },
  orderStatus: {
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});