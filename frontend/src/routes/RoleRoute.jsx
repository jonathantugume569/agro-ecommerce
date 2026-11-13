import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePathForRole } from "../utils/roles";

// <RoleRoute allowedRoles={["dealer"]}> ...pages... </RoleRoute>
// or as a layout route: <Route element={<RoleRoute allowedRoles={["admin"]} />}>
export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="route-loading">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return children ?? <Outlet />;
}
