import { useState } from "react";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import "./HealthStep.css";

type AllergyCategory = "food" | "medication" | "environmental" | "other";
type Severity = "mild" | "moderate" | "severe";

interface Allergy {
  id: string;
  category: AllergyCategory;
  name: string;
}

interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
}

export interface HealthData {
  bloodType: string;
  allergies: Allergy[];
  conditions: string;
  conditionSeverity: Severity | "";
  medications: Medication[];
  doctorName: string;
  doctorPhone: string;
}

interface HealthStepProps {
  data: HealthData;
  onChange: (newData: HealthData) => void;
  errors: { [key: string]: string };
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ALLERGY_CATEGORIES: { id: AllergyCategory; label: string; emoji: string }[] = [
  { id: "food",          label: "Alimentaria",  emoji: "🍽️" },
  { id: "medication",    label: "Medicamento",  emoji: "💊" },
  { id: "environmental", label: "Ambiental",    emoji: "🌿" },
  { id: "other",         label: "Otra",         emoji: "⚠️" },
];

const SEVERITY_OPTIONS: { id: Severity; label: string; color: string }[] = [
  { id: "mild",     label: "Leve",     color: "severity-mild"     },
  { id: "moderate", label: "Moderada", color: "severity-moderate" },
  { id: "severe",   label: "Severa",   color: "severity-severe"   },
];

const ALLERGY_CATEGORY_COLORS: Record<AllergyCategory, string> = {
  food:          "tag-food",
  medication:    "tag-medication",
  environmental: "tag-environmental",
  other:         "tag-other",
};

export function HealthStep({ data, onChange, errors }: HealthStepProps) {
  const [allergyInput, setAllergyInput]       = useState("");
  const [allergyCategory, setAllergyCategory] = useState<AllergyCategory>("food");

  const update = (field: Partial<HealthData>) => onChange({ ...data, ...field });

  // ===== ALERGIAS =====
  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (!trimmed) return;
    const already = data.allergies.some(
      a => a.name.toLowerCase() === trimmed.toLowerCase() && a.category === allergyCategory
    );
    if (already) return;
    update({
      allergies: [
        ...data.allergies,
        { id: crypto.randomUUID(), category: allergyCategory, name: trimmed },
      ],
    });
    setAllergyInput("");
  };

  const removeAllergy = (id: string) => {
    update({ allergies: data.allergies.filter(a => a.id !== id) });
  };

  const handleAllergyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addAllergy(); }
  };

  // ===== MEDICAMENTOS =====
  const addMedication = () => {
    update({
      medications: [
        ...data.medications,
        { id: crypto.randomUUID(), name: "", dose: "", frequency: "" },
      ],
    });
  };

  const removeMedication = (id: string) => {
    update({ medications: data.medications.filter(m => m.id !== id) });
  };

  const updateMedication = (id: string, field: Partial<Medication>) => {
    update({
      medications: data.medications.map(m => m.id === id ? { ...m, ...field } : m),
    });
  };

  return (
    <div className="health-step">

      {/* ===== TIPO DE SANGRE ===== */}
      <div className="form-section">
        <h4 className="form-section-title">
          Tipo de sangre <span className="required">*</span>
        </h4>
        <div className="blood-type-grid">
          {BLOOD_TYPES.map(type => (
            <button
              key={type}
              type="button"
              className={`blood-type-card ${data.bloodType === type ? "selected" : ""}`}
              onClick={() => update({ bloodType: type })}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.bloodType && <span className="field-error">{errors.bloodType}</span>}
      </div>

      <div className="form-divider" />

      {/* ===== ALERGIAS ===== */}
      <div className="form-section">
        <h4 className="form-section-title">Alergias</h4>

        {/* Selector de categoría */}
        <div className="allergy-categories">
          {ALLERGY_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`category-btn ${allergyCategory === cat.id ? "selected" : ""}`}
              onClick={() => setAllergyCategory(cat.id)}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Input para agregar */}
        <div className="allergy-input-row">
          <input
            type="text"
            className="allergy-input"
            placeholder={
              allergyCategory === "food"          ? "Ej. Maní, Lácteos, Gluten..." :
              allergyCategory === "medication"    ? "Ej. Penicilina, Ibuprofeno..." :
              allergyCategory === "environmental" ? "Ej. Polen, Polvo, Ácaros..." :
              "Ej. Látex, Picadura de abeja..."
            }
            value={allergyInput}
            onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={handleAllergyKeyDown}
          />
          <button
            type="button"
            className="btn-add-allergy"
            onClick={addAllergy}
            disabled={!allergyInput.trim()}
          >
            <FiPlus size={15} />
            Agregar
          </button>
        </div>

        {/* Tags de alergias */}
        {data.allergies.length > 0 && (
          <div className="allergy-tags">
            {data.allergies.map(allergy => (
              <span
                key={allergy.id}
                className={`allergy-tag ${ALLERGY_CATEGORY_COLORS[allergy.category]}`}
              >
                {ALLERGY_CATEGORIES.find(c => c.id === allergy.category)?.emoji}
                {allergy.name}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeAllergy(allergy.id)}
                >
                  <FiX size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-divider" />

      {/* ===== CONDICIONES MÉDICAS ===== */}
      <div className="form-section">
        <h4 className="form-section-title">Condiciones médicas</h4>
        <div className="conditions-row">
          <div className="form-field conditions-field">
            <textarea
              className="conditions-textarea"
              rows={3}
              placeholder="Ej. Asma leve, epilepsia controlada, diabetes tipo 1..."
              value={data.conditions}
              onChange={e => update({ conditions: e.target.value })}
            />
          </div>
          <div className="form-field severity-field">
            <label>Severidad</label>
            <div className="severity-options">
              {SEVERITY_OPTIONS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`severity-btn ${s.color} ${data.conditionSeverity === s.id ? "selected" : ""}`}
                  onClick={() => update({ conditionSeverity: s.id })}
                  disabled={!data.conditions.trim()}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="form-divider" />

      {/* ===== MEDICAMENTOS ===== */}
      <div className="form-section">
        <div className="section-header-row">
          <h4 className="form-section-title">Medicamentos</h4>
          <button type="button" className="btn-add" onClick={addMedication}>
            <FiPlus size={14} />
            Agregar
          </button>
        </div>

        {data.medications.length === 0 ? (
          <p className="empty-hint">Sin medicamentos registrados</p>
        ) : (
          <div className="medications-list">
            {data.medications.map((med, index) => (
              <div key={med.id} className="medication-card">
                <div className="medication-card-header">
                  <span className="medication-card-title">Medicamento {index + 1}</span>
                  <button
                    type="button"
                    className="phone-remove-btn"
                    onClick={() => removeMedication(med.id)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <div className="medication-fields">
                  <div className="form-field">
                    <label>Nombre <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Ej. Salbutamol"
                      value={med.name}
                      onChange={e => updateMedication(med.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Dosis</label>
                    <input
                      type="text"
                      placeholder="Ej. 2mg"
                      value={med.dose}
                      onChange={e => updateMedication(med.id, { dose: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Frecuencia</label>
                    <input
                      type="text"
                      placeholder="Ej. Cada 8 horas"
                      value={med.frequency}
                      onChange={e => updateMedication(med.id, { frequency: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-divider" />

      {/* ===== MÉDICO DE CABECERA ===== */}
      <div className="form-section">
        <h4 className="form-section-title">Médico de cabecera <span className="optional">(opcional)</span></h4>
        <div className="form-row two-cols">
          <div className="form-field">
            <label>Nombre del médico</label>
            <input
              type="text"
              placeholder="Ej. Dr. Juan Pérez"
              value={data.doctorName}
              onChange={e => update({ doctorName: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Teléfono de contacto</label>
            <input
              type="tel"
              placeholder="686-123-4567"
              value={data.doctorPhone}
              onChange={e => update({ doctorPhone: e.target.value })}
            />
          </div>
        </div>
      </div>

    </div>
  );
}