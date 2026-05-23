import Stepper from "../components/Stepper";
import type { Step } from "../types/stepper";
import "./ChildHandover.css";
import { SelectChildStep } from "../features/child-handover/SelectChildStep";
import { AuthorizePickupStep } from "../features/child-handover/AuthorizePickupStep";
import { ConfirmPickupStep } from "../features/child-handover/ConfirmPickupStep";
import { useState, useEffect } from "react";
import { Import } from "lucide-react";

// Definir el tipo Child
interface Child {
  id: string;
  name: string;
  lastName: string;
  classroom?: string;
}

export default function ChildHandover() {
  // ============================================
  // RESTAURAR DATOS GUARDADOS EN sessionStorage
  // ============================================
  const savedData = sessionStorage.getItem("stepData");
  const savedStep = sessionStorage.getItem("currentStep");
  const savedSteps = sessionStorage.getItem("steps");
  const savedStepperKey = sessionStorage.getItem("stepperKey");

  // Estado inicial con restauración
  const [stepData, setStepData] = useState(() => {
    if (savedData) {
      console.log("🔄 Restaurando stepData guardado");
      return JSON.parse(savedData);
    }
    return {
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
    };
  });

  const [currentStep, setCurrentStep] = useState(() => {
    if (savedStep) {
      console.log("🔄 Restaurando currentStep:", savedStep);
      return parseInt(savedStep);
    }
    return 0;
  });

  const [steps, setSteps] = useState<Step[]>(() => {
    if (savedSteps) {
      console.log("🔄 Restaurando steps guardado");
      return JSON.parse(savedSteps);
    }
    return [
      { title: "Seleccionar", status: "current" as const },
      { title: "Autorizar recogida", status: "pending" as const },
      { title: "Confirmar", status: "pending" as const },
    ];
  });

  // Key para forzar remontaje del Stepper
  const [stepperKey, setStepperKey] = useState<number>(() => {
    if (savedStepperKey) {
      return parseInt(savedStepperKey);
    }
    return 0;
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [authorizeKey, setAuthorizeKey] = useState<number>(0);

  // Limpiar sessionStorage después de restaurar
  useEffect(() => {
    if (savedData) sessionStorage.removeItem("stepData");
    if (savedStep) sessionStorage.removeItem("currentStep");
    if (savedSteps) sessionStorage.removeItem("steps");
    if (savedStepperKey) sessionStorage.removeItem("stepperKey");
  }, []);

  // ============================================
  // FUNCIÓN PARA GUARDAR DATOS ANTES DE RECARGAR
  // ============================================
  const saveAndReload = (targetStep: number) => {
    console.log("💾 Guardando datos en sessionStorage antes de recargar");
    sessionStorage.setItem("stepData", JSON.stringify(stepData));
    sessionStorage.setItem("currentStep", targetStep.toString());
    sessionStorage.setItem("steps", JSON.stringify(steps));
    sessionStorage.setItem("stepperKey", (stepperKey + 1).toString());
    window.location.reload();
  };

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
      if (currentStep === 1) {
        saveAndReload(currentStep + 1);
        return;
      }

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
      if (currentStep === 1) {
        saveAndReload(currentStep - 1);
        return;
      }

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

      // Limpiar sessionStorage al completar
      sessionStorage.removeItem("stepData");
      sessionStorage.removeItem("currentStep");
      sessionStorage.removeItem("steps");
      sessionStorage.removeItem("stepperKey");
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
            key={authorizeKey}
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

        {currentStep === 2 && <ConfirmPickupStep />}
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
