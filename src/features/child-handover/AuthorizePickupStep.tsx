import { forwardRef } from "react";
import "./AuthorizePickupStep.css";
import { BiometricHandoverCapture } from "./components/BiometricHandoverCapture";


interface AuthorizePickupStepProps {
  data: {
    faceVerified: boolean;
    fingerprintVerified: boolean;
    authorizationCode?: string;
  };
  onChange: (data: any) => void;
  errors: { [key: string]: string };
  selectedChildren: Array<{ name: string; lastName: string }>;
}

export interface AuthorizePickupStepRef {
  stopCamera: () => void;
}

export const AuthorizePickupStep = forwardRef<AuthorizePickupStepRef, AuthorizePickupStepProps>(
  ({ selectedChildren }) => {

  return (
    <div className="authorize-container">
      <div className="authorize-layout">
        <div className="authorize-left">
          <div className="auth-header">
            <h2>Autorizar salida</h2>
            <p>
              Verifica tu identidad para autorizar la salida de{" "}
              <strong>
                {selectedChildren.length}{" "}
                {selectedChildren.length === 1 ? "niño" : "niños"}
              </strong>
            </p>
            <div className="children-list">
              {selectedChildren.map((child, i) => (
                <span key={i} className="child-chip">
                  {child.name} {child.lastName}
                </span>
              ))}
            </div>
          </div>
          <div className="panel">
              {/* Nuevo componente para validacion biometrica */}
              <BiometricHandoverCapture/>
          </div>
        </div>
      </div>
    </div>
  );
});