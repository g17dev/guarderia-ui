// components/FaceCapture.tsx
import { useEffect, useRef, useState } from "react";
import { useCamera } from "../hooks/useCamera";
import { useFaceVerificationSocket } from "../hooks/useFaceVerificationSocket";
import { ScanFace } from "lucide-react";

type FaceCaptureProps = {
  onCameraReady?: (stopCamera: () => void) => void;
  onVerificationSuccess: (nombre: string) => void;
  onVerificationError: (error: string) => void;
  onContinueToFingerprint?: () => void;  // ✅ Nueva prop
  isActive: boolean;
};

interface VerificationMessage {
  type: 'status' | 'face_detected' | 'verifying' | 'result' | 'error';
  message: string;
  confidence?: number;
  face_detected?: boolean;
  ready_for_verification?: boolean;
  authorized?: boolean;
  nombre?: string;
}

export const FaceCapture = ({ 
  onCameraReady,
  onVerificationSuccess, 
  onVerificationError,
  onContinueToFingerprint,  // ✅ Recibir la función
  isActive 
}: FaceCaptureProps) => {
  const { 
    videoRef, 
    isCameraActive, 
    error, 
    statusMessage,
    startCamera, 
    stopCamera, 
    capturePhoto,
  } = useCamera();
  
  const { wsStatus, lastMessage, connect, sendFrame, startSendingFrames, stopSendingFrames, disconnect, sendVerificationCommand } = useFaceVerificationSocket();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);  // ✅ Estado de éxito
  const [verifiedNombre, setVerifiedNombre] = useState("");  // ✅ Nombre verificado
  const hasStartedRef = useRef(false);
  const hasNotifiedCameraReady = useRef(false);

  // Notificar al padre cuando la cámara está lista
  useEffect(() => {
    if (isCameraActive && onCameraReady && !hasNotifiedCameraReady.current) {
      console.log('📷 FaceCapture: Cámara lista, notificando al padre');
      hasNotifiedCameraReady.current = true;
      onCameraReady(stopCamera);
    }
  }, [isCameraActive, stopCamera, onCameraReady]);

  // Iniciar cámara y WebSocket cuando el tab está activo
  useEffect(() => {
    if (isActive && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startCamera();
      
      connect((msg: VerificationMessage) => {
        console.log("Mensaje WebSocket:", msg);
        
        if (msg.type === 'face_detected' && msg.face_detected) {
          setIsFaceDetected(true);
        }
        
        if (msg.type === 'status' && !msg.face_detected) {
          setIsFaceDetected(false);
        }
        
        if (msg.type === 'result') {
          setIsVerifying(false);
          if (msg.authorized) {
            setVerificationSuccess(true);  // ✅ Marcar como éxito
            setVerifiedNombre(msg.nombre || "Usuario");
            onVerificationSuccess(msg.nombre || "Usuario");
          } else {
            onVerificationError(msg.message);
          }
        }
      });
    }
    
    return () => {
      if (!isActive) {
        stopCamera();
        disconnect();
        hasStartedRef.current = false;
        hasNotifiedCameraReady.current = false;
        setIsFaceDetected(false);
        setVerificationSuccess(false);  // ✅ Resetear éxito
      }
    };
  }, [isActive, startCamera, stopCamera, connect, disconnect, onVerificationSuccess, onVerificationError]);

  // Enviar frames cuando la cámara está activa y WebSocket conectado
  useEffect(() => {
    if (isCameraActive && wsStatus === 'connected' && !isVerifying && !verificationSuccess) {
      if (videoRef.current) {
        startSendingFrames(videoRef as React.RefObject<HTMLVideoElement>, sendFrame, 5);
      }
    }
    
    return () => {
      stopSendingFrames();
    };
  }, [isCameraActive, wsStatus, isVerifying, verificationSuccess, videoRef, sendFrame, startSendingFrames, stopSendingFrames]);

  const handleVerify = async () => {
    setIsVerifying(true);
    const sent = sendVerificationCommand();
    
    if (!sent) {
      onVerificationError("Conexión perdida con el servidor");
      setIsVerifying(false);
    }
  };

  const handleContinue = () => {
    if (onContinueToFingerprint) {
      onContinueToFingerprint();
    }
  };

  // Determinar si el botón debe estar habilitado
  const isVerifyButtonEnabled = isCameraActive && !isVerifying && wsStatus === 'connected' && isFaceDetected && !verificationSuccess;

  const getDisplayMessage = () => {
    if (error) return error;
    if (verificationSuccess) return `✅ Identidad verificada: ${verifiedNombre}`;
    if (isVerifying) return "Verificando identidad...";
    
    // ✅ Cuando hay rostro detectado, NO mostrar mensaje de texto
    if (isFaceDetected) {
      return ""; // Retorna string vacío para no mostrar nada
    }
    
    if (statusMessage) return statusMessage;
    if (wsStatus === 'connecting') return "Conectando con el servidor...";
    if (wsStatus === 'disconnected') return "Conectando al servidor...";
    if (!isCameraActive) return "Iniciando cámara...";
    return "Coloca tu rostro dentro del marco";
  };

  return (
    <div className="panel-content">
      <div className={`camera-box ${verificationSuccess ? 'success' : ''} ${isFaceDetected && !verificationSuccess ? 'face-detected' : ''}`}>
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

        {!isCameraActive && !error && (
          <div className="scanface-overlay">
            <ScanFace size={120} color="#004B92" strokeWidth={1.5} />
          </div>
        )}

        <div className="frame" />
        {isVerifying && <div className="scan-line" />}
        
        {isFaceDetected && !isVerifying && !verificationSuccess && (
          <div className="face-detected-indicator">
            <span>✓ Rostro detectado</span>
          </div>
        )}
      </div>

      <p className={`status ${verificationSuccess ? 'success' : ''}`}>
        {getDisplayMessage()}
      </p>

      <div className="camera-controls">
        <button
          onClick={verificationSuccess ? handleContinue : handleVerify}
          disabled={!verificationSuccess && !isVerifyButtonEnabled}
          className={`btn primary capture-btn ${isFaceDetected ? 'active' : ''} ${verificationSuccess ? 'success-btn' : ''}`}
        >
          {verificationSuccess ? "Continuar →" : (isVerifying ? "Verificando..." : "Verificar identidad")}
        </button>
      </div>
    </div>
  );
};