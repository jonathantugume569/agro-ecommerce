import { useEffect, useState } from "react";
import { getAdminUsers } from "../../api/dealersApi";
import VerifiedBadge from "../../components/dealers/VerifiedBadge";
import { getErrorMessage } from "../../utils/apiErrors";
import "../../styles/accounts.css";

function profileSummary(user) {
  const profile = user.profile;
  if (!profile) return "-";
  if (user.role === "dealer") {
    return (
      <>
        {profile.business_name} <VerifiedBadge verified={profile.is_verified} showUnverified />
      </>
    );
  }
  return [profile.location, profile.district].filter(Boolean).join(", ") || "-";
}

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // debounced search text
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wait until the admin stops typing before calling the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getAdminUsers({ q: query, role, page })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((err) => active && setError(getErrorMessage(err, "Could not load users.")))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [query, role, page]);

  return (
    <div className="page">
      <h1>Manage users</h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="farmer">Farmers</option>
          <option value="dealer">Dealers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading users...</p>
      ) : data.results.length === 0 ? (
        <p className="muted">No users match your search.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "-"}</td>
                  <td><span className={`pill pill-role-${u.role}`}>{u.role}</span></td>
                  <td>{profileSummary(u)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pager">
        <button className="btn btn-secondary" type="button"
          disabled={!data.previous || loading} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span className="muted">Page {page} &middot; {data.count} users</span>
        <button className="btn btn-secondary" type="button"
          disabled={!data.next || loading} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
