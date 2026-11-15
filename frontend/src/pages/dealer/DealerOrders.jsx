import { useEffect, useState } from "react";
import { acceptOrder, getOrders, rejectOrder } from "../../api/ordersApi";
import OrderCard from "../../components/orders/OrderCard";
import { getOrderError } from "../../utils/orderHelpers";
import "../../styles/orders.css";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "", label: "All" },
];

export default function DealerOrders() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrders({ status: status || undefined, page })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((err) => active && setError(getOrderError(err, "Could not load orders.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, page, reloadKey]);

  function changeTab(value) {
    setStatus(value);
    setPage(1);
    setFlash("");
  }

  async function decide(order, action) {
    setBusyId(order.id);
    setError("");
    setFlash("");
    try {
      await (action === "accept" ? acceptOrder(order.id) : rejectOrder(order.id));
      setFlash(`Order #${order.id} ${action === "accept" ? "accepted" : "rejected"}.`);
      if (data.results.length === 1 && page > 1) setPage((p) => p - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      setError(getOrderError(err, "Could not update this order."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <h1>Orders received</h1>

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

      {flash && <div className="alert alert-success">{flash}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading orders...</p>
      ) : data.results.length === 0 ? (
        <p className="muted">No {status || ""} orders.</p>
      ) : (
        <div className="stack">
          {data.results.map((order) => (
            <OrderCard key={order.id} order={order} viewer="dealer">
              {order.status === "pending" && (
                <div className="btn-row">
                  <button className="btn btn-primary" disabled={busyId === order.id}
                    onClick={() => decide(order, "accept")}>Accept</button>
                  <button className="btn btn-danger" disabled={busyId === order.id}
                    onClick={() => decide(order, "reject")}>Reject</button>
                </div>
              )}
            </OrderCard>
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
