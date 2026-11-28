import { MessageSquare, Package, ShieldCheck } from "lucide-react";
import { ChildAvatar } from "../children/components/ChildAvatar";
import { CompactPersonName } from "./components/CompactPersonName";
import { BelongingIcon } from "./BelongingsEditor";
import { outcomeLabels, type MovementDetails } from "./belongings";
import { getReviewBelongings } from "./reviewBelongings";
import type { OperationsState } from "./operations";
import type { Authorization, Movement, ReceptionAdult, ReceptionChild } from "./reception";
import "./MovementReview.css";

interface MovementReviewProps {
  selected: ReceptionChild[];
  action: Movement;
  entryLabel: string;
  authorization: Authorization;
  adult?: ReceptionAdult;
  details: MovementDetails;
  state?: OperationsState;
  phase: "review" | "saving" | "save-error";
  simulation: boolean;
}

export function MovementReview({ selected, action, entryLabel, authorization, adult, details, state, phase, simulation }: MovementReviewProps) {
  const person = authorization.adult;
  const [firstName, ...lastNames] = person.name.trim().split(/\s+/);
  const relationships = [...new Set(adult?.permissions.filter(permission => selected.some(child => child.id === permission.childId)
    && permission.actions.includes(action)).map(permission => permission.relationship))];
  const movement = action === "entry" ? entryLabel.toLocaleLowerCase("es") : "salida";
  const title = phase === "saving" ? `Registrando ${movement}…`
    : phase === "save-error" ? "Registro pendiente de confirmación"
      : `Listo para registrar ${movement === "reingreso" ? "el" : "la"} ${movement}`;
  const childrenReview = selected.map(child => ({ child,
    items: state ? getReviewBelongings(child.id, action, details, state) : [],
  }));
  // Count article records, not units or the extra row for an unchecked balance.
  const articleCount = childrenReview.reduce((total, { items }) => total + new Set(items.map(item => item.articleId)).size, 0);
  const hasComments = !!details.commonComment.trim() || selected.some(child => details.childComments[child.id]?.trim());

  return <section className="movement-review" aria-label="Revisión para confirmar el movimiento">
    <span className="sr-only" role="status">{title}</span>
    <div className="movement-review-people" data-multiple={selected.length > 1}>
      <section className="movement-review-person-card movement-review-adult" aria-label="Adulto identificado y autorizado">
        <h3 className="movement-review-person-label">Adulto identificado{simulation && <span className="sr-only"> · simulación</span>}</h3>
        <div className="movement-review-person">
          <ChildAvatar child={{ name: firstName, lastName: lastNames.join(" "), photoUrl: person.photoUrl }} size="sm" />
          <div className="movement-review-person-details">
            <CompactPersonName name={firstName} lastName={lastNames.join(" ")} />
            <p className="movement-review-person-meta">{relationships.join(" / ") || "Responsable autorizado"}</p>
          </div>
        </div>
        <span className="movement-review-permission" aria-label="Autorización válida para este movimiento"><ShieldCheck size={15} aria-hidden="true" />Autorización válida</span>
      </section>
      <section className="movement-review-person-card movement-review-minors" aria-label={selected.length === 1 ? "Menor del movimiento" : "Menores del movimiento"}>
        <h3 className="movement-review-person-label">{selected.length === 1 ? "Menor" : "Menores"}</h3>
        <ul className="movement-review-minor-list">{selected.map(child => {
          const relationship = relationships.length > 1 ? [...new Set(adult?.permissions.filter(permission => permission.childId === child.id && permission.actions.includes(action)).map(permission => permission.relationship))].join(" / ") : "";
          return <li className="movement-review-person" key={child.id}>
            <ChildAvatar child={child} size="sm" />
            <div className="movement-review-person-details">
              <CompactPersonName name={child.name} lastName={child.lastName} />
              {child.classroom && <p className="movement-review-person-meta">{child.classroom}</p>}
              {relationship && <p className="movement-review-person-relationship">{relationship} del adulto identificado</p>}
            </div>
          </li>;
        })}</ul>
      </section>
    </div>
    {state && <section className="movement-review-belongings" aria-label="Pertenencias del movimiento">
      <h3 className="movement-review-section-heading"><Package size={17} aria-hidden="true" />Pertenencias{articleCount > 0 && <span>({articleCount} {articleCount === 1 ? "artículo" : "artículos"})</span>}</h3>
      {childrenReview.map(({ child, items }) => {
        const registration = details.entries[child.id]?.registration;
        const stay = state.stays[child.id];
        return <section className="movement-review-child" key={child.id} aria-label={`Pertenencias de ${child.name} ${child.lastName}`}>
          {selected.length > 1 && <h4>{child.name} {child.lastName}</h4>}
          {action === "entry" && !details.entries[child.id]?.items.length && <p className="movement-review-empty">{registration === "none" ? "No trae pertenencias" : "Sin registro de pertenencias"}</p>}
          {action === "pickup" && !items.length && <p className="movement-review-empty">{stay?.registration === "none" ? "No trae pertenencias en esta estancia" : stay?.registration === "recorded" ? "Sin pendientes: artículos entregados o utilizados previamente" : "Sin registro de pertenencias en esta estancia"}</p>}
          {items.length > 0 && <ul className="movement-review-items">{items.map(item => <li key={item.id}>
            <span className="movement-review-item-icon"><BelongingIcon kind={item.kind} category={item.category} /></span>
            <div className="movement-review-item-body">
              <div className="movement-review-item-line"><span><strong>{item.label}</strong>{item.details && ` · ${item.details}`} <span className="movement-review-quantity">× {item.quantity}</span></span>
                {item.outcome && <span className="movement-review-outcome" data-outcome={item.outcome}>{outcomeLabels[item.outcome]}</span>}
              </div>
              {item.previous && <small className="movement-review-previous">Pendiente de una visita anterior</small>}
              {item.comment && <p className="movement-review-item-comment"><span>Observación: </span>{item.comment}</p>}
            </div>
          </li>)}</ul>}
        </section>;
      })}
    </section>}
    {hasComments && <section className="movement-review-notes" aria-label="Notas del movimiento">
      <h3 className="movement-review-section-heading"><MessageSquare size={17} aria-hidden="true" />Notas</h3>
      {details.commonComment.trim() && <p className="movement-review-comment movement-review-common"><span className="movement-review-label">Comentario común · todos los menores</span>{details.commonComment}</p>}
      {selected.map(child => details.childComments[child.id]?.trim() && <p className="movement-review-comment" key={child.id}><span className="movement-review-label">{selected.length > 1 ? `${child.name} ${child.lastName}` : "Comentario"}</span>{details.childComments[child.id]}</p>)}
    </section>}
  </section>;
}
