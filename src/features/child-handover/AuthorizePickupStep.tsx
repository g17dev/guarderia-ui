import { useState } from "react";
import "./AuthorizePickupStep.css";
import { VerificationStepper } from "./components/VerificationStepper";
import { ScanFace } from 'lucide-react';
import { FingerprintPattern } from 'lucide-react';

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

export function AuthorizePickupStep({
  data,
  onChange,
  errors,
  selectedChildren,
}: AuthorizePickupStepProps) {
  const [activeTab, setActiveTab] = useState<"face" | "fingerprint">("face");
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [isFingerprintScanning, setIsFingerprintScanning] = useState(false);

  // Determinar el paso actual (0 = facial, 1 = huella)
  const currentStep = activeTab === "face" ? 0 : 1;

  const handleFaceVerification = () => {
    setIsFaceScanning(true);
    setTimeout(() => {
      onChange({ ...data, faceVerified: true });
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

  return (
    <div className="authorize-container">
      {/* Contenedor principal con dos columnas */}
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
            {activeTab === "face" && (
              <>
                <div className="panel-content">
                  <div className="camera-box">
                    <ScanFace size={200} color="#004B92" strokeWidth={1}/>
                    <div className="frame" />
                    {isFaceScanning && <div className="scan-line" />}
                  </div>
                  <p className="status">
                    {!data.faceVerified
                      ? "Coloca tu rostro dentro del marco"
                      : "Verificación completada"}
                  </p>
                </div>

                <div className="panel-footer">
                  {!data.faceVerified ? (
                    <button
                      className="btn primary"
                      onClick={handleFaceVerification}
                      disabled={isFaceScanning}
                    >
                      {isFaceScanning ? <span className="spinner" /> : "Verificar"}
                    </button>
                  ) : (
                    <div className="success">Identidad verificada</div>
                  )}
                </div>
              </>
            )}

            {activeTab === "fingerprint" && (
              <>
                <div className="panel-content">
                  <div
                    className={`fingerprint ${
                      isFingerprintScanning ? "active" : ""
                    }`}>
                    <FingerprintPattern size={200} color="#004B92" strokeWidth={1}/>
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
                      {isFingerprintScanning ? <span className="spinner" /> : "Verificar"}
                    </button>
                  ) : (
                    <div className="success">Huella verificada</div>
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
}