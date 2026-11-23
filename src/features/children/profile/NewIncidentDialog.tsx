import { useRef, useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { format, isValid, parseISO } from "date-fns";
import { AlertTriangle, CalendarDays, Check, ClipboardList, MapPin, X } from "lucide-react";
import { demoIncidentAuthor, incidentSeverityLabels, type ChildIncident } from "./incidents";
import "./NewIncidentDialog.css";

export function NewIncidentDialog({ childName, open, onOpenChange, onCreated, onRestoreFocus }: {
  childName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (incident: ChildIncident) => void;
  onRestoreFocus: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<ChildIncident["severity"] | "">("");
  const [initialResponse, setInitialResponse] = useState("");
  const [error, setError] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const ready = !!(title.trim() && description.trim() && occurredAt && location.trim() && severity);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || !severity || submitting.current) return;
    const date = parseISO(occurredAt);
    if (!isValid(date) || date.getTime() > Date.now()) { setError("Selecciona la fecha y hora en que ocurrió. No puede ser una fecha futura."); return; }
    submitting.current = true;
    onCreated({ id: crypto.randomUUID(), title: title.trim(), description: description.trim(), occurredAt, location: location.trim(), severity, status: "reported", reportedBy: `${demoIncidentAuthor.author} · ${demoIncidentAuthor.role}`, initialResponse: initialResponse.trim(), comments: [] });
    onOpenChange(false);
  }
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="new-incident-overlay" /><Dialog.Content className="new-incident-dialog" onOpenAutoFocus={event => { event.preventDefault(); titleInput.current?.focus({ preventScroll: true }); }} onCloseAutoFocus={event => { event.preventDefault(); onRestoreFocus(); }}>
    <header className="new-incident-heading"><span className="new-incident-icon"><ClipboardList size={23} aria-hidden="true" /></span><div><Dialog.Title>Registrar incidente</Dialog.Title><Dialog.Description>{childName}</Dialog.Description></div><Dialog.Close className="new-incident-close" aria-label="Cerrar registro de incidente"><X size={20} aria-hidden="true" /></Dialog.Close></header>
    <form className="new-incident-form" onSubmit={submit}><div className="new-incident-fields"><p className="new-incident-hint">Documenta lo sucedido. Podrás agregar comentarios y seguimiento después.</p>
      <div className="new-incident-field"><label htmlFor="new-incident-title">¿Qué ocurrió?</label><input ref={titleInput} id="new-incident-title" required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ej. Caída durante el juego en el patio" /></div>
      <div className="new-incident-field"><label htmlFor="new-incident-description">Descripción</label><textarea id="new-incident-description" required rows={3} maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe lo que observaste y las circunstancias del incidente…" /></div>
      <div className="new-incident-field-row"><div className="new-incident-field"><label htmlFor="new-incident-date"><CalendarDays size={14} aria-hidden="true" />Fecha y hora</label><input type="datetime-local" id="new-incident-date" required max={format(new Date(), "yyyy-MM-dd'T'HH:mm")} value={occurredAt} onChange={event => { setOccurredAt(event.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "new-incident-date-error" : undefined} />{error && <p id="new-incident-date-error" className="new-incident-error" role="alert">{error}</p>}</div><div className="new-incident-field"><label htmlFor="new-incident-location"><MapPin size={14} aria-hidden="true" />Lugar</label><input id="new-incident-location" required maxLength={120} list="new-incident-places" value={location} onChange={event => setLocation(event.target.value)} placeholder="Ej. Patio de juegos" /><datalist id="new-incident-places"><option value="Patio de juegos" /><option value="Salón" /><option value="Comedor" /><option value="Área de descanso" /></datalist></div></div>
      <fieldset className="new-incident-severity"><legend><AlertTriangle size={14} aria-hidden="true" />Gravedad del incidente</legend><div>{(["low", "medium", "high"] as const).map(value => <label key={value} className={`new-incident-level ${value}`}><input type="radio" name="new-incident-severity" value={value} required checked={severity === value} onChange={() => setSeverity(value)} /><span>{incidentSeverityLabels[value]}</span><Check size={15} aria-hidden="true" /></label>)}</div></fieldset>
      <div className="new-incident-field"><label htmlFor="new-incident-response">Atención inicial <span>Opcional</span></label><textarea id="new-incident-response" rows={2} maxLength={2000} value={initialResponse} onChange={event => setInitialResponse(event.target.value)} placeholder="¿Qué hizo el personal después del incidente?" /></div>
      <p className="new-incident-provenance">Registra {demoIncidentAuthor.author} · Demo <span>Estado inicial: Reportado</span></p>
    </div><footer className="new-incident-footer"><p>Se conservará en esta vista de demostración.</p><div><Dialog.Close type="button" className="new-incident-cancel">Cancelar</Dialog.Close><button type="submit" className="new-incident-save" disabled={!ready}><Check size={16} aria-hidden="true" />Registrar incidente</button></div></footer></form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
