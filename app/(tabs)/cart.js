import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { removeFromCart, selectCartItems, selectCartTotal, updateQuantity } from '../../store/slices/cartSlice';

export default function CartScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cart = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const { user } = useAuth();

  const [addressLoading, setAddressLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const subtotal = Number(total);
  const subtotalAmount = Number.isFinite(subtotal) ? subtotal : 0;
  const shippingAmount = 0;
  const totalAmount = subtotalAmount + shippingAmount;

  const freeShippingThreshold = 30000;
  const progress = Math.max(0, Math.min(1, freeShippingThreshold > 0 ? totalAmount / freeShippingThreshold : 1));

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    const setup = async () => {
      try {
        if (!user?.uid) {
          if (!mounted) return;
          setSelectedAddress(null);
          setAddressLoading(false);
          return;
        }

        setAddressLoading(true);
        const { ref, onValue } = await import('firebase/database');
        const { database } = await import('../../config/firebase');

        const addressesRef = ref(database, `addresses/${user.uid}`);
        unsubscribe = onValue(addressesRef, (snapshot) => {
          if (!mounted) return;
          if (!snapshot.exists()) {
            setSelectedAddress(null);
            setAddressLoading(false);
            return;
          }

          const data = snapshot.val();
          const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
          const def = list.find((a) => a?.isDefault) ?? list[0] ?? null;
          setSelectedAddress(def);
          setAddressLoading(false);
        });
      } catch {
        if (!mounted) return;
        setSelectedAddress(null);
        setAddressLoading(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  const addressLine = useMemo(() => {
    if (addressLoading) return 'Cargando dirección...';
    if (!selectedAddress) return 'Elegí una dirección';
    const parts = [selectedAddress?.address, selectedAddress?.city].filter(Boolean);
    return parts.join(' · ');
  }, [addressLoading, selectedAddress]);

  const storeName = 'SHIFT Store';

  const renderItem = ({ item }) => {
    const qty = Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 0;
    const price = Number.isFinite(Number(item?.price)) ? Number(item.price) : 0;
    const lineTotal = price * qty;

    return (
      <View style={styles.productRow}>
        <View style={styles.checkbox} />

        <Pressable
          style={styles.productImageWrap}
          onPress={() => router.push(`/product/${item.id}`)}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
          />
        </Pressable>

        <View style={styles.productInfo}>
          <View style={styles.productTopRow}>
            <Text style={styles.productTitle} numberOfLines={2}>{item.name}</Text>
            <TouchableOpacity
              style={styles.trashButton}
              onPress={() => dispatch(removeFromCart(item.id))}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.productBottomRow}>
            <View style={styles.qtyPill}>
              <TouchableOpacity
                style={styles.qtyButton}
                activeOpacity={0.8}
                onPress={() => dispatch(updateQuantity({ productId: item.id, quantity: qty - 1 }))}
              >
                <Ionicons name="remove" size={16} color="#111" />
              </TouchableOpacity>

              <Text style={styles.qtyText}>{qty} u.</Text>

              <TouchableOpacity
                style={styles.qtyButton}
                activeOpacity={0.8}
                onPress={() => dispatch(updateQuantity({ productId: item.id, quantity: qty + 1 }))}
              >
                <Ionicons name="add" size={16} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.priceCol}>
              <Text style={styles.priceText}>${lineTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const listHeader = (
    <>
      <Pressable style={styles.addressRow} onPress={() => router.push('/account/addresses')}>
        <Ionicons name="location-outline" size={16} color="#111" />
        <Text style={styles.addressText} numberOfLines={1}>{addressLine}</Text>
        <Ionicons name="chevron-forward" size={16} color="#111" />
      </Pressable>

      <View style={styles.block}>
        <Pressable style={styles.blockHeader} onPress={() => router.push('/stores')}>
          <View style={styles.checkbox} />
          <View style={styles.blockHeaderText}>
            <Text style={styles.blockTitle} numberOfLines={1}>Productos de {storeName}</Text>
            <Text style={styles.blockSubtitle} numberOfLines={1}>Tienda oficial</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#111" />
        </Pressable>

        <View style={styles.divider} />
      </View>
    </>
  );

  const listFooter = (
    <>
      {cart.length > 0 && (
        <View style={styles.block}>
          <View style={styles.shippingRow}>
            <Text style={styles.shippingTitle}>Envío</Text>
            <Text style={styles.shippingPrice}>Gratis</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>

          <Text style={styles.shippingHint}>
            Aprovechá tu envío gratis agregando más productos de {storeName}.
          </Text>

          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.linkText}>Ver productos</Text>
            <Ionicons name="chevron-forward" size={16} color="#2F6FED" />
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 190 }} />
    </>
  );

  return (
    <View style={styles.container}>
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.title}>Carrito</Text>
          <Text style={styles.emptyText}>Tu carrito está vacío</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}> 
            <Text style={styles.shopButtonText}>Ir a comprar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.screenHeader}>
            <Text style={styles.title}>Carrito</Text>
          </View>

          <FlatList
            data={cart}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Producto</Text>
              <Text style={styles.summaryValue}>${subtotalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Envío</Text>
              <Text style={styles.summaryGreen}>Gratis</Text>
            </View>

            <TouchableOpacity
              style={styles.couponRow}
              activeOpacity={0.85}
              onPress={() => router.push('/coupons')}
            >
              <Text style={styles.couponText}>Ingresar código de cupón</Text>
            </TouchableOpacity>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push('/checkout')}
              activeOpacity={0.9}
            >
              <Text style={styles.checkoutText}>Continuar compra</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f3f3' },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#f3f3f3',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#111' },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  addressText: {
    flex: 1,
    color: '#111',
    fontWeight: '700',
  },
  block: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockHeaderText: {
    flex: 1,
  },
  blockTitle: {
    fontWeight: '900',
    color: '#111',
  },
  blockSubtitle: {
    marginTop: 2,
    color: '#666',
    fontWeight: '700',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginTop: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#2F6FED',
    backgroundColor: '#2F6FED',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  productImageWrap: {
    width: 78,
    height: 78,
    borderRadius: 10,
    backgroundColor: '#f1f1f1',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
  },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  productTitle: {
    flex: 1,
    fontWeight: '900',
    color: '#111',
  },
  trashButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f1f1',
    overflow: 'hidden',
  },
  qtyButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    width: 54,
    textAlign: 'center',
    fontWeight: '900',
    color: '#111',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#111',
  },
  shippingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shippingTitle: {
    fontWeight: '900',
    color: '#111',
  },
  shippingPrice: {
    fontWeight: '900',
    color: '#1B5E20',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.10)',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1B5E20',
  },
  shippingHint: {
    marginTop: 10,
    color: '#555',
    fontWeight: '600',
    lineHeight: 18,
  },
  linkRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  linkText: {
    color: '#2F6FED',
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.10)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#111',
    fontWeight: '700',
  },
  summaryValue: {
    color: '#111',
    fontWeight: '900',
  },
  summaryGreen: {
    color: '#1B5E20',
    fontWeight: '900',
  },
  couponRow: {
    marginTop: 6,
    marginBottom: 10,
  },
  couponText: {
    color: '#2F6FED',
    fontWeight: '900',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },
  checkoutButton: {
    backgroundColor: '#2F6FED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    marginBottom: 12,
  },
  shopButton: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});