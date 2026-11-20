import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDelivery, updateDeliveryStatus } from "../../api/deliveryApi";
import DeliveryStatusForm from "../../components/delivery/DeliveryStatusForm";
import DeliveryTimeline from "../../components/delivery/DeliveryTimeline";

export default function UpdateDelivery() {
  const { orderId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDelivery(orderId)
      .then(setDelivery)
      .catch((err) => setError(err.response?.data?.detail || "Failed to load delivery."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleStatusSubmit = async (status, note) => {
    setError("");
    try {
      const updated = await updateDeliveryStatus(orderId, status, note);
      setDelivery(updated);
    } catch (err) {
      setError(err.response?.data?.status || "Failed to update status.");
    }
  };

  if (loading) return <p>Loading delivery...</p>;
  if (!delivery) return <p>{error || "Delivery not found."}</p>;

  return (
    <div>
      <h2>Manage Delivery — Order #{delivery.order}</h2>
      <p>
        Current status: <strong>{delivery.status}</strong>
      </p>

      {error && <p>{error}</p>}

      <DeliveryStatusForm
        nextStatuses={delivery.next_statuses}
        onSubmit={handleStatusSubmit}
      />

      <h3>Tracking History</h3>
      <DeliveryTimeline updates={delivery.updates} />
    </div>
  );
}