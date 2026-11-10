import axiosClient from "./axiosClient";

export async function register(payload) {
  const { data } = await axiosClient.post("/accounts/register/", payload);
  return data;
}

// Returns { access, refresh, user }
export async function login(credentials) {
  const { data } = await axiosClient.post("/accounts/login/", credentials);
  return data;
}

export async function refreshToken(refresh) {
  const { data } = await axiosClient.post("/accounts/token/refresh/", { refresh });
  return data;
}

export async function getMe() {
  const { data } = await axiosClient.get("/accounts/me/");
  return data;
}
