// Small helpers for the orders/cart screens.
// (Swap formatUGX for JohnPaul's utils/formatters.js once it exists.)

export function formatUGX(amount) {
  const n = Number(amount) || 0;
  return `UGX ${n.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

export function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" });
}

// Reuses the .pill-* classes already in accounts.css.
export const STATUS_PILL = {
  pending: "pill-pending",
  accepted: "pill-approved",
  rejected: "pill-rejected",
  cancelled: "pill-rejected",
};

// Turns a DRF error into one readable string.
export function getOrderError(error, fallback = "Something went wrong.") {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return Array.isArray(data.detail) ? data.detail.join(" ") : String(data.detail);
  const parts = Object.values(data).flat().map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
  return parts.join(" ") || fallback;
}

// Turns a listing from the catalog API (/catalog/listings/ or /catalog/listings/<id>/)
// into the shape the cart stores. Use this whenever you add a listing to the cart.
export function listingToCartItem(listing) {
  const product = listing.product || {};
  return {
    listingId: listing.id,
    name: product.unit ? `${product.name} (${product.unit})` : product.name,
    dealerName: listing.dealer?.business_name ?? "Dealer",
    price: Number(listing.price),
    stock: listing.stock,
  };
}
