import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { ChildAvatar } from "../features/children/components/ChildAvatar";
import { getAge } from "../utils/child";
import { MOCK_CHILDREN } from "../data/mockChildren";
import { useBreadcrumb } from "../context/BreadCrumbContext";
import { AttendanceTab } from "../features/children/profile/AttendanceTab";
import { PaymentsTab } from "../features/children/profile/PaymentsTab";
import { IncidentsTab } from "../features/children/profile/IncidentsTab";
import { HandoverTab } from "../features/children/profile/HandoverTab";
import { DocumentsTab } from "../features/children/profile/DocumentsTab";
import { NotesTab } from "../features/children/profile/NotesTab";
import "./ChildProfile.css";

const TABS = [
  { id: "attendance", label: "Asistencias"        },
  { id: "payments",   label: "Pagos"              },
  { id: "incidents",  label: "Incidentes"         },
  { id: "handovers",  label: "Historial de entregas" },
  { id: "documents",  label: "Documentos"         },
  { id: "notes",      label: "Notas"              },
];

const CLASSROOM_LABELS: Record<string, string> = {
  "maternal-a":   "Maternal A",
  "preescolar-1": "Preescolar 1",
  "primaria":     "Primaria",
};

export function ChildProfile() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { setCustomLabel } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState("attendance");

  const id = state?.id as string;
  const child = MOCK_CHILDREN.find(c => c.id === id);

  // Registra el nombre del niño en el breadcrumb
  useEffect(() => {
    if (child) setCustomLabel(`${child.name} ${child.lastName}`);
    return () => setCustomLabel(""); // limpia al salir
  }, [child]);

  if (!child) {
    return (
      <div className="profile-not-found">
        <p>Niño no encontrado.</p>
        <button onClick={() => navigate("/children")}>Volver al listado</button>
      </div>
    );
  }

  return (
    <div className="child-profile-page">

      {/* ===== CARD SUPERIOR ===== */}
      <div className="profile-card">

        {/* Columna izquierda */}
        <div className="profile-card-left">
          <ChildAvatar child={child} size="lg" />
          <h2 className="profile-name">{child.name} {child.lastName}</h2>
          <span className={`profile-status-badge ${child.status === "active" ? "active" : "inactive"}`}>
            {child.status === "active" ? "Activo" : "Inactivo"}
          </span>

          <div className="profile-tutors">
            <p className="profile-tutors-label">Tutor</p>
            <div className="profile-tutor-item">
              <div className="profile-tutor-avatar">
                {child.tutor.name[0]}{child.tutor.lastName[0]}
              </div>
              <div>
                <p className="profile-tutor-name">{child.tutor.name} {child.tutor.lastName}</p>
                <p className="profile-tutor-relation">{child.tutor.relationship}</p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="profile-action-btn edit"
              onClick={() => navigate(`/children/${child.id}/editar`)}>
              <FiEdit2 size={15} />
              Editar
            </button>
            <button className="profile-action-btn delete">
              <FiTrash2 size={15} />
              Eliminar
            </button>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="profile-card-right">

          <div className="profile-info-section">
            <h4 className="profile-info-title">Información general</h4>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Nombre completo</span>
                <span className="profile-info-value">{child.name} {child.lastName}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Edad</span>
                <span className="profile-info-value">{getAge(child.birthDate)} años</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Fecha de nacimiento</span>
                <span className="profile-info-value">
                  {new Date(child.birthDate).toLocaleDateString("es-MX", {
                    day: "2-digit", month: "long", year: "numeric"
                  })}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Grupo</span>
                <span className="profile-info-value">
                  <span className="badge badge-classroom">
                    {CLASSROOM_LABELS[child.classroom] ?? child.classroom}
                  </span>
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Fecha de inscripción</span>
                <span className="profile-info-value">
                  {new Date(child.enrollmentDate).toLocaleDateString("es-MX", {
                    day: "2-digit", month: "long", year: "numeric"
                  })}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Estado</span>
                <span className="profile-info-value">
                  <span className={`badge ${child.status === "active" ? "badge-active" : "badge-inactive"}`}>
                    {child.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="profile-info-divider" />

          <div className="profile-info-section">
            <h4 className="profile-info-title">Tutor principal</h4>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Nombre</span>
                <span className="profile-info-value">{child.tutor.name} {child.tutor.lastName}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Relación</span>
                <span className="profile-info-value">{child.tutor.relationship}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Teléfono</span>
                <span className="profile-info-value">{child.tutor.phone}</span>
              </div>
            </div>
          </div>

          {child.allergies.length > 0 && (
            <>
              <div className="profile-info-divider" />
              <div className="profile-info-section">
                <h4 className="profile-info-title">Alergias</h4>
                <div className="profile-allergies">
                  {child.allergies.map(a => (
                    <span key={a} className="allergy-badge">{a}</span>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="profile-tabs-card">
        <div className="profile-tabs-header">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="profile-tabs-content">
          {activeTab === "attendance" && <AttendanceTab childId={child.id} />}
          {activeTab === "payments"   && <PaymentsTab   childId={child.id} />}
          {activeTab === "incidents"  && <IncidentsTab  childId={child.id} />}
          {activeTab === "handovers"  && <HandoverTab   childId={child.id} />}
          {activeTab === "documents"  && <DocumentsTab  childId={child.id} />}
          {activeTab === "notes"      && <NotesTab      childId={child.id} />}
        </div>
      </div>

    </div>
  );
}