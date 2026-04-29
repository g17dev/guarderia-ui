    import Stepper from "../components/Stepper";
    import type { Step } from "../types/stepper";
    import "./ChildHandover.css";
    import { SelectChildStep } from "../features/child-handover/SelectChildStep";
    import { useState } from "react";

    export default function ChildHandover() {
    
    const [steps, setSteps] = useState<Step[]>([
        { title: "Seleccionar", status: "current" as const },
        { title: "Autorizacion", status: "pending" as const },
        { title: "Confirmacion", status: "pending" as const }
    ]);

    // Estado para los datos de cada paso
    const [stepData, setStepData] = useState({
        seleccionar: {
        childIds: [] as string[],      // ← Array, no string
        childrenNames: "",              // ← Nombres concatenados
        },
        autorizacion: {
        authorizationCode: "",
        },
    });

    // Estado para el paso actual
    const [currentStep, setCurrentStep] = useState(0);

    // Estado para errores de validación
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Función para manejar la validación de un paso
    // Validación del paso
  const validateStep = (stepIndex: number) => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};

    if (stepIndex === 0) {
      // ✅ Usar childIds.length
      if (stepData.seleccionar.childIds.length === 0) {
        newErrors.childIds = "Selecciona al menos un niño.";
        isValid = false;
      }
    }

    if (stepIndex === 1) {
      if (!stepData.autorizacion.authorizationCode) {
        newErrors.authorizationCode = "Ingresa el código de autorización.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

    // Función para avanzar al siguiente paso
  const nextStep = () => {
    const isValid = validateStep(currentStep);
    if (isValid) {  // ← Quitar la condición de que no sea el último
        const updatedSteps = [...steps];
        updatedSteps[currentStep] = { ...updatedSteps[currentStep], status: "completed" };
        
        // Si no es el último paso, marcar el siguiente como current
        if (currentStep < steps.length - 1) {
        updatedSteps[currentStep + 1] = { ...updatedSteps[currentStep + 1], status: "current" };
        setCurrentStep(currentStep + 1);
        }
        
        setSteps(updatedSteps);
    }
    };

    // Función para retroceder al paso anterior
  const prevStep = () => {
        setCurrentStep(currentStep - 1);
        // Actualiza el estado del stepper
        steps[currentStep].status = "pending";
        steps[currentStep - 1].status = "current";
    };

    const handleConfirm = () => {
        const isValid = validateStep(currentStep);
        if (isValid) {
            const updatedSteps = [...steps];
            updatedSteps[currentStep] = { ...updatedSteps[currentStep], status: "completed" };
            setSteps(updatedSteps);
            
            console.log("Registro completado:", stepData);
            alert("¡Registro de salida completado!");
        }
    };


    return (
        <div className="page">
            <h2>Registro de salida</h2>
            <Stepper steps={steps} />
            <div className="stepper-content">
                {/* Renderiza el contenido del paso actual */}
                {currentStep === 0 && (
                <SelectChildStep
                    data={stepData.seleccionar}  // ← Esto ahora es { childIds: [], childrenNames: "" }
                    onChange={(newData) => setStepData((prev) => ({ 
                    ...prev, 
                    seleccionar: newData 
                    }))}
                    errors={errors}
                />
                )}
                {/* {currentStep === 1 && (
                <AutorizacionStep
                    data={stepData.autorizacion}
                    onChange={(data) => setStepData((prev) => ({ ...prev, autorizacion: data }))}
                    errors={errors}
                />
                )}
                {currentStep === 2 && (
                <ConfirmacionStep data={stepData} />
                )} */}
            </div>
            <div className="stepper-buttons">
                {currentStep > 0 && (
                    <button onClick={prevStep}>← Atrás</button>
                )}
                {currentStep < steps.length - 1 && (  // ← "Siguiente" solo si NO es el último
                    <button onClick={nextStep}>Siguiente →</button>
                )}
                {currentStep === steps.length - 1 && (  // ← "Confirmar" SOLO en el último paso
                    <button onClick={handleConfirm} className="btn-success">✓ Confirmar</button>
                )}
            </div>
        </div>
    );
    }