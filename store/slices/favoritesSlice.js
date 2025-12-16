import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'favorites';

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeList = (value) => (Array.isArray(value) ? value : []);

export const loadFavoritesFromStorage = createAsyncThunk('favorites/loadFromStorage', async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return normalizeList(safeParse(raw, []));
});

export const persistFavoritesToStorage = createAsyncThunk(
  'favorites/persistToStorage',
  async (_, { getState }) => {
    const state = getState();
    const favorites = normalizeList(state?.favorites?.items);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return true;
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [],
    hydrated: false,
  },
  reducers: {
    addFavorite(state, action) {
      const product = action.payload;
      if (!product?.id) return;

      const exists = state.items.some((p) => String(p.id) === String(product.id));
      if (exists) return;

      state.items.unshift(product);
    },
    removeFavorite(state, action) {
      const productId = action.payload;
      state.items = state.items.filter((p) => String(p.id) !== String(productId));
    },
    toggleFavorite(state, action) {
      const product = action.payload;
      if (!product?.id) return;

      const exists = state.items.some((p) => String(p.id) === String(product.id));
      if (exists) {
        state.items = state.items.filter((p) => String(p.id) !== String(product.id));
      } else {
        state.items.unshift(product);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadFavoritesFromStorage.fulfilled, (state, action) => {
      state.items = normalizeList(action.payload);
      state.hydrated = true;
    });
  },
});

export const { addFavorite, removeFavorite, toggleFavorite } = favoritesSlice.actions;

export const selectFavorites = (state) => normalizeList(state?.favorites?.items);
export const selectIsFavorite = (productId) => (state) =>
  normalizeList(state?.favorites?.items).some((p) => String(p.id) === String(productId));

export default favoritesSlice.reducer;
