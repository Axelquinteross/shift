import Constants from 'expo-constants';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Provider, useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { notificationsService, subscribeToNotifications } from '../services/notificationsService';
import { ordersService } from '../services/ordersService';
import { setAuthState } from '../store/slices/authSlice';
import { loadCartFromStorage } from '../store/slices/cartSlice';
import { loadFavoritesFromStorage } from '../store/slices/favoritesSlice';
import { loadNotifications } from '../store/slices/notificationsSlice';
import store from '../store/store';

const ENABLE_IN_APP_TOASTS = true;

type InAppNotification = {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  read: boolean;
  orderId?: string | null;
  type?: string | null;
};

function RootLayoutContent() {
  const { loading, isAuth, user } = useAuth() as any;
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();
  const [toast, setToast] = useState<InAppNotification | null>(null);
  const toastY = useRef(new Animated.Value(-120)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shippingTickRef = useRef(false);

  useEffect(() => {
    dispatch(loadCartFromStorage());
    dispatch(loadFavoritesFromStorage());
    dispatch(loadNotifications());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      setAuthState({
        user: null,
        isAuth,
        loading,
      })
    );
  }, [dispatch, isAuth, loading]);

  useEffect(() => {
    if (Constants?.appOwnership !== 'expo') return;

    const originalError = console.error;
    const originalWarn = console.warn;

    const shouldIgnore = (args: unknown[]) => {
      const first = args?.[0];
      const msg = typeof first === 'string' ? first : '';
      return msg.includes('expo-notifications: Android Push notifications') ||
        msg.includes('expo-notifications` functionality is not fully supported in Expo Go');
    };

    console.error = (...args: unknown[]) => {
      if (shouldIgnore(args)) return;
      originalError(...(args as any));
    };

    console.warn = (...args: unknown[]) => {
      if (shouldIgnore(args)) return;
      originalWarn(...(args as any));
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    const setup = async () => {
      try {
        if (Platform.OS === 'web') return;
        if (Constants?.appOwnership === 'expo') return;

        const Notifications = await import('expo-notifications');

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        const perms = await Notifications.getPermissionsAsync();
        if (perms.status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
          });
        }
      } catch (e) {
        console.error('Notifications setup error:', e);
      }
    };

    setup();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (isAuth === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const emailVerified = !!user?.emailVerified;

    // Solo redirigir si estamos en una página incorrecta
    if (isAuth && !emailVerified) {
      const inVerifyEmail = segments[0] === '(auth)' && segments[1] === 'verify-email';
      if (!inVerifyEmail) router.replace('/(auth)/verify-email');
      return;
    }

    if (isAuth && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isAuth && !inAuthGroup && !inTabsGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuth, loading, segments, user?.emailVerified]);

  useEffect(() => {
    if (!ENABLE_IN_APP_TOASTS) return;
    const unsubscribe = subscribeToNotifications((notification: InAppNotification) => {
      setToast(notification);
      dispatch(loadNotifications());
    });

    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    if (loading) return;
    if (!isAuth) return;
    if (!user?.emailVerified) return;

    let cancelled = false;

    const tick = async () => {
      if (shippingTickRef.current) return;
      shippingTickRef.current = true;

      try {
        const orders = await ordersService.getOrders();
        const nowMs = Date.now();

        for (const order of orders) {
          if (cancelled) break;
          if (!order?.id) continue;

          const idx = Number.isFinite(Number(order?.shipping?.stepIndex))
            ? Number(order.shipping.stepIndex)
            : 0;

          const currentStatus = ordersService.shippingSteps[idx] ?? order?.shipping?.status;
          if (currentStatus === 'Entregado') continue;

          const last = order?.shipping?.updatedAt;
          const lastMs = last ? new Date(last).getTime() : 0;

          // Avanza cada 5 segundos
          if (nowMs - lastMs < 5000) continue;

          const nextIdx = Math.min(idx + 1, ordersService.shippingSteps.length - 1);
          const nextStatus = ordersService.shippingSteps[nextIdx];

          await ordersService.updateOrder(order.id, {
            shipping: { status: nextStatus, stepIndex: nextIdx },
          });

          if (nextStatus === 'Preparando') {
            await notificationsService.ensureOrderNotification({
              orderId: order.id,
              type: 'preparing',
              title: 'Pedido confirmado',
              body: 'Estamos preparando tu pedido',
            });
          }

          if (nextStatus === 'Despachado') {
            await notificationsService.ensureOrderNotification({
              orderId: order.id,
              type: 'dispatched',
              title: 'Pedido despachado',
              body: 'Tu pedido fue despachado',
            });
          }

          if (nextStatus === 'En camino') {
            await notificationsService.ensureOrderNotification({
              orderId: order.id,
              type: 'on_the_way',
              title: 'En camino',
              body: 'Tu pedido está en camino',
            });
          }

          if (nextStatus === 'En la puerta') {
            await notificationsService.ensureOrderNotification({
              orderId: order.id,
              type: 'door',
              title: 'Repartidor',
              body: 'El repartidor está en la puerta',
            });
          }

          if (nextStatus === 'Entregado') {
            await notificationsService.ensureOrderNotification({
              orderId: order.id,
              type: 'delivered',
              title: 'Entrega exitosa',
              body: 'Gracias por tu compra!',
            });

            await notificationsService.ensureOrderNotification({
              orderId: order.id,
              type: 'rate',
              title: '¿Cómo fue tu compra?',
              body: 'Calificá tu pedido con estrellas',
            });
          }
        }
      } catch (e) {
        console.error('Shipping scheduler error:', e);
      } finally {
        shippingTickRef.current = false;
      }
    };

    const interval = setInterval(() => {
      tick();
    }, 1000);

    // También disparar una vez al iniciar
    tick();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuth, loading]);

  useEffect(() => {
    if (!ENABLE_IN_APP_TOASTS) return;
    if (!toast) return;

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }

    toastY.setValue(-120);
    Animated.timing(toastY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();

    toastTimer.current = setTimeout(() => {
      Animated.timing(toastY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 2800);

    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
        toastTimer.current = null;
      }
    };
  }, [toast, toastY]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return (
    <>
      {ENABLE_IN_APP_TOASTS && !!toast && (
        <Animated.View style={[styles.toastWrap, { transform: [{ translateY: toastY }] }]} pointerEvents="box-none">
          <Pressable
            style={styles.toast}
            onPress={() => {
              if (toast?.orderId && toast?.type === 'rate') {
                router.push((`/rate/${toast.orderId}` as unknown) as any);
                return;
              }
              if (toast?.orderId) router.push((`/orders/${toast.orderId}` as unknown) as any);
              router.push(('/notifications' as unknown) as any);
            }}
          >
            <Text style={styles.toastTitle} numberOfLines={1}>{toast.title}</Text>
            <Text style={styles.toastBody} numberOfLines={2}>{toast.body}</Text>
          </Pressable>
        </Animated.View>
      )}
      <Stack screenOptions={{
        headerStyle: { backgroundColor: '#8B0000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />

        {/* Rutas de la cuenta */}
        <Stack.Screen 
          name="account/edit-profile" 
          options={{ 
            title: 'Editar Perfil',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="account/payment-methods" 
          options={{ 
            title: 'Métodos de Pago',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="account/addresses" 
          options={{ 
            title: 'Mis Direcciones',
            headerShown: true
          }} 
        />

        <Stack.Screen 
          name="account/my-listings" 
          options={{ 
            title: 'Mis publicaciones',
            headerShown: true
          }} 
        />

        <Stack.Screen 
          name="account/create-listing" 
          options={{ 
            title: 'Crear publicación',
            headerShown: true
          }} 
        />

        {/* Otras rutas */}
        <Stack.Screen 
          name="orders/index" 
          options={{ 
            title: 'Mis Pedidos',
            headerShown: true
          }} 
        />

        <Stack.Screen
          name="checkout"
          options={{
            title: 'Checkout',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="orders/[id]"
          options={{
            title: 'Seguimiento',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="rate/[orderId]"
          options={{
            title: 'Calificar',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="notifications"
          options={{
            title: 'Notificaciones',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="favorites/index" 
          options={{ 
            title: 'Favoritos',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="product/[id]" 
          options={{ 
            title: 'Producto',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="settings/notifications" 
          options={{ 
            title: 'Preferencias de notificaciones',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="settings/privacy" 
          options={{ 
            title: 'Privacidad',
            headerShown: true
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  toast: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  toastTitle: {
    color: '#fff',
    fontWeight: '900',
    marginBottom: 2,
  },
  toastBody: {
    color: '#ddd',
    fontWeight: '600',
  },
});
