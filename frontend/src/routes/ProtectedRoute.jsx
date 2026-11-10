import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// Usage A (wrapper):  <ProtectedRoute><Page /></ProtectedRoute>
// Usage B (layout):   <Route element={<ProtectedRoute />}> ...child routes... </Route>
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="route-loading">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
