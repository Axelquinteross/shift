import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useAuth } from '../../hooks/useAuth';
import { productService } from '../../services/databaseService';
import { notificationsService } from '../../services/notificationsService';
import { initDatabase, productSQLiteService } from '../../services/sqliteService';
import { selectFavorites, toggleFavorite } from '../../store/slices/favoritesSlice';
import { selectUnreadCount } from '../../store/slices/notificationsSlice';
import { loadProductsToFirebase } from '../../utils/loadProducts';

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

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todo');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  const unreadNotifications = useSelector(selectUnreadCount);
  const favorites = useSelector(selectFavorites);

  const favoriteIds = useMemo(() => {
    const set = new Set();
    (Array.isArray(favorites) ? favorites : []).forEach((p) => {
      if (p?.id != null) set.add(String(p.id));
    });
    return set;
  }, [favorites]);

  const categories = ['Todo', 'Electrónica', 'Hogar', 'Deportes', 'Ropa', 'Juguetes'];
  const shortcuts = [
    { key: 'ofertas', label: 'Ofertas', icon: 'pricetag-outline' },
    { key: 'envios', label: 'Envíos', icon: 'rocket-outline' },
    { key: 'cupones', label: 'Cupones', icon: 'ticket-outline' },
    { key: 'tienda', label: 'Tiendas', icon: 'storefront-outline' },
    { key: 'full', label: 'Full', icon: 'flash-outline' },
  ];

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const loadPrefs = async () => {
        try {
          const prefs = await notificationsService.getPreferences();
          if (mounted) setPromotionsEnabled(prefs?.promotions !== false);
        } catch (e) {
          console.error('Error loading preferences:', e);
          if (mounted) setPromotionsEnabled(true);
        }
      };

      loadPrefs();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const banners = [
    {
      key: 'b1',
      image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=60',
      title: 'Hasta 40% OFF',
      subtitle: 'En productos seleccionados',
      cta: 'Ver ofertas',
    },
    {
      key: 'b2',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=60',
      title: 'Cuotas sin interés',
      subtitle: 'Pagá como quieras',
      cta: 'Ver medios de pago',
    },
  ];

  const filteredShortcuts = useMemo(() => {
    if (promotionsEnabled) return shortcuts;
    return shortcuts.filter((s) => !['ofertas', 'cupones', 'full'].includes(String(s.key)));
  }, [promotionsEnabled]);

  const filteredBanners = useMemo(() => {
    if (promotionsEnabled) return banners;
    return [];
  }, [promotionsEnabled]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let unsubscribe;

    const subscribeAddresses = async () => {
      try {
        if (!user?.uid) {
          setDefaultAddress(null);
          return;
        }

        const { ref, onValue } = await import('firebase/database');
        const { database } = await import('../../config/firebase');

        const addressesRef = ref(database, `addresses/${user.uid}`);

        unsubscribe = onValue(addressesRef, (snapshot) => {
          if (!snapshot.exists()) {
            setDefaultAddress(null);
            return;
          }

          const data = snapshot.val();
          const addressesList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          const selected = addressesList.find((a) => a?.isDefault) ?? addressesList[0] ?? null;
          setDefaultAddress(selected);
        });
      } catch (e) {
        console.error('Error loading default address:', e);
        setDefaultAddress(null);
      }
    };

    subscribeAddresses();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      await initDatabase();

      const cachedProducts = await productSQLiteService.getProducts();
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts.map(normalizeProduct));
        setLoading(false);
      }

      const refreshFromFirebase = async () => {
        const productsData = await productService.getAllProducts();

        if (Object.keys(productsData).length === 0) {
          await loadProductsToFirebase();
          const retryData = await productService.getAllProducts();
          const productsArray = Object.keys(retryData).map(key => normalizeProduct({
            id: key,
            ...retryData[key]
          }));
          await productSQLiteService.saveProducts(productsArray);
          return productsArray;
        }

        const productsArray = Object.keys(productsData).map(key => normalizeProduct({
          id: key,
          ...productsData[key]
        }));
        await productSQLiteService.saveProducts(productsArray);
        return productsArray;
      };
      
      if (cachedProducts.length > 0) {
        refreshFromFirebase()
          .then((freshProducts) => {
            if (freshProducts?.length > 0) setProducts(freshProducts);
          })
          .catch((error) => {
            console.error('Error loading products:', error);
          });
        return;
      }

      const freshProducts = await refreshFromFirebase();
      setProducts(freshProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      // Intentar cargar desde SQLite como fallback
      try {
        const sqliteProducts = await productSQLiteService.getProducts();
        if (sqliteProducts.length > 0) {
          setProducts(sqliteProducts.map(normalizeProduct));
        } else {
          // Último fallback a datos locales
          const fallbackProducts = require('../../data/products');
          setProducts(fallbackProducts.map(normalizeProduct));
        }
      } catch (sqliteError) {
        console.error('Error con SQLite:', sqliteError);
        const fallbackProducts = require('../../data/products');
        setProducts(fallbackProducts.map(normalizeProduct));
      }
    } finally {
      setLoading(false);
    }
  };

  const forceReloadCatalog = async () => {
    try {
      setLoading(true);
      await loadProductsToFirebase();
      await loadProducts();
    } catch (e) {
      console.error('Error al actualizar catálogo:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos basados en el término de búsqueda
  const filteredProducts = products.filter(product => {
    const name = (product?.name ?? '').toLowerCase();
    const description = (product?.description ?? '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || description.includes(term);

    const productCategory = (product?.category ?? '').toLowerCase();
    const category = (activeCategory ?? 'Todo').toLowerCase();
    const matchesCategory = category === 'todo' ? true : productCategory === category;

    return matchesSearch && matchesCategory;
  });

  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderProductItem = useCallback(({ item: product }) => {
    const isFav = favoriteIds.has(String(product.id));
    return (
      <View style={styles.productCard}>
        <View style={styles.productImageContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/product/${product.id}`)}
          >
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => dispatch(toggleFavorite(normalizeProduct(product)))}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={isFav ? '#8B0000' : '#333'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/product/${product.id}`)}
        >
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.productPrice}>
            ${(Number.isFinite(Number(product.price)) ? Number(product.price) : 0).toFixed(2)}
          </Text>
          <Text style={styles.productMeta}>Envío gratis</Text>
        </TouchableOpacity>
      </View>
    );
  }, [dispatch, favoriteIds, router]);

  const listHeader = useMemo(() => {
    const initials = String(user?.name || user?.email || 'U')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => (p?.[0] ? p[0].toUpperCase() : ''))
      .join('');

    const addressLine = defaultAddress?.address
      ? `${defaultAddress.address}${defaultAddress.city ? `, ${defaultAddress.city}` : ''}`
      : 'Agregá una dirección';

    return (
      <>
        <View style={styles.header}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.85}
              onPress={() => router.push('/profile')}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials || 'U'}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.searchPill}>
              <Ionicons name="search" size={18} color="#666" />
              <TextInput
                style={styles.searchPillInput}
                placeholder="Buscar productos..."
                placeholderTextColor="#666"
                value={searchTerm}
                onChangeText={setSearchTerm}
                returnKeyType="search"
              />
            </View>

            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.8}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 99 ? '99+' : String(unreadNotifications)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.locationRow}
            activeOpacity={0.9}
            onPress={() => router.push('/account/addresses')}
          >
            <Ionicons name="location-outline" size={16} color="#fff" />
            <Text style={styles.locationText}>{addressLine}</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>

          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => c}
            contentContainerStyle={styles.categoriesRow}
            renderItem={({ item: c }) => (
              <TouchableOpacity
                style={styles.categoryTab}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(c)}
              >
                <Text style={[styles.categoryTabText, activeCategory === c && styles.categoryTabTextActive]}>{c}</Text>
                <View style={[styles.categoryUnderline, activeCategory === c && styles.categoryUnderlineActive]} />
              </TouchableOpacity>
            )}
          />
        </View>

        {filteredBanners.length > 0 ? (
          <FlatList
            data={filteredBanners}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(b) => b.key}
            contentContainerStyle={styles.bannerRow}
            renderItem={({ item: b }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  if (b.key === 'b2') {
                    router.push('/account/payment-methods');
                    return;
                  }
                  router.push('/offers');
                }}
              >
                <ImageBackground
                  source={{ uri: b.image }}
                  style={styles.bannerCard}
                  imageStyle={styles.bannerImage}
                >
                  <View style={styles.bannerOverlay} />
                  <View style={styles.bannerContent}>
                    <View style={styles.bannerBadge}>
                      <Text style={styles.bannerBadgeText}>OFERTA</Text>
                    </View>
                    <Text style={styles.bannerTitle}>{b.title}</Text>
                    <Text style={styles.bannerSubtitle}>{b.subtitle}</Text>
                    <View style={styles.bannerCta}>
                      <Text style={styles.bannerCtaText}>{b.cta}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#fff" />
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
          />
        ) : null}

        <View style={styles.shortcutsRow}>
          {filteredShortcuts.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={styles.shortcut}
              activeOpacity={0.85}
              onPress={() => {
                const routes = {
                  ofertas: '/offers',
                  envios: '/shipping',
                  cupones: '/coupons',
                  tienda: '/stores',
                  full: '/full',
                };
                router.push(routes[s.key] ?? '/(tabs)');
              }}
            >
              <View style={styles.shortcutIcon}>
                <Ionicons name={s.icon} size={18} color="#111" />
              </View>
              <Text style={styles.shortcutLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.adminRow}>
          <TouchableOpacity style={styles.adminButton} activeOpacity={0.9} onPress={forceReloadCatalog}>
            <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
            <Text style={styles.adminButtonText}>Actualizar catálogo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          {searchTerm ? `Resultados para: ${searchTerm}` : 'Para vos'}
        </Text>
      </>
    );
  }, [activeCategory, categories, forceReloadCatalog, router, searchTerm, filteredBanners, filteredShortcuts, unreadNotifications, user?.avatar, user?.email, user?.name, defaultAddress]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProducts}
        keyExtractor={keyExtractor}
        renderItem={renderProductItem}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.listColumn}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B0000" />
              <Text style={styles.loadingText}>Cargando productos...</Text>
            </View>
          ) : (
            <Text style={styles.noResults}>No se encontraron productos</Text>
          )
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
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
    backgroundColor: '#111',
    paddingTop: 10,
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontWeight: '700',
    color: '#111',
    fontSize: 12,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchPillInput: {
    flex: 1,
    paddingVertical: 0,
    color: '#111',
    fontSize: 14,
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#8B0000',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 6,
  },
  locationText: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  categoriesRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 18,
  },
  categoryTab: {
    paddingVertical: 6,
  },
  categoryTabText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 13,
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  categoryUnderline: {
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  categoryUnderlineActive: {
    backgroundColor: '#8B0000',
  },
  listContent: {
    paddingBottom: 30,
  },
  listColumn: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  bannerRow: {
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 12,
    gap: 12,
  },
  bannerCard: {
    width: 290,
    borderRadius: 16,
    height: 140,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bannerImage: {
    borderRadius: 16,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerContent: {
    padding: 16,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#8B0000',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  bannerBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  bannerCta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerCtaText: {
    color: '#fff',
    fontWeight: '700',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  shortcut: {
    alignItems: 'center',
    width: 60,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  shortcutLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  adminRow: {
    paddingHorizontal: 12,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e7e7e7',
  },
  adminButtonText: {
    color: '#111',
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 14,
    marginLeft: 12,
    color: '#333',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginTop: 2,
  },
  productMeta: {
    marginTop: 4,
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
});

