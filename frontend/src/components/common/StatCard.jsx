import { Link } from "react-router-dom";
import "../../styles/dashboard.css";

// <StatCard label="Dealers" value={12} hint="3 awaiting review" to="/admin/users" tone="warn" />
// value = null shows "-" (data not available yet).
export default function StatCard({ label, value, hint, to, tone = "default" }) {
  const content = (
    <>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value ?? "-"}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </>
  );

  const className = `stat-card stat-${tone}`;

  return to ? (
    <Link to={to} className={className}>{content}</Link>
  ) : (
    <div className={className}>{content}</div>
  );
}