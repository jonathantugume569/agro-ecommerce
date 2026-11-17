import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyVerifications, getProfile } from "../../api/dealersApi";
import { DASHBOARD_ENDPOINTS, getCount } from "../../api/dashboardApi";
import StatCard from "../../components/common/StatCard";
import VerifiedBadge from "../../components/dealers/VerifiedBadge";
import { getErrorMessage } from "../../utils/formatters";
import "../../styles/accounts.css";
import "../../styles/dashboard.css";

// Change a path here if your routes are named differently.
const LINKS = {
  listings: "/dealer/listings",
  addListing: "/dealer/listings/new",
  orders: "/dealer/orders",
  premium: "/dealer/premium",
  profile: "/profile",
  verification: "/dealer/verification",
};

// needsVerified: the dealer cannot use this until an admin approves the business.
const TILES = [
  { key: "listings", label: "My listings", desc: "Manage your products, prices and stock.", to: LINKS.listings, needsVerified: true },
  { key: "add", label: "Add a listing", desc: "Put a new product on sale.", to: LINKS.addListing, needsVerified: true },
  { key: "orders", label: "Orders", desc: "Accept orders and update delivery.", to: LINKS.orders, needsVerified: false },
  { key: "premium", label: "Premium plans", desc: "Get your listings featured.", to: LINKS.premium, needsVerified: true },
  { key: "profile", label: "Business profile", desc: "Update your business details.", to: LINKS.profile, needsVerified: false },
  { key: "verification", label: "Verification", desc: "Submit or check your documents.", to: LINKS.verification, needsVerified: false },
];

export default function DealerDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ listings: null, orders: null, pendingOrders: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [profileData, requestData, listings, orders, pendingOrders] = await Promise.all([
          getProfile(),
          getMyVerifications(),
          getCount(DASHBOARD_ENDPOINTS.myListings),
          getCount(DASHBOARD_ENDPOINTS.orders),
          getCount(DASHBOARD_ENDPOINTS.orders, { status: "pending" }),
        ]);
        if (!active) return;
        setProfile(profileData);
        setRequests(requestData);
        setCounts({ listings, orders, pendingOrders });
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Could not load your dashboard."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="page"><p>Loading dashboard...</p></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;

  const isVerified = Boolean(profile?.is_verified);
  const hasPending = requests.some((r) => r.status === "pending");
  const latest = requests[0];

  return (
    <div className="page">
      <div className="dash-head">
        <div className="dash-title">
          <h1>{profile?.business_name || "Dealer dashboard"}</h1>
          <VerifiedBadge verified={isVerified} showUnverified />
        </div>
      </div>
      <p className="muted">Your sales overview and shortcuts.</p>

      {/* Verification status */}
      {isVerified ? null : hasPending ? (
        <div className="alert alert-info">
          Your documents are under review. You can publish listings once an admin approves them.
        </div>
      ) : latest?.status === "rejected" ? (
        <div className="alert alert-error">
          Your last verification request was rejected.
          {latest.admin_notes && <> Reason: {latest.admin_notes}</>}{" "}
          <Link to={LINKS.verification}>Upload new documents</Link>
        </div>
      ) : (
        <div className="alert alert-info">
          Your business is not verified yet, so you cannot publish listings.{" "}
          <Link to={LINKS.verification}>Submit your documents</Link>
        </div>
      )}

      <div className="stat-grid">
        <StatCard
          label="Verification"
          value={isVerified ? "Verified" : hasPending ? "In review" : "Not verified"}
          tone={isVerified ? "good" : "warn"}
          to={LINKS.verification}
        />
        <StatCard label="Active listings" value={counts.listings} to={LINKS.listings} />
        <StatCard label="Total orders" value={counts.orders} to={LINKS.orders} />
        <StatCard
          label="Orders to handle"
          value={counts.pendingOrders}
          hint="Waiting for your response"
          tone={counts.pendingOrders > 0 ? "warn" : "default"}
          to={LINKS.orders}
        />
      </div>

      <h2>Quick actions</h2>
      <div className="action-grid">
        {TILES.map((tile) => {
          const enabled = !tile.needsVerified || isVerified;
          const content = (
            <>
              <strong>{tile.label}</strong>
              <span>{enabled ? tile.desc : "Available after your business is verified."}</span>
            </>
          );
          return enabled ? (
            <Link key={tile.key} className="action-tile" to={tile.to}>{content}</Link>
          ) : (
            <div key={tile.key} className="action-tile disabled" aria-disabled="true">{content}</div>
          );
        })}
      </div>
    </div>
  );
}