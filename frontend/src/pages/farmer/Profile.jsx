import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, updateProfile } from "../../api/dealersApi";
import FormField from "../../components/common/FormField";
import VerifiedBadge from "../../components/dealers/VerifiedBadge";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage, getFieldErrors } from "../../utils/apiErrors";
import { formatDate } from "../../utils/formatDate";
import "../../styles/accounts.css";

const FARMER_FIELDS = ["location", "district", "farm_size_acres", "main_crops"];
const DEALER_FIELDS = ["business_name", "license_number", "location", "district", "description"];

function toForm(data, fields) {
  return Object.fromEntries(fields.map((key) => [key, data[key] ?? ""]));
}

// Used by both farmers and dealers.
export default function Profile() {
  const { user, refreshUser } = useAuth();
  const isDealer = user?.role === "dealer";
  const isFarmer = user?.role === "farmer";
  const fields = isDealer ? DEALER_FIELDS : FARMER_FIELDS;

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(isDealer || isFarmer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isDealer && !isFarmer) return undefined;
    let active = true;

    getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setForm(toForm(data, fields));
      })
      .catch((err) => active && setError(getErrorMessage(err, "Could not load your profile.")))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [isDealer, isFarmer]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSuccess("");
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const payload = { ...form };
    if (isFarmer) {
      payload.farm_size_acres = form.farm_size_acres === "" ? null : form.farm_size_acres;
    }
    if (isDealer) {
      delete payload.license_number; // licence is not editable here
    }

    setSaving(true);
    try {
      const updated = await updateProfile(payload);
      setProfile(updated);
      setForm(toForm(updated, fields));
      setSuccess("Profile saved.");
      refreshUser().catch(() => {});
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "Could not save your profile."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page"><p>Loading profile...</p></div>;

  return (
    <div className="page">
      <h1>My profile</h1>

      <section className="card">
        <h2>Account</h2>
        <dl className="details">
          <div><dt>Username</dt><dd>{user?.username}</dd></div>
          <div><dt>Email</dt><dd>{user?.email}</dd></div>
          <div><dt>Phone</dt><dd>{user?.phone || "Not provided"}</dd></div>
          <div><dt>Account type</dt><dd className="capitalize">{user?.role}</dd></div>
        </dl>
      </section>

      {isDealer && profile && (
        <section className="card">
          <h2>Verification</h2>
          {profile.is_verified ? (
            <p>
              <VerifiedBadge verified /> Verified on {formatDate(profile.verified_at)}. Farmers can
              see your verified badge on your listings.
            </p>
          ) : (
            <div className="alert alert-info">
              Your business is not verified yet, so you cannot publish listings.{" "}
              <Link to="/dealer/verification">Submit your documents</Link>
            </div>
          )}
        </section>
      )}

      {(isDealer || isFarmer) && (
        <form className="card" onSubmit={handleSubmit}>
          <h2>{isDealer ? "Business details" : "Farm details"}</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-grid">
            {isDealer && (
              <>
                <FormField label="Business name" name="business_name" value={form.business_name ?? ""}
                  onChange={handleChange} error={fieldErrors.business_name} required />
                <FormField label="Licence number" name="license_number" value={form.license_number ?? ""}
                  disabled hint="Contact an admin to change your licence number." />
              </>
            )}

            <FormField label="Location / village" name="location" value={form.location ?? ""}
              onChange={handleChange} error={fieldErrors.location} />
            <FormField label="District" name="district" value={form.district ?? ""}
              onChange={handleChange} error={fieldErrors.district} />

            {isFarmer && (
              <>
                <FormField label="Farm size (acres)" name="farm_size_acres" type="number"
                  min="0" step="0.01" value={form.farm_size_acres ?? ""}
                  onChange={handleChange} error={fieldErrors.farm_size_acres} />
                <FormField label="Main crops" name="main_crops" value={form.main_crops ?? ""}
                  onChange={handleChange} error={fieldErrors.main_crops}
                  placeholder="Maize, beans, coffee" />
              </>
            )}
          </div>

          {isDealer && (
            <FormField as="textarea" rows={4} label="About your business" name="description"
              value={form.description ?? ""} onChange={handleChange} error={fieldErrors.description} />
          )}

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}

      {!isDealer && !isFarmer && (
        <div className="alert alert-info">Admin accounts do not have a profile.</div>
      )}
    </div>
  );
}
