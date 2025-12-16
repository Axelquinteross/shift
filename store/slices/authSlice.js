import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuth: null,
    loading: true,
  },
  reducers: {
    setAuthState(state, action) {
      const { user, isAuth, loading } = action.payload ?? {};
      if (typeof loading === 'boolean') state.loading = loading;
      if (typeof isAuth === 'boolean' || isAuth === null) state.isAuth = isAuth;
      if (user !== undefined) state.user = user;
    },
    clearAuthState(state) {
      state.user = null;
      state.isAuth = false;
      state.loading = false;
    },
  },
});

export const { setAuthState, clearAuthState } = authSlice.actions;

export const selectAuthUser = (state) => state?.auth?.user ?? null;
export const selectIsAuth = (state) => state?.auth?.isAuth ?? null;
export const selectAuthLoading = (state) => Boolean(state?.auth?.loading);

export default authSlice.reducer;
