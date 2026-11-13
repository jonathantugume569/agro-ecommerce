import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/formatters";
import { homePathForRole } from "../../utils/roles";

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
      setError(
        getErrorMessage(err, "Login failed. Check your username and password."),
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form className="card min-w-lg" onSubmit={handleSubmit}>
        <h1 className="border-b border-gray-200 pb-4 text-center">
          Welcome back
        </h1>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="flex flex-col mt-4">
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              className="input outlined"
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              className="input outlined"
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <button
            className="btn primary btn-block"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-switch">
            New here? <Link to="/register" className="link underline">Create an account</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
