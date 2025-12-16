import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    clearAllNotifications,
    loadNotifications,
    markAllRead,
    markNotificationRead,
    selectNotifications,
} from '../store/slices/notificationsSlice';

export default function NotificationsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);

  const formatRelative = useCallback((iso) => {
    const ts = iso ? new Date(iso).getTime() : NaN;
    if (!Number.isFinite(ts)) return '';

    const diffMs = Date.now() - ts;
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));

    if (diffSec < 60) return 'hace unos segundos';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr} h`;
    const diffDay = Math.floor(diffHr / 24);
    return `hace ${diffDay} d`;
  }, []);

  const getVisuals = useCallback((type) => {
    switch (String(type)) {
      case 'preparing':
        return { icon: 'time-outline', color: '#8B0000' };
      case 'dispatched':
        return { icon: 'cube-outline', color: '#1B5E20' };
      case 'on_the_way':
        return { icon: 'car-outline', color: '#0D47A1' };
      case 'door':
        return { icon: 'home-outline', color: '#6A1B9A' };
      case 'delivered':
        return { icon: 'checkmark-circle-outline', color: '#2E7D32' };
      case 'rate':
        return { icon: 'star-outline', color: '#F9A825' };
      default:
        return { icon: 'notifications-outline', color: '#111' };
    }
  }, []);

  const load = useCallback(async () => {
    await dispatch(loadNotifications());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  const handleMarkAllRead = async () => {
    await dispatch(markAllRead());
  };

  const handleClearAll = async () => {
    await dispatch(clearAllNotifications());
  };

  const renderItem = ({ item }) => {
    const visuals = getVisuals(item?.type);
    const relative = formatRelative(item?.createdAt);

    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        activeOpacity={0.85}
        onPress={async () => {
          await dispatch(markNotificationRead(item.id));
          if (item?.orderId && item?.type === 'rate') {
            router.push(`/rate/${item.orderId}`);
            return;
          }
          if (item?.orderId) router.push(`/orders/${item.orderId}`);
        }}
      >
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: `${visuals.color}22` }]}>
            <Ionicons name={visuals.icon} size={18} color={visuals.color} />
          </View>

          <View style={styles.content}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                {!item.read && <View style={styles.unreadDot} />}
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              </View>
              <Text style={styles.date} numberOfLines={1}>{relative}</Text>
            </View>
            <Text style={styles.body}>{item.body}</Text>
            {!!item?.orderId && (
              <Text style={styles.link}>{item?.type === 'rate' ? 'Calificar compra' : 'Ver seguimiento'}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.screenTitle}>Notificaciones</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead} activeOpacity={0.85}>
            <Text style={styles.markAllText}>Marcar leído</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll} activeOpacity={0.85}>
            <Text style={styles.clearAllText}>Limpiar todo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => String(n.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tenés notificaciones</Text>
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
  topRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  markAllText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  clearAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#8B0000',
  },
  clearAllText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  list: {
    paddingBottom: 16,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  cardUnread: {
    borderWidth: 2,
    borderColor: '#8B0000',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#8B0000',
    marginRight: 8,
    marginTop: 4,
  },
  title: {
    flex: 1,
    fontWeight: '900',
    color: '#111',
  },
  date: {
    color: '#777',
    fontSize: 12,
  },
  body: {
    color: '#333',
    marginBottom: 8,
  },
  link: {
    color: '#8B0000',
    fontWeight: '800',
  },
});
