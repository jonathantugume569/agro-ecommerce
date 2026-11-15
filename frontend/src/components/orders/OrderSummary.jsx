import { formatUGX } from "../../utils/orderHelpers";
import "../../styles/orders.css";

// Shows cart totals grouped by dealer (so the farmer sees how many orders they'll get).
export default function OrderSummary({ items, children }) {
  const groups = {};
  items.forEach((i) => {
    (groups[i.dealerName] = groups[i.dealerName] || []).push(i);
  });
  const total = items.reduce((sum, i) => sum + i.quantity * Number(i.price), 0);
  const dealerCount = Object.keys(groups).length;

  return (
    <aside className="card">
      <h2>Order summary</h2>
      {Object.entries(groups).map(([dealer, lines]) => (
        <div key={dealer}>
          <div className="summary-group">{dealer}</div>
          {lines.map((l) => (
            <div className="summary-row" key={l.listingId}>
              <span>{l.quantity} × {l.name}</span>
              <span>{formatUGX(l.quantity * Number(l.price))}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="summary-row summary-total">
        <span>Total</span>
        <span>{formatUGX(total)}</span>
      </div>
      {dealerCount > 1 && (
        <p className="hint">Your items come from {dealerCount} dealers, so this will be placed as {dealerCount} separate orders.</p>
      )}
      {children}
    </aside>
  );
}
