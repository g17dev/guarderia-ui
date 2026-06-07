import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./BreadCrumbs.css";

interface BreadcrumbItem {
  label: string;
  to?: string; // si no tiene 'to' es el item actual (sin link)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="breadcrumb-item">
            {!isLast && item.to ? (
              <Link to={item.to} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
            {!isLast && (
              <ChevronRight size={14} className="breadcrumb-separator" />
            )}
          </span>
        );
      })}
    </nav>
  );
}