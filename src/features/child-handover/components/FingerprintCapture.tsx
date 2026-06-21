// components/FingerprintCapture.tsx
import { useState, useEffect, useRef } from "react";
import { FingerprintPattern } from 'lucide-react';
import "./FingerprintCapture.css";

type FingerprintCaptureProps = {
  onVerificationSuccess: () => void;
  onVerificationError: (error: string) => void;
  isActive: boolean;
  isVerified?: boolean;
};

type FlowState = 'checking_sensor' | 'sensor_ready' | 'ready_to_verify' | 'scanning' | 'success';

export const FingerprintCapture = ({
  onVerificationSuccess,
  Based on the given diagnostic errors, it seems like `onVerificationError` is not being used or read anywhere in the component. If you want to handle an error state in this component, a good idea would be to use try/catch blocks for handling any potential runtime errors. Here's how we can modify the code:

  ```jsx
    const handleVerify = () => {
      if (flowState !== 'ready_to_verify') return;

      console.log("🔍 Iniciando escaneo...");
      setFlowState('scanning');

      try {
        setTimeout(() => {
          // Assuming successful verification pathway...
          console.log("✅ Verificación exitosa");
          setFlowState('success');
          setVerificationSuccess(true);
          onVerificationSuccess();
        }, 2000);
      } catch (error) {
        // Handle error here...
        if (typeof onVerificationError === 'function') {
          onVerificationError(String(error));
        } else {
          console.log("onVerificationError is not a function");
        }
      }
    };
  ```
  In this code, we have wrapped the timeout function inside a try/catch block to catch any runtime errors during verification. If an error occurs, it will be caught and passed to `onVerificationError` if it's a function. Otherwise, a console log statement is used to inform that `onVerificationError` is not a function.
  isActive,
  isVerified = false
}: FingerprintCaptureProps) => {
  const [flowState, setFlowState] = useState<FlowState>('checking_sensor');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Limpiar todos los timeouts
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  // Simular el flujo completo del sensor
  useEffect(() => {
    if (!isActive || isVerified) return;

    clearAllTimeouts();

    const timeout2 = setTimeout(() => {
        console.log("👆 Sensor listo - Presiona Verificar");
        setFlowState('ready_to_verify');
      }, 2000);

    timeoutsRef.current.push(timeout2);

    return () => {
      clearAllTimeouts();
    };
  }, [isActive, isVerified]);

  // Resetear cuando se reactiva
  useEffect(() => {
    if (isActive && !isVerified) {
      setFlowState('checking_sensor');
      setVerificationSuccess(false);
    }
  }, [isActive, isVerified]);

  const handleVerify = () => {
    if (flowState !== 'ready_to_verify') return;

    console.log("🔍 Iniciando escaneo...");
    setFlowState('scanning');

    const timeout = setTimeout(() => {
      console.log("✅ Verificación exitosa");
      setFlowState('success');
      setVerificationSuccess(true);
      onVerificationSuccess();
    }, 2000);

    timeoutsRef.current.push(timeout);
  };

  const getDisplayMessage = () => {
    if (isVerified || verificationSuccess) return "✅ Huella verificada correctamente";

    switch (flowState) {
      case 'checking_sensor':
        return "Verificando sensor de huella...";
      case 'ready_to_verify':
        return "✅ Sensor listo - Coloca tu dedo";
      case 'scanning':
        return "Escaneando huella...";
      case 'success':
        return "✅ Huella verificada correctamente";
    }
  };

  // Habilitar botón cuando está listo para verificar
  const isVerifyButtonEnabled = flowState === 'ready_to_verify';

  const getAnimationState = () => {
    if (isVerified || verificationSuccess) return 'verified';
    if (flowState === 'scanning') return 'verifying';
    if (flowState === 'ready_to_verify') return 'ready';
    return '';
  };

  const getIconColor = () => {
    if (isVerified || verificationSuccess) return "#10b981";
    if (flowState === 'scanning') return "#004B92";
    if (flowState === 'ready_to_verify') return "#004B92";
    return "#999";
  };

  // DEBUG: Mostrar estado actual en consola
  useEffect(() => {
    console.log("🔍 FlowState actual:", flowState);
  }, [flowState]);

  return (
    <div className="fingerprint-capture">
      <div className="fingerprint-container">
        <div className={`fingerprint-animation ${getAnimationState()}`}>
          <FingerprintPattern
            size={140}
            color={getIconColor()}
            strokeWidth={1.5}
            className={`fingerprint-icon ${flowState === 'scanning' ? 'pulse' : ''} ${flowState === 'ready_to_verify' ? 'glow' : ''}`}
          />

          {flowState === 'scanning' && <div className="fingerprint-scan-line" />}
          {flowState === 'scanning' && <div className="fingerprint-ripple" />}
        </div>

        {flowState === 'scanning' && (
          <div className="scanning-indicator">
            <div className="scanning-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="fingerprint-status-container">
        <p className={`fingerprint-status ${flowState === 'success' || verificationSuccess ? 'success' : ''}`}>
          {getDisplayMessage()}
        </p>
      </div>

      <div className="fingerprint-controls">
        <button
          onClick={handleVerify}
          disabled={!isVerifyButtonEnabled}
          className={`btnVerify ${isVerifyButtonEnabled ? 'active' : ''} ${(verificationSuccess || isVerified) ? 'verified' : ''}`}
        >
          {flowState === 'scanning' ? "Escaneando..." : ((verificationSuccess || isVerified) ? "Continuar →" : "Verificar huella")}
        </button>
      </div>
    </div>
  );
};
