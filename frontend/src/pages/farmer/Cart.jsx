import { Link, useNavigate } from "react-router-dom";
import CartItem from "../../components/orders/CartItem";
import OrderSummary from "../../components/orders/OrderSummary";
import useCart from "../../hooks/useCart";
import "../../styles/orders.css";

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

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

        <OrderSummary items={items}>
          <button type="button" className="btn btn-primary btn-block"
            onClick={() => navigate("/checkout")}>
            Proceed to checkout
          </button>
        </OrderSummary>
      </div>
    </div>
  );
}
