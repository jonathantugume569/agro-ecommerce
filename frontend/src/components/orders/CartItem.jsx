import { formatUGX } from "../../utils/orderHelpers";
import "../../styles/orders.css";

export default function CartItem({ item, onQuantityChange, onRemove }) {
  const atMax = item.stock != null && item.quantity >= item.stock;

  return (
    <article className="card cart-item">
      <div>
        <h3>{item.name}</h3>
        <p className="muted">Sold by {item.dealerName}</p>
        <p>{formatUGX(item.price)} each</p>
        {atMax && !item.unavailable && <p className="hint">Maximum available: {item.stock}</p>}
        {item.unavailable && (
          <p className="alert alert-error">This item is no longer available. Remove it to continue.</p>
        )}
      </div>

      <div className="cart-item-side">
        <div className="qty">
          <button type="button" className="btn btn-secondary"
            disabled={item.unavailable || item.quantity <= 1}
            onClick={() => onQuantityChange(item.listingId, item.quantity - 1)}
            aria-label="Decrease quantity">−</button>
          <input type="number" min={1} max={item.stock ?? undefined} value={item.quantity}
            disabled={item.unavailable}
            onChange={(e) => onQuantityChange(item.listingId, Number(e.target.value) || 1)}
            aria-label="Quantity" />
          <button type="button" className="btn btn-secondary"
            disabled={item.unavailable || atMax}
            onClick={() => onQuantityChange(item.listingId, item.quantity + 1)}
            aria-label="Increase quantity">+</button>
        </div>
        <strong>{formatUGX(item.quantity * Number(item.price))}</strong>
        <button type="button" className="btn btn-secondary" onClick={() => onRemove(item.listingId)}>
          Remove
        </button>
      </div>
    </article>
  );
}
