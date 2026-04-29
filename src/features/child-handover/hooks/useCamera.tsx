// hooks/useCamera.ts
import { useState, useRef, useEffect } from 'react';

export const useCamera = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // 'user' para cámara frontal, 'environment' para trasera
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permiso denegado. Por favor, permite el acceso a la cámara.');
        } else if (err.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara en este dispositivo.');
        } else if (err.name === 'NotReadableError') {
          setError('La cámara está siendo usada por otra aplicación.');
        } else {
          setError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    isCameraActive,
    error,
    startCamera,
    stopCamera,
    capturePhoto
  };
};