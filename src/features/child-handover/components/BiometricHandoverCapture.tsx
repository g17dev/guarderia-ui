import "./BiometricHandoverCapture.css"
import { ScanFace } from "lucide-react";
import { FingerprintPattern } from "lucide-react"

export const BiometricHandoverCapture = () => {

    return (
        <div className="biometric-handover-capture">
            <div className="camera-box">
                <video
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

                <div className="scanface-overlay">
                    <ScanFace size={300} color="#004B92" strokeWidth={1} />
                    <p className={`status ${false ? 'success' : ''}`}>
                        {/* {getDisplayMessage()} */}
                        Buscando camara...
                        {/* Conectando con el servidor... */}
                        {/* Solicitando permisos de cámara... */}
                        {/* Iniciando camara... */}
                    </p>
                </div>

                <div className="face-detected-indicator">
                    <span>✓ Rostro detectado</span>
                    {/* <span>⚠️ Acomoda tu rostro en el marco</span> */}
                </div>

            </div>

            <div className="fingerprint-section">
                <div className="fingerprint-card">
                    {/* Icono de huella */}
                    <div className="fingerprint-icon-wrapper">
                        <FingerprintPattern 
                            size={64} 
                            strokeWidth={1.5}
                            className="fingerprint-icon deactive"
                        />
                    </div>

                    {/* Texto y descripción */}
                    <div className="fingerprint-info">
                        <h3 className="fingerprint-title">Verificación de huella</h3>
                        <p className="fingerprint-description">
                            Espere un momento, mientras estamos verificando el sensor de huella...
                            {/* Sensor listo, por favor inicie el escaneo para confirmar su identidad. */}
                        </p>
                    </div>

                    {/* Botón de acción */}
                    <button className="fingerprint-button deactive">
                        Iniciar Escaneo de Huella
                        {/* Escaneando... */}
                    </button>
                </div>
            </div>
        </div>
    );
};