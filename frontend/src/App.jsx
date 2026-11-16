import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "sonner";
import { AppProvider } from "./context/AppContext";
import AppModal from "./components/common/Modal";
import { useAppContext } from "./context/AppContext";

function ModalHost() {
  const { currentChild } = useAppContext();
  return <AppModal>{currentChild}</AppModal>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
            <ModalHost />
            <Toaster position="top-right" richColors />
          </CartProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}