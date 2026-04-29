// components/VerificationStepper.tsx
import "./VerificationStepper.css";

interface VerificationStepperProps {
  currentStep: number; // 0 = facial, 1 = huella
  faceVerified: boolean;
  fingerprintVerified: boolean;
}

export function VerificationStepper({ 
  currentStep, 
  faceVerified, 
  fingerprintVerified 
}: VerificationStepperProps) {
  return (
    <div className="verification-stepper-vertical">
      {/* Paso 1: Validación Facial */}
      <div className={`step-vertical ${currentStep === 0 ? 'active' : ''} ${faceVerified ? 'completed' : ''}`}>
        <div className="step-indicator-vertical">
          <div className="step-circle">
            {faceVerified}
          </div>
          {/* ✅ CORREGIDO: Mostrar línea si el paso 1 está completado */}
          <div className={`step-line-vertical ${faceVerified ? 'completed' : ''}`}></div>
        </div>
        <div className="step-content">
          <div className="step-title">Validación Facial</div>
        </div>
      </div>

      {/* Paso 2: Validación de Huella */}
      <div className={`step-vertical ${currentStep === 1 ? 'active' : ''} ${fingerprintVerified ? 'completed' : ''}`}>
        <div className="step-indicator-vertical">
          <div className="step-circle">
            {fingerprintVerified}
          </div>
        </div>
        <div className="step-content">
          <div className="step-title">Validación de Huella</div>
        </div>
      </div>
    </div>
  );
}