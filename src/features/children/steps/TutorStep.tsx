import { useState, useRef } from "react";
import { FiUpload, FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import { FingerprintPattern } from "lucide-react";
import "./TutorStep.css";

// ===== TIPOS =====
type PhoneType = "personal" | "work" | "home" | "other";
type PhoneRegion = "MX" | "US";

interface Phone {
  id: string;
  region: PhoneRegion;
  type: PhoneType;
  number: string;
  note: string;
}

export interface TutorData {
  id: string;
  photoFile: File | null;
  photoPreview: string;
  name: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  relationship: "father" | "mother" | "grandfather" | "grandmother" | "uncle" | "aunt" | "legal" | "other" | "";
  curp: string;
  ine: string;
  phones: Phone[];
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface TutorStepProps {
  tutors: TutorData[];
  onChange: (newTutors: TutorData[]) => void;
  errors: { [key: string]: string };
}

// ===== FACTORY =====
export const newTutorData = (): TutorData => ({
  id: crypto.randomUUID(),
  photoFile: null,
  photoPreview: "",
  name: "",
  lastNamePaternal: "",
  lastNameMaternal: "",
  relationship: "",
  curp: "",
  ine: "",
  phones: [{ id: crypto.randomUUID(), region: "MX", type: "personal", number: "", note: "" }],
  street: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
});

// ===== CONSTANTES =====
const RELATIONSHIP_LABELS: Record<string, string> = {
  father: "Padre", mother: "Madre", grandfather: "Abuelo",
  grandmother: "Abuela", uncle: "Tío", aunt: "Tía",
  legal: "Tutor legal", other: "Otro",
};

const PHONE_TYPE_LABELS: Record<PhoneType, string> = {
  personal: "Personal", work: "Trabajo", home: "Casa", other: "Otro",
};

const RELATIONSHIPS = [
  {
    id: "father", label: "Padre",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="18" r="11" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M14 54c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="27" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="37" cy="17" r="1.5" fill="currentColor"/>
        <path d="M27 23c2 2 8 2 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 8c3-3 12-4 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "mother", label: "Madre",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="18" r="11" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M14 54c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="27" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="37" cy="17" r="1.5" fill="currentColor"/>
        <path d="M27 23c2 2 8 2 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M20 10c2-4 8-6 14-4s10 8 8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "grandfather", label: "Abuelo",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="18" r="11" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M14 54c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="27" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="37" cy="17" r="1.5" fill="currentColor"/>
        <path d="M27 23c2 2 8 2 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M21 10c0 0 4-4 11-4s11 4 11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M26 36l-4 6M38 36l4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "grandmother", label: "Abuela",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="18" r="11" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M14 54c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="27" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="37" cy="17" r="1.5" fill="currentColor"/>
        <path d="M27 23c2 2 8 2 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M20 12c1-5 7-8 14-6s10 8 8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M28 36l-2 8M36 36l2 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "legal", label: "Tutor legal",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="18" r="11" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M14 54c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="27" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="37" cy="17" r="1.5" fill="currentColor"/>
        <path d="M27 23c2 2 8 2 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="26" y="6" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M29 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "other", label: "Otro",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="18" r="11" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M14 54c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="27" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="37" cy="17" r="1.5" fill="currentColor"/>
        <path d="M27 23c2 2 8 2 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="32" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
];

const TutorPlaceholderSVG = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="avatar-placeholder-svg">
    <circle cx="60" cy="60" r="60" fill="#F0F4F8"/>
    <circle cx="60" cy="42" r="22" fill="#B0C4D8"/>
    <ellipse cx="60" cy="98" rx="32" ry="22" fill="#B0C4D8"/>
    <circle cx="52" cy="40" r="2.5" fill="#2D5F8A"/>
    <circle cx="68" cy="40" r="2.5" fill="#2D5F8A"/>
    <path d="M52 50c3 3 13 3 16 0" stroke="#2D5F8A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M42 28c3-6 10-10 18-10s15 4 18 10" stroke="#8AAFC8" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// ===== SUBCOMPONENTE: FORMULARIO DE UN TUTOR =====
function TutorForm({
  data,
  errors,
  onChange,
}: {
  data: TutorData;
  errors: { [key: string]: string };
  onChange: (field: Partial<TutorData>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange({ photoFile: file, photoPreview: preview });
  };

  const handleRemovePhoto = () => {
    onChange({ photoFile: null, photoPreview: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addPhone = () => {
    onChange({
      phones: [
        ...data.phones,
        { id: crypto.randomUUID(), region: "MX", type: "personal", number: "", note: "" },
      ],
    });
  };

  const removePhone = (id: string) => {
    if (data.phones.length <= 1) return;
    onChange({ phones: data.phones.filter(p => p.id !== id) });
  };

  const updatePhone = (id: string, field: Partial<Phone>) => {
    onChange({
      phones: data.phones.map(p => p.id === id ? { ...p, ...field } : p),
    });
  };

  return (
    <div className="tutor-form">

      {/* ===== TOP: foto + datos personales ===== */}
      <div className="tutor-top">

        {/* Foto */}
        <div className="photo-section">
          <div className="photo-preview">
            {data.photoPreview ? (
              <>
                <img src={data.photoPreview} alt="Foto del tutor" className="photo-img" />
                <button className="photo-remove" onClick={handleRemovePhoto} type="button">
                  <FiX size={14} />
                </button>
              </>
            ) : (
              <TutorPlaceholderSVG />
            )}
          </div>
          <div className="photo-upload-info">
            <p className="photo-upload-title">Foto del tutor</p>
            <p className="photo-upload-hint">Opcional · JPG, PNG o WEBP · Máx. 5MB</p>
            <button className="photo-upload-btn" type="button" onClick={() => fileInputRef.current?.click()}>
              <FiUpload size={13} />
              {data.photoPreview ? "Cambiar foto" : "Subir foto"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              className="photo-input-hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Nombre + Relación */}
        <div className="form-right">
          <div className="form-section">
            <h4 className="form-section-title">Nombre completo</h4>
            <div className="form-row three-cols">
              <div className="form-field">
                <label>Nombre <span className="required">*</span></label>
                <input type="text" placeholder="Ej. Carlos" value={data.name}
                  onChange={e => onChange({ name: e.target.value })}
                  className={errors.name ? "input-error" : ""} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-field">
                <label>Apellido paterno <span className="required">*</span></label>
                <input type="text" placeholder="Ej. García" value={data.lastNamePaternal}
                  onChange={e => onChange({ lastNamePaternal: e.target.value })}
                  className={errors.lastNamePaternal ? "input-error" : ""} />
                {errors.lastNamePaternal && <span className="field-error">{errors.lastNamePaternal}</span>}
              </div>
              <div className="form-field">
                <label>Apellido materno</label>
                <input type="text" placeholder="Ej. López" value={data.lastNameMaternal}
                  onChange={e => onChange({ lastNameMaternal: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Relación */}
          <div className="form-section">
            <h4 className="form-section-title">Relación con el niño <span className="required">*</span></h4>
            <div className="option-cards">
              {RELATIONSHIPS.map(rel => (
                <button key={rel.id} type="button"
                  className={`option-card ${data.relationship === rel.id ? "selected" : ""}`}
                  onClick={() => onChange({ relationship: rel.id as TutorData["relationship"] })}
                >
                  <div className="option-card-icon relation-icon">{rel.icon}</div>
                  <span className="option-card-label">{rel.label}</span>
                </button>
              ))}
            </div>
            {errors.relationship && <span className="field-error">{errors.relationship}</span>}
          </div>
        </div>
      </div>

      <div className="form-divider" />

      {/* ===== IDENTIFICACIÓN ===== */}
      <div className="form-section">
        <h4 className="form-section-title">Identificación</h4>
        <div className="form-row two-cols">
          <div className="form-field">
            <label>CURP <span className="required">*</span></label>
            <input type="text" placeholder="Ej. GACL850101HDFRZR09"
              value={data.curp}
              onChange={e => onChange({ curp: e.target.value.toUpperCase() })}
              className={errors.curp ? "input-error" : ""}
              maxLength={18} />
            {errors.curp && <span className="field-error">{errors.curp}</span>}
          </div>
          <div className="form-field">
            <label>Número de INE</label>
            <input type="text" placeholder="Ej. IDMEX1234567890123"
              value={data.ine}
              onChange={e => onChange({ ine: e.target.value.toUpperCase() })}
              maxLength={20} />
          </div>
        </div>
      </div>

      <div className="form-divider" />

      {/* ===== TELÉFONOS ===== */}
      <div className="form-section">
        <div className="section-header-row">
          <h4 className="form-section-title">Teléfonos <span className="required">*</span></h4>
          <button type="button" className="btn-add" onClick={addPhone}>
            <FiPlus size={14} />
            Agregar
          </button>
        </div>
        <div className="phones-list">
          {data.phones.map((phone, index) => (
            <div key={phone.id} className="phone-card">
              <div className="phone-card-header">
                <span className="phone-card-title">Teléfono {index + 1}</span>
                <button type="button" className="phone-remove-btn"
                  onClick={() => removePhone(phone.id)}
                  disabled={data.phones.length <= 1}>
                  <FiTrash2 size={15} />
                </button>
              </div>
              <div className="phone-card-content">
                <select className="phone-type-select" value={phone.type}
                  onChange={e => updatePhone(phone.id, { type: e.target.value as PhoneType })}>
                  {Object.entries(PHONE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select className="phone-region-select" value={phone.region}
                  onChange={e => updatePhone(phone.id, { region: e.target.value as PhoneRegion })}>
                  <option value="MX">🇲🇽 +52</option>
                  <option value="US">🇺🇸 +1</option>
                </select>
                <input type="tel" className="phone-number-input"
                  placeholder={phone.region === "US" ? "(201) 555-1234" : "686 123 4567"}
                  value={phone.number}
                  onChange={e => updatePhone(phone.id, { number: e.target.value })} />
              </div>
              <textarea className="phone-note-input" rows={2}
                placeholder="Ej. Llamar aquí durante horario laboral (7:00am - 5:00pm)"
                value={phone.note}
                onChange={e => updatePhone(phone.id, { note: e.target.value })} />
            </div>
          ))}
        </div>
        {errors.phones && <span className="field-error">{errors.phones}</span>}
      </div>

      <div className="form-divider" />

      {/* ===== DIRECCIÓN ===== */}
      <div className="form-section">
        <h4 className="form-section-title">Dirección</h4>
        <div className="form-row two-cols">
          <div className="form-field">
            <label>Calle y número <span className="required">*</span></label>
            <input type="text" placeholder="Ej. Av. Reforma 123"
              value={data.street}
              onChange={e => onChange({ street: e.target.value })}
              className={errors.street ? "input-error" : ""} />
            {errors.street && <span className="field-error">{errors.street}</span>}
          </div>
          <div className="form-field">
            <label>Colonia <span className="required">*</span></label>
            <input type="text" placeholder="Ej. Centro"
              value={data.neighborhood}
              onChange={e => onChange({ neighborhood: e.target.value })}
              className={errors.neighborhood ? "input-error" : ""} />
            {errors.neighborhood && <span className="field-error">{errors.neighborhood}</span>}
          </div>
        </div>
        <div className="form-row three-cols">
          <div className="form-field">
            <label>Ciudad <span className="required">*</span></label>
            <input type="text" placeholder="Ej. Mexicali"
              value={data.city}
              onChange={e => onChange({ city: e.target.value })}
              className={errors.city ? "input-error" : ""} />
            {errors.city && <span className="field-error">{errors.city}</span>}
          </div>
          <div className="form-field">
            <label>Estado <span className="required">*</span></label>
            <input type="text" placeholder="Ej. Baja California"
              value={data.state}
              onChange={e => onChange({ state: e.target.value })}
              className={errors.state ? "input-error" : ""} />
            {errors.state && <span className="field-error">{errors.state}</span>}
          </div>
          <div className="form-field">
            <label>Código postal</label>
            <input type="text" placeholder="Ej. 21000"
              value={data.zipCode}
              onChange={e => onChange({ zipCode: e.target.value })}
              maxLength={5} />
          </div>
        </div>
      </div>

      <div className="form-divider" />

      {/* ===== HUELLAS DIGITALES ===== */}
      <div className="form-section">
        <div className="section-header-row">
          <div>
            <h4 className="form-section-title">Huellas digitales <span className="required">*</span></h4>
            <p className="section-subtitle">Requeridas para autorizar la entrega del menor</p>
          </div>
          <button type="button" className="btn-add">
            <FiPlus size={14} />
            Agregar huella
          </button>
        </div>
        <div className="fingerprints-empty">
          <div className="fingerprints-empty-icon">
            <FingerprintPattern size={48} strokeWidth={1.2} />
          </div>
          <p className="fingerprints-empty-title">Sin huellas registradas</p>
          <p className="fingerprints-empty-hint">
            Agrega al menos una huella para autorizar la entrega del menor
          </p>
        </div>
      </div>

    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export function TutorStep({ tutors, onChange, errors }: TutorStepProps) {
  const [activeTab, setActiveTab] = useState(0);

  const addTutor = () => {
    const newTutors = [...tutors, newTutorData()];
    onChange(newTutors);
    setActiveTab(newTutors.length - 1);
  };

  const removeTutor = (index: number) => {
    if (tutors.length <= 1) return;
    const updated = tutors.filter((_, i) => i !== index);
    onChange(updated);
    setActiveTab(Math.min(activeTab, updated.length - 1));
  };

  const updateTutor = (index: number, field: Partial<TutorData>) => {
    onChange(tutors.map((t, i) => i === index ? { ...t, ...field } : t));
  };

  const currentTutor = tutors[activeTab];

  const tutorErrors = Object.fromEntries(
    Object.entries(errors)
      .filter(([k]) => k.startsWith(`tutor_${activeTab}_`))
      .map(([k, v]) => [k.replace(`tutor_${activeTab}_`, ""), v])
  );

  return (
    <div className="tutor-step">

      {/* ===== TABS ===== */}
      <div className={`tutor-tabs ${tutors.length <= 1 ? "single-tutor" : ""}`}>
        {tutors.length > 1 && (
          <div className="tutor-tabs-list">
            {tutors.map((t, i) => (
              <div key={t.id} className={`tutor-tab ${activeTab === i ? "active" : ""}`}>
                <div className="tutor-tab-btn" onClick={() => setActiveTab(i)}>
                  <div className={`tutor-tab-avatar ${activeTab === i ? "active" : ""}`}>
                    {t.photoPreview
                      ? <img src={t.photoPreview} alt="" />
                      : t.name?.[0]?.toUpperCase() || (i + 1)
                    }
                  </div>
                  <span className="tutor-tab-label">
                    {t.relationship ? RELATIONSHIP_LABELS[t.relationship] : `Adulto responsable`}
                  </span>
                  {Object.keys(errors).some(k => k.startsWith(`tutor_${i}_`)) && (
                    <span className="tutor-tab-error-dot" />
                  )}
                  {tutors.length > 1 && (
                    <button type="button" className="tutor-tab-remove"
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que se cambie de tab activo al eliminar
                        removeTutor(i);
                      }} title="Eliminar tutor">
                      <FiTrash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn-add tutor-add-btn" onClick={addTutor}>
          <FiPlus size={14} />
          Agregar tutor
        </button>
      </div>

      {/* ===== FORMULARIO DEL TUTOR ACTIVO ===== */}
      <TutorForm
        key={currentTutor.id}
        data={currentTutor}
        errors={tutorErrors}
        onChange={(field) => updateTutor(activeTab, field)}
      />

    </div>
  );
}