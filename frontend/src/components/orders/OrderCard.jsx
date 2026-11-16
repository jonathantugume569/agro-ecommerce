import { Link } from "react-router-dom";
import { STATUS_PILL, formatDateTime, formatUGX } from "../../utils/orderHelpers";
import "../../styles/orders.css";

export function OrderStatusPill({ status }) {
  return <span className={`pill ${STATUS_PILL[status] || ""}`}>{status}</span>;
}

// `viewer` decides who we show as the "other party" and which link to use.
export default function OrderCard({ order, viewer = "farmer", children }) {
  const other = viewer === "dealer" ? order.farmer_name : order.dealer_name;

  return (
    <article className="card order-card">
      <div className="order-card-head">
        <h3>
          {viewer === "farmer" ? (
            <Link to={`/orders/${order.id}`}>Order #{order.id}</Link>
          ) : (
            <>Order #{order.id}</>
          )}
        </h3>
        <OrderStatusPill status={order.status} />
      </div>

      <p className="muted">
        {viewer === "dealer" ? "From" : "Sold by"} {other} · {formatDateTime(order.created_at)}
      </p>

      <ul className="order-lines">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>{item.quantity} × {item.product_name}</span>
            <span>{formatUGX(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="summary-row summary-total">
        <span>Total</span>
        <span>{formatUGX(order.total_amount)}</span>
      </div>

      {viewer === "dealer" && <p className="muted">Deliver to: {order.delivery_address}</p>}
      {children}
    </article>
  );
}
