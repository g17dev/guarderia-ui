import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "../BreadCrumbs";
import "./AppLayout.css";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  children:  "Niños",
  new:       "Nuevo niño",
  access:    "Control de acceso",
  handover:  "Registro de salida",
};

function useBreadcrumbs() {
  const { pathname, state } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return segments.map((segment, index) => {
    const to = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    // Si está en el mapa lo usa, si no busca en el state.name
    const label = ROUTE_LABELS[segment] ?? (state?.name as string) ?? segment;

    return {
      label,
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