import { useEffect, useState } from "react";
import { createProduct } from "../../api/productsApi";
import { getCategories } from "../../api/categoriesApi";
import "../../styles/product-form.css";

export default function ProductForm({ onProductCreated }) {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError("Failed to load categories.");
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !category) {
      setError("Product name and category are required.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("description", description);
      formData.append("unit", unit);

      if (image) {
        formData.append("image", image);
      }

      const product = await createProduct(formData);

      setSuccess("Product created successfully!");

      setName("");
      setCategory("");
      setDescription("");
      setUnit("");
      setImage(null);
      setPreview("");

      if (onProductCreated) {
        onProductCreated(product);
      }
    } catch (err) {
      const data = err.response?.data;

      setError(
        typeof data === "object"
          ? Object.entries(data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
              .join(" | ")
          : "Failed to create product."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2>Add Product</h2>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="form-group">
        <label>Product Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Maize seeds"
          required
        />
      </div>

      <div className="form-group">
        <label>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the product"
        />
      </div>

      <div className="form-group">
        <label>Unit</label>
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="e.g. kg, bag, litre"
        />
      </div>

      <div className="form-group">
        <label>Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        <small>Maximum image size: 5 MB</small>
      </div>

      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Product preview" />
          <button
            type="button"
            onClick={() => {
              setImage(null);
              setPreview("");
            }}
          >
            Remove image
          </button>
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Create Product"}
      </button>
    </form>
  );
}