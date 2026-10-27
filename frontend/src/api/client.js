import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('lmswlc_auth');
    const auth = raw ? JSON.parse(raw) : null;
    if (auth?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
  } catch {
    /* ignore */
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const payload = data.data;
        localStorage.setItem(
          'lmswlc_auth',
          JSON.stringify({ user: payload.user, accessToken: payload.accessToken })
        );
        original.headers.Authorization = `Bearer ${payload.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('lmswlc_auth');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
