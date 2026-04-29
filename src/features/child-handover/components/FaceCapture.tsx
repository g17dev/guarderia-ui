import { useEffect } from "react";
import { useCamera } from "../hooks/useCamera";

type FaceCaptureProps = {
  onCapture: (imageData: string) => void | Promise<void>;
  isVerifying: boolean;
};

export const FaceCapture = ({ onCapture, isVerifying }: FaceCaptureProps) => {
  const { videoRef, isCameraActive, error } = useCamera();

  useEffect(() => {
    console.log("Camera:", isCameraActive);
  }, [isCameraActive]);

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg");
    onCapture(imageData);
  };

  return (
    <div className="face-container">
      <div className="face-card">
        <div className="video-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video"
          />

          {/* Overlay guía facial */}
          <div className="overlay" />
        </div>

        {error && <p className="error">{error}</p>}

        <button
          onClick={takePhoto}
          disabled={!isCameraActive || isVerifying}
          className="capture-button"
        >
          {isVerifying ? "Verificando..." : "Capturar rostro"}
        </button>

        {!isCameraActive && !error && (
          <p className="hint">Iniciando cámara...</p>
        )}
      </div>
    </div>
  );
};