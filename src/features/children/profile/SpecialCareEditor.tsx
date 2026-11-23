import { useState } from "react";
import { Check, ChevronDown, ClipboardCheck, HeartPulse, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { careCategoryLabels, getCareState, isMedicalCare, localDateKey, validateSpecialCarePlan, withCareInstructions, type CareInstruction, type SpecialCarePlan } from "./specialCare";
import "./SpecialCare.css";

export function SpecialCareEditor({ plan, onChange }: { plan: SpecialCarePlan; onChange: (plan: SpecialCarePlan) => void }) {
  const [expandedId, setExpandedId] = useState<string>();
  const [reviewer, setReviewer] = useState(plan.review?.reviewedBy ?? "");
  const [error, setError] = useState("");
  function update(id: string, patch: Partial<CareInstruction>) {
    setError("");
    onChange(withCareInstructions(plan, plan.instructions.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item)));
  }
  function add() {
    const id = crypto.randomUUID();
    onChange(withCareInstructions(plan, [...plan.instructions, {
      id, category: "other", instruction: "", when: "", priority: "routine", validity: "ongoing",
      startDate: localDateKey(), endDate: "", reportedBy: "", updatedAt: new Date().toISOString(),
      authorizationStatus: "pending", authorizationReference: "",
    }]));
    setExpandedId(id);
  }
  return <section className="special-care-editor" aria-labelledby="special-care-editor-heading">
    <div className="special-care-editor-heading"><div><h3 id="special-care-editor-heading"><HeartPulse size={19} aria-hidden="true" />Cuidados especiales</h3><p>Qué necesita el niño, cuándo y cómo ayudarle.</p></div><button type="button" className="profile-editor-cancel" onClick={add}><Plus size={16} aria-hidden="true" />Agregar cuidado</button></div>
    {!plan.instructions.length && <div className="special-care-empty"><HeartPulse size={24} aria-hidden="true" /><div><strong>Sin indicaciones registradas</strong><p>Agrega los apoyos o cuidados que el personal debe conocer.</p></div></div>}
    <div className="special-care-editor-list">{plan.instructions.map((item, index) => {
      const open = expandedId === item.id;
      const state = getCareState(item);
      return <div key={item.id} className="special-care-editor-item">
        <button type="button" className="special-care-disclosure" aria-expanded={open} aria-controls={`care-fields-${item.id}`} onClick={() => setExpandedId(open ? undefined : item.id)}>
          <span><small>Cuidado {index + 1} · {careCategoryLabels[item.category]}</small><strong>{item.instruction.trim() || "Completa la indicación de cuidado"}</strong></span>
          {item.priority === "priority" && <span className="special-care-priority">Prioritario</span>}
          {state !== "active" && <span className="special-care-state">{state === "upcoming" ? "Próximo" : "Finalizado"}</span>}
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        {open && <div id={`care-fields-${item.id}`} className="special-care-fields">
          <div className="profile-editor-grid">
            <label>Tipo de cuidado<select value={item.category} onChange={event => update(item.id, { category: event.target.value as CareInstruction["category"] })}>{Object.entries(careCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Prioridad<select value={item.priority} onChange={event => update(item.id, { priority: event.target.value as CareInstruction["priority"] })}><option value="routine">Habitual</option><option value="priority">Prioritario</option></select></label>
          </div>
          <label className="special-care-instruction">Indicación para el personal<textarea rows={3} value={item.instruction} placeholder="Describe el apoyo que necesita y qué debe hacer el personal." onChange={event => update(item.id, { instruction: event.target.value })} /></label>
          <div className="profile-editor-grid">
            <label>Cuándo aplica<input value={item.when} placeholder="Ej.: al comer o durante el descanso" onChange={event => update(item.id, { when: event.target.value })} /></label>
            <label>Indicación proporcionada por<input value={item.reportedBy} placeholder="Nombre del familiar o profesional" onChange={event => update(item.id, { reportedBy: event.target.value })} /></label>
            <label>Vigencia<select value={item.validity} onChange={event => update(item.id, { validity: event.target.value as CareInstruction["validity"] })}><option value="ongoing">Continuo</option><option value="temporary">Temporal</option></select></label>
            <label>Desde<input type="date" value={item.startDate} onChange={event => update(item.id, { startDate: event.target.value })} /></label>
            {item.validity === "temporary" && <label>Hasta<input type="date" min={item.startDate} value={item.endDate} onChange={event => update(item.id, { endDate: event.target.value })} /></label>}
          </div>
          {isMedicalCare(item) && <div className="special-care-authorization"><h4>Autorización de la indicación</h4><p>Registra por separado la referencia de la autorización proporcionada.</p><div className="profile-editor-grid"><label>Estado de la autorización<select value={item.authorizationStatus} onChange={event => update(item.id, { authorizationStatus: event.target.value as CareInstruction["authorizationStatus"] })}><option value="pending">Pendiente de registrar</option><option value="documented">Referencia registrada</option></select></label>{item.authorizationStatus === "documented" && <label>Referencia de la autorización<input value={item.authorizationReference} placeholder="Nombre o referencia del documento" onChange={event => update(item.id, { authorizationReference: event.target.value })} /></label>}</div></div>}
          <div className="special-care-item-footer"><span>Actualizado {format(parseISO(item.updatedAt), "d MMM yyyy", { locale: es })}</span><button type="button" className="profile-remove-adult" onClick={() => { onChange(withCareInstructions(plan, plan.instructions.filter(care => care.id !== item.id))); setExpandedId(undefined); }}><Trash2 size={14} aria-hidden="true" />Quitar indicación</button></div>
        </div>}
      </div>;
    })}</div>
    <div className={`special-care-review ${plan.review ? "reviewed" : ""}`}>
      <ClipboardCheck size={20} aria-hidden="true" /><div><strong>{plan.review ? "Información revisada" : "Revisión de cuidados pendiente"}</strong><p>{plan.review ? `${plan.review.reviewedBy} · ${format(parseISO(plan.review.reviewedAt), "d MMM yyyy", { locale: es })}` : "Revisa las indicaciones antes de marcar esta información como actualizada."}</p></div>
      {!plan.review && <div className="special-care-review-controls"><label className="sr-only" htmlFor="care-reviewer">Revisado por</label><input id="care-reviewer" value={reviewer} placeholder="Revisado por…" onChange={event => { setReviewer(event.target.value); setError(""); }} /><button type="button" className="profile-editor-cancel" onClick={() => {
        const invalid = validateSpecialCarePlan(plan);
        if (invalid) { setExpandedId(invalid.id); setError(invalid.message); return; }
        if (!reviewer.trim()) { setError("Indica quién revisó la información de cuidados."); return; }
        onChange({ ...plan, review: { reviewedBy: reviewer.trim(), reviewedAt: new Date().toISOString() } });
        setError("");
      }}><Check size={16} aria-hidden="true" />Marcar como revisada</button></div>}
    </div>
    {error && <p className="profile-editor-error" role="alert">{error}</p>}
  </section>;
}
