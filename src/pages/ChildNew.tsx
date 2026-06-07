import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/Stepper";
import type { Step } from "../types/stepper";
import { Breadcrumbs } from "../components/BreadCrumbs";
import "./ChildNew.css";

const INITIAL_STEPS: Step[] = [
  { title: "Información básica", status: "current" },
  { title: "Tutor",             status: "pending" },
  { title: "Salud",             status: "pending" },
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

  const goNext = () => {
    if (currentStep >= steps.length - 1) return;
    const updated = steps.map((s, i) => ({
      ...s,
      status:
        i < currentStep + 1  ? "completed" as const
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
        i < currentStep - 1  ? "completed" as const
        : i === currentStep - 1 ? "current" as const
        : "pending" as const,
    }));
    setSteps(updated);
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="child-new-page">

      {/* Breadcrumbs — siempre primero */}
      <Breadcrumbs items={[
        { label: "Niños",     to: "/children" },
        { label: "Nuevo niño" },
      ]} />

      {/* Header */}
      <div className="child-new-header">
        <h2>Agregar niño</h2>
        <p>Completa los pasos para registrar un nuevo menor en el sistema</p>
      </div>

      {/* Contenido principal */}
      <div className="child-new-body">

        {/* Sidebar con stepper */}
        <aside className="child-new-sidebar">
          <Stepper steps={steps} orientation="vertical" />
        </aside>

        {/* Panel del paso actual */}
        <div className="child-new-content">
          <div className="step-panel">
            <div className="step-panel-header">
              <h3>{INITIAL_STEPS[currentStep].title}</h3>
              <p>{STEP_DESCRIPTIONS[currentStep]}</p>
            </div>

            <div className="step-panel-body">
              <div className="step-placeholder">
                Paso {currentStep + 1} — contenido próximamente
              </div>
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