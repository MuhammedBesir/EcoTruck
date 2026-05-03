import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Sidebar } from "./components/shared/Sidebar";
import { TopBar } from "./components/shared/TopBar";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { RoleGuard } from "./components/shared/RoleGuard";
import Dashboard from "./pages/Dashboard";
import Emissions from "./pages/Emissions";
import Suppliers from "./pages/Suppliers";
import Offsets from "./pages/Offsets";
import Compliance from "./pages/Compliance";
import AuditLog from "./pages/AuditLog";
import SupplierPortal from "./pages/SupplierPortal";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import Forbidden from "./pages/Forbidden";
import Login from "./pages/Login";
import Register from "./pages/Register";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function HomeRedirect() {
  const { currentUser } = useAppContext();
  if (currentUser?.role === "supplier")
    return <Navigate to="/supplier-portal" replace />;
  return <Navigate to="/dashboard" replace />;
}

function ProtectedLayout() {
  const { token, authLoading } = useAppContext();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-eco-bg dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-eco-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-eco-bg dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-14 p-6">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />

              {/* Admin + Manager + Analyst + Viewer */}
              <Route
                path="/dashboard"
                element={
                  <RoleGuard
                    allowedRoles={["admin", "manager", "analyst", "viewer"]}
                  >
                    <Dashboard />
                  </RoleGuard>
                }
              />

              {/* Admin + Manager + Analyst */}
              <Route
                path="/emissions"
                element={
                  <RoleGuard allowedRoles={["admin", "manager", "analyst"]}>
                    <Emissions />
                  </RoleGuard>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <RoleGuard allowedRoles={["admin", "manager", "analyst"]}>
                    <Suppliers />
                  </RoleGuard>
                }
              />

              {/* Admin + Manager */}
              <Route
                path="/offsets"
                element={
                  <RoleGuard allowedRoles={["admin", "manager"]}>
                    <Offsets />
                  </RoleGuard>
                }
              />
              <Route
                path="/compliance"
                element={
                  <RoleGuard allowedRoles={["admin", "manager"]}>
                    <Compliance />
                  </RoleGuard>
                }
              />

              {/* Admin only */}
              <Route
                path="/audit-log"
                element={
                  <RoleGuard allowedRoles={["admin"]}>
                    <AuditLog />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin"
                element={
                  <RoleGuard allowedRoles={["admin"]}>
                    <AdminPanel />
                  </RoleGuard>
                }
              />

              {/* Supplier only */}
              <Route
                path="/supplier-portal"
                element={
                  <RoleGuard allowedRoles={["supplier"]}>
                    <SupplierPortal />
                  </RoleGuard>
                }
              />

              {/* All roles */}
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/403" element={<Forbidden />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}
