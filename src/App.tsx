import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import ChildAccess from "./pages/ChildAccess";
import ChildHandover from "./pages/ChildHandover";
import { Dashboard } from "./pages/Dashboard";
import { ChildrenManagement } from "./pages/ChildrenManagement";
import { ChildNew } from "./pages/ChildNew";
import { ChildProfile } from "./pages/ChildProfile";
import { ToastProvider } from "./context/ToastContext";
import { ToastContainer } from "./components/toasts/ToastContainer";
import { BreadcrumbProvider } from "./context/BreadcrumbContext";
import { lazy, Suspense } from "react";

const DesignLab = lazy(() => import("./features/design-lab/DesignLab"));

export default function App() {
  return (
    <ToastProvider>
      <BreadcrumbProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/design-lab/*" element={<Suspense fallback={<p role="status">Cargando laboratorio…</p>}><DesignLab /></Suspense>} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"     element={<Dashboard />} />
              <Route path="children"      element={<ChildrenManagement />} />
              <Route path="children/new"  element={<ChildNew />} />
              <Route path="children/:slug" element={<ChildProfile />} />
              <Route path="access"        element={<ChildAccess />} />
              <Route path="handover"      element={<ChildHandover />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </BreadcrumbProvider>
    </ToastProvider>
  );
}
