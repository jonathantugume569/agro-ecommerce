import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import FormField from "../../components/common/FormField";
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
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      const msg = "Passwords do not match.";
      setFieldErrors({ confirmPassword: msg });
      toast.error(msg);
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
    const toastId = toast.loading("Creating your account...");

    try {
      await register(payload);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      toast.error(
        getErrorMessage(err, "Registration failed. Please check the form."),
        { id: toastId }
      );
      setSubmitting(false);
      return;
    }

    // Account created: sign in automatically.
    try {
      setJustRegistered(true);
      await login(payload.username, payload.password);
      toast.success(
        isDealer
          ? "Account created! Please complete your dealer verification."
          : "Account created! Welcome to AgroEcom.",
        { id: toastId }
      );
    } catch {
      toast.info("Account created! Please sign in to continue.", {
        id: toastId,
      });
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form className="card w-full max-w-lg" onSubmit={handleSubmit}>
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

        {/* ---------- Section 1: same for everyone ---------- */}
        <fieldset className="mt-4 border-0 border-t border-gray-200 pt-4">
          <legend className="pr-2 font-bold">Account details</legend>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Username" name="username" value={form.username}
              onChange={handleChange} error={fieldErrors.username}
              autoComplete="username" required />
            <FormField label="Email" name="email" type="email" value={form.email}
              onChange={handleChange} error={fieldErrors.email}
              autoComplete="email" required />
            <FormField label="Phone" name="phone" type="tel" value={form.phone}
              onChange={handleChange} error={fieldErrors.phone} placeholder="+256..." />
            <div className="hidden sm:block" />
            <FormField label="Password" name="password" type="password" value={form.password}
              onChange={handleChange} error={fieldErrors.password} autoComplete="new-password"
              hint="At least 8 characters, not too common." required />
            <FormField label="Confirm password" name="confirmPassword" type="password"
              value={form.confirmPassword} onChange={handleChange}
              error={fieldErrors.confirmPassword} autoComplete="new-password" required />
          </div>
        </fieldset>

        {/* ---------- Section 2: depends on the role ---------- */}
        {isDealer ? (
          <fieldset className="mt-4 border-0 border-t border-gray-200 pt-4">
            <legend className="pr-2 font-bold">Business details</legend>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <FormField label="Business name" name="business_name" value={form.business_name}
                onChange={handleChange} error={fieldErrors.business_name} required />
              <FormField label="Trading licence number" name="license_number"
                value={form.license_number} onChange={handleChange}
                error={fieldErrors.license_number} required
                hint="You will upload the licence document after signing up." />
              <FormField label="Business location" name="location" value={form.location}
                onChange={handleChange} error={fieldErrors.location}
                placeholder="Town, street or market" />
              <FormField label="Business district" name="district" value={form.district}
                onChange={handleChange} error={fieldErrors.district} />
            </div>
          </fieldset>
        ) : (
          <fieldset className="mt-4 border-0 border-t border-gray-200 pt-4">
            <legend className="pr-2 font-bold">Farm location</legend>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <FormField label="Village / location" name="location" value={form.location}
                onChange={handleChange} error={fieldErrors.location} />
              <FormField label="District" name="district" value={form.district}
                onChange={handleChange} error={fieldErrors.district} />
            </div>
          </fieldset>
        )}

        <button
          className="btn primary w-full mt-4"
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
