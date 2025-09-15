import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userName: null,
    roles: [],
    isAuthenticated: false,
    loading: false,
  },
  reducers: {
    setUser(state, action) {
      state.userName = action.payload.userName;
      state.roles = action.payload.roles;
      state.isAuthenticated = true;
      state.loading = false;
    },
    clearUser(state) {
      state.userName = null;
      state.roles = [];
      state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
