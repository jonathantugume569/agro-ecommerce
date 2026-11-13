import axiosClient from "./axiosClient";

const url = (orderId, action = "") => `/logistics/orders/${orderId}/${action}`;

export const getDelivery = (orderId) =>
  axiosClient.get(url(orderId)).then((res) => res.data);

export const updateDeliveryStatus = (orderId, status, note = "") =>
  axiosClient.post(url(orderId, "status/"), { status, note }).then((res) => res.data);

export const confirmReceipt = (orderId) =>
  axiosClient.post(url(orderId, "confirm/")).then((res) => res.data);