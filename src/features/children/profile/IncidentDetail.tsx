import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ClipboardList, Clock3, MapPin, MessageSquare, Send, UserRound, X } from "lucide-react";
import { IncidentBadges } from "./IncidentBadges";
import { demoIncidentAuthor, type ChildIncident, type IncidentComment } from "./incidents";
import { useCardMorph } from "./useCardMorph";

export function IncidentDetail({ incident, childName, source, open, onClose, onRestoreFocus, onAddComment, draft, onDraftChange }: {
  incident: ChildIncident;
  childName: string;
  source: HTMLButtonElement;
  open: boolean;
  onClose: () => void;
  onRestoreFocus: () => void;
  onAddComment: (comment: IncidentComment) => void;
  draft: string;
  onDraftChange: (value: string) => void;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const previousCount = useRef(incident.comments.length);
  const [notice, setNotice] = useState("");
  const { sheet, overlay, bridge, startMorph, requestClose } = useCardMorph({ source, open, onClose, anchor });
  useEffect(() => {
    if (incident.comments.length > previousCount.current) body.current?.scrollTo({ top: body.current.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    previousCount.current = incident.comments.length;
  }, [incident.comments.length]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || text.length > 1500) return;
    onAddComment({ id: crypto.randomUUID(), incidentId: incident.id, ...demoIncidentAuthor, createdAt: new Date().toISOString(), text });
    onDraftChange("");
    setNotice("Comentario agregado en esta vista.");
  }
  return <Dialog.Root open={open} onOpenChange={next => { if (!next) requestClose(); }}><Dialog.Portal>
    <Dialog.Overlay ref={overlay} className="incident-detail-overlay" />
    <div ref={bridge} className="incident-record-bridge" aria-hidden="true" inert />
    <Dialog.Content ref={sheet} className="incident-detail-sheet" onOpenAutoFocus={event => { event.preventDefault(); startMorph(); sheet.current?.querySelector<HTMLButtonElement>(".incident-detail-close")?.focus({ preventScroll: true }); }} onCloseAutoFocus={event => { event.preventDefault(); onRestoreFocus(); }}>
      <header className="incident-detail-header"><div ref={anchor} className="incident-detail-summary"><div className="incident-detail-eyebrow">INCIDENTE <span>Datos ficticios</span></div><IncidentBadges incident={incident} /><Dialog.Title>{incident.title}</Dialog.Title><Dialog.Description>{childName}<span><CalendarDays size={13} aria-hidden="true" />{format(parseISO(incident.occurredAt), "d 'de' MMMM 'de' yyyy", { locale: es })}<span aria-hidden="true">·</span><Clock3 size={13} aria-hidden="true" />{format(parseISO(incident.occurredAt), "h:mm a", { locale: es })}</span></Dialog.Description></div><button type="button" className="incident-detail-close" aria-label="Cerrar detalle del incidente" onClick={requestClose}><X size={20} aria-hidden="true" /></button></header>
      <div ref={body} className="incident-detail-body">
        <dl className="incident-detail-facts"><div><dt><UserRound size={14} aria-hidden="true" />Registrado por</dt><dd>{incident.reportedBy}</dd></div><div><dt><MapPin size={14} aria-hidden="true" />Lugar del incidente</dt><dd>{incident.location}</dd></div></dl>
        <section className="incident-detail-section"><h3><ClipboardList size={17} aria-hidden="true" />Qué ocurrió</h3><p>{incident.description}</p></section>
        <section className="incident-detail-section incident-initial-response"><h3><ClipboardList size={17} aria-hidden="true" />Atención inicial</h3><p>{incident.initialResponse || "Sin atención inicial documentada."}</p></section>
        <section className="incident-follow-up" aria-labelledby="incident-follow-up-heading"><h3 id="incident-follow-up-heading"><MessageSquare size={17} aria-hidden="true" />Seguimiento del equipo <span>{incident.comments.length}</span></h3><p className="incident-follow-up-hint">Comentarios en orden, del primero al más reciente.</p>
          {incident.comments.length ? <ol className="incident-comment-list">{incident.comments.map(comment => <li key={comment.id} className="incident-comment"><span className="incident-comment-avatar" aria-hidden="true"><UserRound size={16} /></span><div><div className="incident-comment-byline"><strong>{comment.author}</strong><span>{comment.role}</span></div><time dateTime={comment.createdAt}>{format(parseISO(comment.createdAt), "d MMM yyyy · h:mm a", { locale: es })}</time><p>{comment.text}</p></div></li>)}</ol> : <div className="incident-follow-up-empty"><MessageSquare size={22} aria-hidden="true" /><p>Aún no hay comentarios.<span>Agrega la primera observación para iniciar el seguimiento.</span></p></div>}
        </section>
      </div>
      <form className="incident-comment-form" onSubmit={submit}><div className="incident-composer-heading"><label htmlFor="incident-follow-up-text">Agregar seguimiento</label><span>{demoIncidentAuthor.author} · Demo</span></div><textarea id="incident-follow-up-text" value={draft} onChange={event => { onDraftChange(event.target.value); setNotice(""); }} rows={2} maxLength={1500} placeholder="Documenta qué observaste, qué se hizo o cómo continuó el seguimiento…" /><div className="incident-composer-footer"><span role="status">{notice || "Los comentarios se conservan en esta vista de demostración."}</span><button type="submit" disabled={!draft.trim()}><Send size={15} aria-hidden="true" />Agregar comentario</button></div></form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
