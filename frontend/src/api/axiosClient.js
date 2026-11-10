// Shared Axios instance (JohnPaul owns this file; included so the auth code runs).
import axios from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "../utils/tokenStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const axiosClient = axios.create({ baseURL: API_URL });

// Attach the JWT to every request.
axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the access token expired, get a new one once and retry the request.
let refreshPromise = null;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";
    const isAuthCall = url.includes("/accounts/login/") || url.includes("/accounts/token/refresh/");

    if (status === 401 && original && !original._retry && !isAuthCall && getRefreshToken()) {
      original._retry = true;
      try {
        refreshPromise =
          refreshPromise ||
          axios
            .post(`${API_URL}/accounts/token/refresh/`, { refresh: getRefreshToken() })
            .finally(() => {
              refreshPromise = null;
            });
        const { data } = await refreshPromise;
        saveTokens({ access: data.access, refresh: data.refresh });
        original.headers.Authorization = `Bearer ${data.access}`;
        return axiosClient(original);
      } catch (refreshError) {
        clearSession();
        window.location.assign("/login");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
