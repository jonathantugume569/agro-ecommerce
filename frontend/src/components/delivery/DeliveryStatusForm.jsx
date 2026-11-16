import { useState } from "react";

export default function DeliveryStatusForm({ nextStatuses, onSubmit }) {
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (nextStatuses.length === 0) return <p>No further updates available.</p>;

  // Falls back to the first valid status whenever the allowed list changes
  const status = nextStatuses.includes(choice) ? choice : nextStatuses[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(status, note);
      setNote("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select value={status} onChange={(e) => setChoice(e.target.value)}>
        {nextStatuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
      />
      <button type="submit" disabled={submitting}>Update status</button>
    </form>
  );
}