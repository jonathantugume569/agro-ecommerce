import axiosClient from "./axiosClient";

// Remove empty filters so they are not sent as ?q=&role=
function clean(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
}

// ---------- Public ----------
export async function getDealers(params) {
  const { data } = await axiosClient.get("/accounts/dealers/", { params: clean(params) });
  return data; // { count, next, previous, results }
}

export async function getDealer(id) {
  const { data } = await axiosClient.get(`/accounts/dealers/${id}/`);
  return data;
}

// ---------- Own profile (farmer or dealer) ----------
export async function getProfile() {
  const { data } = await axiosClient.get("/accounts/profile/");
  return data;
}

export async function updateProfile(payload) {
  const { data } = await axiosClient.patch("/accounts/profile/", payload);
  return data;
}

// ---------- Dealer verification ----------
export async function getMyVerifications() {
  const { data } = await axiosClient.get("/accounts/verification/");
  return data.results ?? data; // array, newest first
}

// formData must contain: document (file) and optionally notes
export async function submitVerification(formData) {
  const { data } = await axiosClient.post("/accounts/verification/", formData);
  return data;
}

// ---------- Admin ----------
export async function getAdminVerifications(params) {
  const { data } = await axiosClient.get("/accounts/admin/verifications/", {
    params: clean(params),
  });
  return data; // { count, next, previous, results }
}

// action: "approve" | "reject"
export async function reviewVerification(id, { action, admin_notes = "" }) {
  const { data } = await axiosClient.post(`/accounts/admin/verifications/${id}/review/`, {
    action,
    admin_notes,
  });
  return data;
}

export async function getAdminUsers(params) {
  const { data } = await axiosClient.get("/accounts/admin/users/", { params: clean(params) });
  return data; // { count, next, previous, results }
}
