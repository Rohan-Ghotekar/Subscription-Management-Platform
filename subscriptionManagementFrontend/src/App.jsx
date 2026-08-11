import "./App.css";
import PageTransition from "./components/PageTransition";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterProvider from "./pages/RegisterProvider";
import ForgotPassword from "./pages/ForgotPassword";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagePlans from "./pages/admin/ManagePlans";
import NotificationAdmin from "./pages/admin/Notifications";

import Analytics from "./pages/admin/Analytics";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageProviders from "./pages/admin/ManageProviders";
import AdminPaymentHistory from "./pages/admin/AdminPaymentHistory";
// User pages

import UserDashboard from "./pages/user/UserDashboard";
import Plans from "./pages/user/Plans";
import Subscription from "./pages/user/Subscription";
import Profile from "./pages/user/Profile";
import Notifications from "./pages/user/Notifications";

import ChangePassword from "./pages/user/ChangePassword";
import PaymentSuccess from "./pages/user/PaymentSuccess";
import PaymentCancel from "./pages/user/PaymentCancel";
import BillingHistory from "./pages/user/BillingHistory";

// Provider pages
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderManagePlans from "./pages/provider/ProviderManagePlans";
import ProviderViewUsers from "./pages/provider/ProviderViewUsers";
//import NotificationProvider from "./pages/provider/Notifications";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SidebarProvider>
        <Routes>
          {/* Auth routes */}
          <Route
            path="/login"
            element={
              <PageTransition>
                <Login />
              </PageTransition>
            }
          />
          <Route
            path="/register"
            element={
              <PageTransition>
                <Register />
              </PageTransition>
            }
          />
          <Route
            path="/register-provider"
            element={
              <PageTransition>
                <RegisterProvider />
              </PageTransition>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PageTransition>
                <ForgotPassword />
              </PageTransition>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageTransition>
                  <AdminDashboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageTransition>
                  <AdminPaymentHistory />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageTransition>
                  <ManagePlans />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/plans/create"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageTransition>
                  <ManagePlans />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageTransition>
                  <Analytics />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageTransition>
                  <ManageUsers />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/providers"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageTransition>
                  <ManageProviders />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          {/* User routes */}
          {/* Payment routes — public so Stripe can redirect back */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="user">
                <PageTransition>
                  <UserDashboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          {/* User billing */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute allowedRole="user">
                <PageTransition>
                  <BillingHistory />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans"
            element={
              <ProtectedRoute allowedRole="user">
                <PageTransition>
                  <Plans />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute allowedRole="user">
                <PageTransition>
                  <Subscription />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRole="user">
                <PageTransition>
                  <Profile />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRole="user">
                <PageTransition>
                  <Notifications />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/provider/notifications"
            element={
              <ProtectedRoute allowedRole="provider">
                <PageTransition>
                  <NotificationProvider />
                </PageTransition>
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageTransition>
                  <NotificationAdmin />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowedRole="user">
                <PageTransition>
                  <ChangePassword />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          {/* Provider routes */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute allowedRole="provider">
                <PageTransition>
                  <ProviderDashboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/plans"
            element={
              <ProtectedRoute allowedRole="provider">
                <PageTransition>
                  <ProviderManagePlans />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/plans/create"
            element={
              <ProtectedRoute allowedRole="provider">
                <PageTransition>
                  <ProviderManagePlans />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/users"
            element={
              <ProtectedRoute allowedRole="provider">
                <PageTransition>
                  <ProviderViewUsers />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          {/* Default: redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        </SidebarProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;