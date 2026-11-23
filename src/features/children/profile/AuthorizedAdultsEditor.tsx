import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Fingerprint, Info, Plus, ShieldCheck, ShieldOff, Trash2, UsersRound, X } from "lucide-react";
import { ChildAvatar } from "../components/ChildAvatar";
import type { ProfileAuthorizedAdult } from "./childProfile";

const fingers = ["Índice derecho", "Índice izquierdo", "Pulgar derecho", "Pulgar izquierdo"];

export function AuthorizedAdultsEditor({ adults, childName, onChange, onCaptureChange }: {
  adults: ProfileAuthorizedAdult[];
  childName: string;
  onChange: (adults: ProfileAuthorizedAdult[]) => void;
  onCaptureChange: (active: boolean) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>();
  const [capture, setCapture] = useState<"ready" | "first" | "complete">();
  const [finger, setFinger] = useState(fingers[0]);
  const captureAction = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!capture) return;
    captureAction.current?.focus({ preventScroll: true });
    captureAction.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [capture]);
  const selected = adults.find(adult => adult.id === selectedId);
  const update = (patch: Partial<ProfileAuthorizedAdult>) => onChange(adults.map(adult => adult.id === selectedId ? { ...adult, ...patch } : adult));
  function finishCapture() {
    setCapture(undefined);
    onCaptureChange(false);
  }

  if (selected) return <div className="profile-adult-detail" data-capturing={Boolean(capture)}>
    {!capture && <button type="button" className="profile-adults-back" onClick={() => { finishCapture(); setSelectedId(undefined); }}><ArrowLeft size={16} aria-hidden="true" />Volver a los adultos</button>}
    <div className="profile-adult-detail-heading"><ChildAvatar child={{ name: selected.name.trim() || "Nuevo", lastName: "" }} size="md" /><div><h3>{selected.name.trim() || "Nuevo adulto"}</h3><p>{capture ? `Registro de huella · ${selected.relationship}` : `Datos y autorización para ${childName}`}</p></div>{capture && <span className="profile-preview-tag">Simulación</span>}</div>
    {!capture && <fieldset className="profile-adult-fields"><div className="profile-editor-grid">
      <label>Nombre completo del adulto<input value={selected.name} autoComplete="off" onChange={event => update({ name: event.target.value })} /></label>
      <label>Parentesco o relación<select value={selected.relationship} onChange={event => update({ relationship: event.target.value })}><option value="">Seleccionar relación</option>{["Madre", "Padre", "Abuela", "Abuelo", "Tía", "Tío", "Tutor legal", "Otro"].map(value => <option key={value}>{value}</option>)}{selected.relationship && !["Madre", "Padre", "Abuela", "Abuelo", "Tía", "Tío", "Tutor legal", "Otro"].includes(selected.relationship) && <option>{selected.relationship}</option>}</select></label>
      <label>Teléfono del adulto<input type="tel" value={selected.phone} onChange={event => update({ phone: event.target.value })} /></label>
    </div>
    <label className="profile-pickup-permission"><input type="checkbox" checked={selected.canPickup} onChange={event => update({ canPickup: event.target.checked })} /><span><strong>Autorizado para recoger a {childName}</strong><small>Este permiso corresponde únicamente a este niño.</small></span><ShieldCheck size={20} aria-hidden="true" /></label>
    </fieldset>}
    <section className="profile-fingerprint-section" aria-labelledby="profile-fingerprint-heading">
      {!capture && <div className="profile-fingerprint-heading"><div><h4 id="profile-fingerprint-heading">Huella del adulto</h4><p>La huella identifica a la persona; el permiso autoriza la recogida.</p></div><span className="profile-preview-tag">Simulación</span></div>}
      {capture ? <div className="profile-fingerprint-capture">
        <div className={`profile-enrollment-symbol ${capture === "complete" ? "complete" : ""}`}>{capture === "complete" ? <Check size={36} aria-hidden="true" /> : <Fingerprint size={44} aria-hidden="true" />}</div>
        <div role="status"><h4>{capture === "complete" ? "Lecturas de prueba completadas" : capture === "first" ? "Retira y vuelve a colocar el dedo" : "Coloca el dedo en el lector"}</h4><p>{capture === "complete" ? `${finger} · Listo para añadir al perfil` : capture === "first" ? "Segunda lectura para completar el registro de prueba." : "Realizaremos dos lecturas del mismo dedo."}</p></div>
        {capture === "ready" && <label className="profile-finger-select">Dedo a registrar<select value={finger} onChange={event => setFinger(event.target.value)}>{fingers.map(value => <option key={value}>{value}</option>)}</select></label>}
        <div className="profile-enrollment-steps" aria-label={capture === "ready" ? "0 de 2 lecturas" : capture === "first" ? "1 de 2 lecturas" : "2 de 2 lecturas"}><span className={capture !== "ready" ? "done" : ""}>1</span><i /><span className={capture === "complete" ? "done" : ""}>2</span></div>
        <div className="profile-enrollment-actions"><button type="button" className="profile-editor-cancel" onClick={finishCapture}>Cancelar captura</button><button ref={captureAction} type="button" className="profile-editor-save" onClick={() => {
          if (capture === "complete") {
            update({ fingerprintPreview: { finger, capturedAt: new Date().toISOString() } });
            finishCapture();
          } else setCapture(capture === "ready" ? "first" : "complete");
        }}>{capture === "complete" ? "Añadir huella de prueba" : capture === "first" ? "Simular segunda lectura" : "Simular primera lectura"}</button></div>
      </div> : <div className="profile-fingerprint-summary"><Fingerprint size={24} aria-hidden="true" /><div><strong>{selected.fingerprintPreview ? "Huella de prueba registrada" : "Sin huella registrada en esta vista"}</strong><p>{selected.fingerprintPreview?.finger ?? "Registra una huella para revisar la experiencia de identificación."}</p></div><button type="button" className="profile-editor-cancel" disabled={!selected.name.trim() || !selected.relationship.trim()} onClick={() => { setFinger(selected.fingerprintPreview?.finger ?? fingers[0]); setCapture("ready"); onCaptureChange(true); }}>{selected.fingerprintPreview ? "Reemplazar" : "Registrar huella"}</button>{selected.fingerprintPreview && <button type="button" className="profile-fingerprint-remove" aria-label="Quitar huella de prueba" title="Quitar huella de prueba" onClick={() => update({ fingerprintPreview: undefined })}><X size={18} /></button>}</div>}
    </section>
    {!capture && <button type="button" className="profile-remove-adult" onClick={() => { onChange(adults.filter(adult => adult.id !== selectedId)); setSelectedId(undefined); }}><Trash2 size={15} aria-hidden="true" />Quitar adulto de este perfil</button>}
  </div>;

  return <div className="profile-authorized-editor">
    <div className="profile-adults-intro"><div><h3>Adultos y huellas</h3><p>Gestiona quién puede recoger a {childName} y su identificación.</p></div><button type="button" className="profile-editor-cancel" onClick={() => { const id = crypto.randomUUID(); onChange([...adults, { id, name: "", relationship: "", phone: "", canPickup: false }]); setSelectedId(id); }}><Plus size={16} aria-hidden="true" />Agregar adulto</button></div>
    <div className="profile-adults-list">{adults.map(adult => <button key={adult.id} type="button" className="profile-adult-row" onClick={() => setSelectedId(adult.id)}>
      <ChildAvatar child={{ name: adult.name.trim() || "Nuevo", lastName: "" }} size="sm" />
      <span className="profile-adult-row-name"><strong>{adult.name.trim() || "Nuevo adulto · Completa sus datos"}</strong><small>{adult.relationship || "Sin relación indicada"}{adult.phone ? ` · ${adult.phone}` : ""}</small></span>
      <span className={`profile-adult-permission ${adult.canPickup ? "allowed" : ""}`}>{adult.canPickup ? <ShieldCheck size={15} aria-hidden="true" /> : <ShieldOff size={15} aria-hidden="true" />}{adult.canPickup ? "Puede recoger" : "Sin permiso"}</span>
      <span className="profile-adult-fingerprint-status"><Fingerprint size={16} aria-hidden="true" />{adult.fingerprintPreview ? "Huella de prueba" : "Sin huella en esta vista"}</span><ChevronRight size={16} aria-hidden="true" />
    </button>)}</div>
    {!adults.length && <div className="profile-adults-empty"><UsersRound size={32} aria-hidden="true" /><h4>No hay adultos configurados</h4><p>Agrega un adulto y define su permiso de recogida.</p></div>}
    <p className="profile-editor-note"><Info size={18} aria-hidden="true" />Los cambios se aplican al guardar el perfil. Las lecturas de huella son de prueba; no se capturan datos biométricos reales.</p>
  </div>;
}
