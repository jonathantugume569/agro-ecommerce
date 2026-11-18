import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { placeOrders } from "../../api/ordersApi";
import OrderSummary from "../../components/orders/OrderSummary";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import { getOrderError } from "../../utils/orderHelpers";
import "../../styles/orders.css";

export default function Checkout() {
  const { items, clearCart, refreshCart, hasUnavailable, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState(user?.farmer_profile?.location || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false); // true once prices have been refreshed

  useEffect(() => {
    refreshCart().finally(() => setReady(true));
  }, [refreshCart]);

  if (items.length === 0) {
    return (
      <div className="page">
        <h1>Checkout</h1>
        <p className="muted">Your cart is empty.</p>
        <Link className="btn btn-primary" to="/products">Browse products</Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    if (hasUnavailable) {
      setError("Some items are no longer available. Go back to your cart and remove them.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const orders = await placeOrders({
        items: items.map((i) => ({ listing: i.listingId, quantity: i.quantity })),
        delivery_address: address.trim(),
        notes: notes.trim(),
        // The total the farmer was shown. The backend refuses the order if prices moved.
        expected_total: totalPrice.toFixed(2),
      });
      clearCart();
      navigate("/orders", { state: { placed: orders.length } });
    } catch (err) {
      // e.g. "Only 2 of Maize seed left in stock" — cart is kept so they can fix it.
      setError(getOrderError(err, "Could not place your order."));
      refreshCart(); // show the current prices so the farmer can review and try again
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Checkout</h1>
      <div className="cart-layout">
        <form className="card" onSubmit={handleSubmit}>
          <h2>Delivery details</h2>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-field">
            <label htmlFor="address">Delivery address <span className="req">*</span></label>
            <input id="address" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Village / town, district" required />
          </div>
          <div className="form-field">
            <label htmlFor="notes">Notes for the dealer (optional)</label>
            <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={submitting || !ready || hasUnavailable}>
              {submitting ? "Placing order..." : "Place order"}
            </button>
            <Link className="btn btn-secondary" to="/cart">Back to cart</Link>
          </div>
        </form>

        <OrderSummary items={items.filter((i) => !i.unavailable)} />
      </div>
    </div>
  );
}
