import "./BiometricHandoverCapture.css"
import { ScanFace } from "lucide-react";
import { FingerprintPattern } from "lucide-react"
import { useBiometricSimulation } from "../hooks/useBiometricSimulation";
import { useBiometricCapture } from "../hooks/useBiometricCapture";

export const BiometricHandoverCapture = () => {

    // Usar el hook de simulación
    const { 
        isFingerprintReady,
        isFingerprintScanning,
        getFingerprintMessage,
        startFingerprintScan
    } = useBiometricSimulation();

    const {
        videoRef,
        isCameraActive,
        isFaceDetected,
        getDisplayMessage,
    } = useBiometricCapture();

    // Determinar si el overlay debe mostrarse
    const showOverlay = !isCameraActive;

    // Clase condicional para camera-box
    const cameraBoxClass = `camera-box ${isCameraActive ? 'active' : ''} ${isCameraActive && !isFaceDetected ? 'face-unknown' : ''}`;

    // Clases condicionales para la sección de huella
    const iconFingerprint = `fingerprint-icon ${isFingerprintReady ? 'active' : 'deactive'}`;

    const buttonFingerprint = `fingerprint-button ${isFingerprintReady ? 'active' : 'deactive'}`;
    
    
    return (
        <div className="biometric-handover-capture">
            <div className={cameraBoxClass}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                    }}
                />

                {showOverlay && (
                <div className="scanface-overlay">
                    <ScanFace size={300} color="#004B92" strokeWidth={1} />
                    <p className={`status ${false ? 'success' : ''}`}>
                        {getDisplayMessage()}
                    </p>
                </div>
                )}

                {/* Indicador de estado del rostro */}
                {isCameraActive && (
                    <div className={`face-detected-indicator ${isFaceDetected ? 'visible' : 'warning'}`}>
                        <span>
                            {isFaceDetected 
                                ? '✓ Rostro detectado' 
                                : '⚠️ Acomoda tu rostro en el marco'}
                        </span>
                    </div>
                )}

            </div>

            <div className="fingerprint-section">
                <div className="fingerprint-card">
                    {/* Icono de huella */}
                    <div className={`fingerprint-icon-wrapper ${isFingerprintScanning ? 'active' : ''}`}>
                        <FingerprintPattern 
                            size={64} 
                            strokeWidth={1.5}
                            className={iconFingerprint}
                        />
                    </div>

                    {/* Texto y descripción */}
                    <div className="fingerprint-info">
                        <h3 className="fingerprint-title">Verificación de huella</h3>
                        <p className="fingerprint-description">
                            {/* Espere un momento, mientras estamos verificando el sensor de huella... */}
                            {/* Sensor listo, por favor inicie el escaneo para confirmar su identidad. */}
                            {getFingerprintMessage()}
                        </p>
                    </div>

                    {/* Botón de acción */}
                    <button className={buttonFingerprint}
                            onClick={startFingerprintScan}
                            disabled={isFingerprintScanning}>
                    {isFingerprintScanning ? (
                        <>
                        <svg 
                            className="spinner-icon" 
                            viewBox="0 0 24 24" 
                            width="18" 
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round">
                            <animateTransform 
                                attributeName="transform" 
                                type="rotate" 
                                from="0 12 12" 
                                to="360 12 12" 
                                dur="1s" 
                                repeatCount="indefinite" 
                            />
                            </path>
                        </svg>
                        Escaneando...
                        </>
                    ) : (
                        "Iniciar Escaneo de Huella"
                    )}
                    </button>
                </div>
            </div>
        </div>
    );
};