export default function DeliveryTimeline({ updates }) {
  if (!updates || updates.length === 0) {
    return <p>No delivery updates yet.</p>;
  }

  return (
    <ul>
      {updates.map((update) => (
        <li key={update.id}>
          <strong>{update.status}</strong> —{" "}
          <span>{new Date(update.timestamp).toLocaleString()}</span>
          {update.note && <p>{update.note}</p>}
        </li>
      ))}
    </ul>
  );
}