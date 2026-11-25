import { CircleCheck } from "lucide-react";
import type { MovementReceipt, ReceptionChild } from "./reception";
import { Link } from "react-router-dom";
import { generateSlug } from "../../utils/child";

interface ConfirmPickupStepProps {
  receipt: MovementReceipt;
  selectedChildren: ReceptionChild[];
  adultName: string;
  simulation?: boolean;
  reentry?: boolean;
}

export function ConfirmPickupStep({ receipt, selectedChildren, adultName, simulation, reentry }: ConfirmPickupStepProps) {
  const movement = receipt.action === "entry" ? reentry ? "Reingreso" : "Entrada" : "Recogida";
  const ending = reentry && receipt.action === "entry" ? simulation ? "simulado" : "registrado" : simulation ? "simulada" : "registrada";
  return (
    <div className="reception-confirmation" role="status">
      <div className="reception-symbol success"><CircleCheck aria-hidden="true" /></div>
      <h2>{movement} {ending}</h2>
      <p className="reception-confirmation-names" title={selectedChildren.map(child => `${child.name} ${child.lastName}`).join(", ")}>{selectedChildren.map(child => `${child.name} ${child.lastName}`).join(", ")}</p>
      <p className="reception-note">Con {adultName} · {new Date(receipt.savedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>
      {simulation && <p className="reception-note">Registro de prueba, solo en esta sesión.</p>}
      <div className="reception-confirmation-links">{selectedChildren.map(child => <Link key={child.id} to={`/children/${generateSlug(child.name, child.lastName)}`} state={{ id: child.id, name: `${child.name} ${child.lastName}` }}>Ver asistencia de {child.name} {child.lastName}</Link>)}</div>
    </div>
  );
}
