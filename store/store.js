import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import cartReducer, {
    addToCart,
    clearCart,
    removeFromCart,
    updateQuantity,
} from './slices/cartSlice';
import favoritesReducer, {
    addFavorite,
    removeFavorite,
    toggleFavorite,
} from './slices/favoritesSlice';
import notificationsReducer from './slices/notificationsSlice';

const persistMiddleware = createListenerMiddleware();

persistMiddleware.startListening({
  matcher: isAnyOf(addToCart, removeFromCart, updateQuantity, clearCart),
  effect: async (_, api) => {
    const state = api.getState();
    const items = Array.isArray(state?.cart?.items) ? state.cart.items : [];
    await AsyncStorage.setItem('cart', JSON.stringify(items));
  },
});

persistMiddleware.startListening({
  matcher: isAnyOf(addFavorite, removeFavorite, toggleFavorite),
  effect: async (_, api) => {
    const state = api.getState();
    const items = Array.isArray(state?.favorites?.items) ? state.favorites.items : [];
    await AsyncStorage.setItem('favorites', JSON.stringify(items));
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    favorites: favoritesReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).prepend(persistMiddleware.middleware),
});

export default store;
