import { useEffect, useState } from "react";
import { getAdminVerifications, reviewVerification } from "../../utils/requests";
import { getErrorMessage, formatDate } from "../../utils/formatters";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

export default function VerifyDealers() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const [notes, setNotes] = useState({}); // admin notes typed per request id
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getAdminVerifications({ status, page })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError("");
      })
      .catch((err) => active && setError(getErrorMessage(err, "Could not load requests.")))
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

  async function review(item, action) {
    setBusyId(item.id);
    setError("");
    setFlash("");
    try {
      await reviewVerification(item.id, { action, admin_notes: notes[item.id] || "" });
      setFlash(
        `${item.business_name} was ${action === "approve" ? "approved" : "rejected"}.`
      );
      // If that was the last item on this page, step back one page.
      if (data.results.length === 1 && page > 1) setPage((p) => p - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your decision."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <h1>Dealer verification</h1>

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            className={`tab${status === tab.value ? " active" : ""}`}
            onClick={() => changeTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {flash && <div className="alert alert-success">{flash}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading requests...</p>
      ) : data.results.length === 0 ? (
        <p className="muted">No {status || ""} requests.</p>
      ) : (
        <div className="stack">
          {data.results.map((item) => (
            <article className="card review-card" key={item.id}>
              <div className="review-head">
                <h3>{item.business_name}</h3>
                <span className={`pill pill-${item.status}`}>{item.status}</span>
              </div>

              <dl className="details">
                <div><dt>Licence number</dt><dd>{item.license_number}</dd></div>
                <div><dt>Dealer account</dt><dd>{item.dealer_username}</dd></div>
                <div><dt>Submitted</dt><dd>{formatDate(item.created_at)}</dd></div>
              </dl>

              {item.notes && <p>Dealer note: {item.notes}</p>}
              {item.document && (
                <p><a href={item.document} target="_blank" rel="noreferrer">Open uploaded document</a></p>
              )}

              {item.status === "pending" ? (
                <div className="review-actions">
                  <textarea
                    rows={2}
                    placeholder="Note for the dealer (recommended when rejecting)"
                    value={notes[item.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                  />
                  <div className="btn-row">
                    <button className="btn btn-primary" type="button"
                      disabled={busyId === item.id} onClick={() => review(item, "approve")}>
                      Approve
                    </button>
                    <button className="btn btn-danger" type="button"
                      disabled={busyId === item.id} onClick={() => review(item, "reject")}>
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {item.admin_notes && <p>Admin note: {item.admin_notes}</p>}
                  {item.reviewed_at && <p className="muted">Reviewed {formatDate(item.reviewed_at)}</p>}
                </>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="pager">
        <button className="btn btn-secondary" type="button"
          disabled={!data.previous || loading} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span className="muted">Page {page} &middot; {data.count} total</span>
        <button className="btn btn-secondary" type="button"
          disabled={!data.next || loading} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
