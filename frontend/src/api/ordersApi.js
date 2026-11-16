import axiosClient from "./axiosClient";

// Place the whole cart. Backend splits it into one order per dealer and returns a LIST.
// items: [{ listing: <listingId>, quantity: <n> }]
export async function placeOrders({ items, delivery_address, notes = "" }) {
  const { data } = await axiosClient.post("/orders/", { items, delivery_address, notes });
  return data;
}

// Paginated: { count, next, previous, results }. params: { status, page }
export async function getOrders(params = {}) {
  const { data } = await axiosClient.get("/orders/", { params });
  return data;
}

export async function getOrder(id) {
  const { data } = await axiosClient.get(`/orders/${id}/`);
  return data;
}

export async function cancelOrder(id) {
  const { data } = await axiosClient.post(`/orders/${id}/cancel/`);
  return data;
}

export async function acceptOrder(id) {
  const { data } = await axiosClient.post(`/orders/${id}/accept/`);
  return data;
}

export async function rejectOrder(id) {
  const { data } = await axiosClient.post(`/orders/${id}/reject/`);
  return data;
}
