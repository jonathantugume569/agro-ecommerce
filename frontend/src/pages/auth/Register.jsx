import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../../utils/formatters";
import { homePathForRole } from "../../utils/roles";

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
      setError(
        getErrorMessage(err, "Registration failed. Please check the form."),
      );
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form className="card min-w-lg" onSubmit={handleSubmit}>
        <h1 className="border-b border-gray-200 pb-4 text-center">
          Create your account
        </h1>

        <div
          className="flex gap-4 border-b border-gray-200 py-4"
          role="group"
          aria-label="Account type"
        >
          <button
            type="button"
            className={`btn ${role === "farmer" ? " primary" : " secondary"} flex-1`}
            onClick={() => setRole("farmer")}
          >
            I am a farmer
          </button>
          <button
            type="button"
            className={`btn ${role === "dealer" ? " primary" : " secondary"} flex-1`}
            onClick={() => setRole("dealer")}
          >
            I am an Agro Dealer
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="flex flex-col my-4">
          <div
            className={`form-field${fieldErrors.username ? " has-error" : ""}`}
          >
            <label htmlFor="username">Username</label>
            <input
              className="input outlined"
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
            {fieldErrors.username && (
              <small className="field-error">{fieldErrors.username}</small>
            )}
          </div>
          <div className={`form-field${fieldErrors.email ? " has-error" : ""}`}>
            <label htmlFor="email">Email</label>
            <input
              className="input outlined"
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            {fieldErrors.email && (
              <small className="field-error">{fieldErrors.email}</small>
            )}
          </div>
          <div className={`form-field${fieldErrors.phone ? " has-error" : ""}`}>
            <label htmlFor="phone">Phone</label>
            <input
              className="input outlined"
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+2567XXXXXXXX"
            />
            {fieldErrors.phone && (
              <small className="field-error">{fieldErrors.phone}</small>
            )}
          </div>
          <div className="flex gap-4">
            <div
              className={`flex-1 form-field${fieldErrors.district ? " has-error" : ""}`}
            >
              <label htmlFor="district">District</label>
              <input
                className="input outlined"
                id="district"
                name="district"
                value={form.district}
                onChange={handleChange}
              />
              {fieldErrors.district && (
                <small className="field-error">{fieldErrors.district}</small>
              )}
            </div>
            <div
              className={`flex-1 form-field${fieldErrors.location ? " has-error" : ""}`}
            >
              <label htmlFor="location">Location / village</label>
              <input
                className="input outlined"
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
              />
              {fieldErrors.location && (
                <small className="field-error">{fieldErrors.location}</small>
              )}
            </div>
          </div>

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
                  value={form.business_name}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.business_name && (
                  <small className="field-error">
                    {fieldErrors.business_name}
                  </small>
                )}
              </div>
              <div
                className={`form-field${fieldErrors.license_number ? " has-error" : ""}`}
              >
                <label htmlFor="license_number">Trading licence number</label>
                <input
                  className="input outlined"
                  id="license_number"
                  name="license_number"
                  value={form.license_number}
                  onChange={handleChange}
                  required
                />
                <small className="hint">
                  You will upload the licence document after signing up.
                </small>
                {fieldErrors.license_number && (
                  <small className="field-error">
                    {fieldErrors.license_number}
                  </small>
                )}
              </div>
            </>
          )}

          <div
            className={`form-field${fieldErrors.password ? " has-error" : ""}`}
          >
            <label htmlFor="password">Password</label>
            <input
              className="input outlined"
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <small className="hint">
              At least 8 characters, not too common.
            </small>
            {fieldErrors.password && (
              <small className="field-error">{fieldErrors.password}</small>
            )}
          </div>
          <div
            className={`form-field${fieldErrors.confirmPassword ? " has-error" : ""}`}
          >
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              className="input outlined"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirmPassword && (
              <small className="field-error">
                {fieldErrors.confirmPassword}
              </small>
            )}
          </div>
        </div>

        <button
          className="btn primary w-full"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-4">
          Already registered?{" "}
          <Link to="/login" className="link underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
