import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import "./AuthorizePickupStep.css";
import { VerificationStepper } from "./components/VerificationStepper";
import { FaceCapture } from "./components/FaceCapture";

interface AuthorizePickupStepProps {
  data: {
    faceVerified: boolean;
    fingerprintVerified: boolean;
    authorizationCode?: string;
  };
  onChange: (data: any) => void;
  errors: { [key: string]: string };
  selectedChildren: Array<{ name: string; lastName: string }>;
}

export interface AuthorizePickupStepRef {
  stopCamera: () => void;
}

export const AuthorizePickupStep = forwardRef<AuthorizePickupStepRef, AuthorizePickupStepProps>(
  ({ data, onChange, errors, selectedChildren }, ref) => {
    const [activeTab, setActiveTab] = useState<"face" | "fingerprint">("face");
    const [isFaceScanning, setIsFaceScanning] = useState(false);
    const [isFingerprintScanning, setIsFingerprintScanning] = useState(false);
    const [isVerifyingFace, setIsVerifyingFace] = useState(false);
    const [faceMessage, setFaceMessage] = useState("");
    
    // ✅ NUEVO: Estado para guardar la función de detener cámara
    const [cameraStopFn, setCameraStopFn] = useState<(() => void) | null>(null);

    // Determinar el paso actual (0 = facial, 1 = huella)
    const currentStep = activeTab === "face" ? 0 : 1;

    // ✅ NUEVO: Conectar el ref con la función real
    useImperativeHandle(ref, () => ({
      stopCamera: () => {
        console.log('🔴 stopCamera llamado desde ref');
        if (cameraStopFn) {
          console.log('🔴 Ejecutando stopCamera real');
          cameraStopFn();
        } else {
          console.log('⚠️ cameraStopFn no está disponible aún');
        }
      }
    }));

    useEffect(() => {
      console.log('📌 activeTab cambió a:', activeTab);
    }, [activeTab]);

    const handleFaceCapture = async (imageData: string) => {
      setIsVerifyingFace(true);
      setIsFaceScanning(true);
      
      setTimeout(() => {
        onChange({ ...data, faceVerified: true });
        setIsVerifyingFace(false);
        setIsFaceScanning(false);
        setActiveTab("fingerprint");
      }, 2000);
    };

    const handleFingerprintVerification = () => {
      setIsFingerprintScanning(true);
      setTimeout(() => {
        onChange({ ...data, fingerprintVerified: true });
        setIsFingerprintScanning(false);
      }, 2000);
    };

    const handleFaceVerificationSuccess = (nombre: string) => {
      setIsVerifyingFace(false);
      onChange({ ...data, faceVerified: true });
      setFaceMessage(`✅ Identidad verificada: ${nombre}`);
      //setTimeout(() => setActiveTab("fingerprint"), 1500);
    };

    const handleFaceVerificationError = (error: string) => {
      setIsVerifyingFace(false);
      setFaceMessage(`❌ ${error}`);
    };

    const handleCameraReady = (stopFn: () => void) => {
      console.log('📷 Recibida función stopCamera desde FaceCapture');
      setCameraStopFn(() => stopFn);
    };

    const handleContinueToFingerprint = () => {
    setActiveTab("fingerprint");
  };


  return (
    <div className="authorize-container">
      <div className="authorize-layout">
        {/* Columna Izquierda: Panel de verificación */}
        <div className="authorize-left">
          <div className="auth-header">
            <h2>Autorizar salida</h2>
            <p>
              Verifica tu identidad para autorizar la salida de{" "}
              <strong>
                {selectedChildren.length}{" "}
                {selectedChildren.length === 1 ? "niño" : "niños"}
              </strong>
            </p>
            <div className="children-list">
              {selectedChildren.map((child, i) => (
                <span key={i} className="child-chip">
                  {child.name} {child.lastName}
                </span>
              ))}
            </div>
          </div>
          <div className="panel">
            {activeTab === "face" ? (
            <>
              <FaceCapture 
                onCameraReady={handleCameraReady}
                onVerificationSuccess={handleFaceVerificationSuccess}
                onVerificationError={handleFaceVerificationError}
                onContinueToFingerprint={handleContinueToFingerprint}
                isActive={true}
              />
            </>
          ) : (
              // Contenido para huella
              <>
                <div className="panel-content">
                  <div className="fingerprint-container">
                    <div className={`fingerprint ${isFingerprintScanning ? "active" : ""}`} />
                  </div>
                  <p className="status">
                    {!data.fingerprintVerified
                      ? "Coloca tu dedo en el lector"
                      : "Verificación completada"}
                  </p>
                </div>

                <div className="panel-footer">
                  {!data.fingerprintVerified ? (
                    <button
                      className="btn primary"
                      onClick={handleFingerprintVerification}
                      disabled={isFingerprintScanning}
                    >
                      {isFingerprintScanning ? <span className="spinner" /> : "Verificar huella"}
                    </button>
                  ) : (
                    <div className="success-message">
                      <span className="success-icon">✓</span>
                      <p>Huella verificada correctamente</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {errors.verification && <div className="error">{errors.verification}</div>}
        </div>

        {/* Columna Derecha: Stepper vertical */}
        <div className="authorize-right">
          <VerificationStepper 
            currentStep={currentStep}
            faceVerified={data.faceVerified}
            fingerprintVerified={data.fingerprintVerified}
          />
        </div>
      </div>
    </div>
  );
});