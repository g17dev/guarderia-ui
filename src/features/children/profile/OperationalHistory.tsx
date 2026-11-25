import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { CheckBelonging, EntryBelongings } from "../../child-handover/BelongingsEditor";
import { outcomeLabels, outstandingBelongings, type BelongingCheck, type EntryBelonging } from "../../child-handover/belongings";
import { operationalSimulation, useOperationalSimulation } from "../../child-handover/operationalSimulation";
import { localDateKey } from "./specialCare";

export function OperationalHistory({ childId, date }: { childId: string; date: string }) {
  const state = useOperationalSimulation();
  const movements = state.movements.filter(movement => movement.receipt.childIds.includes(childId) && localDateKey(new Date(movement.receipt.savedAt)) === date);
  const resolutions = state.events.filter(event => !event.movementId && state.belongings.some(item => item.id === event.itemId && item.childId === childId) && localDateKey(new Date(event.at)) === date);
  if (!movements.length && !resolutions.length) return null;
  return <div className="operational-history"><h4>Registros confirmados de esta sesión · Simulación</h4>{movements.map(movement => {
    const { receipt, details } = movement;
    const Icon = receipt.action === "entry" ? LogIn : LogOut;
    const entry = details.entries[childId];
    const checks = details.checks.filter(check => movement.itemSnapshots.some(item => item.id === check.itemId && item.childId === childId));
    return <article key={receipt.id}><header><Icon size={17} aria-hidden="true" /><strong>{receipt.action === "entry" ? "Entrada" : "Salida"} confirmada</strong><time dateTime={receipt.savedAt}>{new Date(receipt.savedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</time></header><p>{receipt.action === "entry" ? "Entregó" : "Recogió"}: {movement.adultName}</p>
      {(details.commonComment || details.childComments[childId]) && <div><p><strong>Comentarios del movimiento</strong></p>{details.commonComment && <blockquote>Común al movimiento: {details.commonComment}</blockquote>}{details.childComments[childId] && <blockquote>De este menor: {details.childComments[childId]}</blockquote>}</div>}
      <details><summary>Consultar pertenencias y comprobación</summary>{receipt.action === "entry" && <p>{entry?.registration === "none" ? "Sin pertenencias declaradas." : entry?.items.length ? "Pertenencias registradas en esta entrada:" : "Sin registro de pertenencias. No se declaró si traía artículos."}</p>}<ul>{entry?.items.map((item, index) => <li key={index}>{item.label} × {item.quantity}{item.details ? ` · ${item.details}` : ""} · {item.returnable ? "Retornable" : "Consumible"}</li>)}{checks.map(check => <li key={check.itemId}>{movement.itemSnapshots.find(item => item.id === check.itemId)?.label} × {check.quantity} · {outcomeLabels[check.outcome]}{check.comment ? ` · Observación de pertenencia: ${check.comment}` : ""}</li>)}</ul>{receipt.action === "pickup" && !checks.length && <p>No había pertenencias pendientes que comprobar.</p>}</details>
    </article>;
  })}{resolutions.length > 0 && <details><summary>Seguimiento de pertenencias · {resolutions.length} eventos</summary><ul>{resolutions.map(event => <li key={event.id}>{state.belongings.find(item => item.id === event.itemId)?.label} × {event.quantity} · {outcomeLabels[event.outcome]} · {new Date(event.at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}{event.comment ? ` · ${event.comment}` : ""}</li>)}</ul></details>}</div>;
}

export function BelongingsFollowUp({ childId }: { childId: string }) {
  const state = useOperationalSimulation();
  const [drafts, setDrafts] = useState<Record<string, BelongingCheck>>({});
  const [additions, setAdditions] = useState<EntryBelonging[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const pending = outstandingBelongings(state.belongings, state.events, childId);
  const child = state.children.find(item => item.id === childId);
  return <section className="belongings-followup" aria-label="Seguimiento de pertenencias"><details><summary>Pertenencias pendientes · {pending.length}</summary><p className="belonging-hint">Incluye artículos que permanecen en guardería, sin comprobar y de jornadas anteriores. Resolverlos agrega un evento nuevo.</p>{pending.length ? pending.map(item => <div key={item.id}><CheckBelonging item={item} check={drafts[item.id]} onChange={check => setDrafts(previous => ({ ...previous, [item.id]: check }))} />{drafts[item.id] && <Button variant="outline" size="operational" onClick={() => {
      try { operationalSimulation.resolve(childId, drafts[item.id]); setDrafts(previous => { const next = { ...previous }; delete next[item.id]; return next; }); setError(""); setNotice("Resultado registrado. El historial original se conserva."); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo resolver la pertenencia."); }
    }}>Registrar resultado de {item.label}</Button>}</div>) : <p className="belonging-hint">No hay pertenencias pendientes.</p>}</details>
    {child?.attendanceStatus === "inside" && <details><summary>Agregar pertenencias durante la estancia</summary><EntryBelongings childId={childId} history={state.belongings} items={additions} onChange={setAdditions} /><Button size="operational" disabled={!additions.length} onClick={() => {
      try { operationalSimulation.addDuringStay(childId, additions); setAdditions([]); setError(""); setNotice("Pertenencias agregadas a la estancia actual."); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo agregar la pertenencia."); }
    }}>Guardar pertenencias de la estancia</Button></details>}
    <p role="status" className="operational-feedback">{notice}</p>{error && <p role="alert" className="reception-warning">{error}</p>}
  </section>;
}
