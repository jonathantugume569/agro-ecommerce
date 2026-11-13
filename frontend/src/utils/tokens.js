const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const USER_KEY = "user";

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: ignore */
  }
}

export const getAccessToken = () => read(ACCESS_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);

export function saveTokens({ access, refresh }) {
  if (access) write(ACCESS_KEY, access);
  if (refresh) write(REFRESH_KEY, refresh);
}

export function getStoredUser() {
  try {
    const raw = read(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user) {
  write(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}
