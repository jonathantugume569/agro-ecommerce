
import axiosClient from "./axiosClient";

// ADMIN: Fetch users.
export async function getAdminUsers(params = {}) {
  const { data } = await axiosClient.get(
    "/accounts/admin/users/",
    { params }
  );

  return data;
}

// ADMIN: Fetch dealer verification requests.
export async function getAdminVerifications(params = {}) {
  const { data } = await axiosClient.get(
    "/accounts/admin/verifications/",
    { params }
  );

  return data;
}

// DEALER: Fetch the logged-in dealer's verification request(s).
export async function getMyVerifications(params = {}) {
  const { data } = await axiosClient.get(
    "/accounts/verification/",
    { params }
  );

  // Ensure the dashboard receives an array.
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (data && typeof data === "object" && data.status) return [data];

  return [];
}

// DEALER: Fetch the logged-in user's profile.
export async function getProfile() {
  const { data } = await axiosClient.get("/accounts/profile/");
  return data;
}
