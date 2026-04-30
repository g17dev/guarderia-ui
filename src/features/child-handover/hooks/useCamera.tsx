// hooks/useCamera.ts
import { useState, useRef, useEffect } from 'react';

export const useCamera = () => {
  const [isCameraActive, setIsCameraActive] = useState(false); // ✅ Cambiado a false
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Inicializando cámara...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);

  const startCamera = async () => {
    // ✅ Permitir reiniciar si no está activa (quitamos la condición que bloqueaba)
    if (isStartingRef.current) {
      console.log('Cámara ya iniciándose');
      return;
    }

    setStatusMessage('Solicitando permisos de cámara...');
    isStartingRef.current = true;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;
      setStatusMessage('Conectando con la cámara...');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setStatusMessage('Iniciando transmisión de video...');
            videoRef.current
              .play()
              .then(() => {
                console.log('✅ Video reproduciéndose');
                setIsCameraActive(true);
                setStatusMessage('Cámara lista');
              })
              .catch((err) => {
                console.error('Error al reproducir video:', err);
                if (err.name !== 'AbortError') {
                  setError('No se pudo reproducir el video');
                  setStatusMessage('Error al reproducir el video');
                }
                setIsCameraActive(false);
              })
              .finally(() => {
                isStartingRef.current = false;
              });
          }
        };
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      isStartingRef.current = false;
      setIsCameraActive(false);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permiso denegado. Por favor, permite el acceso a la cámara.');
          setStatusMessage('Permiso denegado');
        } else if (err.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara en este dispositivo.');
          setStatusMessage('Cámara no encontrada');
        } else if (err.name === 'NotReadableError') {
          setError('La cámara está siendo usada por otra aplicación.');
          setStatusMessage('Cámara en uso');
        } else if (err.name === 'AbortError') {
          console.warn('El play() fue abortado');
          setStatusMessage('Reiniciando cámara...');
          // Intentar reiniciar
          setTimeout(() => {
            if (!isCameraActive && !isStartingRef.current) {
              startCamera();
            }
          }, 500);
        } else {
          setError('No se pudo acceder a la cámara. Verifica los permisos.');
          setStatusMessage('Error de acceso a cámara');
        }
      }
    }
  };

  const stopCamera = () => {
    console.log('🔴 stopCamera llamado - cerrando cámara...');
    
    // Método 1: Detener tracks del stream guardado
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log(`Deteniendo track: ${track.kind}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Método 2: Limpiar el video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
      videoRef.current.pause();
    }
    
    // Método 3: Forzar cierre de todas las pistas del navegador
    // @ts-ignore
    if (navigator.mediaDevices && navigator.mediaDevices.getTracks) {
      // @ts-ignore
      navigator.mediaDevices.getTracks().forEach((track) => {
        if (track.kind === 'video') {
          console.log('Deteniendo track global encontrado');
          track.stop();
        }
      });
    }
    
    // Método 4: Cerrar también el stream guardado en window (si existe)
    if ((window as any).activeStream) {
      (window as any).activeStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      (window as any).activeStream = null;
    }
    
    setIsCameraActive(false);
    isStartingRef.current = false;
    setStatusMessage('Cámara detenida');
    
    console.log('✅ Cámara cerrada completamente');
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !videoRef.current.videoWidth) return null;

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

  return {
    videoRef,
    isCameraActive,
    error,
    statusMessage,
    startCamera,
    stopCamera,
    capturePhoto,
    setStatusMessage,
  };
};