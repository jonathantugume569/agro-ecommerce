import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeSlashIcon,
  PencilSimpleIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { deleteListing, getMyListings, updateListing } from "../../api/productsApi";
import { formatDate, getErrorMessage } from "../../utils/formatters";
import { formatPrice } from "../../utils/formatPrice";


const LOW_STOCK_LIMIT = 5;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Visible" },
  { key: "hidden", label: "Hidden" },
];

function Pill({ tone, children }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function StockPill({ stock }) {
  if (stock === 0) return <Pill tone="red">Out of stock</Pill>;
  if (stock <= LOW_STOCK_LIMIT) return <Pill tone="amber">Low stock: {stock} left</Pill>;
  return <span className="text-sm text-gray-600">{stock} in stock</span>;
}

export default function MyListings() {
  const { user } = useAuth();
  const isVerified = Boolean(user?.profile?.is_verified);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyListings({ page_size: 100 });
      setListings(data.results);
      setLoadError("");
    } catch (err) {
      setLoadError(getErrorMessage(err, "Could not load your listings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      active: listings.filter((l) => l.is_active).length,
      hidden: listings.filter((l) => !l.is_active).length,
      outOfStock: listings.filter((l) => l.stock === 0).length,
    }),
    [listings]
  );

  const visible = listings.filter((l) =>
    filter === "all" ? true : filter === "active" ? l.is_active : !l.is_active
  );

  async function toggleActive(listing) {
    setBusyId(listing.id);
    try {
      const updated = await updateListing(listing.id, { is_active: !listing.is_active });
      setListings((current) => current.map((l) => (l.id === updated.id ? updated : l)));
      toast.success(
        updated.is_active ? "Listing is now visible to farmers." : "Listing hidden from farmers."
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update the listing."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(listing) {
    const confirmed = window.confirm(
      `Delete your listing for ${listing.product.name}? This cannot be undone.`
    );
    if (!confirmed) return;
    setBusyId(listing.id);
    try {
      const result = await deleteListing(listing.id);
      if (result.deactivated) {
        setListings((current) =>
          current.map((l) => (l.id === listing.id ? { ...l, is_active: false } : l))
        );
        toast.info("This listing has orders, so it was hidden instead of deleted.");
      } else {
        setListings((current) => current.filter((l) => l.id !== listing.id));
        toast.success("Listing deleted.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the listing."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My listings</h1>
          <p className="text-sm text-gray-500">The products you sell, with your price and stock.</p>
        </div>
        {isVerified ? (
          <Link to="/dealer/listings/new" className="btn primary">
            <PlusIcon size={18} weight="bold" /> Add listing
          </Link>
        ) : (
          <span className="btn primary pointer-events-none opacity-50" aria-disabled="true">
            <PlusIcon size={18} weight="bold" /> Add listing
          </span>
        )}
      </div>

      {!isVerified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your business is not verified yet, so you cannot add or edit listings.{" "}
          <Link to="/dealer/verification" className="font-medium underline">
            Submit your documents
          </Link>{" "}
          to get verified.
        </div>
      )}

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{loadError}</span>
          <button className="btn secondary" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {!loadError && !loading && listings.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="card flat">
              <p className="text-2xl font-semibold text-gray-900">{counts.active}</p>
              <p className="text-sm text-gray-500">Visible to farmers</p>
            </div>
            <div className="card flat">
              <p className="text-2xl font-semibold text-gray-900">{counts.hidden}</p>
              <p className="text-sm text-gray-500">Hidden</p>
            </div>
            <div className="card flat">
              <p className="text-2xl font-semibold text-gray-900">{counts.outOfStock}</p>
              <p className="text-sm text-gray-500">Out of stock</p>
            </div>
          </div>

          <div className="flex gap-2" role="tablist" aria-label="Filter listings">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`btn ${filter === f.key ? "primary" : "secondary"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      {loading && <p className="text-gray-500">Loading your listings...</p>}

      {!loading && !loadError && listings.length === 0 && (
        <div className="card flat flex flex-col items-center gap-3 py-12 text-center">
          <h2 className="text-lg font-medium text-gray-900">You have no listings yet</h2>
          <p className="max-w-md text-sm text-gray-500">
            Add the products you sell with your price and stock. Farmers will see them and can
            compare your price with other dealers.
          </p>
          {isVerified && (
            <Link to="/dealer/listings/new" className="btn primary">
              Add your first listing
            </Link>
          )}
        </div>
      )}

      {!loading && listings.length > 0 && visible.length === 0 && (
        <p className="text-gray-500">No listings match this filter.</p>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((listing) => (
          <li
            key={listing.id}
            className={`card flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${
              listing.is_active ? "" : "opacity-75"
            }`}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-semibold text-gray-900">
                  {listing.product.name}
                </h2>
                {listing.product.unit && (
                  <span className="text-sm text-gray-500">{listing.product.unit}</span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {listing.product.category_name}
                {listing.location ? `, ${listing.location}` : ""}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Pill tone={listing.is_active ? "green" : "gray"}>
                  {listing.is_active ? "Visible" : "Hidden"}
                </Pill>
                {listing.is_premium && (
                  <Pill tone="amber">
                    <StarIcon size={12} weight="fill" />
                    Premium
                    {listing.premium_expires_at
                      ? ` until ${formatDate(listing.premium_expires_at)}`
                      : ""}
                  </Pill>
                )}
                <StockPill stock={listing.stock} />
              </div>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <p className="text-lg font-semibold text-gray-900">{formatPrice(listing.price)}</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/dealer/listings/${listing.id}/edit`}
                  className={`btn secondary ${isVerified ? "" : "pointer-events-none opacity-50"}`}
                  aria-disabled={!isVerified}
                >
                  <PencilSimpleIcon size={16} /> Edit
                </Link>
                <button
                  className="btn secondary"
                  onClick={() => toggleActive(listing)}
                  disabled={busyId === listing.id || !isVerified}
                >
                  {listing.is_active ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
                  {listing.is_active ? "Hide" : "Show"}
                </button>
                <button
                  className="btn secondary text-red-700"
                  onClick={() => handleDelete(listing)}
                  disabled={busyId === listing.id || !isVerified}
                >
                  <TrashIcon size={16} /> Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
