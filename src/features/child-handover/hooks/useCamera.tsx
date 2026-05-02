import { useState, useRef, useCallback, useEffect } from 'react';

export interface VerificationMessage {
  type: 'status' | 'face_detected' | 'verifying' | 'result' | 'error';
  message: string;
  confidence?: number;
  face_detected?: boolean;
  ready_for_verification?: boolean;
  authorized?: boolean;
  nombre?: string;
}

export const useCamera = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Buscando cámara...');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<VerificationMessage | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const isStartingRef = useRef(false);
  const [isServerReady, setIsServerReady] = useState(false);

  // Función para verificar si el servidor está disponible
  const checkServerHealth = async (): Promise<boolean> => {
    try {
      // Intentar conectar al endpoint de health check
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Servidor disponible:', data);
        setIsServerReady(true);
        return true;
      }
      throw new Error('Servidor no responde');
    } catch (error) {
      console.error('❌ Servidor no disponible:', error);
      setIsServerReady(false);
      setStatusMessage('Servidor no disponible. No se puede iniciar la cámara.');
      setError('No se pudo conectar con el servidor de verificación.');
      return false;
    }
  };


  // Función para verificar si hay una cámara disponible
  async function checkForCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.error("Tu navegador no soporta la detección de dispositivos multimedia.");
      return false;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      return hasCamera;
    } catch (error) {
      console.error("Error al enumerar los dispositivos:", error);
      return false;
    }
  }

  // Función para detener el envío de frames
  const stopSendingFrames = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }, []);

  // Función para iniciar el envío de frames
  const startSendingFrames = useCallback(() => {
    if (frameIntervalRef.current) stopSendingFrames();
    
    frameIntervalRef.current = setInterval(() => {
      if (videoRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          const frameData = canvas.toDataURL('image/jpeg', 0.7);
          wsRef.current.send(frameData);
        }
      }
    }, 200); // 5 frames por segundo
  }, [stopSendingFrames]);

  // Función para conectar WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/face-verify`;
    wsRef.current = new WebSocket(wsUrl);
    setWsStatus('connecting');
    
    wsRef.current.onopen = () => {
      console.log('✅ WebSocket conectado');
      setWsStatus('connected');
      startSendingFrames(); // Comenzar a enviar frames
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as VerificationMessage;
        setLastMessage(data);
        
        // Actualizar estado de detección de rostro
        if (data.type === 'face_detected' && data.face_detected) {
          setIsFaceDetected(true);
          setStatusMessage('✅ Rostro detectado');
        } else if (data.type === 'status' && !data.face_detected) {
          setIsFaceDetected(false);
          setStatusMessage(data.message);
        }
        
        if (data.type === 'result') {
          console.log('Resultado de verificación:', data);
        }
      } catch (error) {
        console.error('Error al parsear mensaje:', error);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('❌ Error en WebSocket:', error);
      setWsStatus('disconnected');
    };
    
    wsRef.current.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      setWsStatus('disconnected');
      stopSendingFrames();
    };
  }, [startSendingFrames, stopSendingFrames]);

  // Desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    stopSendingFrames();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWsStatus('disconnected');
    }
  }, [stopSendingFrames]);

  const startCamera = async () => {
    if (isStartingRef.current) return;

    // Validar que el servidor esté disponible
    await checkServerHealth();
  
    if (!isServerReady) {
      console.warn('⚠️ No se puede iniciar la cámara: servidor no disponible');
      return;
    }

    setStatusMessage('Buscando cámara...');
    const hasCamera = await checkForCamera();

    if (!hasCamera) {
      setError('No se encontró ninguna cámara en este dispositivo.');
      setStatusMessage('Cámara no encontrada');
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
      setStatusMessage('Iniciando cámara...');

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
                setStatusMessage('✅ Cámara lista');
                
                // ✅ Conectar WebSocket automáticamente al activar la cámara
                connectWebSocket();
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
    
    // Detener envío de frames y desconectar WebSocket
    disconnectWebSocket();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log(`Deteniendo track: ${track.kind}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
      videoRef.current.pause();
    }
    
    setIsCameraActive(false);
    isStartingRef.current = false;
    setIsFaceDetected(false);
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

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return {
    videoRef,
    isCameraActive,
    isFaceDetected,
    error,
    statusMessage,
    wsStatus,
    lastMessage,
    startCamera,
    stopCamera,
    capturePhoto,
    setStatusMessage,
  };
};