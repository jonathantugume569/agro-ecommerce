import { Navigate, Route, Routes } from "react-router-dom";
import RoleRoute from "./RoleRoute";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Profile from "../pages/farmer/Profile";
import VerificationRequest from "../pages/dealer/VerificationRequest";
import VerifyDealers from "../pages/admin/VerifyDealers";
import ManageUsers from "../pages/admin/ManageUsers";

const Placeholder = ({ title }) => (
  <div className="page"><h1>{title}</h1><p className="muted">Coming soon.</p></div>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RoleRoute allowedRoles={["farmer", "dealer"]} />}>
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["dealer"]} />}>
        <Route path="/dealer/verification" element={<VerificationRequest />} />
        <Route path="/dealer/dashboard" element={<Placeholder title="Dealer dashboard" />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/verifications" element={<VerifyDealers />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/dashboard" element={<Placeholder title="Admin dashboard" />} />
      </Route>

      <Route path="/products" element={<Placeholder title="Products" />} />
      <Route path="*" element={<Placeholder title="Page not found" />} />
    </Routes>
  );
}