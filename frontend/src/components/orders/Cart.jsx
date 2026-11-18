import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartItem from "../../components/orders/CartItem";
import OrderSummary from "../../components/orders/OrderSummary";
import useCart from "../../hooks/useCart";
import "../../styles/orders.css";

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, refreshCart, hasUnavailable } = useCart();
  const navigate = useNavigate();

  // Make sure the prices and stock shown are the current ones.
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const available = items.filter((i) => !i.unavailable);

  if (items.length === 0) {
    return (
      <div className="page">
        <h1>Your cart</h1>
        <p className="muted">Your cart is empty.</p>
        <Link className="btn btn-primary" to="/products">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Your cart</h1>
      <div className="cart-layout">
        <div className="stack">
          {items.map((item) => (
            <CartItem key={item.listingId} item={item}
              onQuantityChange={updateQuantity} onRemove={removeItem} />
          ))}
          <div>
            <button type="button" className="btn btn-secondary" onClick={clearCart}>Clear cart</button>
          </div>
        </div>

        <OrderSummary items={available}>
          {hasUnavailable && (
            <p className="alert alert-error">Remove the unavailable items to continue.</p>
          )}
          <button type="button" className="btn btn-primary btn-block"
            disabled={hasUnavailable || available.length === 0}
            onClick={() => navigate("/checkout")}>
            Proceed to checkout
          </button>
        </OrderSummary>
      </div>
    </div>
  );
}
