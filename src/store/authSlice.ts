import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  isAuthenticated: boolean;
}

const savedToken = localStorage.getItem('token');
const savedRefreshToken = localStorage.getItem('refreshToken');
const isValidToken = savedToken && savedToken !== 'undefined' && savedToken !== 'null';

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      return JSON.parse(savedUser);
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
  }
  return null;
};

const initialState: AuthState = {
  token: isValidToken ? savedToken : null,
  refreshToken: isValidToken ? savedRefreshToken : null,
  user: isValidToken ? getSavedUser() : null,
  isAuthenticated: !!isValidToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; refreshToken: string; user: any }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    tokenRefreshed: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
});

export const { loginSuccess, tokenRefreshed, logout } = authSlice.actions;
export default authSlice.reducer;
