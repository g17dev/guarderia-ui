import { ArrowUpRight, CalendarDays, CheckCircle2, MessageSquare, Package, UserRound } from "lucide-react";
import type { MovementReceipt, ReceptionChild } from "./reception";
import type { OperationsState, StoredMovement } from "./operations";
import { Link } from "react-router-dom";
import { generateSlug } from "../../utils/child";
import { ChildAvatar } from "../children/components/ChildAvatar";
import { outcomeLabels } from "./belongings";
import { getReceiptBelongings } from "./receiptBelongings";
import { FamilyNotice, type FamilyNoticeStatus } from "./components/FamilyNotice";
import "./MovementReceipt.css";

interface ConfirmPickupStepProps {
  receipt: MovementReceipt;
  selectedChildren: ReceptionChild[];
  adultName: string;
  relationship?: string;
  simulation?: boolean;
  reentry?: boolean;
  notificationStatus?: FamilyNoticeStatus;
  confirmedMovement?: StoredMovement;
  state?: OperationsState;
}

export function ConfirmPickupStep({ receipt, selectedChildren, adultName, relationship, simulation, reentry, notificationStatus, confirmedMovement, state }: ConfirmPickupStepProps) {
  const movement = receipt.action === "entry" ? reentry ? "Reingreso" : "Entrada" : "Salida";
  const ending = movement === "Reingreso" ? "registrado" : "registrada";
  const savedAt = new Date(receipt.savedAt);
  const confirmed = confirmedMovement?.receipt.id === receipt.id ? confirmedMovement : undefined;
  const children = selectedChildren.filter(child => receipt.childIds.includes(child.id));
  const summaries = children.map(child => ({ child,
    items: confirmed && state ? getReceiptBelongings(confirmed, state, child.id) : [],
  }));
  const articleCount = summaries.reduce((total, { items }) => total + new Set(items.map(item => item.articleId)).size, 0);
  const hasCommonComment = !!confirmed?.details.commonComment.trim();

  return <div className="reception-success">
    <header className="reception-success-heading" role="status">
      <div className="reception-success-symbol"><CheckCircle2 size={34} aria-hidden="true" /></div>
      <div>
        <div className="reception-success-title"><h2>{movement} {ending}</h2>{simulation && <span>Simulación</span>}</div>
        <p>{simulation ? "Registro de prueba completado, disponible solo durante esta sesión." : "El movimiento se completó correctamente."}</p>
      </div>
    </header>

    <section className="reception-success-receipt" aria-label="Comprobante del movimiento">
      <dl className="reception-success-metadata">
        <div><dt><UserRound size={15} aria-hidden="true" />Adulto identificado</dt><dd>{confirmed?.adultName || adultName}</dd>{relationship && <dd className="reception-success-secondary">{relationship}</dd>}</div>
        <div><dt><CalendarDays size={15} aria-hidden="true" />Fecha y hora</dt><dd><time dateTime={receipt.savedAt}>{savedAt.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })} · {savedAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</time></dd><dd className="reception-success-secondary">{movement}</dd></div>
      </dl>
      {confirmed && <p className="reception-success-article-count"><Package size={16} aria-hidden="true" />{articleCount > 0 ? `${articleCount} ${articleCount === 1 ? "artículo en el movimiento" : "artículos en el movimiento"}` : "Sin artículos en el movimiento"}</p>}
      <div className="reception-success-children">{summaries.map(({ child, items }) => <section className="reception-success-child" key={child.id} aria-label={`Movimiento de ${child.name} ${child.lastName}`}>
        <div className="reception-success-child-heading"><ChildAvatar child={child} size="sm" /><div><h3>{child.name} {child.lastName}</h3>{child.classroom && <p>{child.classroom}</p>}</div></div>
        {confirmed && <>
          {items.length > 0 ? <ul className="reception-success-items">{items.map(item => <li key={item.id}>
            <span>{item.label}{item.details && ` · ${item.details}`} <span className="reception-success-quantity">× {item.quantity}</span></span>
            <span className="reception-success-outcome" data-outcome={item.outcome ?? "received"}>{item.outcome ? outcomeLabels[item.outcome] : "Recibido"}</span>
          </li>)}</ul> : <p className="reception-success-empty">{receipt.action === "entry"
            ? confirmed.details.entries[child.id]?.registration === "none" ? "No trae pertenencias" : "Sin registro de pertenencias"
            : state?.stays[child.id]?.registration === "none" ? "Sin pertenencias declaradas en esta estancia" : state?.stays[child.id]?.registration === "recorded" ? "Sin pertenencias pendientes de esta estancia" : "Sin registro de pertenencias en esta estancia"}</p>}
          {confirmed.details.childComments[child.id]?.trim() && <p className="reception-success-comment"><MessageSquare size={14} aria-hidden="true" />Comentario registrado</p>}
        </>}
        <Link className="reception-success-history" to={`/children/${generateSlug(child.name, child.lastName)}`} state={{ id: child.id, name: `${child.name} ${child.lastName}` }}>Ver asistencia de {child.name}<ArrowUpRight size={15} aria-hidden="true" /></Link>
      </section>)}</div>
      {hasCommonComment && <p className="reception-success-comment reception-success-common"><MessageSquare size={14} aria-hidden="true" />Comentario común registrado</p>}
    </section>

    <FamilyNotice status={simulation ? "simulated" : notificationStatus ?? "disabled"} />
  </div>;
}
