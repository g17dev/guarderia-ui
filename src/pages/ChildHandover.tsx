import Stepper from "../components/Stepper";
import type { Step } from "../types/stepper";
import "./ChildHandover.css";
import { SelectChildStep } from "../features/child-handover/SelectChildStep";
import { AuthorizePickupStep } from "../features/child-handover/AuthorizePickupStep";
import { ConfirmPickupStep } from "../features/child-handover/ConfirmPickupStep";
import { useState, useEffect } from "react";
import type { Child } from "../types/child";


export default function ChildHandover() {
  const [stepData, setStepData] = useState({
    seleccionar: {
      childIds: [] as string[],
      childrenNames: "",
      selectedChildrenData: [] as Child[],
    },
    autorizacion: {
      faceVerified: false,
      fingerprintVerified: false,
      authorizationCode: "",
    },
  });

  const [currentStep, setCurrentStep] = useState(0);

  const [steps, setSteps] = useState<Step[]>([
    { title: "Seleccionar", status: "current" as const },
    { title: "Autorizar recogida", status: "pending" as const },
    { title: "Confirmar", status: "pending" as const },
  ]);

  const [stepperKey, setStepperKey] = useState<number>(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // ============================================
  // VALIDACIÓN DE PASOS
  // ============================================
  const validateStep = (stepIndex: number) => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};

    if (stepIndex === 0) {
      if (stepData.seleccionar.childIds.length === 0) {
        newErrors.childIds = "Selecciona al menos un niño.";
        isValid = false;
      }
    }

    if (stepIndex === 1) {
      if (!stepData.autorizacion.faceVerified) {
        newErrors.faceVerified = "Debes completar la verificación facial.";
        isValid = true;
      }
      if (!stepData.autorizacion.fingerprintVerified) {
        newErrors.fingerprintVerified =
          "Debes completar la verificación de huella.";
        isValid = true;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // ============================================
  // FUNCIÓN PARA AVANZAR AL SIGUIENTE PASO
  // ============================================
  const nextStep = () => {
    const isValid = validateStep(currentStep);
    if (isValid && currentStep < steps.length - 1) {
      const updatedSteps = [...steps];
      updatedSteps[currentStep] = {
        ...updatedSteps[currentStep],
        status: "completed",
      };
      updatedSteps[currentStep + 1] = {
        ...updatedSteps[currentStep + 1],
        status: "current",
      };

      setSteps(updatedSteps);
      setCurrentStep(currentStep + 1);
      setStepperKey((prev) => prev + 1);
    }
  };

  // ============================================
  // FUNCIÓN PARA RETROCEDER AL PASO ANTERIOR
  // ============================================
  const prevStep = () => {
    if (currentStep > 0) {
      const updatedSteps = [...steps];
      updatedSteps[currentStep] = {
        ...updatedSteps[currentStep],
        status: "pending",
      };
      updatedSteps[currentStep - 1] = {
        ...updatedSteps[currentStep - 1],
        status: "current",
      };

      setSteps(updatedSteps);
      setCurrentStep(currentStep - 1);
      setStepperKey((prev) => prev + 1);

      if (currentStep - 1 === 0) {
        setRefreshKey((prev) => prev + 1);
      }
    }
  };

  // ============================================
  // OBTENER NIÑOS SELECCIONADOS
  // ============================================
  const getSelectedChildren = () => {
    return stepData.seleccionar.selectedChildrenData;
  };

  // ============================================
  // CONFIRMAR REGISTRO
  // ============================================
  const handleConfirm = () => {
    const isValid = validateStep(currentStep);
    if (isValid) {
      const updatedSteps = [...steps];
      updatedSteps[currentStep] = {
        ...updatedSteps[currentStep],
        status: "completed",
      };
      setSteps(updatedSteps);
      setStepperKey((prev) => prev + 1);

      console.log("Registro completado:", stepData);
      alert("¡Registro de salida completado!");
    }
  };

  // Sincronizar el estado de currentStep con el visual del stepper
  useEffect(() => {
    const updatedSteps: Step[] = steps.map((step, index) => ({
      ...step,
      status:
        index === currentStep
          ? ("current" as const)
          : index < currentStep
            ? ("completed" as const)
            : ("pending" as const),
    }));

    if (JSON.stringify(steps) !== JSON.stringify(updatedSteps)) {
      setSteps(updatedSteps);
    }
  }, [currentStep]);

  return (
    <div className="page">
      <h2>Registro de salida</h2>
      <Stepper steps={steps} />
      <div className="stepper-content">
        {currentStep === 0 && (
          <SelectChildStep
            key={refreshKey}
            data={stepData.seleccionar}
            onChange={(newData, selectedChildrenData) =>
              setStepData((prev: typeof stepData) => ({
                ...prev,
                seleccionar: {
                  ...newData,
                  selectedChildrenData, // ← NUEVO: guardar los niños completos
                },
              }))
            }
            errors={errors}
          />
        )}

        {currentStep === 1 && (
          <AuthorizePickupStep
            data={stepData.autorizacion}
            onChange={(newData: typeof stepData.autorizacion) =>
              setStepData((prev: typeof stepData) => ({
                ...prev,
                autorizacion: newData,
              }))
            }
            errors={errors}
            selectedChildren={getSelectedChildren()}
          />
        )}

        {currentStep === 2 && <ConfirmPickupStep selectedChildren={stepData.seleccionar.selectedChildrenData}/>}
      </div>

      <div className="stepper-buttons">
        {currentStep > 0 && <button onClick={prevStep}>← Atrás</button>}
        {currentStep < steps.length - 1 && (
          <button onClick={nextStep}>Siguiente →</button>
        )}
        {currentStep === steps.length - 1 && (
          <button onClick={handleConfirm} className="btn-success">
            ✓ Confirmar
          </button>
        )}
      </div>
    </div>
  );
}