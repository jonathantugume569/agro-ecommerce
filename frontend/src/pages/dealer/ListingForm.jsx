import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PlusIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import {
  createListing,
  createProduct,
  getCategories,
  getListing,
  getProducts,
  updateListing,
} from "../../api/productsApi";
import { getErrorMessage, getFieldErrors } from "../../utils/formatters";

const EMPTY_FORM = { product_id: "", price: "", stock: "", location: "", description: "", is_active: true };
const EMPTY_PRODUCT = { name: "", category: "", unit: "", description: "" };

// The API returns errors as { field: ["message"] }. Turn each into one string.
function toMessages(error) {
  const raw = getFieldErrors(error);
  const messages = {};
  Object.entries(raw).forEach(([key, value]) => {
    messages[key] = Array.isArray(value) ? value.join(" ") : String(value);
  });
  return messages;
}

function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      <label htmlFor={htmlFor}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

export default function ListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVerified = Boolean(user?.profile?.is_verified);

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [productErrors, setProductErrors] = useState({});
  const [productFormError, setProductFormError] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [cats, productPage, listing] = await Promise.all([
          getCategories(),
          getProducts({ page_size: 100, ordering: "name" }),
          isEdit ? getListing(id) : Promise.resolve(null),
        ]);
        if (!active) return;

        setCategories(cats);
        let productList = productPage.results;

        if (listing) {
          // Make sure the listing's own product is selectable even if it is not in the first 100.
          if (!productList.some((p) => p.id === listing.product.id)) {
            productList = [listing.product, ...productList];
          }
          setForm({
            product_id: String(listing.product.id),
            price: String(Number(listing.price)),
            stock: String(listing.stock),
            location: listing.location ?? "",
            description: listing.description ?? "",
            is_active: listing.is_active,
          });
        } else {
          // New listings start with the dealer's own location.
          setForm((f) => ({
            ...f,
            location: user?.profile?.location || user?.profile?.district || "",
          }));
        }
        setProducts(productList);
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err, "Could not load the form."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const selectedProduct = products.find((p) => String(p.id) === String(form.product_id));

  const productOptions = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term) ||
        String(p.id) === String(form.product_id)
    );
  }, [products, productSearch, form.product_id]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function validate() {
    const found = {};
    if (!isEdit && !form.product_id) found.product_id = "Choose the product you are selling.";
    if (form.price === "" || Number(form.price) <= 0) found.price = "Enter a price greater than zero.";
    if (form.stock === "" || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      found.stock = "Enter the number of units you have, using a whole number.";
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      price: form.price,
      stock: Number(form.stock),
      location: form.location.trim(),
      description: form.description.trim(),
      is_active: form.is_active,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateListing(id, payload);
        toast.success("Listing saved.");
      } else {
        await createListing({ ...payload, product_id: Number(form.product_id) });
        toast.success("Listing added.");
      }
      navigate("/dealer/listings");
    } catch (err) {
      const messages = toMessages(err);
      const { non_field_errors, detail, ...fieldMessages } = messages;
      setErrors(fieldMessages);
      setFormError(
        non_field_errors || detail || (Object.keys(fieldMessages).length ? "" : getErrorMessage(err, "Could not save the listing."))
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateProduct() {
    setProductFormError("");
    const found = {};
    if (!newProduct.name.trim()) found.name = "Enter the product name.";
    if (!newProduct.category) found.category = "Choose a category.";
    setProductErrors(found);
    if (Object.keys(found).length > 0) return;

    setCreatingProduct(true);
    try {
      const created = await createProduct({
        name: newProduct.name.trim(),
        category: Number(newProduct.category),
        unit: newProduct.unit.trim(),
        description: newProduct.description.trim(),
      });
      setProducts((list) => [created, ...list]);
      setField("product_id", String(created.id));
      setNewProduct(EMPTY_PRODUCT);
      setProductErrors({});
      setProductSearch("");
      setShowNewProduct(false);
      toast.success(`${created.name} added to the catalog.`);
    } catch (err) {
      const messages = toMessages(err);
      const { non_field_errors, detail, ...fieldMessages } = messages;
      setProductErrors(fieldMessages);
      setProductFormError(
        non_field_errors || detail || (Object.keys(fieldMessages).length ? "" : getErrorMessage(err, "Could not add the product."))
      );
    } finally {
      setCreatingProduct(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {loadError}{" "}
          <Link to="/dealer/listings" className="font-medium underline">
            Back to my listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div>
        <Link to="/dealer/listings" className="link text-sm">
          Back to my listings
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          {isEdit ? "Edit listing" : "Add listing"}
        </h1>
      </div>

      {!isVerified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your business must be verified before you can save listings.{" "}
          <Link to="/dealer/verification" className="font-medium underline">
            Go to verification
          </Link>
        </div>
      )}

      <form className="card flex max-w-2xl flex-col gap-1" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {formError}
          </div>
        )}

        {/* Product */}
        <Field
          label="Product"
          htmlFor="product_id"
          error={errors.product_id}
          required
          hint={isEdit ? "The product cannot be changed. Add a new listing for a different product." : undefined}
        >
          {!isEdit && (
            <input
              type="search"
              className="input outlined"
              placeholder="Search products"
              aria-label="Search products"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          )}
          <select
            id="product_id"
            className="input outlined"
            value={form.product_id}
            onChange={(e) => setField("product_id", e.target.value)}
            disabled={isEdit}
          >
            <option value="">Choose a product</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.unit ? ` (${p.unit})` : ""} - {p.category_name}
              </option>
            ))}
          </select>
        </Field>

        {!isEdit && !showNewProduct && (
          <button
            type="button"
            className="btn outlined self-start"
            onClick={() => setShowNewProduct(true)}
          >
            <PlusIcon size={16} weight="bold" /> Product not listed? Add it
          </button>
        )}

        {!isEdit && showNewProduct && (
          <div className="card flat my-2 flex flex-col gap-1">
            <h2 className="text-base font-semibold text-gray-900">New product</h2>
            <p className="text-sm text-gray-500">
              Check the list first. Other dealers will be able to list this product too.
            </p>

            {productFormError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                {productFormError}
              </div>
            )}

            <Field label="Product name" htmlFor="new_name" error={productErrors.name} required>
              <input
                id="new_name"
                className="input outlined"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </Field>
            <Field label="Category" htmlFor="new_category" error={productErrors.category} required>
              <select
                id="new_category"
                className="input outlined"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              >
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="How it is sold"
              htmlFor="new_unit"
              error={productErrors.unit}
              hint="For example 2kg pack, 50kg bag or per kg."
            >
              <input
                id="new_unit"
                className="input outlined"
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              />
            </Field>
            <Field label="Description" htmlFor="new_description" error={productErrors.description}>
              <textarea
                id="new_description"
                rows={2}
                className="input outlined"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </Field>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn primary"
                onClick={handleCreateProduct}
                disabled={creatingProduct || !isVerified}
              >
                {creatingProduct ? "Adding..." : "Add product"}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setShowNewProduct(false);
                  setProductErrors({});
                  setProductFormError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Price and stock */}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field
            label="Price (UGX)"
            htmlFor="price"
            error={errors.price}
            required
            hint={selectedProduct?.unit ? `Your price for one ${selectedProduct.unit}.` : undefined}
          >
            <input
              id="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="100"
              className="input outlined"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
            />
          </Field>
          <Field label="Stock" htmlFor="stock" error={errors.stock} required hint="Units you can supply now.">
            <input
              id="stock"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              className="input outlined"
              value={form.stock}
              onChange={(e) => setField("stock", e.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Location"
          htmlFor="location"
          error={errors.location}
          hint="Where farmers can collect this from. Defaults to your business location."
        >
          <input
            id="location"
            className="input outlined"
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
          />
        </Field>

        <Field label="Description" htmlFor="description" error={errors.description} hint="Variety, quality, pack size or delivery notes.">
          <textarea
            id="description"
            rows={3}
            className="input outlined"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>

        <label className="my-2 flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-emerald-700"
            checked={form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
          />
          <span>
            Show this listing to farmers
            <span className="block text-xs text-gray-500">Turn this off to hide it without deleting it.</span>
          </span>
        </label>

        <div className="mt-2 flex gap-2">
          <button className="btn primary" type="submit" disabled={submitting || !isVerified}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Add listing"}
          </button>
          <Link to="/dealer/listings" className="btn secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
