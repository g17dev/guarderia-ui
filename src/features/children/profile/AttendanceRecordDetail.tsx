import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { BusFront, CalendarDays, ChevronsUpDown, LogIn, LogOut, MapPin, School, UserRound, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getAttendanceEvents, type AttendanceEvent, type AttendanceRecord } from "./attendanceRecords";
import { AttendanceMiniMap } from "./AttendanceMiniMap";
import { useCardMorph } from "./useCardMorph";
import "./AttendanceRecordDetail.css";

const icons = { entry: LogIn, exit: LogOut, school: School, transport: BusFront };
function timeLabel(date: string, time: string) {
  return format(parseISO(`${date}T${time}`), "h:mm a", { locale: es });
}
export function AttendanceRecordDetail({ record, initialEvent, childName, source, open, onClose, onRestoreFocus }: {
  record: AttendanceRecord;
  initialEvent: AttendanceEvent["id"] | "journey";
  childName: string;
  source: HTMLButtonElement;
  open: boolean;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  const events = getAttendanceEvents(record);
  const [activeId, setActiveId] = useState(initialEvent === "journey" ? "school-delivery" : initialEvent);
  const body = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const { sheet, overlay, bridge, startMorph, requestClose } = useCardMorph({ source, open, onClose, anchor: hero });
  const focusMovement = useRef(false);
  const active = events.find(event => event.id === activeId) ?? events[0];

  useEffect(() => {
    if (!focusMovement.current) return;
    focusMovement.current = false;
    hero.current?.focus({ preventScroll: true });
    body.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [activeId]);

  if (!active) return null;
  const Icon = icons[active.kind];
  const schoolEvent = active.kind === "school" || active.kind === "transport";

  return <Dialog.Root open={open} onOpenChange={next => { if (!next) requestClose(); }}><Dialog.Portal>
    <Dialog.Overlay ref={overlay} className="attendance-detail-overlay" />
    <div ref={bridge} className="attendance-record-bridge" aria-hidden="true" inert />
    <Dialog.Content ref={sheet} className="attendance-detail-sheet" onOpenAutoFocus={event => { event.preventDefault(); startMorph(); sheet.current?.querySelector<HTMLButtonElement>(".attendance-detail-close")?.focus({ preventScroll: true }); }} onCloseAutoFocus={event => { event.preventDefault(); onRestoreFocus(); }}>
      <header className="attendance-detail-header"><div><div className="attendance-detail-eyebrow">RECORRIDO DEL DÍA <span>Datos ficticios</span></div><Dialog.Title>{active.label}</Dialog.Title><Dialog.Description>{childName}<span>{format(parseISO(record.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</span></Dialog.Description></div><button type="button" className="attendance-detail-close" aria-label="Cerrar detalle del registro" onClick={requestClose}><X size={20} /></button></header>
      <div ref={body} className="attendance-detail-body">
        <section ref={hero} key={`hero-${active.id}`} tabIndex={-1} className="attendance-detail-hero" aria-label="Hora y lugar del movimiento"><span className={`attendance-detail-symbol ${active.kind}`}><Icon size={24} aria-hidden="true" /></span><div><span className="attendance-detail-time-label">Hora del movimiento</span><strong>{timeLabel(record.date, active.time)}</strong><p><MapPin size={14} aria-hidden="true" />{active.location}</p></div></section>
        <dl key={`facts-${active.id}`} className="attendance-detail-facts">
          {!schoolEvent && <div><dt><UserRound size={14} aria-hidden="true" />{active.kind === "entry" ? "Adulto que entrega" : "Adulto que recoge"}</dt><dd>{active.adult || "Sin dato en este ejemplo"}</dd></div>}
          <div><dt>{schoolEvent ? "Responsable de la guardería" : "Registrado por"}</dt><dd>{(schoolEvent ? active.responsibleName : active.recordedBy) || "Sin dato en este ejemplo"}</dd></div>
          {active.handoverPerson && <div><dt>{active.id === "school-delivery" ? "Recibe en la escuela" : "Entrega en la escuela"}</dt><dd>{active.handoverPerson}</dd></div>}
        </dl>
        <AttendanceMiniMap key={active.id} nursery={record.place} school={record.schoolJourney?.place} initialLocation={active.kind === "school" || active.id === "school-departure" ? "school" : "nursery"} />
        <section className="attendance-detail-journey" aria-labelledby="attendance-journey-title"><div className="attendance-detail-section-heading"><h3 id="attendance-journey-title"><CalendarDays size={16} aria-hidden="true" />De la llegada a la recogida</h3><span>{events.length} movimientos</span></div><p className="attendance-detail-hint">Todos los movimientos, en orden. Pulsa uno para ampliar su información.</p>
          <ol className="attendance-timeline">{events.map(event => {
            const EventIcon = icons[event.kind];
            return <li key={event.id}><button type="button" aria-pressed={event.id === active.id} onClick={() => { if (event.id === activeId) { hero.current?.focus({ preventScroll: true }); body.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } else { focusMovement.current = true; setActiveId(event.id); } }}><span className="attendance-timeline-icon"><EventIcon size={18} aria-hidden="true" /></span><span className="attendance-timeline-label"><span className="attendance-timeline-topline"><strong>{event.label}</strong><time dateTime={`${record.date}T${event.time}`}>{timeLabel(record.date, event.time)}</time></span><small>{event.location}</small>{event.adult && <span className="attendance-timeline-person">{event.kind === "entry" ? "Entregó" : "Recogió"}: {event.adult}</span>}{event.responsibleName && <span className="attendance-timeline-person">{event.responsibleName}</span>}{event.handoverPerson && <span className="attendance-timeline-person">{event.id === "school-delivery" ? "Recibió" : "Entregó"}: {event.handoverPerson}</span>}</span></button></li>;
          })}</ol>
        </section>
        {record.notes && <section className="attendance-detail-notes"><h3>Observaciones</h3><p>{record.notes}</p></section>}
      </div>
      <footer className="attendance-detail-footer"><ChevronsUpDown size={14} aria-hidden="true" /><span>Desplázate para consultar todo el recorrido</span></footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
