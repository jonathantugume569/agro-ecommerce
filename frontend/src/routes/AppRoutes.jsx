import { Navigate, Route, Routes } from "react-router-dom";
import RoleRoute from "./RoleRoute";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Profile from "../pages/farmer/Profile";
import VerificationRequest from "../pages/dealer/VerificationRequest";
import VerifyDealers from "../pages/admin/VerifyDealers";
import ManageUsers from "../pages/admin/ManageUsers";
import Cart from "../pages/farmer/Cart";
import Checkout from "../pages/farmer/Checkout";
import MyOrders from "../pages/farmer/MyOrders";
import OrderDetail from "../pages/farmer/OrderDetail";
import DealerOrders from "../pages/dealer/DealerOrders";
import HomePage from "../pages/farmer/HomePage";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";
import MyListings from "../pages/dealer/MyListings";
import ListingForm from "../pages/dealer/ListingForm";
import AdminDashboard from "../pages/admin/Dashboard";
import DealerDashboard from "../pages/dealer/Dashboard";
import TrackDelivery from "../pages/farmer/TrackDelivery";
import UpdateDelivery from "../pages/dealer/UpdateDelivery";
import Categories from "../pages/admin/Categories";

const Placeholder = ({ title }) => (
  <div className="page">
    <h1>{title}</h1>
    <p className="muted">Coming soon.</p>
  </div>
);

export default function AppRoutes() {
  return (
    <>
      <Header />
      <main className="bg-gray-100">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<RoleRoute allowedRoles={["farmer", "dealer"]} />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["farmer"]} />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/orders/:orderId/track" element={<TrackDelivery />} />
          </Route>

          <Route
            path="/admin/categories"
            element={<Categories />}
          />

          <Route element={<RoleRoute allowedRoles={["dealer"]} />}>
            <Route
              path="/dealer/verification"
              element={<VerificationRequest />}
            />
            <Route
              path="/dealer/dashboard"
              element={<DealerDashboard />}
            />
            <Route path="/dealer/orders" element={<DealerOrders />} />
            <Route path="/dealer/listings" element={<MyListings />} />
            <Route path="/dealer/listings/new" element={<ListingForm />} />
            <Route path="/dealer/listings/:id/edit" element={<ListingForm />} />
            <Route path="/dealer/dashboard" element={<DealerDashboard />}/>
            <Route path="/dealer/orders/:orderId/delivery" element={<UpdateDelivery />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/verifications" element={<VerifyDealers />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />}/>
          </Route>

          <Route path="/products" element={<HomePage />} />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}