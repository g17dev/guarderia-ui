import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/Stepper";
import type { Step } from "../types/stepper";
import { BasicInfoStep } from "../features/children/steps/BasicInfoStep";
import { TutorStep } from "../features/children/steps/TutorStep";

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
    tutor: {
      photoFile: null as File | null,
      photoPreview: "",
      name: "",
      lastNamePaternal: "",
      lastNameMaternal: "",
      relationship: "" as "father" | "mother" | "grandfather" | "grandmother" | "uncle" | "aunt" | "legal" | "other" | "",
      curp: "",
      ine: "",
      phones: [
        {
          id: crypto.randomUUID(),
          region: "MX" as PhoneRegion,  // ← agrega esto
          type: "personal" as const,
          number: "",
          note: "",
        }
      ] as Phone[],
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
    health: {
      allergies: [] as string[],
      conditions: "",
      bloodType: "",
    },
  });

  const goNext = () => {
    if (currentStep >= steps.length - 1) return;
    const updated = steps.map((s, i) => ({
      ...s,
      status:
        i < currentStep + 1 ? "completed" as const
        : i === currentStep + 1 ? "current" as const
        : "pending" as const,
    }));
    setSteps(updated);
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

  return (
    <div className="child-new-page">

      <div className="child-new-header">
        <h2>Agregar niño</h2>
        <p>Completa los pasos para registrar un nuevo menor en el sistema</p>
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
                  data={formData.tutor}
                  onChange={(newData) =>
                    setFormData(prev => ({ ...prev, tutor: newData }))
                  }
                  errors={errors}
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