import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getOrders } from "../../api/ordersApi";
import OrderCard from "../../components/orders/OrderCard";
import { getOrderError } from "../../utils/orderHelpers";
import "../../styles/orders.css";

const TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function MyOrders() {
  const location = useLocation();
  const placed = location.state?.placed; // set by Checkout after a successful order

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrders({ status: status || undefined, page })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((err) => active && setError(getOrderError(err, "Could not load your orders.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, page]);

  function changeTab(value) {
    setStatus(value);
    setPage(1);
  }

  return (
    <div className="page">
      <h1>My orders</h1>

      {placed && (
        <div className="alert alert-success">
          {placed === 1 ? "Your order was placed." : `Your cart was placed as ${placed} orders (one per dealer).`}
        </div>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button key={tab.label} type="button" role="tab"
            aria-selected={status === tab.value}
            className={`tab${status === tab.value ? " active" : ""}`}
            onClick={() => changeTab(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading orders...</p>
      ) : data.results.length === 0 ? (
        <p className="muted">No orders here yet.</p>
      ) : (
        <div className="stack">
          {data.results.map((order) => (
            <OrderCard key={order.id} order={order} viewer="farmer" />
          ))}
        </div>
      )}

      {(data.previous || data.next) && (
        <div className="pager">
          <button className="btn btn-secondary" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="muted">Page {page}</span>
          <button className="btn btn-secondary" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
