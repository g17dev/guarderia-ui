import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FiEdit2 } from "react-icons/fi";
import { ChildAvatar } from "../features/children/components/ChildAvatar";
import { getAge, generateSlug } from "../utils/child";
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
  { id: "attendance", label: "Asistencias" },
  { id: "payments", label: "Pagos" },
  { id: "incidents", label: "Incidentes" },
  { id: "documents", label: "Documentos" },
  { id: "notes", label: "Notas" },
];

const CLASSROOM_LABELS: Record<string, string> = {
  "maternal-a": "Maternal A",
  "preescolar-1": "Preescolar 1",
  primaria: "Primaria",
};

export function ChildProfile() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { setCustomLabel } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState("attendance");

  const id = state?.id as string;
  const { slug } = useParams<{ slug: string }>();
  const child = id
    ? MOCK_CHILDREN.find((c) => c.id === id)
    : MOCK_CHILDREN.find((c) => generateSlug(c.name, c.lastName) === slug);

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
      <div className="button-section">
        <button className="profile-action-btn edit">
          <FiEdit2 size={15} />
          Editar Perfil
        </button>
      </div>

      {/* ===== CARD SUPERIOR ===== */}
      <div className="profile-card">
        {/* Columna izquierda */}
        <div className="profile-card-left">
          <ChildAvatar child={child} size="lg" />
          <h2 className="profile-name">
            {child.name} {child.lastName}
          </h2>
          <span className="badge badge-classroom">
            {CLASSROOM_LABELS[child.classroom] ?? child.classroom}
          </span>
        </div>

        {/* Columna derecha */}
        <div className="profile-card-right">
          <div className="profile-info-section">
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Nombre completo</span>
                <span className="profile-info-value">
                  {child.name} {child.lastName}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Edad</span>
                <span className="profile-info-value">
                  {getAge(child.birthDate)} años
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Fecha de nacimiento</span>
                <span className="profile-info-value">
                  {new Date(child.birthDate).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Grupo</span>
                <span className="profile-info-value">
                  <span className="classroom">
                    {CLASSROOM_LABELS[child.classroom] ?? child.classroom}
                  </span>
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Fecha de inscripción</span>
                <span className="profile-info-value">
                  {new Date(child.enrollmentDate).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Estado</span>
                <span className="profile-info-value">
                  <span
                    className={`badge ${child.status === "active" ? "badge-active" : "badge-inactive"}`}
                  >
                    {child.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="profile-tabs-card">
        <div className="profile-tabs-header">
          {TABS.map((tab) => (
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
          {activeTab === "payments" && <PaymentsTab childId={child.id} />}
          {activeTab === "incidents" && <IncidentsTab childId={child.id} />}
          {activeTab === "handovers" && <HandoverTab childId={child.id} />}
          {activeTab === "documents" && <DocumentsTab childId={child.id} />}
          {activeTab === "notes" && <NotesTab childId={child.id} />}
        </div>
      </div>
    </div>
  );
}
