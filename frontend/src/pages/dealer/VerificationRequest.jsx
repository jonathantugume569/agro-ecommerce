import { useCallback, useEffect, useState } from "react";
import { getMyVerifications, getProfile, submitVerification } from "../../utils/requests";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, formatDate } from "../../utils/formatters";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export default function VerificationRequest() {
  const { refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [fileKey, setFileKey] = useState(0); // changing this resets the file input
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const [profileData, requestData] = await Promise.all([getProfile(), getMyVerifications()]);
      setProfile(profileData);
      setRequests(requestData);
      setLoadError("");
    } catch (err) {
      setLoadError(getErrorMessage(err, "Could not load your verification details."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isVerified = Boolean(profile?.is_verified);
  const hasPending = requests.some((r) => r.status === "pending");
  const latest = requests[0];
  const canSubmit = !isVerified && !hasPending;

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    setError("");
    if (chosen) {
      if (!ALLOWED_TYPES.includes(chosen.type)) {
        setError("Upload a PDF, JPG or PNG file.");
        setFile(null);
        return;
      }
      if (chosen.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`The file must be smaller than ${MAX_SIZE_MB} MB.`);
        setFile(null);
        return;
      }
    }
    setFile(chosen);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Choose a document to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);
    formData.append("notes", notes);

    setSubmitting(true);
    try {
      await submitVerification(formData);
      setSuccess("Documents submitted. An admin will review them soon.");
      setFile(null);
      setNotes("");
      setFileKey((k) => k + 1);
      await load();
      refreshUser().catch(() => {});
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit your documents."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (loadError) return <div className="page"><div className="alert alert-error">{loadError}</div></div>;

  return (
    <div className="page">
      <h1>Business verification</h1>
      <p className="muted">
        Verified dealers get a trust badge and can publish product listings.
      </p>

      {isVerified && (
        <div className="alert alert-success">
          <span className="pill pill-approved">Verified</span> Your business was verified on {formatDate(profile.verified_at)}.
        </div>
      )}

      {!isVerified && hasPending && (
        <div className="alert alert-info">
          Your documents are under review. You will be able to publish listings once approved.
        </div>
      )}

      {!isVerified && !hasPending && latest?.status === "rejected" && (
        <div className="alert alert-error">
          Your last request was rejected.
          {latest.admin_notes && <> Reason: {latest.admin_notes}</>} You can upload new documents below.
        </div>
      )}

      {!isVerified && !hasPending && !latest && (
        <div className="alert alert-info">
          Upload a copy of your trading licence or business registration to get verified.
        </div>
      )}

      {canSubmit && (
        <form className="card" onSubmit={handleSubmit}>
          <h2>Submit documents</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-field">
            <label htmlFor="document">Licence or registration document <span className="req">*</span></label>
            <input
              key={fileKey}
              id="document"
              name="document"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
            />
            <small className="hint">PDF, JPG or PNG, up to {MAX_SIZE_MB} MB.</small>
          </div>

          <div className="form-field">
            <label htmlFor="notes">Notes for the reviewer (optional)</label>
            <textarea className="input outlined" id="notes" name="notes" rows={3}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Uploading..." : "Submit for review"}
          </button>
        </form>
      )}

      {success && !canSubmit && <div className="alert alert-success">{success}</div>}

      {requests.length > 0 && (
        <section className="card">
          <h2>Request history</h2>
          <ul className="history">
            {requests.map((r) => (
              <li key={r.id}>
                <div className="history-head">
                  <span className={`pill pill-${r.status}`}>{r.status}</span>
                  <span className="muted">Submitted {formatDate(r.created_at)}</span>
                </div>
                {r.notes && <p>Your note: {r.notes}</p>}
                {r.admin_notes && <p>Admin note: {r.admin_notes}</p>}
                {r.reviewed_at && <p className="muted">Reviewed {formatDate(r.reviewed_at)}</p>}
                {r.document && (
                  <a href={r.document} target="_blank" rel="noreferrer">View document</a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
