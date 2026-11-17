// Catalog API: categories, products, listings and price comparison.
// All paths are relative to the shared axios client (base URL ends in /api).
import axiosClient from "../utils/axiosClient";
import { clean } from "../utils/formatters";

// ---------- Categories ----------
export async function getCategories() {
  const { data } = await axiosClient.get("/catalog/categories/");
  return data; // plain array, not paginated
}

// ---------- Products ----------
// params: search, category, category_slug, min_price, max_price, location,
//         verified_only, in_stock, ordering, page, page_size
export async function getProducts(params = {}) {
  const { data } = await axiosClient.get("/catalog/products/", { params: clean(params) });
  return data; // { count, next, previous, results }
}

export async function getProduct(id) {
  const { data } = await axiosClient.get(`/catalog/products/${id}/`);
  return data;
}

// A verified dealer can add a product that is not in the catalog yet.
// payload: { name, category, unit, description } (or FormData when sending an image)
export async function createProduct(payload) {
  const { data } = await axiosClient.post("/catalog/products/", payload);
  return data;
}

// Every dealer's price for one product, cheapest first.
// Returns { product, summary: { count, cheapest_price, highest_price, average_price,
// cheapest_listing_id }, listings: [... is_cheapest, below_average, difference_from_average] }
export async function compareProduct(id) {
  const { data } = await axiosClient.get(`/catalog/products/${id}/compare/`);
  return data;
}

// ---------- Listings ----------
// Public browse of active listings.
// params: search, category, category_slug, product, dealer, min_price, max_price,
//         location, verified_only, in_stock, ordering (price, -price, created_at, stock), page, page_size
export async function getListings(params = {}) {
  const { data } = await axiosClient.get("/catalog/listings/", { params: clean(params) });
  return data;
}

// The signed-in dealer's own listings, including hidden ones.
export async function getMyListings(params = {}) {
  const { data } = await axiosClient.get("/catalog/listings/mine/", { params: clean(params) });
  return data;
}

export async function getListing(id) {
  const { data } = await axiosClient.get(`/catalog/listings/${id}/`);
  return data;
}

// payload: { product_id, price, stock, location, description, is_active }
export async function createListing(payload) {
  const { data } = await axiosClient.post("/catalog/listings/", payload);
  return data;
}

// payload: any of { price, stock, location, description, is_active }
export async function updateListing(id, payload) {
  const { data } = await axiosClient.patch(`/catalog/listings/${id}/`, payload);
  return data;
}

// Resolves to { deactivated: boolean, message }. A listing that already has orders is
// hidden instead of deleted.
export async function deleteListing(id) {
  const response = await axiosClient.delete(`/catalog/listings/${id}/`);
  return {
    deactivated: response.status === 200,
    message: response.data?.detail ?? "",
  };
}
