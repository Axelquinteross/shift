import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { notificationsService } from '../../services/notificationsService';

const normalizeList = (value) => (Array.isArray(value) ? value : []);

export const loadNotifications = createAsyncThunk('notifications/load', async () => {
  const list = await notificationsService.getNotifications();
  return normalizeList(list);
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
  const list = await notificationsService.markAllRead();
  return normalizeList(list);
});

export const clearAllNotifications = createAsyncThunk('notifications/clearAll', async () => {
  await notificationsService.clearAll();
  return [];
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id) => {
  const list = await notificationsService.markRead(id);
  return normalizeList(list);
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    hydrated: false,
  },
  reducers: {
    setNotifications(state, action) {
      state.items = normalizeList(action.payload);
      state.hydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.items = normalizeList(action.payload);
        state.hydrated = true;
      })
      .addCase(markAllRead.fulfilled, (state, action) => {
        state.items = normalizeList(action.payload);
      })
      .addCase(clearAllNotifications.fulfilled, (state, action) => {
        state.items = normalizeList(action.payload);
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.items = normalizeList(action.payload);
      });
  },
});

export const { setNotifications } = notificationsSlice.actions;

export const selectNotifications = (state) => normalizeList(state?.notifications?.items);
export const selectUnreadCount = (state) =>
  normalizeList(state?.notifications?.items).reduce((acc, n) => acc + (n?.read ? 0 : 1), 0);

export default notificationsSlice.reducer;
