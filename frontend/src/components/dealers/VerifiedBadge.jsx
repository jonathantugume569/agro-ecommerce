
export default function VerifiedBadge({ verified = false }) {
  return (
    <span className={`verified-badge ${verified ? "is-verified" : "not-verified"}`}>
      {verified ? "Verified Dealer" : "Not Verified"}
    </span>
  );
}
