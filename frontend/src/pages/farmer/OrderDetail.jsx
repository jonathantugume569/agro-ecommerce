import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelOrder, getOrder } from "../../api/ordersApi";
import { OrderStatusPill } from "../../components/orders/OrderCard";
import { formatDateTime, formatUGX, getOrderError } from "../../utils/orderHelpers";
import "../../styles/orders.css";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getOrder(id)
      .then((o) => active && setOrder(o))
      .catch((err) => active && setError(getOrderError(err, "Could not load this order.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  async function handleCancel() {
    if (!window.confirm("Cancel this order?")) return;
    setBusy(true);
    setError("");
    try {
      setOrder(await cancelOrder(id));
    } catch (err) {
      setError(getOrderError(err, "Could not cancel this order."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page"><p>Loading order...</p></div>;
  if (!order) {
    return (
      <div className="page">
        {error && <div className="alert alert-error">{error}</div>}
        <Link to="/orders">Back to my orders</Link>
      </div>
    );
  }

  const canCancel = order.status === "pending" || order.status === "accepted";

  return (
    <div className="page">
      <p><Link to="/orders">← My orders</Link></p>
      <div className="order-card-head">
        <h1>Order #{order.id}</h1>
        <OrderStatusPill status={order.status} />
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <dl className="details">
          <div><dt>Sold by</dt><dd>{order.dealer_name}</dd></div>
          <div><dt>Placed</dt><dd>{formatDateTime(order.created_at)}</dd></div>
          <div><dt>Deliver to</dt><dd>{order.delivery_address}</dd></div>
        </dl>
        {order.notes && <p>Your note: {order.notes}</p>}
      </section>

      <section className="card">
        <h2>Items</h2>
        <table className="table">
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>{formatUGX(item.unit_price)}</td>
                <td>{formatUGX(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="summary-row summary-total">
          <span>Total</span><span>{formatUGX(order.total_amount)}</span>
        </div>
      </section>

      {canCancel && (
        <button type="button" className="btn btn-danger" disabled={busy} onClick={handleCancel}>
          {busy ? "Cancelling..." : "Cancel order"}
        </button>
      )}
    </div>
  );
}
