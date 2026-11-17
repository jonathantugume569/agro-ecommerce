import axiosClient from "./axiosClient";

// URLs that belong to your teammates' apps (orders, catalog).
// If a stat card shows "-", the URL below probably differs from the real one:
// check that app's urls.py and change it here. Nothing else needs editing.
export const DASHBOARD_ENDPOINTS = {
  orders: "/orders/",
  myListings: "/catalog/listings/mine/",
};

// Works for paginated ({count, results}) and plain-array responses.
export const countOf = (data) => {
  if (typeof data?.count === "number") return data.count;
  return Array.isArray(data) ? data.length : 0;
};

export const itemsOf = (data) => data?.results ?? (Array.isArray(data) ? data : []);

// Returns a number, or null when the endpoint is missing or fails.
// It never throws, so one broken URL cannot break the whole dashboard.
export async function getCount(url, params = {}) {
  try {
    const { data } = await axiosClient.get(url, { params: { ...params, page_size: 1 } });
    if (typeof data?.count === "number") return data.count;
    if (Array.isArray(data)) return data.length;
    return null;
  } catch {
    return null;
  }
}