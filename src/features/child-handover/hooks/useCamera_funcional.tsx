import { useEffect, useRef, useState } from "react";

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (streamRef.current) return; // 🔥 evita reinicio

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (!isMounted) return;

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          await videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("No se pudo acceder a la cámara");
      }
    };

    startCamera();

    return () => {
      isMounted = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    isCameraActive,
    error,
  };
};