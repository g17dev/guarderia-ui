import { lazy, Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Check, ChevronRight, CornerDownRight, MessageSquare, Plus, UserRound } from "lucide-react";
import { IncidentBadges } from "./IncidentBadges";
import { previewIncidents, type ChildIncident, type IncidentComment } from "./incidents";
import "./ProfileTabs.css";
import "./IncidentsTab.css";

const IncidentDetail = lazy(() => import("./IncidentDetail").then(module => ({ default: module.IncidentDetail })));
const NewIncidentDialog = lazy(() => import("./NewIncidentDialog").then(module => ({ default: module.NewIncidentDialog })));

export function IncidentsTab({ childId, childName, comments, onAddComment, records, onAddIncident }: {
  childId: string;
  childName: string;
  comments: IncidentComment[];
  onAddComment: (comment: IncidentComment) => void;
  records: ChildIncident[];
  onAddIncident: (incident: ChildIncident) => void;
}) {
  const [detail, setDetail] = useState<{ id: string; source: HTMLButtonElement; request: number }>();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [createRequest, setCreateRequest] = useState(0);
  const [addedId, setAddedId] = useState<string>();
  const createTrigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const freshForm = useRef(false);
  const pendingFocus = useRef<string>(undefined);
  const previousPositions = useRef(new Map<string, number>());
  const previousScroll = useRef(0);
  const request = useRef(0);
  const incidents = useMemo(() => [...previewIncidents, ...records].map(incident => ({ ...incident, comments: [...incident.comments, ...comments.filter(comment => comment.incidentId === incident.id)] })).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)), [comments, records]);
  useLayoutEffect(() => {
    const container = list.current;
    const card = container?.querySelector<HTMLButtonElement>(`[data-incident-id="${addedId}"]`);
    if (!container || !card || !addedId) return;
    card.getAnimations().forEach(animation => animation.cancel());
    container.scrollTop += card.getBoundingClientRect().top - container.getBoundingClientRect().top - 4;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scrollDelta = container.scrollTop - previousScroll.current;
    const movements: Animation[] = [];
    container.querySelectorAll<HTMLButtonElement>("[data-incident-id]").forEach(element => {
      const before = previousPositions.current.get(element.dataset.incidentId ?? "");
      if (before === undefined || element === card) return;
      const delta = before - scrollDelta - element.getBoundingClientRect().top;
      if (Math.abs(delta) > .5) movements.push(element.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 480, easing: "cubic-bezier(.2,.75,.25,1)" }));
    });
    movements.push(card.animate([{ opacity: 0, transform: "translateY(12px) scale(.985)", backgroundColor: "var(--primary-soft)" }, { opacity: 1, transform: "translateY(0) scale(1)", backgroundColor: "var(--card)" }], { duration: 620, delay: 120, fill: "backwards", easing: "cubic-bezier(.2,.75,.25,1)" }));
    return () => movements.forEach(animation => animation.cancel());
  }, [addedId, records]);
  function register(incident: ChildIncident) {
    previousPositions.current = new Map(Array.from(list.current?.querySelectorAll<HTMLButtonElement>("[data-incident-id]") ?? []).map(card => [card.dataset.incidentId ?? "", card.getBoundingClientRect().top]));
    previousScroll.current = list.current?.scrollTop ?? 0;
    pendingFocus.current = incident.id;
    freshForm.current = true;
    onAddIncident(incident);
    setAddedId(incident.id);
  }
  const active = incidents.find(incident => incident.id === detail?.id);
  return <div className="tab-content incidents-tab" data-child-id={childId}>
    <div className="incidents-heading"><div><h3>Historial de incidentes <span className="incidents-demo">Demo</span></h3><p>Documentación y seguimiento del equipo · Más recientes primero</p></div><button ref={createTrigger} type="button" className="incident-create-trigger" onClick={() => { if (!createRequest || freshForm.current) { setCreateRequest(value => value + 1); freshForm.current = false; } setCreateOpen(true); }}><Plus size={17} aria-hidden="true" />Registrar incidente</button></div>
    <div className="incidents-summary"><span>{incidents.length} incidentes</span><span role="status">{addedId && <><Check size={14} aria-hidden="true" />Incidente agregado en esta vista.</>}</span></div>
    <div ref={list} className="incidents-list" aria-label="Incidentes del niño">
      {incidents.map((incident, index) => {
        const participants = [...new Set([incident.reportedBy.split(" · ")[0], ...incident.comments.map(comment => comment.author)])];
        return <button key={incident.id} data-incident-id={incident.id} type="button" className="incident-card" aria-haspopup="dialog" aria-label={`Ver incidente: ${incident.title}, ${format(parseISO(incident.occurredAt), "d 'de' MMMM 'de' yyyy", { locale: es })}`} style={{ animationDelay: `${incident.id === addedId ? 0 : Math.min(index, 5) * 55}ms` }} onClick={event => { setDetail({ id: incident.id, source: event.currentTarget, request: ++request.current }); setOpen(true); }}>
          <IncidentBadges incident={incident} />
          <span className="incident-card__content"><span className="incident-card__title">{incident.title}</span><span className="incident-card__description"><CornerDownRight size={17} aria-hidden="true" /><span>{incident.description}</span></span></span>
          <span className="incident-card__footer"><span className="incident-card__reporters" aria-label={`Participan ${participants.join(", ")}`}>{participants.slice(0, 3).map(name => <span key={name} className="incident-card__avatar" title={name}><UserRound size={13} aria-hidden="true" /></span>)}</span><span className="incident-card__meta"><span className="incident-card__comments" aria-label={`${incident.comments.length} comentarios`}><MessageSquare size={14} aria-hidden="true" />{incident.comments.length}</span><span className="incident-card__date"><CalendarDays size={14} aria-hidden="true" /><time dateTime={incident.occurredAt}>{format(parseISO(incident.occurredAt), "d 'de' MMM 'de' yyyy", { locale: es })}</time></span></span></span>
          <ChevronRight className="incident-card__chevron" size={16} aria-hidden="true" />
        </button>;
      })}
    </div>
    {createRequest > 0 && <Suspense fallback={null}><NewIncidentDialog key={createRequest} childName={childName} open={createOpen} onOpenChange={setCreateOpen} onCreated={register} onRestoreFocus={() => { const card = pendingFocus.current ? list.current?.querySelector<HTMLButtonElement>(`[data-incident-id="${pendingFocus.current}"]`) : undefined; (card ?? createTrigger.current)?.focus({ preventScroll: true }); pendingFocus.current = undefined; }} /></Suspense>}
    {detail && active && <Suspense fallback={null}><IncidentDetail key={detail.request} incident={active} childName={childName} source={detail.source} open={open} onClose={() => setOpen(false)} onRestoreFocus={() => { if (detail.source.isConnected) detail.source.focus({ preventScroll: true }); }} onAddComment={onAddComment} draft={drafts[active.id] ?? ""} onDraftChange={value => setDrafts(previous => ({ ...previous, [active.id]: value }))} /></Suspense>}
  </div>;
}
