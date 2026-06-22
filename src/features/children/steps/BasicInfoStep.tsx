import { useRef } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import "./BasicInfoStep.css";

interface BasicInfoData {
  name: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  gender: "male" | "female" | "";
  birthDate: string;
  classroom: string;
  photoFile: File | null;
  photoPreview: string;
}

interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (newData: BasicInfoData) => void;
  errors: { [key: string]: string };
}

const CLASSROOMS = [
  {
    id: "maternal-a",
    label: "Maternal A",
    ageRange: "1 - 2 años",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="20" r="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M20 48c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M24 36c-2 1-5 3-5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M40 36c2 1 5 3 5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="28" cy="19" r="1.5" fill="currentColor"/>
        <circle cx="36" cy="19" r="1.5" fill="currentColor"/>
        <path d="M28 25c1.5 2 6.5 2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M20 8c3-4 10-5 14-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="18" cy="20" r="3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="46" cy="20" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: "preescolar-1",
    label: "Preescolar 1",
    ageRange: "3 - 4 años",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="18" r="11" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="27" cy="17" r="1.5" fill="currentColor"/>
        <circle cx="37" cy="17" r="1.5" fill="currentColor"/>
        <path d="M27 23c2 2.5 8 2.5 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 10l3-4h14l3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="26" y="36" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M29 44v6M35 44v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "primaria",
    label: "Primaria",
    ageRange: "5 - 6 años",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="16" r="10" stroke="currentColor" strokeWidth="2.5"/>
        <path d="M15 52c0-9.389 7.611-17 17-17s17 7.611 17 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="28" cy="15" r="1.5" fill="currentColor"/>
        <circle cx="36" cy="15" r="1.5" fill="currentColor"/>
        <path d="M28 21c1.5 2 6.5 2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="24" y="35" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M28 35v-3M36 35v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M27 41h10M27 44h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const ChildPlaceholderSVG = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="avatar-placeholder-svg">
    <circle cx="60" cy="60" r="60" fill="#EEF3FB"/>
    <circle cx="60" cy="45" r="20" fill="#B3CAEA"/>
    <ellipse cx="60" cy="95" rx="28" ry="20" fill="#B3CAEA"/>
    <circle cx="53" cy="43" r="2.5" fill="#004B92"/>
    <circle cx="67" cy="43" r="2.5" fill="#004B92"/>
    <path d="M53 52c2.5 3 11.5 3 14 0" stroke="#004B92" strokeWidth="2" strokeLinecap="round"/>
    <path d="M45 30c4-8 18-10 24-4" stroke="#7AAAD6" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="39" cy="45" r="5" fill="#B3CAEA"/>
    <circle cx="81" cy="45" r="5" fill="#B3CAEA"/>
  </svg>
);

const MaleSVG = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="12" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M18 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="27" cy="19" r="2" fill="currentColor"/>
    <circle cx="37" cy="19" r="2" fill="currentColor"/>
    <path d="M27 26c2 2 8 2 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M26 10c2-3 10-4 14-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M44 8l4-4M44 8h4M44 8v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FemaleSVG = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="12" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M18 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="27" cy="19" r="2" fill="currentColor"/>
    <circle cx="37" cy="19" r="2" fill="currentColor"/>
    <path d="M27 26c2 2 8 2 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 10c1-3 6-6 12-4s8 6 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 12c-1 2-1 5 0 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="32" y1="44" x2="32" y2="56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="27" y1="51" x2="37" y2="51" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export function BasicInfoStep({ data, onChange, errors }: BasicInfoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: Partial<BasicInfoData>) => {
    onChange({ ...data, ...field });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    update({ photoFile: file, photoPreview: preview });
  };

  const handleRemovePhoto = () => {
    update({ photoFile: null, photoPreview: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="basic-info-step">

      {/* Columna izquierda — foto */}
      <div className="photo-section">
        <div className="photo-preview">
          {data.photoPreview ? (
            <>
              <img src={data.photoPreview} alt="Foto del niño" className="photo-img" />
              <button className="photo-remove" onClick={handleRemovePhoto} type="button">
                <FiX size={14} />
              </button>
            </>
          ) : (
            <ChildPlaceholderSVG />
          )}
        </div>
        <div className="photo-upload-info">
          <p className="photo-upload-title">Foto del niño</p>
          <p className="photo-upload-hint">Opcional · JPG, PNG o WEBP · Máx. 5MB</p>
          <button
            className="photo-upload-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload size={13} />
            {data.photoPreview ? "Cambiar foto" : "Subir foto"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="photo-input-hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Columna derecha — campos */}
      <div className="form-right">

        {/* Datos personales */}
        <div className="form-section">
          <h4 className="form-section-title">Nombre Completo</h4>
          <div className="form-row three-cols">
            <div className="form-field">
              <label>Nombre <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Ej. Mateo"
                value={data.name}
                onChange={e => update({ name: e.target.value })}
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-field">
              <label>Apellido paterno <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Ej. García"
                value={data.lastNamePaternal}
                onChange={e => update({ lastNamePaternal: e.target.value })}
                className={errors.lastNamePaternal ? "input-error" : ""}
              />
              {errors.lastNamePaternal && <span className="field-error">{errors.lastNamePaternal}</span>}
            </div>
            <div className="form-field">
              <label>Apellido materno</label>
              <input
                type="text"
                placeholder="Ej. López"
                value={data.lastNameMaternal}
                onChange={e => update({ lastNameMaternal: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Fecha de nacimiento */}
        <div className="form-section">
          <h4 className="form-section-title">Fecha de nacimiento <span className="required">*</span></h4>
          <div className="form-row one-col">
            <div className="form-field">
              <input
                type="date"
                value={data.birthDate}
                onChange={e => update({ birthDate: e.target.value })}
                className={errors.birthDate ? "input-error" : ""}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.birthDate && <span className="field-error">{errors.birthDate}</span>}
            </div>
          </div>
        </div>

        {/* Género y Grupo en la misma fila */}
        <div className="form-row-horizontal">

          <div className="form-section">
            <h4 className="form-section-title">Género <span className="required">*</span></h4>
            <div className="option-cards">
              <button
                type="button"
                className={`option-card ${data.gender === "male" ? "selected" : ""}`}
                onClick={() => update({ gender: "male" })}
              >
                <div className="option-card-icon gender-male">
                  <MaleSVG />
                </div>
                <span className="option-card-label">Niño</span>
              </button>
              <button
                type="button"
                className={`option-card ${data.gender === "female" ? "selected" : ""}`}
                onClick={() => update({ gender: "female" })}
              >
                <div className="option-card-icon gender-female">
                  <FemaleSVG />
                </div>
                <span className="option-card-label">Niña</span>
              </button>
            </div>
            {errors.gender && <span className="field-error">{errors.gender}</span>}
          </div>

          <div className="form-section">
            <h4 className="form-section-title">Grupo <span className="required">*</span></h4>
            <div className="option-cards">
              {CLASSROOMS.map(room => (
                <button
                  key={room.id}
                  type="button"
                  className={`option-card option-card-classroom ${data.classroom === room.id ? "selected" : ""}`}
                  onClick={() => update({ classroom: room.id })}
                >
                  <div className="option-card-icon classroom-icon">
                    {room.icon}
                  </div>
                  <span className="option-card-label">{room.label}</span>
                  <span className="option-card-sublabel">{room.ageRange}</span>
                </button>
              ))}
            </div>
            {errors.classroom && <span className="field-error">{errors.classroom}</span>}
          </div>

        </div>

      </div>
    </div>
  );
}