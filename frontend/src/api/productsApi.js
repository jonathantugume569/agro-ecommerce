
import axiosClient from "./axiosClient";

// CATEGORIES
export async function getCategories(params = {}) {
  const { data } = await axiosClient.get("/catalog/categories/", { params });
  return data;
}

// PRODUCTS
export async function getProducts(params = {}) {
  const { data } = await axiosClient.get("/catalog/products/", { params });
  return data;
}

export async function createProduct(productData) {
  const { data } = await axiosClient.post(
    "/catalog/products/",
    productData
  );
  return data;
}

export async function updateProduct(id, productData) {
  const { data } = await axiosClient.patch(
    `/catalog/products/${id}/`,
    productData
  );
  return data;
}

export async function deleteProduct(id) {
  const { data } = await axiosClient.delete(
    `/catalog/products/${id}/`
  );
  return data;
}

// LISTINGS
export async function getMyListings(params = {}) {
  const { data } = await axiosClient.get(
    "/catalog/listings/mine/",
    { params }
  );
  return data;
}

export async function getListing(id) {
  const { data } = await axiosClient.get(
    `/catalog/listings/${id}/`
  );
  return data;
}

export async function createListing(listingData) {
  const { data } = await axiosClient.post(
    "/catalog/listings/",
    listingData
  );
  return data;
}

export async function updateListing(id, listingData) {
  const { data } = await axiosClient.patch(
    `/catalog/listings/${id}/`,
    listingData
  );
  return data;
}

export async function deleteListing(id) {
  const { data } = await axiosClient.delete(
    `/catalog/listings/${id}/`
  );
  return data;
}

// PUBLIC FARMER LISTINGS
export async function getAvailableListings(params = {}) {
  const { data } = await axiosClient.get(
    "/catalog/listings/",
    { params }
  );

  return data;
}