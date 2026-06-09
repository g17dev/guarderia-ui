import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "../BreadCrumbs";
import "./AppLayout.css";

const ROUTE_LABELS: Record<string, string> = {
  dashboard:  "Dashboard",
  children:   "Niños",
  new:        "Nuevo niño",
  access:     "Control de acceso",
};

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  // Solo mostrar si hay más de un segmento
  if (segments.length <= 1) return null;

  return segments.map((segment, index) => {
    const to = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    return {
      label: ROUTE_LABELS[segment] ?? segment,
      to: isLast ? undefined : to,
    };
  });
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const breadcrumbs = useBreadcrumbs();

  return (
    <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div className="app-right">
        {breadcrumbs && (
          <div className="app-topbar">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}