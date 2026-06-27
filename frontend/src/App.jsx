import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AdminContext } from "./contexts/AdminContext.jsx";
import { TechnicianContext } from "./contexts/TechnicianContext.jsx";

import NotFoundPage from "./pages/utils/NotFoundPage.jsx";
import RoleBaseLoginPage from "./pages/Auth/RoleBaseLoginPage.jsx";
import AppLayout from "./components/AppLayout.jsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.jsx";
import CreateAssetPage from "./pages/Inventory/CreateAssetPage.jsx";
import InventoryPage from "./pages/Inventory/InventoryPage.jsx";
import UpdateAssetPage from "./pages/Inventory/UpdateAssetPage.jsx";
import ViewAssetPage from "./pages/Inventory/ViewAssetPage.jsx";
import OrdersPage from "./pages/Order/OrdersPage.jsx";
import CreateOrderPage from "./pages/Order/CreateOrderPage.jsx";
import ViewOrderPage from "./pages/Order/ViewOrderPage.jsx";
import UpdateOrderPage from "./pages/Order/UpdateOrderPage.jsx";
import AdminProfilePage from "./pages/Profile/AdminProfilePage.jsx";
import UpdateAdminProfilePage from "./pages/Profile/UpdateAdminProfilePage.jsx";
import TechnicianProfilePage from "./pages/Profile/TechnicianProfilePage.jsx";
import UpdateTechnicianProfilePage from "./pages/Profile/UpdateTechnicianProfilePage.jsx";
import UpdateTechnicianPage from "./pages/Technician/UpdateTechninicanPage.jsx";
import RegisterTechnicianPage from "./pages/Technician/RegisterTechnicianPage.jsx";
import TechniciansPage from "./pages/Technician/TechniciansPage.jsx";
import ViewTechnicianPage from "./pages/Technician/ViewTechninicanPage.jsx";

const AuthenticatedRoute = ({ children, isCurrentUserLoggedIn }) => {
  return isCurrentUserLoggedIn ? children : <Navigate to="/login" />;
};

const UnauthenticatedRoute = ({ children, isNoUserLoggedIn }) => {
  return isNoUserLoggedIn ? children : <Navigate to="/dashboard" />;
};

const App = () => {
  const { isLoadingAdminAuth, isAdminLoggedIn } = useContext(AdminContext);
  const { isLoadingTechnicianAuth, isTechnicianLoggedIn } =
    useContext(TechnicianContext);

  // Wait for BOTH contexts to finish checking localStorage before routing
  if (isLoadingAdminAuth || isLoadingTechnicianAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-on-surface font-body font-medium">
        Loading CelerityForge...
      </div>
    );
  }

  return (
    <Routes>
      {/* --- DEFAULT ROUTE ---*/}
      <Route
        path="/"
        element={
          isAdminLoggedIn || isTechnicianLoggedIn ? (
            <Navigate to="/dashboard" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* --- RBLOGIN ROUTE --- */}
      <Route
        path="/login"
        element={
          <UnauthenticatedRoute
            isNoUserLoggedIn={!isAdminLoggedIn && !isTechnicianLoggedIn}
          >
            <RoleBaseLoginPage />
          </UnauthenticatedRoute>
        }
      />

      {/* --- APPLAYOUT AND CHILDREN ROUTES --- */}
      <Route
        element={
          <AuthenticatedRoute
            isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
          >
            <AppLayout />
          </AuthenticatedRoute>
        }
      >
        {/* <Route
          element={
            (isLoadingAdminAuth || isLoadingTechnicianAuth) && (
              <div className="min-h-screen w-full flex items-center justify-center bg-background text-on-surface font-body font-medium">
                Loading CelerityForge...
              </div>
            )
          }
        /> */}

        {/* --- DASHBOARD ROUTE --- */}
        <Route
          path="/dashboard"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              <DashboardPage />
            </AuthenticatedRoute>
          }
        />

        {/* --- INVENTORY ROUTES --- */}
        <Route
          path="/inventory/assets"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              <InventoryPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/inventory/assets/create"
          element={
            <AuthenticatedRoute isCurrentUserLoggedIn={isAdminLoggedIn}>
              <CreateAssetPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/inventory/assets/:assetId"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              <ViewAssetPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/inventory/assets/:assetId/update"
          element={
            <AuthenticatedRoute isCurrentUserLoggedIn={isAdminLoggedIn}>
              <UpdateAssetPage />
            </AuthenticatedRoute>
          }
        />

        {/* --- ORDERS ROUTES --- */}
        <Route
          path="/orders"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              <OrdersPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/orders/create"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              <CreateOrderPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              <ViewOrderPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/orders/:orderId/update"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              <UpdateOrderPage />
            </AuthenticatedRoute>
          }
        />

        {/* --- PROFILE ROUTES --- */}
        <Route
          path="/profile"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              {isAdminLoggedIn ? (
                <AdminProfilePage />
              ) : (
                <TechnicianProfilePage />
              )}
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/profile/update"
          element={
            <AuthenticatedRoute
              isCurrentUserLoggedIn={isAdminLoggedIn || isTechnicianLoggedIn}
            >
              {isAdminLoggedIn ? (
                <UpdateAdminProfilePage />
              ) : (
                <UpdateTechnicianProfilePage />
              )}
            </AuthenticatedRoute>
          }
        />

        {/* --- TECHNICIANS ROUTES --- */}
        <Route
          path="/technicians"
          element={
            <AuthenticatedRoute isCurrentUserLoggedIn={isAdminLoggedIn}>
              <TechniciansPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/technicians/register"
          element={
            <AuthenticatedRoute isCurrentUserLoggedIn={isAdminLoggedIn}>
              <RegisterTechnicianPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/technicians/:technicianId"
          element={
            <AuthenticatedRoute isCurrentUserLoggedIn={isAdminLoggedIn}>
              <ViewTechnicianPage />
            </AuthenticatedRoute>
          }
        />
        <Route
          path="/technicians/:technicianId/update"
          element={
            <AuthenticatedRoute isCurrentUserLoggedIn={isAdminLoggedIn}>
              <UpdateTechnicianPage />
            </AuthenticatedRoute>
          }
        />
      </Route>

      {/* --- CATCH / NOT FOUND ROUTE --- */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
