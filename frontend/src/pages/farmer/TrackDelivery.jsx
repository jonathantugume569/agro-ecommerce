import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { confirmReceipt, getDelivery } from "../../api/deliveryApi";
import DeliveryTimeline from "../../components/delivery/DeliveryTimeline";

export default function TrackDelivery() {
  const { orderId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getDelivery(orderId)
      .then(setDelivery)
      .catch((err) => setError(err.response?.data?.detail || "Failed to load delivery."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const updated = await confirmReceipt(orderId);
      setDelivery(updated);
    } catch (err) {
      setError(err.response?.data?.status || "Could not confirm receipt.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <p>Loading delivery...</p>;
  if (error) return <p>{error}</p>;
  if (!delivery) return null;

  const canConfirm =
    !delivery.receipt_confirmed &&
    !["Cancelled", "Failed"].includes(delivery.status);

  return (
    <div>
      <h2>Order #{delivery.order} Delivery</h2>
      <p>
        Current status: <strong>{delivery.status}</strong>
      </p>

      {delivery.receipt_confirmed && <p>Receipt confirmed.</p>}

      {canConfirm && (
        <button onClick={handleConfirm} disabled={confirming}>
          {confirming ? "Confirming..." : "Confirm Receipt"}
        </button>
      )}

      <h3>Tracking History</h3>
      <DeliveryTimeline updates={delivery.updates} />
    </div>
  );
}