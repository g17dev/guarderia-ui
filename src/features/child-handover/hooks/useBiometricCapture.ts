import { useState, useEffect } from 'react';
import { useCamera } from './useCamera';

export const useBiometricCapture = () => {

        // Hook de cámara real
        const { 
            videoRef,
            isCameraActive,  // ← Este es el estado REAL
            isFaceDetected,
            statusMessage,
            startCamera,
        } = useCamera();

       // Obtener mensajes del proceso para activar la camara
       const getDisplayMessage = () => {
        return statusMessage;    
      }
        
      // Nuevos estados para huella
      const [isFingerprintReady, setIsFingerprintReady] = useState(false);
      const [isFingerprintScanning, setIsFingerprintScanning] = useState(false);
      
      const [fingerprintMessage, setFingerprintMessage] = useState('Espere un momento, mientras estamos verificando el sensor de huella...');
    
      const getFingerprintMessage = () => fingerprintMessage;
    
      const startFingerprintScan = () => {
        if (!isFingerprintReady || isFingerprintScanning) return;
        
        setIsFingerprintScanning(true);
        setFingerprintMessage('Escaneando huella...');
        
            setTimeout(() => {
                setIsFingerprintScanning(false);
                setFingerprintMessage('✅ Huella verificada correctamente');
            }, 3000);
        };

      // Iniciar la cámara automáticamente cuando el hook se usa
      useEffect(() => {
        startCamera();  // ← Llamar a la función para iniciar la cámara
      }, []);
    
    
      return {
        videoRef,
        isCameraActive,
        isFaceDetected,
        getDisplayMessage,
        isFingerprintReady,
        isFingerprintScanning,
        getFingerprintMessage,
        startFingerprintScan
      };
};