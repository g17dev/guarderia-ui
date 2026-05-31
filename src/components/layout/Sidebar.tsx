import { NavLink } from "react-router-dom";
import { LayoutDashboard, DoorOpen, Menu, X } from "lucide-react";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/children",    icon: DoorOpen,        label: "Gestion de niños" },
  { to: "/access",    icon: DoorOpen,        label: "Control de acceso" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <span className="sidebar-logo">Guardería</span>}
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
          >
            <Icon size={20} className="sidebar-icon" />
            {!collapsed && <span className="sidebar-label">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}