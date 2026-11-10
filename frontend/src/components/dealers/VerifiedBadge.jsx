import "../../styles/accounts.css";

// <VerifiedBadge verified={dealer.is_verified} />
// Add showUnverified to also show a grey "Not verified" badge.
export default function VerifiedBadge({ verified = true, showUnverified = false, className = "" }) {
  if (!verified && !showUnverified) return null;

  if (verified) {
    return (
      <span className={`badge badge-verified ${className}`} title="Verified by the platform admin">
        &#10003; Verified
      </span>
    );
  }

  return <span className={`badge badge-unverified ${className}`}>Not verified</span>;
}
