import { useState } from "react";
import { Menu } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "../BreadCrumbs";
import "./AppLayout.css";
import { useBreadcrumb } from "../../context/breadcrumbStore";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  children:  "Niños",
  new:       "Nuevo niño",
  access:    "Recepción",
  handover:  "Registro de salida",
};

function useBreadcrumbs() {
  const { pathname, state } = useLocation();
  const { customLabel } = useBreadcrumb();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return segments.map((segment, index) => {
    const to = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    // Si está en el mapa lo usa, si no busca en el state.name
    const label = ROUTE_LABELS[segment] ?? (state?.name as string) ?? (customLabel || "Expediente");

    return {
      label,
      to: isLast ? undefined : to,
    };
  });
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const breadcrumbs = useBreadcrumbs();
  const { pathname } = useLocation();
  const isReception = pathname === "/access" || pathname === "/handover";

  return (
    <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "mobile-nav-open" : ""}`}>
      <Sidebar collapsed={mobileOpen ? false : collapsed} onToggle={() => {
        if (window.matchMedia("(max-width: 1024px)").matches) setMobileOpen(false);
        else setCollapsed(p => !p);
      }} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <button className="app-sidebar-backdrop" aria-label="Cerrar navegación" onClick={() => setMobileOpen(false)} />}
      <div className="app-right">
          <div className={`app-topbar ${breadcrumbs ? "" : "app-topbar-mobile-only"}`}>
            <button className="app-menu-toggle" aria-label="Abrir navegación" aria-expanded={mobileOpen}
              aria-controls="app-sidebar" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
            {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : <span className="app-mobile-title">Guardería</span>}
          </div>
        <main className={`app-content ${isReception ? "app-content-reception" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
