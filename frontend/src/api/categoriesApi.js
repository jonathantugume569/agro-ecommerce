
import axiosClient from "./axiosClient";

export async function getCategories() {
  const { data } = await axiosClient.get("/catalog/categories/");
  return data;
}

export async function createCategory(category) {
  const { data } = await axiosClient.post(
    "/catalog/categories/",
    category
  );
  return data;
}

export async function updateCategory(id, category) {
  const { data } = await axiosClient.patch(
    `/catalog/categories/${id}/`,
    category
  );
  return data;
}

export async function deleteCategory(id) {
  const { data } = await axiosClient.delete(
    `/catalog/categories/${id}/`
  );
  return data;
}
