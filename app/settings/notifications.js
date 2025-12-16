import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import { notificationsService } from '../../services/notificationsService';

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    promotions: true,
    orderUpdates: true,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const prefs = await notificationsService.getPreferences();
        if (mounted) setNotifications(prefs);
      } catch (e) {
        console.error('Error loading notification preferences:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleSwitch = (key) => {
    setNotifications((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };
      notificationsService.savePreferences(next).catch((e) => {
        console.error('Error saving notification preferences:', e);
      });
      return next;
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Cargando preferencias...</Text>
        </View>
      ) : null}

      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Notificaciones push</Text>
        <Switch
          value={notifications.push}
          onValueChange={() => toggleSwitch('push')}
          trackColor={{ false: '#767577', true: '#8B0000' }}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Ofertas y promociones</Text>
        <Switch
          value={notifications.promotions}
          onValueChange={() => toggleSwitch('promotions')}
          trackColor={{ false: '#767577', true: '#8B0000' }}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Actualizaciones de pedidos</Text>
        <Switch
          value={notifications.orderUpdates}
          onValueChange={() => toggleSwitch('orderUpdates')}
          trackColor={{ false: '#767577', true: '#8B0000' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  loadingWrap: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  settingText: {
    fontSize: 16,
  },
});