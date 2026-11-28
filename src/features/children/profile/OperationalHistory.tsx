import { lazy, Suspense, useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { CheckBelonging } from "../../child-handover/BelongingsEditor";
import { outcomeLabels, type BelongingCheck } from "../../child-handover/belongings";
import { operationalSimulation, useOperationalSimulation } from "../../child-handover/operationalSimulation";
import { localDateKey } from "./specialCare";
import { getOverdueBelongings } from "./overdueBelongings";
import { AttendanceMovementCard } from "./AttendanceMovementCard";

const ConfirmedMovementDetail = lazy(() => import("./ConfirmedMovementDetail").then(module => ({ default: module.ConfirmedMovementDetail })));

export function OperationalHistory({ childId, date }: { childId: string; date: string }) {
  const state = useOperationalSimulation();
  const [detail, setDetail] = useState<{ id: string; source: HTMLButtonElement; request: number; open: boolean }>();
  const movements = state.movements.filter(movement => movement.receipt.childIds.includes(childId) && localDateKey(new Date(movement.receipt.savedAt)) === date)
    .sort((a, b) => Date.parse(a.receipt.savedAt) - Date.parse(b.receipt.savedAt));
  const resolutions = state.events.filter(event => !event.movementId && state.belongings.some(item => item.id === event.itemId && item.childId === childId) && localDateKey(new Date(event.at)) === date);
  const selectedMovement = detail ? state.movements.find(movement => movement.receipt.id === detail.id) : undefined;
  if (!movements.length && !resolutions.length) return null;
  return <div className="operational-history" aria-label="Registros confirmados de esta sesión de simulación">
    {movements.length > 0 && <ol className="attendance-movement-list attendance-day-timeline">{movements.map((movement, index) => <li key={movement.receipt.id}>
      <AttendanceMovementCard label={movement.receipt.action === "entry" ? "Entrada a guardería" : "Salida de guardería"}
        kind={movement.receipt.action === "entry" ? "entry" : "exit"} timestamp={new Date(movement.receipt.savedAt)}
        person={movement.adultName} personLabel={movement.receipt.action === "entry" ? "Entregó" : "Recogió"} delay={index * 55}
        onOpen={source => setDetail(previous => ({ id: movement.receipt.id, source, request: (previous?.request ?? 0) + 1, open: true }))} />
    </li>)}</ol>}
    {resolutions.length > 0 && <details className="attendance-movement-disclosure"><summary>Seguimiento de pertenencias · {resolutions.length} eventos</summary><ul>{resolutions.map(event => <li key={event.id}>{state.belongings.find(item => item.id === event.itemId)?.label} × {event.quantity} · {outcomeLabels[event.outcome]} · {new Date(event.at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}{event.comment ? ` · ${event.comment}` : ""}</li>)}</ul></details>}
    {detail && selectedMovement && <Suspense fallback={null}><ConfirmedMovementDetail key={detail.request} movement={selectedMovement} state={state} childId={childId} source={detail.source} open={detail.open} onClose={() => setDetail(previous => previous ? { ...previous, open: false } : previous)} /></Suspense>}
  </div>;
}

export function BelongingsFollowUp({ childId }: { childId: string }) {
  const state = useOperationalSimulation();
  const [now, setNow] = useState(() => Date.now());
  const [drafts, setDrafts] = useState<Record<string, BelongingCheck>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const overdue = getOverdueBelongings(state, childId, now);
  if (!overdue) return notice ? <p role="status" className="sr-only">{notice}</p> : null;
  const departureDate = new Date(overdue.movement.receipt.savedAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const unchecked = overdue.items.filter(item => item.lastOutcome === "unchecked");
  const pending = overdue.items.filter(item => item.lastOutcome !== "unchecked");
  return <section className="belongings-followup attendance-overdue" aria-label="Pertenencias pendientes de entregar">
    <div className="attendance-overdue-heading"><Package size={18} aria-hidden="true" /><h4>Pertenencias pendientes de entregar</h4></div>
    <p>Hay pertenencias con seguimiento pendiente desde la salida del {departureDate}.</p>
    {unchecked.length > 0 && <p className="attendance-overdue-items"><strong>Sin comprobar:</strong> {unchecked.map(item => `${item.label} × ${item.remaining}`).join(", ")}. No consta si se entregaron.</p>}
    {pending.length > 0 && <p className="attendance-overdue-items"><strong>Entrega pendiente:</strong> {pending.map(item => `${item.label} × ${item.remaining} (${outcomeLabels[item.lastOutcome]})`).join(", ")}.</p>}
    <details><summary>Revisar comprobación</summary><p className="belonging-hint">Resolver un pendiente agrega un evento nuevo y conserva el registro original. Datos de simulación.</p>{overdue.items.map(item => <div key={item.id}><CheckBelonging item={item} check={drafts[item.id]} onChange={check => setDrafts(previous => ({ ...previous, [item.id]: check }))} />{drafts[item.id] && <Button variant="outline" size="operational" onClick={() => {
      try { operationalSimulation.resolve(childId, drafts[item.id]); setDrafts(previous => { const next = { ...previous }; delete next[item.id]; return next; }); setError(""); setNotice("Resultado registrado. El historial original se conserva."); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo resolver la pertenencia."); }
    }}>Registrar resultado de {item.label}</Button>}</div>)}</details>
    {notice && <p role="status" className="operational-feedback">{notice}</p>}{error && <p role="alert" className="reception-warning">{error}</p>}
  </section>;
}
