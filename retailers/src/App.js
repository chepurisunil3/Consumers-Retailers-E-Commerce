import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, RequirePermission } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardOverviewPage from "./pages/DashboardOverviewPage";
import ProductsListPage from "./pages/ProductsListPage";
import ProductFormPage from "./pages/ProductFormPage";
import CategoriesPage from "./pages/CategoriesPage";
import OrdersListPage from "./pages/OrdersListPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import StaffPage from "./pages/StaffPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<RequireAuth><DashboardOverviewPage /></RequireAuth>} />
          <Route path="/dashboard/products" element={<RequireAuth><ProductsListPage /></RequireAuth>} />
          <Route
            path="/dashboard/products/new"
            element={
              <RequireAuth>
                <RequirePermission action="products.write"><ProductFormPage /></RequirePermission>
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/products/:id/edit"
            element={
              <RequireAuth>
                <RequirePermission action="products.write"><ProductFormPage /></RequirePermission>
              </RequireAuth>
            }
          />
          <Route path="/dashboard/categories" element={<RequireAuth><CategoriesPage /></RequireAuth>} />
          <Route path="/dashboard/orders" element={<RequireAuth><OrdersListPage /></RequireAuth>} />
          <Route path="/dashboard/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
          <Route
            path="/dashboard/staff"
            element={
              <RequireAuth>
                <RequirePermission action="staff.manage"><StaffPage /></RequirePermission>
              </RequireAuth>
            }
          />
          <Route path="/dashboard/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
