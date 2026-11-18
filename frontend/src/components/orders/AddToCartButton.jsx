import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import { listingToCartItem } from "../../utils/orderHelpers";

// Drop-in "Add to cart" button for any screen that has a listing from the catalog API.
//
//   <AddToCartButton listing={listing} />
//   <AddToCartButton listing={listing} quantity={2} className="btn secondary flex-1" />
//
// `listing` is one object from /catalog/listings/ (id, product, dealer, price, stock, is_active).
export default function AddToCartButton({
  listing,
  quantity = 1,
  className = "btn btn-primary",
  children = "Add to cart",
}) {
  const { user } = useAuth();
  const { items, addItem } = useCart();
  const navigate = useNavigate();

  const inCart = items.find((i) => i.listingId === listing.id)?.quantity ?? 0;
  const soldOut = !listing.is_active || listing.stock < 1;
  const atMax = inCart >= listing.stock;

  let disabledReason = "";
  if (user && user.role !== "farmer") disabledReason = "Only farmers can order.";
  else if (soldOut) disabledReason = "Out of stock.";
  else if (atMax) disabledReason = "You already have the maximum available in your cart.";

  function handleClick() {
    if (!user) {
      navigate("/login");
      return;
    }
    const item = listingToCartItem(listing);
    addItem(item, quantity);
    toast.success(`Added ${item.name} to your cart.`);
  }

  return (
    <button
      type="button"
      className={className}
      disabled={Boolean(disabledReason)}
      title={disabledReason || undefined}
      onClick={handleClick}
    >
      {soldOut ? "Out of stock" : children}
    </button>
  );
}
