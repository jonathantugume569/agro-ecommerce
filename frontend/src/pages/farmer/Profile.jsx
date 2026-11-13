import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getProfile, updateProfile } from "../../utils/requests";
import { useAuth } from "../../context/AuthContext";
import {
  getErrorMessage,
  getFieldErrors,
  formatDate,
} from "../../utils/formatters";
import { DoorOpenIcon } from "@phosphor-icons/react";

const FARMER_FIELDS = ["location", "district", "farm_size_acres", "main_crops"];
const DEALER_FIELDS = [
  "business_name",
  "license_number",
  "location",
  "district",
  "description",
];

function toForm(data, fields) {
  return Object.fromEntries(fields.map((key) => [key, data[key] ?? ""]));
}

// Used by both farmers and dealers.
export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

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

  function handleLogout() {
    logout();
    toast.success("Signed out.");
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    if (!isDealer && !isFarmer) return undefined;
    let active = true;

    getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setForm(toForm(data, fields));
      })
      .catch(
        (err) =>
          active &&
          setError(getErrorMessage(err, "Could not load your profile.")),
      )
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
      payload.farm_size_acres =
        form.farm_size_acres === "" ? null : form.farm_size_acres;
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

  if (loading)
    return (
      <div className="page">
        <p>Loading profile...</p>
      </div>
    );

  return (
    <div className="page">
      <h1>My profile</h1>

      <section className="card">
        <div class="flex items-center justify-between">
          <h2 className="border-b border-gray-300 pb-4">Account</h2>
          <button
            type="button"
            className="btn secondary"
            onClick={handleLogout}
          >
            <DoorOpenIcon />
            Sign out
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 mt-4">
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <div id="username" className="uppercase">
              {user?.username}
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <div id="email" className="">
              {user?.email}
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone</label>
            <div id="phone" className="uppercase">
              {user?.phone || "Not provided"}
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="role">Account type</label>
            <div id="role" className="uppercase">
              {user?.role}
            </div>
          </div>
        </div>
      </section>

      {isDealer && profile && (
        <section className="card">
          <h2 className="border-b border-gray-300 pb-4 my-4">Verification</h2>
          {profile.is_verified ? (
            <p>
              <span className="pill pill-approved">Verified</span> Verified on{" "}
              {formatDate(profile.verified_at)}. Farmers can see your verified
              badge on your listings.
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
          <h2 className="border-b border-gray-300 pb-4">
            {isDealer ? "Business details" : "Farm details"}
          </h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 mt-4">
            {isDealer && (
              <>
                <div
                  className={`form-field${fieldErrors.business_name ? " has-error" : ""}`}
                >
                  <label htmlFor="business_name">Business name</label>
                  <input
                    className="input outlined"
                    id="business_name"
                    name="business_name"
                    value={form.business_name ?? ""}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.business_name && (
                    <small className="field-error">
                      {fieldErrors.business_name}
                    </small>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="license_number">Licence number</label>
                  <input
                    className="input outlined"
                    id="license_number"
                    name="license_number"
                    value={form.license_number ?? ""}
                    disabled
                  />
                  <small className="hint">
                    Contact an admin to change your licence number.
                  </small>
                </div>
              </>
            )}

            <div
              className={`form-field${fieldErrors.location ? " has-error" : ""}`}
            >
              <label htmlFor="location">Location / village</label>
              <input
                className="input outlined"
                id="location"
                name="location"
                value={form.location ?? ""}
                onChange={handleChange}
              />
              {fieldErrors.location && (
                <small className="field-error">{fieldErrors.location}</small>
              )}
            </div>
            <div
              className={`form-field${fieldErrors.district ? " has-error" : ""}`}
            >
              <label htmlFor="district">District</label>
              <input
                className="input outlined"
                id="district"
                name="district"
                value={form.district ?? ""}
                onChange={handleChange}
              />
              {fieldErrors.district && (
                <small className="field-error">{fieldErrors.district}</small>
              )}
            </div>

            {isFarmer && (
              <>
                <div
                  className={`form-field${fieldErrors.farm_size_acres ? " has-error" : ""}`}
                >
                  <label htmlFor="farm_size_acres">Farm size (acres)</label>
                  <input
                    className="input outlined"
                    id="farm_size_acres"
                    name="farm_size_acres"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.farm_size_acres ?? ""}
                    onChange={handleChange}
                  />
                  {fieldErrors.farm_size_acres && (
                    <small className="field-error">
                      {fieldErrors.farm_size_acres}
                    </small>
                  )}
                </div>
                <div
                  className={`form-field${fieldErrors.main_crops ? " has-error" : ""}`}
                >
                  <label htmlFor="main_crops">Main crops</label>
                  <input
                    className="input outlined"
                    id="main_crops"
                    name="main_crops"
                    value={form.main_crops ?? ""}
                    onChange={handleChange}
                    placeholder="Maize, beans, coffee"
                  />
                  {fieldErrors.main_crops && (
                    <small className="field-error">
                      {fieldErrors.main_crops}
                    </small>
                  )}
                </div>
              </>
            )}
          </div>

          {isDealer && (
            <div
              className={`form-field${fieldErrors.description ? " has-error" : ""}`}
            >
              <label htmlFor="description">About your business</label>
              <textarea
                className="input outlined"
                id="description"
                name="description"
                rows={4}
                value={form.description ?? ""}
                onChange={handleChange}
              />
              {fieldErrors.description && (
                <small className="field-error">{fieldErrors.description}</small>
              )}
            </div>
          )}

          <button
            className="btn primary mt-4 self-right"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}

      {!isDealer && !isFarmer && (
        <div className="alert alert-info">
          Admin accounts do not have a profile.
        </div>
      )}
    </div>
  );
}
