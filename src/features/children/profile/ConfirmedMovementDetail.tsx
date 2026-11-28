import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { LogIn, LogOut, Package, UserRound, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../../../components/ui/button";
import { EntryBelongings } from "../../child-handover/BelongingsEditor";
import { outcomeLabels, type EntryBelonging } from "../../child-handover/belongings";
import type { OperationsState, StoredMovement } from "../../child-handover/operations";
import { operationalSimulation } from "../../child-handover/operationalSimulation";
import { getReceiptBelongings } from "../../child-handover/receiptBelongings";
import { useCardMorph } from "./useCardMorph";
import "./AttendanceRecordDetail.css";

export function ConfirmedMovementDetail({ movement, state, childId, source, open, onClose }: {
  movement: StoredMovement; state: OperationsState; childId: string; source: HTMLButtonElement; open: boolean; onClose: () => void;
}) {
  const hero = useRef<HTMLElement>(null);
  const { sheet, overlay, bridge, startMorph, requestClose } = useCardMorph({ source, open, onClose, anchor: hero });
  const [additions, setAdditions] = useState<EntryBelonging[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const { receipt, details } = movement;
  const child = state.children.find(candidate => candidate.id === childId);
  const entry = receipt.action === "entry";
  const Icon = entry ? LogIn : LogOut;
  const title = entry ? "Entrada a guardería" : "Salida de guardería";
  const items = getReceiptBelongings(movement, state, childId);
  const latest = state.movements.filter(candidate => candidate.receipt.childIds.includes(childId))
    .sort((a, b) => Date.parse(a.receipt.savedAt) - Date.parse(b.receipt.savedAt)).at(-1);
  const canAdd = entry && child?.attendanceStatus === "inside" && latest?.receipt.id === receipt.id;

  return <Dialog.Root open={open} onOpenChange={next => { if (!next) requestClose(); }}><Dialog.Portal>
    <Dialog.Overlay ref={overlay} className="attendance-detail-overlay" />
    <div ref={bridge} className="attendance-record-bridge" aria-hidden="true" inert />
    <Dialog.Content ref={sheet} className="attendance-detail-sheet" onOpenAutoFocus={event => { event.preventDefault(); startMorph(); sheet.current?.querySelector<HTMLButtonElement>(".attendance-detail-close")?.focus({ preventScroll: true }); }} onCloseAutoFocus={event => { event.preventDefault(); if (source.isConnected) source.focus(); }}>
      <header className="attendance-detail-header"><div><div className="attendance-detail-eyebrow">MOVIMIENTO CONFIRMADO <span>Simulación</span></div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{child ? `${child.name} ${child.lastName}` : "Menor del movimiento"}<span>{format(new Date(receipt.savedAt), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</span></Dialog.Description></div><button type="button" className="attendance-detail-close" aria-label="Cerrar detalle del registro" onClick={requestClose}><X size={20} /></button></header>
      <div className="attendance-detail-body">
        <section ref={hero} tabIndex={-1} className="attendance-detail-hero"><span className={`attendance-detail-symbol ${entry ? "entry" : "exit"}`}><Icon size={24} aria-hidden="true" /></span><div><span className="attendance-detail-time-label">Hora del movimiento</span><strong><time dateTime={receipt.savedAt}>{format(new Date(receipt.savedAt), "h:mm a", { locale: es })}</time></strong></div></section>
        <dl className="attendance-detail-facts"><div><dt><UserRound size={14} aria-hidden="true" />{entry ? "Adulto que entrega" : "Adulto que recoge"}</dt><dd>{movement.adultName}</dd></div></dl>
        <details className="attendance-movement-disclosure" open><summary><Package size={16} aria-hidden="true" />Pertenencias y comprobación</summary>
          {items.length ? <ul>{items.map(item => <li key={item.id}>{item.label}{item.details && ` · ${item.details}`} × {item.quantity} · {item.outcome ? outcomeLabels[item.outcome] : "Recibido"}{item.comment && <p>Observación: {item.comment}</p>}</li>)}</ul> : <p>{entry ? details.entries[childId]?.registration === "none" ? "No trae pertenencias" : "Sin registro de pertenencias en este movimiento" : "No había pertenencias pendientes que comprobar"}</p>}
        </details>
        {(details.commonComment.trim() || details.childComments[childId]?.trim()) && <section className="attendance-detail-notes"><h3>Comentarios del movimiento</h3>{details.commonComment.trim() && <p>Común al movimiento: {details.commonComment}</p>}{details.childComments[childId]?.trim() && <p>De este menor: {details.childComments[childId]}</p>}</section>}
        {canAdd && <details className="attendance-context-additions"><summary>Agregar pertenencias a esta estancia</summary><EntryBelongings childId={childId} history={state.belongings} items={additions} onChange={setAdditions} /><Button size="operational" disabled={!additions.length} onClick={() => {
          try { operationalSimulation.addDuringStay(childId, additions); setAdditions([]); setError(""); setNotice("Pertenencias agregadas a la estancia actual. El registro de entrada original se conserva."); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron agregar las pertenencias."); }
        }}>Guardar pertenencias de la estancia</Button></details>}
        {notice && <p className="operational-feedback" role="status">{notice}</p>}{error && <p className="reception-warning" role="alert">{error}</p>}
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
