import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { productService } from '../../services/databaseService';
import { initDatabase, productSQLiteService } from '../../services/sqliteService';
import { addToCart } from '../../store/slices/cartSlice';
import { selectIsFavorite, toggleFavorite } from '../../store/slices/favoritesSlice';

const normalizeProduct = (product) => {
  if (!product) return product;

  const price = product.price === null || product.price === undefined ? 0 : Number(product.price);
  const rating = product.rating === null || product.rating === undefined ? 0 : Number(product.rating);
  const stock = product.stock === null || product.stock === undefined ? 0 : Number(product.stock);
  const soldCount = product.soldCount ?? product.sold_count;

  return {
    id: String(product.id ?? ''),
    name: product.name ?? '',
    description: product.description ?? '',
    price: Number.isFinite(price) ? price : 0,
    category: product.category ?? '',
    image: product.image ?? '',
    rating: Number.isFinite(rating) ? rating : 0,
    stock: Number.isFinite(stock) ? stock : 0,
    sellerName: product.sellerName ?? product.seller_name ?? '',
    sellerLocation: product.sellerLocation ?? product.seller_location ?? '',
    condition: product.condition ?? '',
    soldCount: Number.isFinite(Number(soldCount)) ? Number(soldCount) : 0,
    createdAt: product.createdAt ?? product.created_at ?? null
  };
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const productId = useMemo(() => String(id ?? ''), [id]);
  const dispatch = useDispatch();
  const isFav = useSelector(selectIsFavorite(productId));

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        await initDatabase();

        const cached = await productSQLiteService.getProduct(productId);
        if (mounted && cached) {
          setProduct(normalizeProduct(cached));
        }

        const remote = await productService.getProduct(productId);
        if (mounted && remote) {
          const normalized = normalizeProduct({ id: productId, ...remote });
          setProduct(normalized);
          await productSQLiteService.saveProducts([normalized]);
        }
      } catch (e) {
        // If Firebase fails, cached value (if any) is already shown.
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (productId) load();

    return () => {
      mounted = false;
    };
  }, [productId]);

  if (loading && !product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No se pudo cargar el producto.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: product.image }} style={styles.image} />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => dispatch(toggleFavorite(product))}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={22}
            color={isFav ? '#8B0000' : '#333'}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.price}>${product.price.toFixed(2)}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{product.condition ? product.condition : 'Nuevo'}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{(Number.isFinite(Number(product.soldCount)) ? Number(product.soldCount) : 0)} vendidos</Text>
      </View>

      <View style={styles.sellerRow}>
        <Ionicons name="storefront-outline" size={18} color="#111" />
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{product.sellerName || 'Vendedor verificado'}</Text>
          <Text style={styles.sellerLocation}>{product.sellerLocation || 'Envío a todo el país'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{product.description || 'Sin descripción.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Métodos de pago</Text>
        <View style={styles.paymentRow}>
          <View style={styles.paymentPill}>
            <Ionicons name="card-outline" size={16} color="#333" />
            <Text style={styles.paymentText}>Tarjeta</Text>
          </View>
          <View style={styles.paymentPill}>
            <Ionicons name="cash-outline" size={16} color="#333" />
            <Text style={styles.paymentText}>Efectivo</Text>
          </View>
          <View style={styles.paymentPill}>
            <Ionicons name="logo-paypal" size={16} color="#333" />
            <Text style={styles.paymentText}>Online</Text>
          </View>
        </View>
        <Text style={styles.smallHint}>Simulación: en esta demo no se procesa el pago real.</Text>
      </View>

      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => {
          dispatch(addToCart(product));
          if (Platform.OS === 'android') {
            ToastAndroid.show('Agregado al carrito', ToastAndroid.SHORT);
          } else {
            Alert.alert('Carrito', 'Agregado al carrito');
          }
        }}
        activeOpacity={0.9}
      >
        <Ionicons name="cart-outline" size={18} color="#fff" />
        <Text style={styles.addToCartText}>Agregar al carrito</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    paddingBottom: 24
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  imageWrapper: {
    position: 'relative'
  },
  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#f0f0f0'
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 16,
    paddingTop: 16
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B0000',
    paddingHorizontal: 16,
    paddingTop: 8
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  metaText: {
    color: '#555',
    fontWeight: '600',
  },
  metaDot: {
    color: '#777',
    fontWeight: '900',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    color: '#111',
    fontWeight: '800',
  },
  sellerLocation: {
    color: '#555',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 18
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8
  },
  description: {
    color: '#444',
    lineHeight: 20
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999
  },
  paymentText: {
    color: '#333',
    fontWeight: '600'
  },
  smallHint: {
    marginTop: 10,
    color: '#777',
    fontSize: 12
  },
  addToCartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B0000',
    marginTop: 22,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12
  },
  addToCartText: {
    color: '#fff',
    fontWeight: '700'
  }
});
