import { Pencil, ChevronRight, HeartPulse, Phone, UsersRound } from "lucide-react";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useToast } from "../context/toastStore";
import { ProfileInformation } from "../features/children/profile/ProfileInformation";
import { getProfileAuthorizedAdults, getProfilePreviewState, serviceLabels, type ProfileChild, type ProfileEditSection } from "../features/children/profile/childProfile";
import { attendanceLabels } from "../features/child-handover/reception";
import { getSpecialCareSummary } from "../features/children/profile/specialCare";
import "../features/children/profile/ChildProfileDetails.css";
import { ChildAvatar } from "../features/children/components/ChildAvatar";
import { getAge, generateSlug } from "../utils/child";
import { useOperationalSimulation } from "../features/child-handover/operationalSimulation";
import { useBreadcrumb } from "../context/breadcrumbStore";
import { PaymentsTab } from "../features/children/profile/PaymentsTab";
import { IncidentsTab } from "../features/children/profile/IncidentsTab";
import { HandoverTab } from "../features/children/profile/HandoverTab";
import type { ChildIncident, IncidentComment } from "../features/children/profile/incidents";
import type { ProfileNote } from "../features/children/profile/profileNotes";
import "./ChildProfile.css";

const EditChildProfile = lazy(() => import("../features/children/profile/EditChildProfile").then(module => ({ default: module.EditChildProfile })));
const AttendanceTab = lazy(() => import("../features/children/profile/AttendanceTab").then(module => ({ default: module.AttendanceTab })));
const NotesTab = lazy(() => import("../features/children/profile/NotesTab").then(module => ({ default: module.NotesTab })));

const TABS = [
  { id: "information", label: "Información" },
  { id: "attendance", label: "Asistencias" },
  { id: "payments", label: "Pagos" },
  { id: "incidents", label: "Incidentes" },
  { id: "notes", label: "Notas" },
];

const CLASSROOM_LABELS: Record<string, string> = {
  "maternal-a": "Maternal A",
  "preescolar-1": "Preescolar 1",
  primaria: "Primaria",
};

export function ChildProfile() {
  const { state } = useLocation();
  const operationState = useOperationalSimulation();
  const navigate = useNavigate();
  const { setCustomLabel } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState("attendance");
  const [editedChildren, setEditedChildren] = useState<Record<string, ProfileChild>>({});
  const [editingId, setEditingId] = useState<string>();
  const [editingSection, setEditingSection] = useState<ProfileEditSection>("personal");
  const [careRequest, setCareRequest] = useState(0);
  const [incidentComments, setIncidentComments] = useState<Record<string, IncidentComment[]>>({});
  const [profileIncidents, setProfileIncidents] = useState<Record<string, ChildIncident[]>>({});
  const [profileNotes, setProfileNotes] = useState<Record<string, ProfileNote[]>>({});
  const { toast } = useToast();
  const editButton = useRef<HTMLButtonElement>(null);

  const id = state?.id as string;
  const { slug } = useParams<{ slug: string }>();
  const sourceChild = id
    ? operationState.children.find((c) => c.id === id)
    : operationState.children.find((c) => generateSlug(c.name, c.lastName) === slug);

  const child: ProfileChild | undefined = sourceChild ? editedChildren[sourceChild.id] ?? sourceChild : undefined;
  const currentOperationChild = operationState.children.find(item => item.id === child?.id);
  const preview = child ? { ...getProfilePreviewState(child.id), attendance: currentOperationChild?.attendanceStatus, service: currentOperationChild?.serviceStatus === "active" ? "active" as const : "inactive" as const } : undefined;
  const authorizedCount = child ? getProfileAuthorizedAdults(child).filter(adult => adult.canPickup).length : 0;
  const careSummary = getSpecialCareSummary(child?.specialCare);
  const careStatus = careSummary.priorityCount ? `${careSummary.priorityCount} ${careSummary.priorityCount === 1 ? "prioritaria" : "prioritarias"} · ${careSummary.active.length} ${careSummary.active.length === 1 ? "indicación" : "indicaciones"}`
    : careSummary.active.length ? `${careSummary.active.length} ${careSummary.active.length === 1 ? "indicación" : "indicaciones"}`
    : careSummary.upcoming.length ? `${careSummary.upcoming.length} ${careSummary.upcoming.length === 1 ? "próxima" : "próximas"}` : careSummary.reviewed ? "Información revisada" : "Sin revisar";

  // Registra el nombre del niño en el breadcrumb
  useEffect(() => {
    if (child) setCustomLabel(`${child.name} ${child.lastName}`);
    return () => setCustomLabel(""); // limpia al salir
  }, [child, setCustomLabel]);

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
      <div className="profile-card">
        <div className="profile-card-left">
          <ChildAvatar child={child} size="lg" />
          <div className="profile-identity">
            <h2 className="profile-name">{child.name} {child.lastName}</h2>
            <p className="profile-identity-meta"><span>{CLASSROOM_LABELS[child.classroom] ?? child.classroom}</span><span>{getAge(child.birthDate)} años</span></p>
            <p className="profile-quick-contact"><Phone size={13} aria-hidden="true" /><span className="profile-contact-name">{child.tutor.name} {child.tutor.lastName}</span><a href={`tel:${child.tutor.phone}`}>{child.tutor.phone}</a></p>
            <button type="button" className={`profile-quick-care ${child.allergies.length || child.health?.conditions || careSummary.priorityCount ? "has-alert" : ""}`} title={`Ver cuidados especiales · ${careStatus}`} onClick={() => { setCareRequest(value => value + 1); setActiveTab("information"); }}>
              <HeartPulse size={14} aria-hidden="true" /><span className="profile-care-alert-text">{child.allergies.length ? `Alergias: ${child.allergies.join(", ")}` : child.health?.conditions ? `Cuidados: ${child.health.conditions}` : "Cuidados especiales"}</span><span className={`profile-care-summary-status ${careSummary.priorityCount ? "is-priority" : ""}`}>{careStatus}</span><ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="profile-card-right">
          <div className="profile-info-grid">
            <div className="profile-info-item"><span className="profile-info-label">Estado de hoy</span><span className={`profile-attendance-badge ${preview?.attendance ?? "unknown"}`}>{preview?.attendance ? attendanceLabels[preview.attendance] : "Sin registro hoy"}</span></div>
            <div className="profile-info-item"><span className="profile-info-label">Servicio de guardería</span><span className={`profile-service-badge ${preview?.service ?? "unknown"}`}>{preview?.service ? serviceLabels[preview.service] : "Sin información"}</span></div>
          </div>
          <button type="button" className="profile-authorized-summary" onClick={() => { setEditingSection("adults"); setEditingId(child.id); }}><UsersRound size={15} aria-hidden="true" /><span>{authorizedCount ? `${authorizedCount} ${authorizedCount === 1 ? "adulto autorizado" : "adultos autorizados"}` : "Sin adultos autorizados"}</span><ChevronRight size={14} aria-hidden="true" /></button>
        </div>
        <button ref={editButton} className="profile-action-btn edit" aria-label="Editar perfil" title="Editar perfil" onClick={() => { setEditingSection("personal"); setEditingId(child.id); }}><Pencil size={17} aria-hidden="true" /></button>
      </div>

      {/* ===== TABS ===== */}
      <div className="profile-tabs-card">
        <div className="profile-tabs-header">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`profile-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => { setCareRequest(0); setActiveTab(tab.id); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={`profile-tabs-content ${activeTab === "payments" ? "tab-content-full" : ""}`}>
          {activeTab === "information" && <ProfileInformation child={child} careRequest={careRequest} onEditCare={() => { setEditingSection("health"); setEditingId(child.id); }} />}
          {activeTab === "attendance" && <Suspense fallback={<div className="profile-tab-loading" role="status">Cargando asistencias…</div>}><AttendanceTab childId={child.id} childName={`${child.name} ${child.lastName}`} /></Suspense>}
          {activeTab === "payments" && <PaymentsTab childId={child.id} />}
          {activeTab === "incidents" && <IncidentsTab key={child.id} childId={child.id} childName={`${child.name} ${child.lastName}`} comments={incidentComments[child.id] ?? []} onAddComment={comment => setIncidentComments(previous => ({ ...previous, [child.id]: [...(previous[child.id] ?? []), comment] }))} records={profileIncidents[child.id] ?? []} onAddIncident={incident => setProfileIncidents(previous => ({ ...previous, [child.id]: [...(previous[child.id] ?? []), incident] }))} />}
          {activeTab === "handovers" && <HandoverTab childId={child.id} />}
          {activeTab === "notes" && <Suspense fallback={<div className="profile-tab-loading" role="status">Cargando notas…</div>}><NotesTab key={child.id} childId={child.id} childName={`${child.name} ${child.lastName}`} notes={profileNotes[child.id] ?? []} onAddNote={note => setProfileNotes(previous => ({ ...previous, [child.id]: [...(previous[child.id] ?? []), note] }))} /></Suspense>}
        </div>
      </div>
      {editingId === child.id && <Suspense fallback={null}><EditChildProfile key={child.id} child={child} initialSection={editingSection} onRestoreFocus={() => editButton.current?.focus()} onClose={() => setEditingId(undefined)} onSave={updated => {
        setEditedChildren(previous => ({ ...previous, [child.id]: updated }));
        setEditingId(undefined);
        toast("success", "Perfil actualizado", `Los datos de ${updated.name} se actualizaron en esta vista.`, { badge: "Simulación" });
      }} /></Suspense>}
    </div>
  );
}
