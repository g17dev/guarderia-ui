import { useState } from "react";
import "./AuthorizePickupStep.css";
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

export function AuthorizePickupStep({ 
  data, 
  onChange, 
  errors, 
  selectedChildren 
}: AuthorizePickupStepProps) {
  const [activeTab, setActiveTab] = useState<"face" | "fingerprint">("face");
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [isFingerprintScanning, setIsFingerprintScanning] = useState(false);

  const handleFaceCapture = async (imageData: string) => {
    console.log("Imagen capturada:", imageData);

    setIsVerifyingFace(true);

    try {
        setTimeout(() => {
        onChange({ ...data, faceVerified: true });
        setIsVerifyingFace(false);
        }, 2000);
    } catch (error) {
        console.error('Error al verificar rostro:', error);
        alert('Error al conectar con el servidor de verificación');
        setIsVerifyingFace(false);
    }
    };

  const handleFingerprintVerification = () => {
    setIsFingerprintScanning(true);

    setTimeout(() => {
      onChange({ ...data, fingerprintVerified: true });
      setIsFingerprintScanning(false);
    }, 2000);
  };

  return (
    <div className="authorize-exit-step">
      
      {/* HEADER */}
      <div className="auth-header">
        <h2>Autorizar salida</h2>
        <p className="auth-subtitle">
          Verifica tu identidad para autorizar la salida de 
          <strong> {selectedChildren.length} {selectedChildren.length === 1 ? 'niño' : 'niños'}</strong>
        </p>

        {selectedChildren.length > 0 && (
          <div className="selected-children-preview">
            {selectedChildren.map((child, idx) => (
              <span key={idx} className="child-preview-badge">
                {child.name} {child.lastName}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="verification-tabs">
        <button 
          className={`tab ${activeTab === "face" ? "active" : ""}`}
          onClick={() => setActiveTab("face")}
        >
          <span className="tab-icon">😀</span>
          Reconocimiento Facial
          {data.faceVerified && <span className="verified-badge">✓</span>}
        </button>

        <button 
          className={`tab ${activeTab === "fingerprint" ? "active" : ""}`}
          onClick={() => setActiveTab("fingerprint")}
          disabled={!data.faceVerified}
        >
          <span className="tab-icon">👆</span>
          Validación de Huella
          {data.fingerprintVerified && <span className="verified-badge">✓</span>}
        </button>
      </div>

      {/* ================= FACE PANEL (NO SE DESMONTA) ================= */}
      {/* FACE PANEL */}
      <div
        className="verification-panel face-panel"
        style={{ display: activeTab === "face" ? "block" : "none" }}
        >
        <FaceCapture
            onCapture={handleFaceCapture}
            isVerifying={isVerifyingFace}
        />

        {isVerifyingFace && <p>Verificando rostro...</p>}
        {data.faceVerified && <p>✅ Verificado</p>}
      </div>

      {/* ================= FINGERPRINT PANEL ================= */}
      <div 
        className="verification-panel fingerprint-panel"
        style={{ display: activeTab === "fingerprint" ? "block" : "none" }}
      >
        <div className="fingerprint-container">
          <div className="fingerprint-animation">
            <svg viewBox="0 0 100 100" className="fingerprint-svg">
              <circle cx="50" cy="50" r="40" stroke="#004B92" strokeWidth="2" fill="none"/>
              <path d="M30 50 Q40 30 50 50 Q60 70 70 50" stroke="#004B92" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <p>Coloca tu dedo en el lector de huellas</p>
        </div>

        <div className="verification-status">
          {!data.fingerprintVerified ? (
            <>
              <div className="status-message">
                <span className="status-icon">🔒</span>
                <p>Esperando verificación de huella</p>
              </div>

              <button 
                className="verify-btn primary"
                onClick={handleFingerprintVerification}
                disabled={isFingerprintScanning}
              >
                {isFingerprintScanning
                  ? '⏳ Verificando huella...'
                  : '🖐️ Iniciar verificación de huella'}
              </button>
            </>
          ) : (
            <div className="success-message">
              <span className="success-icon">✓</span>
              <p>Huella verificada correctamente</p>
            </div>
          )}
        </div>
      </div>

      {/* PROGRESO */}
      <div className="validation-progress">
        <div className="progress-steps">
          <div className={`progress-step ${data.faceVerified ? 'completed' : 'pending'}`}>
            <span className="step-number">1</span>
            <span className="step-label">Verificación Facial</span>
          </div>

          <div className={`progress-line ${data.faceVerified ? 'active' : ''}`}></div>

          <div className={`progress-step ${data.fingerprintVerified ? 'completed' : 'pending'}`}>
            <span className="step-number">2</span>
            <span className="step-label">Verificación de Huella</span>
          </div>
        </div>
      </div>

      {errors.verification && (
        <div className="error-message">{errors.verification}</div>
      )}
    </div>
  );
}