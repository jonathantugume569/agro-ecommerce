import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers, getAdminVerifications } from "../../api/dealersApi";
import { DASHBOARD_ENDPOINTS, countOf, getCount, itemsOf } from "../../api/dashboardApi";
import StatCard from "../../components/common/StatCard";
import { getErrorMessage } from "../../utils/formatters";
import "../../styles/accounts.css";
import "../../styles/dashboard.css";

// Change a path here if your routes are named differently.
const LINKS = {
  verifications: "/admin/verifications",
  users: "/admin/users",
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "");

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [allUsers, farmers, dealers, pendingRes, recent, orders] = await Promise.all([
          getAdminUsers({ page_size: 1 }),
          getAdminUsers({ role: "farmer", page_size: 1 }),
          getAdminUsers({ role: "dealer", page_size: 1 }),
          getAdminVerifications({ status: "pending", page_size: 5 }),
          getAdminUsers({ page_size: 5 }),
          getCount(DASHBOARD_ENDPOINTS.orders), // null if the orders URL is different
        ]);
        if (!active) return;

        setStats({
          users: countOf(allUsers),
          farmers: countOf(farmers),
          dealers: countOf(dealers),
          pending: countOf(pendingRes),
          orders,
        });
        setPending(itemsOf(pendingRes));
        setRecentUsers(itemsOf(recent));
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Could not load the dashboard."));
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

  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <h1>Admin dashboard</h1>
          <p className="muted">Overview of users, verification and activity.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total users" value={stats.users} to={LINKS.users} />
        <StatCard label="Farmers" value={stats.farmers} to={`${LINKS.users}`} />
        <StatCard label="Dealers" value={stats.dealers} to={`${LINKS.users}`} />
        <StatCard
          label="Pending verifications"
          value={stats.pending}
          hint={stats.pending > 0 ? "Needs your review" : "All caught up"}
          tone={stats.pending > 0 ? "warn" : "good"}
          to={LINKS.verifications}
        />
        <StatCard label="Total orders" value={stats.orders} hint="From the orders app" />
      </div>

      <div className="dash-columns">
        <section className="dash-card">
          <h2>Waiting for verification</h2>
          {pending.length === 0 ? (
            <p className="dash-empty">No dealers are waiting for review.</p>
          ) : (
            <ul className="dash-list">
              {pending.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.business_name}</strong>
                    <small>
                      {item.dealer_username} &middot; submitted {formatDate(item.created_at)}
                    </small>
                  </div>
                  <Link className="btn btn-secondary" to={LINKS.verifications}>Review</Link>
                </li>
              ))}
            </ul>
          )}
          {stats.pending > pending.length && (
            <p><Link to={LINKS.verifications}>See all {stats.pending} pending requests</Link></p>
          )}
        </section>

        <section className="dash-card">
          <h2>Newest users</h2>
          {recentUsers.length === 0 ? (
            <p className="dash-empty">No users yet.</p>
          ) : (
            <ul className="dash-list">
              {recentUsers.map((u) => (
                <li key={u.id}>
                  <div>
                    <strong>{u.username}</strong>
                    <small>{u.email}</small>
                  </div>
                  <span className={`pill pill-role-${u.role}`}>{u.role}</span>
                </li>
              ))}
            </ul>
          )}
          <p><Link to={LINKS.users}>Manage all users</Link></p>
        </section>
      </div>

      <div className="action-grid">
        <Link className="action-tile" to={LINKS.verifications}>
          <strong>Verify dealers</strong>
          <span>Approve or reject business documents.</span>
        </Link>
        <Link className="action-tile" to={LINKS.users}>
          <strong>Manage users</strong>
          <span>Search farmers, dealers and admins.</span>
        </Link>
      </div>
    </div>
  );
}