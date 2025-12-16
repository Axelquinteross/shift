import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'cart';

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeCart = (value) => (Array.isArray(value) ? value : []);

export const loadCartFromStorage = createAsyncThunk('cart/loadFromStorage', async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return normalizeCart(safeParse(raw, []));
});

export const persistCartToStorage = createAsyncThunk('cart/persistToStorage', async (_, { getState }) => {
  const state = getState();
  const cart = normalizeCart(state?.cart?.items);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  return true;
});

const initialState = {
  items: [],
  hydrated: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action) {
      const product = action.payload;
      if (!product?.id) return;

      const idx = state.items.findIndex((i) => String(i.id) === String(product.id));
      if (idx >= 0) {
        state.items[idx] = {
          ...state.items[idx],
          quantity: Number(state.items[idx]?.quantity ?? 0) + 1,
        };
      } else {
        state.items.push({ ...product, quantity: 1 });
      }
    },
    removeFromCart(state, action) {
      const productId = action.payload;
      state.items = state.items.filter((i) => String(i.id) !== String(productId));
    },
    updateQuantity(state, action) {
      const { productId, quantity } = action.payload ?? {};
      if (!productId) return;

      const q = Number(quantity);
      if (!Number.isFinite(q) || q < 1) {
        state.items = state.items.filter((i) => String(i.id) !== String(productId));
        return;
      }

      state.items = state.items.map((i) =>
        String(i.id) === String(productId) ? { ...i, quantity: q } : i
      );
    },
    clearCart(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadCartFromStorage.fulfilled, (state, action) => {
      state.items = normalizeCart(action.payload);
      state.hydrated = true;
    });
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

export const selectCartItems = (state) => normalizeCart(state?.cart?.items);
export const selectCartCount = (state) =>
  normalizeCart(state?.cart?.items).reduce((acc, item) => acc + Number(item?.quantity ?? 0), 0);
export const selectCartTotal = (state) =>
  normalizeCart(state?.cart?.items)
    .reduce((total, item) => {
      const price = Number.isFinite(Number(item?.price)) ? Number(item.price) : 0;
      const quantity = Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 0;
      return total + price * quantity;
    }, 0)
    .toFixed(2);

export default cartSlice.reducer;
