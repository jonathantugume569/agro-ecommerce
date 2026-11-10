import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormField from "../../components/common/FormField";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage, getFieldErrors } from "../../utils/apiErrors";
import { homePathForRole } from "../../utils/roles";
import "../../styles/accounts.css";

const INITIAL = {
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  location: "",
  district: "",
  business_name: "",
  license_number: "",
};

export default function Register() {
  const { register, login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("farmer");
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  if (isAuthenticated && user) {
    // New dealers go straight to the verification page.
    const target =
      justRegistered && user.role === "dealer"
        ? "/dealer/verification"
        : homePathForRole(user.role);
    return <Navigate to={target} replace />;
  }

  const isDealer = role === "dealer";

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role,
      location: form.location.trim(),
      district: form.district.trim(),
    };
    if (isDealer) {
      payload.business_name = form.business_name.trim();
      payload.license_number = form.license_number.trim();
    }

    setSubmitting(true);
    try {
      await register(payload);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "Registration failed. Please check the form."));
      setSubmitting(false);
      return;
    }

    // Account created: sign in automatically.
    try {
      setJustRegistered(true);
      await login(payload.username, payload.password);
    } catch {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card auth-card-wide" onSubmit={handleSubmit}>
        <h1>Create your account</h1>

        <div className="role-switch" role="group" aria-label="Account type">
          <button
            type="button"
            className={`role-option${role === "farmer" ? " active" : ""}`}
            onClick={() => setRole("farmer")}
          >
            I am a farmer
          </button>
          <button
            type="button"
            className={`role-option${role === "dealer" ? " active" : ""}`}
            onClick={() => setRole("dealer")}
          >
            I am an agro-dealer
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <FormField label="Username" name="username" value={form.username}
            onChange={handleChange} error={fieldErrors.username} required />
          <FormField label="Email" name="email" type="email" value={form.email}
            onChange={handleChange} error={fieldErrors.email} required />
          <FormField label="Phone" name="phone" type="tel" value={form.phone}
            onChange={handleChange} error={fieldErrors.phone} placeholder="+256..." />
          <FormField label="District" name="district" value={form.district}
            onChange={handleChange} error={fieldErrors.district} />
          <FormField label="Location / village" name="location" value={form.location}
            onChange={handleChange} error={fieldErrors.location} />

          {isDealer && (
            <>
              <FormField label="Business name" name="business_name" value={form.business_name}
                onChange={handleChange} error={fieldErrors.business_name} required />
              <FormField label="Trading licence number" name="license_number"
                value={form.license_number} onChange={handleChange}
                error={fieldErrors.license_number} required
                hint="You will upload the licence document after signing up." />
            </>
          )}

          <FormField label="Password" name="password" type="password" value={form.password}
            onChange={handleChange} error={fieldErrors.password} autoComplete="new-password"
            hint="At least 8 characters, not too common." required />
          <FormField label="Confirm password" name="confirmPassword" type="password"
            value={form.confirmPassword} onChange={handleChange}
            error={fieldErrors.confirmPassword} autoComplete="new-password" required />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
