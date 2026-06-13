import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/Stepper";
import type { Step } from "../types/stepper";
import { BasicInfoStep } from "../features/children/steps/BasicInfoStep";
import { TutorStep } from "../features/children/steps/TutorStep";
import type { HealthData } from "../features/children/steps/HealthStep";
import { HealthStep } from "../features/children/steps/HealthStep";
import { ConfirmStep } from "../features/children/steps/ConfirmStep";

import "./ChildNew.css";

const INITIAL_STEPS: Step[] = [
  { title: "Información básica", status: "current" },
  { title: "Adulto Responsable",     status: "pending" },
  { title: "Salud y Cuidados",             status: "pending" },
  { title: "Confirmar",         status: "pending" },
];

const STEP_DESCRIPTIONS = [
  "Foto y datos personales del niño",
  "Datos del padre, madre o tutor responsable",
  "Alergias y condiciones médicas conocidas",
  "Revisa la información antes de guardar",
];

export function ChildNew() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  type PhoneType = "personal" | "work" | "home" | "other";

  type PhoneRegion = "MX" | "US";

  interface Phone {
    id: string;
    region: PhoneRegion;  // ← agrega esto
    type: "personal" | "work" | "home" | "other";
    number: string;
    note: string;
  }

  type TutorRelationship =
    | "father" | "mother" | "grandfather" | "grandmother"
    | "uncle" | "aunt" | "legal" | "other" | "";

   interface TutorData {
    id: string;
    photoFile: File | null;
    photoPreview: string;
    name: string;
    lastNamePaternal: string;
    lastNameMaternal: string;
    relationship: TutorRelationship;
    curp: string;
    ine: string;
    phones: Phone[];
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }

  const newTutor = (): TutorData => ({
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
  // ← formData dentro del componente
  const [formData, setFormData] = useState({
    basicInfo: {
      name: "",
      lastNamePaternal: "",
      lastNameMaternal: "",
      gender: "" as "male" | "female" | "",
      birthDate: "",
      classroom: "",
      photoFile: null as File | null,
      photoPreview: "",
    },
    tutors: [newTutor()] as TutorData[],
    health: {
      bloodType: "",
      allergies: [],
      conditions: "",
      conditionSeverity: "" as HealthData["conditionSeverity"],
      medications: [],
      doctorName: "",
      doctorPhone: "",
    } as HealthData,
  });

  const calculateProgress = () => {
    let filled = 0;
    let total = 0;

    // Paso 1 — básico (5 campos obligatorios)
    const b = formData.basicInfo;
    const basicRequired = [b.name, b.lastNamePaternal, b.birthDate, b.classroom, b.gender];
    total += basicRequired.length;
    filled += basicRequired.filter(Boolean).length;

    // Paso 2 — tutores (4 campos por tutor)
    formData.tutors.forEach(t => {
      const tutorRequired = [t.name, t.lastNamePaternal, t.relationship, t.curp];
      total += tutorRequired.length;
      filled += tutorRequired.filter(Boolean).length;
    });

    // Paso 3 — salud (solo tipo de sangre obligatorio)
    total += 1;
    filled += formData.health.bloodType ? 1 : 0;

    return Math.round((filled / total) * 100);
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return; // ← bloquea si hay errores
    if (currentStep >= steps.length - 1) return;
    const updated = steps.map((s, i) => ({
      ...s,
      status:
        i < currentStep + 1 ? "completed" as const
        : i === currentStep + 1 ? "current" as const
        : "pending" as const,
    }));
    setCurrentStep(currentStep + 1);
  };

  const goPrev = () => {
    if (currentStep <= 0) return;
    const updated = steps.map((s, i) => ({
      ...s,
      status:
        i < currentStep - 1 ? "completed" as const
        : i === currentStep - 1 ? "current" as const
        : "pending" as const,
    }));
    setSteps(updated);
    setCurrentStep(currentStep - 1);
  };

  // Nueva función
  const goToStep = (step: number) => {
    const updated = steps.map((s, i) => ({
      ...s,
      status:
        i < step ? "completed" as const
        : i === step ? "current" as const
        : "pending" as const,
    }));
    setSteps(updated);
    setCurrentStep(step);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 0) {
      const b = formData.basicInfo;
      if (!b.name)             newErrors.name             = "El nombre es obligatorio";
      if (!b.lastNamePaternal) newErrors.lastNamePaternal = "El apellido paterno es obligatorio";
      if (!b.birthDate)        newErrors.birthDate        = "La fecha de nacimiento es obligatoria";
      if (!b.classroom)        newErrors.classroom        = "El grupo es obligatorio";
      if (!b.gender)           newErrors.gender           = "El género es obligatorio";
    }

    if (step === 1) {
      formData.tutors.forEach((t, i) => {
        if (!t.name)             newErrors[`tutor_${i}_name`]             = "El nombre es obligatorio";
        if (!t.lastNamePaternal) newErrors[`tutor_${i}_lastNamePaternal`] = "El apellido paterno es obligatorio";
        if (!t.relationship)     newErrors[`tutor_${i}_relationship`]     = "La relación es obligatoria";
        if (!t.curp)             newErrors[`tutor_${i}_curp`]             = "La CURP es obligatoria";
        const hasPhone = t.phones.some(p => p.number.trim());
        if (!hasPhone)           newErrors[`tutor_${i}_phones`]           = "Al menos un teléfono es obligatorio";
      });
    }

    if (step === 2) {
      if (!formData.health.bloodType) newErrors.bloodType = "El tipo de sangre es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  return (
    <div className="child-new-page">

      {/* Header */}
      <div className="child-new-header">
        <h2>Agregar niño</h2>
        <p>Completa los pasos para registrar un nuevo menor en el sistema</p>
        <div className="progress-bar-wrapper">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
          <span className="progress-bar-label">{calculateProgress()}% completado</span>
        </div>
      </div>

      <div className="child-new-body">

        <aside className="child-new-sidebar">
          <Stepper steps={steps} orientation="vertical" />
        </aside>

        <div className="child-new-content">
          <div className="step-panel">
            <div className="step-panel-header">
              <h3>{INITIAL_STEPS[currentStep].title}</h3>
              <p>{STEP_DESCRIPTIONS[currentStep]}</p>
            </div>

            <div className="step-panel-body">
              {currentStep === 0 && (
                <BasicInfoStep
                  data={formData.basicInfo}
                  onChange={(newData) =>
                    setFormData(prev => ({ ...prev, basicInfo: newData }))
                  }
                  errors={errors}
                />
              )}
              {currentStep === 1 && (
                <TutorStep
                  tutors={formData.tutors}
                  onChange={(newTutors) =>
                    setFormData(prev => ({ ...prev, tutors: newTutors }))
                  }
                  errors={errors}
                />
              )}
              {currentStep === 2 && (
                <HealthStep
                  data={formData.health}
                  onChange={(newData) =>
                    setFormData(prev => ({ ...prev, health: newData }))
                  }
                  errors={errors}
                />
              )}
              {currentStep === 3 && (
                <ConfirmStep
                  formData={formData}
                  onEdit={goToStep}
                />
              )}
            </div>

            <div className="step-panel-footer">
              {currentStep > 0 && (
                <button className="btn-secondary" onClick={goPrev}>
                  ← Atrás
                </button>
              )}
              {currentStep < steps.length - 1 ? (
                <button className="btn-primary" onClick={goNext}>
                  Siguiente →
                </button>
              ) : (
                <button className="btn-success" onClick={() => navigate("/children")}>
                  ✓ Guardar
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}