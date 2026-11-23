import { HeartPulse } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { careCategoryLabels, getCareState, getSpecialCareSummary, isMedicalCare, type CareInstruction, type SpecialCarePlan } from "./specialCare";
import "./SpecialCare.css";

const shortDate = (date: string) => format(parseISO(date), "d MMM yyyy", { locale: es });
function Instruction({ item }: { item: CareInstruction }) {
  const state = getCareState(item);
  return <article className="special-care-detail-item">
    <div className="special-care-detail-meta"><span>{careCategoryLabels[item.category]}</span>{item.priority === "priority" && <span className="special-care-priority">Prioritario</span>}{state !== "active" && <span className="special-care-state">{state === "upcoming" ? "Próximo" : "Finalizado"}</span>}</div>
    <h4>{item.instruction}</h4>
    <p className="special-care-when"><strong>Cuándo:</strong> {item.when}</p>
    <p className="special-care-provenance">{item.validity === "temporary" ? `Del ${shortDate(item.startDate)} al ${shortDate(item.endDate)}` : `Continuo · Desde ${shortDate(item.startDate)}`}</p>
    <p className="special-care-provenance">Indicación de {item.reportedBy} · Actualizada {shortDate(item.updatedAt)}</p>
    {isMedicalCare(item) && <p className={`special-care-medical-status ${item.authorizationStatus === "pending" ? "pending" : ""}`}>{item.authorizationStatus === "documented" ? `Referencia de autorización: ${item.authorizationReference}` : "Autorización pendiente de registrar"}</p>}
  </article>;
}

export function SpecialCareDetails({ plan }: { plan?: SpecialCarePlan; onEdit: () => void }) {
  const summary = getSpecialCareSummary(plan);
  const other = [...summary.upcoming, ...summary.expired];
  return <>
    <div className="special-care-detail-heading">
      <h3><HeartPulse size={18} aria-hidden="true" />Cuidados especiales</h3>
    </div>
    <p className={`special-care-review-note ${summary.reviewed ? "reviewed" : ""}`}>{plan?.review ? `Información revisada por ${plan.review.reviewedBy} · ${shortDate(plan.review.reviewedAt)}` : "Información pendiente de revisión"}</p>
    {summary.active.length ? <div className="special-care-detail-list">{summary.active.map(item => <Instruction key={item.id} item={item} />)}</div> : <div className="special-care-empty"><HeartPulse size={24} aria-hidden="true" /><div><strong>{other.length ? "Sin indicaciones vigentes hoy" : "Sin indicaciones registradas"}</strong><p>{other.length ? "Consulta las indicaciones próximas o finalizadas debajo." : summary.reviewed ? "La revisión quedó registrada sin indicaciones adicionales." : "Puedes registrar y revisar los cuidados desde «Editar cuidados»."}</p></div></div>}
    {other.length > 0 && <details className="special-care-history"><summary>Próximas y finalizadas · {other.length}</summary>{other.map(item => <Instruction key={item.id} item={item} />)}</details>}
  </>;
}
