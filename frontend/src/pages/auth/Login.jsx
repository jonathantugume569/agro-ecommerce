import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import FormField from "../../components/common/FormField";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/apiErrors";
import { homePathForRole } from "../../utils/roles";
import "../../styles/accounts.css";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in (or just logged in): go back where the user came from, or to their home.
  if (isAuthenticated && user) {
    const from = location.state?.from?.pathname;
    return <Navigate to={from || homePathForRole(user.role)} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.username.trim(), form.password);
      // The redirect happens above, once the user is set.
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Check your username and password."));
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to buy or sell farm inputs.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <FormField
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
