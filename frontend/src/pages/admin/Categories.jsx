
import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categoriesApi";
import { getErrorMessage } from "../../utils/formatters";
import "../../styles/categories.css";

const emptyForm = {
  name: "",
  description: "",
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    try {
      setError("");
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load categories."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const categoryData = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (editingId) {
        await updateCategory(editingId, categoryData);
        setSuccess("Category updated successfully.");
      } else {
        await createCategory(categoryData);
        setSuccess("Category created successfully.");
      }

      resetForm();
      await loadCategories();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save category."));
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(category) {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      description: category.description || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteCategory(category.id);

      setSuccess("Category deleted successfully.");

      if (editingId === category.id) {
        resetForm();
      }

      await loadCategories();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not delete category. Products may still belong to it."
        )
      );
    }
  }

  return (
    <div className="page categories-page">
      <div className="dash-head">
        <div>
          <h1>Manage Categories</h1>
          <p className="muted">
            Create and manage agricultural product categories.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {success && (
        <div className="alert alert-success">{success}</div>
      )}

      <section className="category-form-card">
        <div className="category-section-heading">
          <div>
            <h2>{editingId ? "Edit Category" : "Add New Category"}</h2>
            <p className="muted">
              {editingId
                ? "Update the category information."
                : "Enter the details of the new category."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="category-form">
          <div className="form-group">
            <label htmlFor="category-name">Category Name</label>
            <input
              id="category-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Fertilizers"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category-description">Description</label>
            <textarea
              id="category-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe this product category..."
              rows={3}
            />
          </div>

          <div className="category-form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Category"
                  : "Create Category"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="category-list-section">
        <div className="category-section-heading">
          <div>
            <h2>Existing Categories</h2>
            <p className="muted">
              {categories.length} categories available
            </p>
          </div>
        </div>

        {loading ? (
          <p className="dash-empty">Loading categories...</p>
        ) : categories.length === 0 ? (
          <div className="category-empty">
            <h3>No categories available</h3>
            <p>Create your first agricultural product category.</p>
          </div>
        ) : (
          <div className="category-card-grid">
            {categories.map((category) => (
              <article className="category-card" key={category.id}>
                <div className="category-card-top">
                  <div className="category-icon">
                    <span>🌱</span>
                  </div>

                  <span className="category-id">
                    #{category.id}
                  </span>
                </div>

                <div className="category-card-content">
                  <h3>{category.name}</h3>

                  <p>
                    {category.description ||
                      "No description provided for this category."}
                  </p>
                </div>

                <div className="category-card-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(category)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
