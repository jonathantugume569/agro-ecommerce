import { Link } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge";
import "../../styles/accounts.css";

// <DealerCard dealer={dealer} to={`/dealers/${dealer.id}`} footer={<button>...</button>} />
export default function DealerCard({ dealer, to, footer }) {
  const place = [dealer.location, dealer.district].filter(Boolean).join(", ");
  const description =
    dealer.description && dealer.description.length > 140
      ? `${dealer.description.slice(0, 140)}...`
      : dealer.description;

  return (
    <article className="card dealer-card">
      <div className="dealer-card-head">
        <h3>{to ? <Link to={to}>{dealer.business_name}</Link> : dealer.business_name}</h3>
        <VerifiedBadge verified={dealer.is_verified} />
      </div>
      {place && <p className="muted">{place}</p>}
      {description && <p>{description}</p>}
      {footer && <div className="dealer-card-footer">{footer}</div>}
    </article>
  );
}
