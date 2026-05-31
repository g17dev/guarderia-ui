import { useState, useEffect } from 'react';
import { useCamera } from './useCamera';

type SimulationStep = 'checking_camera' | 'requesting_permission' | 'starting_camera' | 'camera_ready' | 'detecting_face' | 'face_detected' | 'connecting_server' | 'ready';

export const useBiometricSimulation = () => {
  const [currentStep, setCurrentStep] = useState<SimulationStep>('checking_camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);

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

  // Simular flujo de huella después de que el servidor está conectado
  // Simular flujo completo de huella
  useEffect(() => {
    if (serverConnected) {
        
        // FLUJO 1: Verificando sensor (2 segundos)
        const timer1 = setTimeout(() => {
        
        // FLUJO 2: Sensor listo (1 segundo después)
        const timer2 = setTimeout(() => {
            setIsFingerprintReady(true);
            setFingerprintMessage('Sensor listo, por favor inicie el escaneo para confirmar su identidad.');
            
            // FLUJO 3: Esperando acción del usuario (sin timeout, espera clic)
            // El usuario debe hacer clic en el botón manualmente
            
        }, 3000);
        
        // Guardar timer2 para limpiarlo
        return () => clearTimeout(timer2);
        
        }, 3000);
        
        // Limpiar timer1 al desmontar
        return () => clearTimeout(timer1);
    }
}, [serverConnected]);


  // Función que retorna el mensaje según el paso actual
  const getDisplayMessage = () => {
    switch (currentStep) {
      case 'checking_camera':
        return 'Buscando cámara...';
      case 'connecting_server':
        return 'Conectando con el servidor...';
      case 'requesting_permission':
        return 'Solicitando permisos de cámara...';
      case 'starting_camera':
        return 'Iniciando cámara...';
      case 'camera_ready':
        return '✅ Cámara lista';
    }
  };

  // Simular el flujo completo
  useEffect(() => {
    const steps: SimulationStep[] = [
      'checking_camera',
      'connecting_server',
      'requesting_permission',
      'starting_camera',
      'camera_ready'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < steps.length) {
        setCurrentStep(steps[index]);

        // Actualizar estados adicionales
        if (steps[index] === 'camera_ready') {
          setServerConnected(true);
          setIsCameraActive(true);
        }
        index++;
      } else {
        clearInterval(interval);
      }
    }, 2000); // Cambia de estado cada 2 segundos

    return () => clearInterval(interval);
  }, []);

  return {
    isCameraActive,
    serverConnected,
    getDisplayMessage,
    isFingerprintReady,
    isFingerprintScanning,
    getFingerprintMessage,
    startFingerprintScan
  };
};