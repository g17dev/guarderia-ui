import { Fingerprint, LoaderCircle, ShieldCheck, ShieldX, ScanLine, RotateCcw, ArrowLeft } from "lucide-react";
import type { Authorization } from "./reception";

interface AuthorizePickupStepProps {
  relationship?: string;
  candidateCount: number;
  childCount: number;
  simulation?: boolean;
  verifying: boolean;
  denied?: boolean;
  authorization?: Authorization;
  onVerify: () => void;
  onChangeSelection: () => void;
}

export function AuthorizePickupStep({ relationship, candidateCount, childCount, simulation, verifying, denied, authorization, onVerify, onChangeSelection }: AuthorizePickupStepProps) {
  if (authorization) {
    const adult = authorization.adult;
    const initials = adult.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("");
    return (
      <div className="reception-identified-adult" role="status">
        <span className="reception-adult-avatar" aria-hidden="true">{adult.photoUrl ? <img src={adult.photoUrl} alt="" /> : initials}</span>
        <div className="reception-adult-details"><span className="reception-note">Adulto identificado{simulation ? " · prueba" : ""}</span>
          <h3>{adult.name}</h3><p>{relationship || "Responsable autorizado"}</p>
          <span className="reception-permission"><ShieldCheck size={17} aria-hidden="true" />Autorizado para {childCount} {childCount === 1 ? "niño" : "niños"}</span>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="reception-verification reception-verification-denied">
        <div className="reception-verification-heading" role="alert">
          <div className="reception-symbol reception-denied-symbol" aria-hidden="true"><ShieldX /></div>
          <div><h2>Huella no reconocida</h2>
            <p>Sin autorización para los niños seleccionados.</p>
          </div>
        </div>
        <div className="reception-recovery-actions">
          <button className="reception-button primary full" onClick={onVerify}><RotateCcw size={18} aria-hidden="true" />Intentar de nuevo</button>
          <button className="reception-button quiet reception-change-selection" onClick={onChangeSelection}><ArrowLeft size={16} aria-hidden="true" />Cambiar selección</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reception-verification" data-scanning={verifying}>
      <div className="reception-verification-heading">
        <div className="reception-symbol reception-reader-symbol" aria-hidden="true"><Fingerprint /></div>
        <div><h2>{verifying ? "Identificando al adulto…" : "Identificar al adulto"}</h2>
          <p>{verifying ? "Mantén el dedo sobre el lector" : "Coloca el dedo en el lector"}</p>
          <span className="reception-reader-state" role="status">{verifying
            ? <><LoaderCircle size={14} className="reception-spin" aria-hidden="true" />Comprobando identidad y permisos</>
            : <><span className="reception-ready-dot" />{candidateCount} {candidateCount === 1 ? "adulto con permiso" : "adultos con permiso"} para el grupo</>}
          </span>
        </div>
      </div>
      <button className="reception-button primary full" disabled={verifying} onClick={onVerify}>
        {verifying ? <LoaderCircle size={18} className="reception-spin" aria-hidden="true" /> : <ScanLine size={18} aria-hidden="true" />}
        {verifying ? "Leyendo huella…" : simulation ? "Simular huella" : "Leer huella"}
      </button>
    </div>
  );
}
