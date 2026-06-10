import { FiEdit2, FiUser, FiHeart } from "react-icons/fi";
import type { HealthData } from "./HealthStep";
import "./ConfirmStep.css";

type AllergyCategory = "food" | "medication" | "environmental" | "other";

interface BasicInfo {
  name: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  gender: "male" | "female" | "";
  birthDate: string;
  classroom: string;
  photoPreview: string;
}

interface TutorInfo {
  name: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  relationship: string;
  curp: string;
  ine: string;
  phones: { id: string; type: string; number: string; note: string }[];
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  photoPreview: string;
}

interface ConfirmStepProps {
  formData: {
    basicInfo: BasicInfo;
    tutor: TutorInfo;
    health: HealthData;
  };
  onEdit: (step: number) => void;
}

const CLASSROOM_LABELS: Record<string, string> = {
  "maternal-a":   "Maternal A",
  "preescolar-1": "Preescolar 1",
  "primaria":     "Primaria",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: "Padre", mother: "Madre", grandfather: "Abuelo",
  grandmother: "Abuela", uncle: "Tío", aunt: "Tía",
  legal: "Tutor legal", other: "Otro",
};

const ALLERGY_CATEGORY_COLORS: Record<AllergyCategory, string> = {
  food: "tag-food", medication: "tag-medication",
  environmental: "tag-environmental", other: "tag-other",
};

const SEVERITY_LABELS: Record<string, string> = {
  mild: "Leve", moderate: "Moderada", severe: "Severa",
};

function Empty() {
  return <span className="confirm-empty">No especificado</span>;
}

function ConfirmRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="confirm-row">
      <span className="confirm-label">{label}</span>
      <span className="confirm-value">{value || <Empty />}</span>
    </div>
  );
}

export function ConfirmStep({ formData, onEdit }: ConfirmStepProps) {
  const { basicInfo, tutor, health } = formData;

  const childFullName = [basicInfo.name, basicInfo.lastNamePaternal, basicInfo.lastNameMaternal]
    .filter(Boolean).join(" ") || "Sin nombre";

  const tutorFullName = [tutor.name, tutor.lastNamePaternal, tutor.lastNameMaternal]
    .filter(Boolean).join(" ") || "Sin nombre";

  return (
    <div className="confirm-step">
      <div className="confirm-card">

        {/* ===== CHECK ANIMADO ===== */}
        <div className="confirm-check-wrapper">
          <svg className="confirm-check-svg" viewBox="0 0 80 80">
            <circle
              className="confirm-check-circle"
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#004B92"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <polyline
              className="confirm-check-mark"
              points="24,42 35,53 56,28"
              fill="none"
              stroke="#004B92"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="confirm-check-label">Todo listo para registrar</p>
          <p className="confirm-check-hint">Revisa la información antes de guardar</p>
        </div>

        <div className="confirm-divider" />

        {/* ===== AVATARES ===== */}
        <div className="confirm-avatars-row">
          <div className="confirm-avatar-group">
            {basicInfo.photoPreview ? (
              <img src={basicInfo.photoPreview} className="confirm-avatar" alt="Niño" />
            ) : (
              <div className="confirm-avatar confirm-avatar-placeholder child-color">
                {basicInfo.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="confirm-avatar-info">
              <span className="confirm-avatar-name">{childFullName}</span>
              <span className="confirm-avatar-sub">
                {CLASSROOM_LABELS[basicInfo.classroom] || "Sin grupo"}
                {health.bloodType && <span className="blood-badge">{health.bloodType}</span>}
              </span>
            </div>
          </div>

          <div className="confirm-avatar-separator">→</div>

          <div className="confirm-avatar-group">
            {tutor.photoPreview ? (
              <img src={tutor.photoPreview} className="confirm-avatar" alt="Tutor" />
            ) : (
              <div className="confirm-avatar confirm-avatar-placeholder tutor-color">
                {tutor.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="confirm-avatar-info">
              <span className="confirm-avatar-name">{tutorFullName}</span>
              <span className="confirm-avatar-sub">
                {RELATIONSHIP_LABELS[tutor.relationship] || "Tutor"}
              </span>
            </div>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* ===== SECCIÓN 1: INFORMACIÓN BÁSICA ===== */}
        <div className="confirm-section">
          <div className="confirm-section-header">
            <div className="confirm-section-title">
              <span className="confirm-section-icon"><FiUser size={13} /></span>
              Información básica
            </div>
            <button type="button" className="confirm-edit-btn" onClick={() => onEdit(0)}>
              <FiEdit2 size={12} /> Editar
            </button>
          </div>
          <ConfirmRow label="Nombre completo" value={childFullName} />
          <ConfirmRow
            label="Fecha de nacimiento"
            value={basicInfo.birthDate
              ? new Date(basicInfo.birthDate).toLocaleDateString("es-MX", {
                  day: "2-digit", month: "long", year: "numeric",
                })
              : null}
          />
          <ConfirmRow
            label="Género"
            value={basicInfo.gender === "male" ? "Niño" : basicInfo.gender === "female" ? "Niña" : null}
          />
          <ConfirmRow label="Grupo" value={CLASSROOM_LABELS[basicInfo.classroom] || null} />
        </div>

        <div className="confirm-divider" />

        {/* ===== SECCIÓN 2: TUTOR ===== */}
        <div className="confirm-section">
          <div className="confirm-section-header">
            <div className="confirm-section-title">
              <span className="confirm-section-icon"><FiUser size={13} /></span>
              Padre o Tutor
            </div>
            <button type="button" className="confirm-edit-btn" onClick={() => onEdit(1)}>
              <FiEdit2 size={12} /> Editar
            </button>
          </div>
          <ConfirmRow label="Nombre completo" value={tutorFullName} />
          <ConfirmRow label="Relación" value={RELATIONSHIP_LABELS[tutor.relationship] || null} />
          <ConfirmRow label="CURP" value={tutor.curp || null} />
          <ConfirmRow label="INE" value={tutor.ine || null} />
          {tutor.phones.length > 0 && (
            <div className="confirm-row confirm-row-column">
              <span className="confirm-label">Teléfonos</span>
              <div className="confirm-phones">
                {tutor.phones.map(phone => (
                  <div key={phone.id} className="confirm-phone-item">
                    <span className="phone-type-badge">{phone.type}</span>
                    <span className="confirm-value">{phone.number || <Empty />}</span>
                    {phone.note && <span className="phone-note-text">{phone.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <ConfirmRow
            label="Dirección"
            value={tutor.street
              ? [tutor.street, tutor.neighborhood, tutor.city, tutor.state, tutor.zipCode]
                  .filter(Boolean).join(", ")
              : null}
          />
        </div>

        <div className="confirm-divider" />

        {/* ===== SECCIÓN 3: SALUD ===== */}
        <div className="confirm-section">
          <div className="confirm-section-header">
            <div className="confirm-section-title">
              <span className="confirm-section-icon"><FiHeart size={13} /></span>
              Salud
            </div>
            <button type="button" className="confirm-edit-btn" onClick={() => onEdit(2)}>
              <FiEdit2 size={12} /> Editar
            </button>
          </div>
          <ConfirmRow label="Tipo de sangre" value={health.bloodType || null} />
          {health.allergies.length > 0 && (
            <div className="confirm-row confirm-row-column">
              <span className="confirm-label">Alergias</span>
              <div className="confirm-tags">
                {health.allergies.map(a => (
                  <span key={a.id} className={`allergy-tag ${ALLERGY_CATEGORY_COLORS[a.category as AllergyCategory]}`}>
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {health.conditions && (
            <div className="confirm-row confirm-row-column">
              <span className="confirm-label">Condición médica</span>
              <div className="confirm-condition">
                <span className="confirm-value">{health.conditions}</span>
                {health.conditionSeverity && (
                  <span className={`severity-badge severity-${health.conditionSeverity}`}>
                    {SEVERITY_LABELS[health.conditionSeverity]}
                  </span>
                )}
              </div>
            </div>
          )}
          {health.medications.length > 0 && (
            <div className="confirm-row confirm-row-column">
              <span className="confirm-label">Medicamentos</span>
              <div className="confirm-medications">
                {health.medications.map(med => (
                  <div key={med.id} className="confirm-med-item">
                    <span className="med-name">{med.name}</span>
                    {med.dose && <span className="med-detail">{med.dose}</span>}
                    {med.frequency && <span className="med-detail">{med.frequency}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <ConfirmRow label="Médico de cabecera" value={health.doctorName || null} />
          {health.doctorPhone && <ConfirmRow label="Tel. médico" value={health.doctorPhone} />}
        </div>

      </div>
    </div>
  );
}