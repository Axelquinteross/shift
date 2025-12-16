import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectCartCount } from '../../store/slices/cartSlice';

function CartTabButton({ onPress, accessibilityState, style }) {
  const count = useSelector(selectCartCount);
  const focused = !!accessibilityState?.selected;

  return (
    <View style={[style, styles.cartTabWrap]} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.cartFab, focused && styles.cartFabFocused]}
      >
        <Ionicons name="cart" size={26} color={focused ? '#8B0000' : '#111'} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={[styles.cartLabel, focused && styles.cartLabelFocused]}>Carrito</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#8B0000',
        },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#8B0000',
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrito',
          tabBarIcon: () => null,
          tabBarButton: (props) => <CartTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cartTabWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  cartFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    transform: [{ translateY: -14 }],
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  cartFabFocused: {
    borderColor: 'rgba(139,0,0,0.35)',
  },
  cartLabel: {
    marginTop: 2,
    transform: [{ translateY: -10 }],
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  cartLabelFocused: {
    color: '#8B0000',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
});