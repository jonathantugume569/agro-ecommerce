import StatusBadge from "../common/StatusBadge";

export default function DeliveryTimeline({ updates }) {
  return (
    <ol>
      {updates.map(({ id, status, note, updated_by_name, created_at }) => (
        <li key={id}>
          <StatusBadge status={status} />
          <time dateTime={created_at}> {new Date(created_at).toLocaleString()}</time>
          {note && <p>{note}</p>}
          <small>by {updated_by_name}</small>
        </li>
      ))}
    </ol>
  );
}