import { BellRing } from "lucide-react";
import "./FamilyNotice.css";

export type FamilyNoticeStatus = "pending" | "sent" | "failed" | "disabled" | "simulated";

const messages: Record<FamilyNoticeStatus, string> = {
  pending: "Aviso pendiente de envío.",
  sent: "Aviso enviado correctamente.",
  failed: "No se pudo enviar el aviso. El registro de asistencia se completó correctamente.",
  disabled: "Los avisos de asistencia están deshabilitados.",
  simulated: "Aviso simulado. No se enviaron notificaciones reales.",
};

// Presentation only: the caller supplies a confirmed notification state.
// Attendance success never implies delivery or identifies notification recipients.
export function FamilyNotice({ status }: { status: FamilyNoticeStatus }) {
  return <aside className="family-notice" data-status={status} aria-label="Aviso a la familia">
    <BellRing size={20} aria-hidden="true" />
    <div>
      <h3>Aviso a la familia</h3>
      <p>{messages[status]}</p>
      {status === "simulated" && <p className="family-notice-context">En la versión operativa, se notificará a los responsables con permiso para recibir avisos de asistencia.</p>}
    </div>
  </aside>;
}
