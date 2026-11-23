import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { Camera, Check, Info, X } from "lucide-react";
import { format } from "date-fns";
import { ChildAvatar } from "../components/ChildAvatar";
import { HealthStep } from "../steps/HealthStep";
import { AuthorizedAdultsEditor } from "./AuthorizedAdultsEditor";
import { SpecialCareEditor } from "./SpecialCareEditor";
import { validateSpecialCarePlan, type SpecialCarePlan } from "./specialCare";
import { getProfileAuthorizedAdults, getProfileHealth, type ProfileChild, type ProfileEditSection } from "./childProfile";

export function EditChildProfile({ child, onSave, onClose, onRestoreFocus, initialSection = "personal" }: {
  child: ProfileChild; onSave: (child: ProfileChild) => void; onClose: () => void; onRestoreFocus: () => void; initialSection?: ProfileEditSection;
}) {
  const [draft, setDraft] = useState<ProfileChild>(() => structuredClone(child));
  const [health, setHealth] = useState(() => structuredClone(getProfileHealth(child)));
  const [carePlan, setCarePlan] = useState<SpecialCarePlan>(() => structuredClone(child.specialCare ?? { instructions: [] }));
  const [section, setSection] = useState<ProfileEditSection>(initialSection);
  const [adults, setAdults] = useState(() => getProfileAuthorizedAdults(child));
  const [originalAdultIds] = useState(() => new Set(getProfileAuthorizedAdults(child).map(adult => adult.id)));
  const [capturingFingerprint, setCapturingFingerprint] = useState(false);
  const [error, setError] = useState("");
  const [readingPhoto, setReadingPhoto] = useState(false);
  const reader = useRef<FileReader | null>(null);
  useEffect(() => () => { reader.current?.abort(); }, []);

  function changePhoto(file?: File) {
    if (!file) return;
    reader.current?.abort();
    setReadingPhoto(false);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Elige una foto JPG, PNG o WebP de hasta 5 MB.");
      return;
    }
    setError("");
    setReadingPhoto(true);
    const nextReader = new FileReader();
    reader.current = nextReader;
    nextReader.onload = () => {
      setDraft(previous => ({ ...previous, photoUrl: String(nextReader.result) }));
      setReadingPhoto(false);
    };
    nextReader.onerror = () => { setError("No se pudo abrir la foto. Elige otra imagen."); setReadingPhoto(false); };
    nextReader.readAsDataURL(file);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (readingPhoto || capturingFingerprint) return;
    const name = draft.name.trim();
    const lastName = draft.lastNamePaternal !== undefined
      ? [draft.lastNamePaternal.trim(), draft.lastNameMaternal?.trim()].filter(Boolean).join(" ") : draft.lastName.trim();
    if (!name || !lastName || !draft.birthDate || draft.birthDate > format(new Date(), "yyyy-MM-dd") || !draft.classroom.trim() || !draft.tutor.phone.trim()) {
      setSection("personal");
      setError("Revisa el nombre, los apellidos, la fecha de nacimiento, el grupo y el teléfono de contacto.");
      return;
    }
    const invalidAdult = adults.find(adult => !adult.name.trim() || !adult.relationship.trim() || (!originalAdultIds.has(adult.id) && !adult.phone.trim()));
    if (invalidAdult) {
      setSection("adults");
      setError(`Completa el nombre, la relación y el teléfono del nuevo adulto${invalidAdult.name.trim() ? `: ${invalidAdult.name.trim()}` : "."}`);
      return;
    }
    const careError = validateSpecialCarePlan(carePlan);
    if (careError) {
      setSection("health");
      setError(careError.message);
      return;
    }
    // Explicit presentation allowlist. Attendance, service and enrollment remain
    // outside this form. Fingerprint markers are never biometric evidence.
    onSave({ ...child, name, lastName, birthDate: draft.birthDate, classroom: draft.classroom.trim(),
      gender: draft.gender, photoUrl: draft.photoUrl,
      lastNamePaternal: draft.lastNamePaternal?.trim(), lastNameMaternal: draft.lastNameMaternal?.trim(),
      tutor: { ...child.tutor, phone: draft.tutor.phone.trim() },
      health, allergies: health.allergies.map(allergy => allergy.name),
      specialCare: { ...carePlan, instructions: carePlan.instructions.map(item => ({ ...item,
        instruction: item.instruction.trim(), when: item.when.trim(), reportedBy: item.reportedBy.trim(), authorizationReference: item.authorizationReference.trim(),
      })) },
      authorizedAdults: adults.map(adult => ({ ...adult, name: adult.name.trim(), relationship: adult.relationship.trim(), phone: adult.phone.trim() })),
    });
  }

  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="profile-editor-overlay" />
      <Dialog.Content className="profile-editor" onCloseAutoFocus={event => { event.preventDefault(); onRestoreFocus(); }}>
        <header className="profile-editor-header"><div><Dialog.Title>Editar perfil</Dialog.Title><Dialog.Description>Datos personales, cuidados y adultos autorizados.</Dialog.Description></div><Dialog.Close className="profile-editor-close" aria-label="Cerrar edición"><X size={20} /></Dialog.Close></header>
        <div className="profile-editor-sections" role="group" aria-label="Secciones de edición">
          <button type="button" disabled={capturingFingerprint} aria-pressed={section === "personal"} onClick={() => setSection("personal")}>Datos personales</button>
          <button type="button" disabled={capturingFingerprint} aria-pressed={section === "health"} onClick={() => setSection("health")}>Salud y cuidados</button>
          <button type="button" disabled={capturingFingerprint} aria-pressed={section === "adults"} onClick={() => setSection("adults")}>Adultos y huellas</button>
        </div>
        <form id="edit-child-profile" className="profile-editor-body" onSubmit={save}>
          {section === "personal" ? <>
            <div className="profile-editor-photo"><ChildAvatar child={draft} size="lg" /><div><label className="profile-photo-picker"><Camera size={16} aria-hidden="true" />Cambiar foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { changePhoto(event.target.files?.[0]); event.target.value = ""; }} /></label><p>JPG, PNG o WebP · Máximo 5 MB</p>{readingPhoto && <p role="status">Preparando foto…</p>}{draft.photoUrl && <button type="button" className="profile-photo-remove" onClick={() => { reader.current?.abort(); setReadingPhoto(false); setDraft(previous => ({ ...previous, photoUrl: "" })); }}>Quitar foto</button>}</div></div>
            <div className="profile-editor-grid">
              <label>Nombre<input value={draft.name} required autoComplete="off" onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
              {draft.lastNamePaternal !== undefined ? <>
                <label>Apellido paterno<input required value={draft.lastNamePaternal} onChange={event => setDraft({ ...draft, lastNamePaternal: event.target.value })} /></label>
                <label>Apellido materno<input value={draft.lastNameMaternal ?? ""} onChange={event => setDraft({ ...draft, lastNameMaternal: event.target.value })} /></label>
              </> : <label>Apellidos<input required value={draft.lastName} onChange={event => setDraft({ ...draft, lastName: event.target.value })} /></label>}
              <label>Fecha de nacimiento<input type="date" required max={format(new Date(), "yyyy-MM-dd")} value={draft.birthDate} onChange={event => setDraft({ ...draft, birthDate: event.target.value })} /></label>
              <label>Género<select value={draft.gender ?? ""} onChange={event => setDraft({ ...draft, gender: event.target.value as ProfileChild["gender"] })}><option value="">No registrado</option><option value="male">Niño</option><option value="female">Niña</option></select></label>
              <label>Grupo<input required list="profile-classrooms" value={draft.classroom} onChange={event => setDraft({ ...draft, classroom: event.target.value })} /><datalist id="profile-classrooms"><option>Maternal A</option><option>Maternal B</option><option>Preescolar 1</option><option>Primaria</option></datalist></label>
              <label>Teléfono de contacto<input type="tel" required value={draft.tutor.phone} onChange={event => setDraft({ ...draft, tutor: { ...draft.tutor, phone: event.target.value } })} /></label>
            </div>
            <p className="profile-editor-note"><Info size={18} aria-hidden="true" />La asistencia y el servicio se actualizan desde sus procesos correspondientes. Los permisos de recogida están en «Adultos y huellas».</p>
          </> : section === "health" ? <>
            <SpecialCareEditor plan={carePlan} onChange={next => { setCarePlan(next); setError(""); }} />
            <details className="profile-medical-details"><summary>Datos médicos, alergias y medicamentos</summary><HealthStep data={health} onChange={setHealth} errors={{}} /></details>
          </> : <AuthorizedAdultsEditor adults={adults} childName={child.name} onChange={next => { setAdults(next); setError(""); }} onCaptureChange={setCapturingFingerprint} />}
          {error && <p className="profile-editor-error" role="alert">{error}</p>}
        </form>
        <footer className="profile-editor-footer"><span>{capturingFingerprint ? "Completa o cancela la captura para guardar" : "Cambios de prueba en este perfil"}</span><Dialog.Close className="profile-editor-cancel">Cancelar</Dialog.Close><button type="submit" form="edit-child-profile" disabled={readingPhoto || capturingFingerprint} className="profile-editor-save"><Check size={16} aria-hidden="true" />Guardar cambios</button></footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
