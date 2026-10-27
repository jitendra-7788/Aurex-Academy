import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

const stored = (() => {
  try {
    return JSON.parse(localStorage.getItem('lmswlc_auth') || 'null');
  } catch {
    return null;
  }
})();

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    return data.data;
  } catch (err) {
    const details = err.response?.data?.details;
    const msg =
      (Array.isArray(details) ? details.map((d) => d.message || d).join(', ') : null) ||
      err.response?.data?.message ||
      'Login failed';
    return rejectWithValue(msg);
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  } catch (err) {
    const details = err.response?.data?.details;
    const msg =
      (Array.isArray(details) ? details.map((d) => d.message || d).join(', ') : null) ||
      err.response?.data?.message ||
      'Registration failed';
    return rejectWithValue(msg);
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    /* ignore */
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored?.user || null,
    accessToken: stored?.accessToken || null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      localStorage.setItem(
        'lmswlc_auth',
        JSON.stringify({ user: state.user, accessToken: state.accessToken })
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        localStorage.setItem(
          'lmswlc_auth',
          JSON.stringify({ user: state.user, accessToken: state.accessToken })
        );
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload.accessToken) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          localStorage.setItem(
            'lmswlc_auth',
            JSON.stringify({ user: state.user, accessToken: state.accessToken })
          );
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = typeof action.payload === 'string' ? action.payload : 'Registration failed';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem(
          'lmswlc_auth',
          JSON.stringify({ user: state.user, accessToken: state.accessToken })
        );
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        localStorage.removeItem('lmswlc_auth');
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        localStorage.removeItem('lmswlc_auth');
      });
  },
});

export const { clearAuthError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
