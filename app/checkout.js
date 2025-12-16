import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { notificationsService } from '../services/notificationsService';
import { ordersService } from '../services/ordersService';
import { clearCart, selectCartItems, selectCartTotal } from '../store/slices/cartSlice';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const cart = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const subscribeAddresses = async () => {
      try {
        if (!user?.uid) {
          setDefaultAddress(null);
          setAddressLoading(false);
          return;
        }

        setAddressLoading(true);
        const { ref, onValue } = await import('firebase/database');
        const { database } = await import('../config/firebase');

        const addressesRef = ref(database, `addresses/${user.uid}`);

        unsubscribe = onValue(addressesRef, (snapshot) => {
          if (!snapshot.exists()) {
            setDefaultAddress(null);
            setAddressLoading(false);
            return;
          }

          const data = snapshot.val();
          const addressesList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          const selected = addressesList.find((a) => a?.isDefault) ?? addressesList[0] ?? null;
          setDefaultAddress(selected);
          setAddressLoading(false);
        });
      } catch (e) {
        console.error('Error loading default address:', e);
        setDefaultAddress(null);
        setAddressLoading(false);
      }
    };

    subscribeAddresses();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  const totalAmount = useMemo(() => {
    const n = Number(total);
    return Number.isFinite(n) ? n : 0;
  }, [total]);

  const addressLine = useMemo(() => {
    if (!defaultAddress?.address) return null;
    return `${defaultAddress.address}${defaultAddress.city ? `, ${defaultAddress.city}` : ''}`;
  }, [defaultAddress?.address, defaultAddress?.city]);

  const canPlaceOrder = cart.length > 0 && !placingOrder && !addressLoading && !!defaultAddress;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrito vacío', 'Agregá productos antes de pagar');
      return;
    }

    if (!defaultAddress) {
      Alert.alert('Dirección requerida', 'Seleccioná o agregá una dirección para continuar', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a direcciones', onPress: () => router.push('/account/addresses') },
      ]);
      return;
    }

    try {
      setPlacingOrder(true);

      const order = ordersService.createOrder({
        items: cart,
        total: Number(totalAmount),
        totalAmount: Number(totalAmount),
        addressId: defaultAddress?.id ?? null,
        address: defaultAddress,
      });

      await ordersService.addOrder(order);
      await notificationsService.ensureOrderNotification({
        orderId: order.id,
        type: 'preparing',
        title: 'Pedido confirmado',
        body: 'Estamos preparando tu pedido',
      });
      dispatch(clearCart());
      router.replace(`/orders/${order.id}`);
    } catch (e) {
      console.error('Error placing order:', e);
      Alert.alert('Error', 'No se pudo completar la compra');
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderItem = ({ item }) => {
    const qty = Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 0;
    const price = Number.isFinite(Number(item?.price)) ? Number(item.price) : 0;
    return (
      <View style={styles.itemRow}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemMeta}>x{qty}</Text>
        <Text style={styles.itemPrice}>${(price * qty).toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Envío</Text>
        <Text style={styles.cardText}>
          {addressLoading ? 'Cargando dirección...' : (addressLine ?? 'No tenés dirección seleccionada')}
        </Text>
        <TouchableOpacity style={styles.link} onPress={() => router.push('/account/addresses')}>
          <Text style={styles.linkText}>{defaultAddress ? 'Cambiar dirección' : 'Seleccionar / agregar dirección'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Productos</Text>
        <FlatList
          data={cart}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, !canPlaceOrder && styles.payButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={!canPlaceOrder}
        >
          {placingOrder ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Confirmar compra</Text>
          )}
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
  cardText: {
    color: '#333',
  },
  link: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  linkText: {
    color: '#8B0000',
    fontWeight: '700',
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
    color: '#111',
    fontWeight: '700',
    marginRight: 10,
  },
  itemMeta: {
    width: 44,
    textAlign: 'right',
    color: '#666',
  },
  itemPrice: {
    width: 90,
    textAlign: 'right',
    color: '#111',
    fontWeight: '800',
  },
  footer: {
    marginTop: 'auto',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },
  payButton: {
    backgroundColor: '#8B0000',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
