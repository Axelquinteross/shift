import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { listingsService } from '../../services/listingsService';

export default function MyListingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const emptyText = useMemo(() => {
    if (!user?.uid) return 'Iniciá sesión para ver tus publicaciones';
    return 'Todavía no tenés publicaciones';
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setListings([]);
        setLoading(false);
        return () => {};
      }

      setLoading(true);
      const unsubscribe = listingsService.onMyListingsChange(user.uid, (list) => {
        setListings(Array.isArray(list) ? list : []);
        setLoading(false);
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }, [user?.uid])
  );

  const confirmDelete = (item) => {
    Alert.alert('Eliminar publicación', `¿Eliminar "${item?.title ?? 'Publicación'}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!user?.uid) return;
            await listingsService.deleteListing({ userId: user.uid, listingId: item?.id });
          } catch (e) {
            console.error('Delete listing error:', e);
            Alert.alert('Error', 'No se pudo eliminar la publicación');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const photo = Array.isArray(item?.photos) ? item.photos[0] : null;

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.imageWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={20} color="#777" />
              </View>
            )}
          </View>

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>{item?.title ?? 'Sin título'}</Text>
            <Text style={styles.price}>${Number(item?.price ?? 0).toFixed(0)}</Text>
            {!!item?.description && (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            )}
            <Text style={styles.meta} numberOfLines={1}>
              {String(item?.createdAt ?? '').slice(0, 16).replace('T', ' ')}
            </Text>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={20} color="#8B0000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        activeOpacity={0.9}
        onPress={() => router.push('/account/create-listing')}
        disabled={!user?.uid}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.createText}>Crear publicación</Text>
      </TouchableOpacity>

      <FlatList
        data={listings}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{loading ? 'Cargando...' : emptyText}</Text>
            {!loading && !!user?.uid && (
              <Text style={styles.emptySub}>Publicá un producto para empezar a vender.</Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 6,
  },
  createText: {
    color: '#fff',
    fontWeight: '900',
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontWeight: '900',
    color: '#111',
    marginBottom: 6,
  },
  emptySub: {
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f1f1',
    marginRight: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '900',
    color: '#111',
    marginBottom: 2,
  },
  price: {
    fontWeight: '900',
    color: '#8B0000',
    marginBottom: 6,
  },
  desc: {
    color: '#333',
    marginBottom: 6,
  },
  meta: {
    color: '#777',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 6,
  },
});
