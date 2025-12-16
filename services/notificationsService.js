import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const STORAGE_KEY = 'notifications';
const PREFS_KEY = 'notification_preferences';

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeList = (value) => (Array.isArray(value) ? value : []);

const listeners = new Set();

const ENABLE_IN_APP_TOASTS = true;

const isExpoGo = Constants?.appOwnership === 'expo';

export const subscribeToNotifications = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const emitNotification = (notification) => {
  listeners.forEach((listener) => {
    try {
      listener(notification);
    } catch (e) {
      console.error('Notification listener error:', e);
    }
  });
};

const showSystemNotification = async (notification) => {
  try {
    if (Platform.OS === 'web') return;
    if (isExpoGo) return;

    const Notifications = await import('expo-notifications');

    await Notifications.scheduleNotificationAsync({
      content: {
        ...(Platform.OS === 'android' ? { channelId: 'default' } : null),
        title: notification?.title ?? 'Notificación',
        body: notification?.body ?? '',
        sound: 'default',
        data: {
          orderId: notification?.orderId ?? null,
          type: notification?.type ?? null,
        },
      },
      trigger: null,
    });
  } catch (e) {
    console.error('System notification error:', e);
  }
};

const defaultPreferences = {
  email: true,
  push: true,
  promotions: true,
  orderUpdates: true,
};

const orderNotificationTypes = new Set([
  'preparing',
  'dispatched',
  'on_the_way',
  'door',
  'delivered',
  'rate',
]);

export const notificationsService = {
  async getPreferences() {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    const parsed = safeParse(raw, null);
    return {
      ...defaultPreferences,
      ...(parsed && typeof parsed === 'object' ? parsed : null),
    };
  },

  async savePreferences(next) {
    const normalized = {
      ...defaultPreferences,
      ...(next && typeof next === 'object' ? next : null),
    };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(normalized));
    return normalized;
  },

  async getNotifications() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return normalizeList(safeParse(raw, []));
  },

  async saveNotifications(list) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeList(list)));
  },

  async clearAll() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  },

  async addNotification(notification) {
    const prefs = await this.getPreferences();

    const type = notification?.type ?? null;
    const isOrderType = type ? orderNotificationTypes.has(String(type)) : false;

    if (isOrderType && prefs?.orderUpdates === false) {
      return null;
    }

    const list = await this.getNotifications();
    const next = [notification, ...list];
    await this.saveNotifications(next);

    if (prefs?.push !== false) {
      await showSystemNotification(notification);
    }

    if (ENABLE_IN_APP_TOASTS && prefs?.push !== false) {
      emitNotification(notification);
    }
    return notification;
  },

  async markAllRead() {
    const list = await this.getNotifications();
    const next = list.map((n) => ({ ...n, read: true }));
    await this.saveNotifications(next);
    return next;
  },

  async markRead(id) {
    const list = await this.getNotifications();
    const next = list.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n));
    await this.saveNotifications(next);
    return next;
  },

  async getUnreadCount() {
    const list = await this.getNotifications();
    return list.reduce((acc, n) => acc + (n?.read ? 0 : 1), 0);
  },

  createNotification({ title, body, orderId, type }) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = new Date().toISOString();

    return {
      id,
      createdAt: now,
      title: title ?? 'Notificación',
      body: body ?? '',
      read: false,
      orderId: orderId ?? null,
      type: type ?? null,
    };
  },

  async ensureOrderNotification({ orderId, type, title, body }) {
    const list = await this.getNotifications();
    const exists = list.some(
      (n) => String(n?.orderId) === String(orderId) && String(n?.type) === String(type)
    );

    if (exists) return null;

    const notif = this.createNotification({ title, body, orderId, type });
    await this.addNotification(notif);
    return notif;
  },
};
