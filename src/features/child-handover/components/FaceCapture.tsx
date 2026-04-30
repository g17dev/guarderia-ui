// components/FaceCapture.tsx
import { useEffect, useRef, useState } from "react";
import { useCamera } from "../hooks/useCamera";
import { useFaceVerificationSocket } from "../hooks/useFaceVerificationSocket";
import { ScanFace } from "lucide-react";

type FaceCaptureProps = {
  onCameraReady?: (stopCamera: () => void) => void;
  onVerificationSuccess: (nombre: string) => void;
  onVerificationError: (error: string) => void;
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
  
  const { wsStatus, lastMessage, connect, sendFrame, startSendingFrames, stopSendingFrames, disconnect } = useFaceVerificationSocket();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false); // ← NUEVO: estado para rostro detectado
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
      
      // Conectar WebSocket
      connect((msg: VerificationMessage) => {
        console.log("Mensaje WebSocket:", msg);
        
        // ✅ Actualizar estado cuando se detecta un rostro
        if (msg.type === 'face_detected' && msg.face_detected) {
          setIsFaceDetected(true);
        }
        
        // Si ya no hay rostro, desactivar
        if (msg.type === 'status' && !msg.face_detected) {
          setIsFaceDetected(false);
        }
        
        if (msg.type === 'result') {
          setIsVerifying(false);
          if (msg.authorized) {
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
      }
    };
  }, [isActive, startCamera, stopCamera, connect, disconnect, onVerificationSuccess, onVerificationError]);

  // Enviar frames cuando la cámara está activa y WebSocket conectado
  useEffect(() => {
    if (isCameraActive && wsStatus === 'connected' && !isVerifying) {
      if (videoRef.current) {
        startSendingFrames(videoRef as React.RefObject<HTMLVideoElement>, sendFrame, 5);
      }
    }
    
    return () => {
      stopSendingFrames();
    };
  }, [isCameraActive, wsStatus, isVerifying, videoRef, sendFrame, startSendingFrames, stopSendingFrames]);

  const handleVerify = async () => {
    setIsVerifying(true);
    
    const imageData = capturePhoto();
    if (imageData) {
      sendFrame(imageData);
    } else {
      onVerificationError("No se pudo capturar la foto");
      setIsVerifying(false);
    }
  };

  // Determinar si el botón debe estar habilitado
  const isVerifyButtonEnabled = isCameraActive && !isVerifying && wsStatus === 'connected' && isFaceDetected;

  const getDisplayMessage = () => {
    if (error) return error;
    if (lastMessage?.message) return lastMessage.message;
    if (statusMessage) return statusMessage;
    if (wsStatus === 'connecting') return "Conectando con el servidor...";
    if (wsStatus === 'disconnected') return "Conectando al servidor...";
    if (!isCameraActive) return "Iniciando cámara...";
    if (isVerifying) return "Verificando identidad...";
    if (!isFaceDetected) return "Coloca tu rostro dentro del marco";
    return "Rostro detectado - Presiona Verificar";
  };

  return (
    <div className="panel-content">
      <div className="camera-box">
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
        
        {/* Indicador visual de detección de rostro */}
        {isFaceDetected && !isVerifying && (
          <div className="face-detected-indicator">
            <span>✓ Rostro detectado</span>
          </div>
        )}
      </div>

      <div className="status-container">
        <p className="status">{getDisplayMessage()}</p>
      </div>

      <div className="camera-controls">
        <button
          onClick={handleVerify}
          disabled={!isVerifyButtonEnabled}
          className={`btn primary capture-btn ${isFaceDetected ? 'active' : ''}`}
        >
          {isVerifying ? "Verificando..." : "Verificar identidad"}
        </button>
      </div>
    </div>
  );
};