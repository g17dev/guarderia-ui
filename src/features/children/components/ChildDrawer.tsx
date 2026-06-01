import { X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChildAvatar } from "./ChildAvatar";
import { getAge } from "../../../utils/child";
import type { Child } from "../../../types/child";
import "./ChildDrawer.css";

interface ChildDrawerProps {
  child: Child | null;
  onClose: () => void;
}

export function ChildDrawer({ child, onClose }: ChildDrawerProps) {
  const navigate = useNavigate();

  return (
    <>
      <div
        className={`drawer-overlay ${child ? "visible" : ""}`}
        onClick={onClose}
      />

      <div className={`drawer ${child ? "open" : ""}`}>
        {child && (
          <>
            <div className="drawer-header">
              <div className="drawer-header-info">
                <ChildAvatar child={child} size="md" />
                <div>
                  <h3>{child.name} {child.lastName}</h3>
                  <span className={`badge ${child.status === "active" ? "badge-active" : "badge-inactive"}`}>
                    {child.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <button className="drawer-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-content">
              <div className="drawer-section">
                <h4 className="drawer-section-title">Información general</h4>
                <div className="drawer-field">
                  <span className="drawer-label">Nombre completo</span>
                  <span className="drawer-value">{child.name} {child.lastName}</span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-label">Edad</span>
                  <span className="drawer-value">{getAge(child.birthDate)} años</span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-label">Fecha de nacimiento</span>
                  <span className="drawer-value">
                    {new Date(child.birthDate).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-label">Aula</span>
                  <span className="drawer-value">
                    <span className="badge badge-classroom">{child.classroom}</span>
                  </span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-label">Fecha de inscripción</span>
                  <span className="drawer-value">
                    {new Date(child.enrollmentDate).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Tutor</h4>
                <div className="drawer-field">
                  <span className="drawer-label">Nombre</span>
                  <span className="drawer-value">{child.tutor.name} {child.tutor.lastName}</span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-label">Relación</span>
                  <span className="drawer-value">{child.tutor.relationship}</span>
                </div>
                <div className="drawer-field">
                  <span className="drawer-label">Teléfono</span>
                  <span className="drawer-value">{child.tutor.phone}</span>
                </div>
              </div>

              <div className="drawer-section">
                <h4 className="drawer-section-title">Alergias y condiciones</h4>
                {child.allergies.length > 0 ? (
                  <div className="drawer-tags">
                    {child.allergies.map(a => (
                      <span key={a} className="drawer-tag">{a}</span>
                    ))}
                  </div>
                ) : (
                  <span className="drawer-empty">Sin alergias registradas</span>
                )}
              </div>
            </div>

            {/* Footer fuera de drawer-content */}
            <div className="drawer-footer">
              <button
                className="drawer-btn-primary"
                onClick={() => navigate(`/children/${child.id}`)}
              >
                <ExternalLink size={15} />
                Ver perfil completo
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}