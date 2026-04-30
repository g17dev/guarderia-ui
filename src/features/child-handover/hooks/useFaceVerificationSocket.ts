// hooks/useFaceVerificationSocket.ts
import { useState, useRef, useCallback } from 'react';

// ✅ Definir y exportar el tipo
export interface VerificationMessage {
  type: 'status' | 'face_detected' | 'verifying' | 'result' | 'error';
  message: string;
  confidence?: number;
  face_detected?: boolean;
  ready_for_verification?: boolean;
  authorized?: boolean;
  nombre?: string;
}

export const useFaceVerificationSocket = () => {
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<VerificationMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const connect = useCallback((onMessage: (msg: VerificationMessage) => void) => {
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
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as VerificationMessage;
        // console.log('📨 Mensaje recibido:', data);
        setLastMessage(data);
        onMessage(data);
      } catch (error) {
        console.error('Error al parsear mensaje:', error);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setWsStatus('disconnected');
    };
    
    wsRef.current.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      setWsStatus('disconnected');
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, []);

  const startSendingFrames = useCallback((
    videoRef: React.RefObject<HTMLVideoElement>,
    sendFrame: (frame: string) => void,
    fps: number = 10
  ) => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          const frameData = canvas.toDataURL('image/jpeg', 0.7);
          sendFrame(frameData);
        }
      }
    }, 1000 / fps);
    
    frameIntervalRef.current = interval;
  }, []);

  const stopSendingFrames = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }, []);

  const sendFrame = useCallback((frameData: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(frameData);
    }
  }, []);

  const disconnect = useCallback(() => {
    stopSendingFrames();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsStatus('disconnected');
  }, [stopSendingFrames]);

  return {
    wsStatus,
    lastMessage,
    connect,
    sendFrame,
    startSendingFrames,
    stopSendingFrames,
    disconnect
  };
};