import { useRef, useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Check, Clock3, FileText, Moon, NotebookPen, Plus, Sprout, UserRound, X } from "lucide-react";
import { noteCategoryLabels, previewProfileNotes, type NoteCategory, type ProfileNote } from "./profileNotes";
import "./ProfileTabs.css";
import "./NotesTab.css";

const categoryIcons = { general: FileText, routine: Moon, development: Sprout };
const categories: NoteCategory[] = ["general", "routine", "development"];

export function NotesTab({ childId, childName, notes, onAddNote }: {
  childId: string;
  childName: string;
  notes: ProfileNote[];
  onAddNote: (note: ProfileNote) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<NoteCategory>("general");
  const [notice, setNotice] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const allNotes = [...previewProfileNotes, ...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || text.length > 1500) return;
    onAddNote({ id: crypto.randomUUID(), category, text, createdAt: new Date().toISOString(), author: "Ana Torres", role: "Maestra · Demo" });
    setDraft(""); setCategory("general"); setOpen(false);
    setNotice("Nota agregada en esta vista.");
    list.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  return <div className="tab-content profile-notes" data-child-id={childId}>
    <header className="profile-notes-heading"><div><h3>Notas del niño <span className="profile-notes-demo">Demo</span></h3><p>Observaciones del día a día para acompañar su cuidado.</p></div><button ref={trigger} type="button" className="profile-note-create" onClick={() => { setNotice(""); setOpen(true); }}><Plus size={17} aria-hidden="true" />Nueva nota</button></header>
    <div className="profile-notes-subheading"><span><NotebookPen size={15} aria-hidden="true" />{allNotes.length} {allNotes.length === 1 ? "nota" : "notas"}</span><span role="status" className={notice ? "profile-note-saved" : ""}>{notice ? <><Check size={14} aria-hidden="true" />{notice}</> : "Más recientes primero"}</span></div>
    <div ref={list} className="profile-notes-list" aria-label={`Notas de ${childName}`}>
      {allNotes.map((note, index) => {
        const Icon = categoryIcons[note.category];
        return <article key={note.id} className={`profile-note profile-note-${note.category}`} style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}>
          <div className="profile-note-topline"><span className="profile-note-category"><Icon size={14} aria-hidden="true" />{noteCategoryLabels[note.category]}</span><time dateTime={note.createdAt}><CalendarDays size={13} aria-hidden="true" />{format(parseISO(note.createdAt), "d MMM yyyy", { locale: es })}<span className="profile-note-time"><Clock3 size={12} aria-hidden="true" />{format(parseISO(note.createdAt), "h:mm a", { locale: es })}</span></time></div>
          <p className="profile-note-text">{note.text}</p>
          <footer className="profile-note-author"><span className="profile-note-avatar" aria-hidden="true"><UserRound size={15} /></span><span><strong>{note.author}</strong><span>{note.role}</span></span></footer>
        </article>;
      })}
    </div>
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className="profile-note-overlay" /><Dialog.Content className="profile-note-dialog" onOpenAutoFocus={event => { event.preventDefault(); textarea.current?.focus({ preventScroll: true }); }} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus({ preventScroll: true }); }}>
      <header className="profile-note-dialog-heading"><span className="profile-note-dialog-icon"><NotebookPen size={22} aria-hidden="true" /></span><div><Dialog.Title>Nueva nota</Dialog.Title><Dialog.Description>{childName}</Dialog.Description></div><Dialog.Close className="profile-note-close" aria-label="Cerrar nueva nota"><X size={20} aria-hidden="true" /></Dialog.Close></header>
      <form onSubmit={save} className="profile-note-form"><div className="profile-note-form-body"><fieldset className="profile-note-categories"><legend>Tipo de nota</legend>{categories.map(value => { const Icon = categoryIcons[value]; return <button key={value} type="button" aria-pressed={category === value} className={value} onClick={() => setCategory(value)}><Icon size={15} aria-hidden="true" />{noteCategoryLabels[value]}</button>; })}</fieldset><label htmlFor="profile-note-text">¿Qué quieres compartir con el equipo?</label><textarea ref={textarea} id="profile-note-text" rows={5} maxLength={1500} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Escribe una observación útil sobre sus hábitos, preferencias o avances…" /><div className="profile-note-field-hint"><span>Registrada por Ana Torres · Demo</span><span>{draft.length}/1500</span></div></div><footer className="profile-note-form-footer"><p>Las notas se conservan en esta vista de demostración.</p><div><Dialog.Close className="profile-note-cancel" type="button">Cancelar</Dialog.Close><button className="profile-note-save" type="submit" disabled={!draft.trim()}><Check size={16} aria-hidden="true" />Guardar nota</button></div></footer></form>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
