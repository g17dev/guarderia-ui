import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { belongingCatalog, type EntryBelonging } from "./belongings";
import { createPersonalBelonging, interpretPersonalBelonging, samePersonalBelonging } from "./personalBelongings";

const cardId = (item: EntryBelonging) => item.custom?.id ?? `${item.label}:${item.details}`;

export function AdditionalBelongings({ articles, items, onChange, disabled, renderArticle, renderIcon }: {
  articles: readonly typeof belongingCatalog[number][]; items: EntryBelonging[]; onChange: (items: EntryBelonging[]) => void;
  disabled: boolean; renderArticle: (article: typeof belongingCatalog[number]) => ReactNode; renderIcon: (item: EntryBelonging) => ReactNode;
}) {
  const [view, setView] = useState({ items, cards: items.filter(item => item.kind === "custom") });
  const [creating, setCreating] = useState(false);
  const [description, setDescription] = useState("");
  const [correction, setCorrection] = useState<{ label: string; details: string } | null>(null);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const restoreAddFocus = useRef(false);
  if (view.items !== items) {
    const active = items.filter(item => item.kind === "custom");
    setView({ items, cards: [...view.cards.map(item => active.find(next => cardId(next) === cardId(item)) ?? item),
      ...active.filter(item => !view.cards.some(previous => cardId(previous) === cardId(item)))] });
  }
  useLayoutEffect(() => {
    if (creating) input.current?.focus();
    else if (restoreAddFocus.current) {
      addButton.current?.focus({ preventScroll: true });
      restoreAddFocus.current = false;
    }
  }, [creating]);
  const interpretation = interpretPersonalBelonging(description);
  const candidate = createPersonalBelonging(description, "preview", correction ?? undefined);
  const duplicate = items.find(item => samePersonalBelonging(item, candidate));
  const valid = !!description.trim() && !!candidate.label && candidate.label.length <= 80 && candidate.details.length <= 240;
  function add() {
    if (disabled || !valid || (duplicate && duplicate.quantity >= 99)) return;
    const cached = view.cards.find(item => samePersonalBelonging(item, candidate));
    const added = { ...candidate, custom: { ...candidate.custom!, id: duplicate?.custom?.id ?? cached?.custom?.id ?? crypto.randomUUID() } };
    if (duplicate) onChange(items.map(item => item === duplicate ? { ...item, quantity: item.quantity + 1 } : item));
    else {
      setView(previous => ({ ...previous, cards: [...previous.cards.filter(item => cardId(item) !== cardId(added)), added] }));
      onChange([...items, added]);
    }
    setDescription(""); setCorrection(null); setCreating(false);
    setMessage(duplicate ? `Se aumentó la cantidad de ${candidate.label}.` : `${candidate.label}: artículo agregado.`);
  }
  return <details className="belonging-more belonging-additional">
    <summary>Otros artículos</summary>
    <div className="belonging-shortcuts belonging-frequent-grid belonging-additional-grid">
      {articles.map(renderArticle)}
      {view.cards.map(item => {
        const active = items.find(value => value.kind === "custom" && cardId(value) === cardId(item));
        return <Button key={cardId(item)} type="button" size="operational" variant="outline"
          className="belonging-frequent-card belonging-personal-card" data-personal-id={cardId(item)}
          data-has-details={!!item.details} title={`${item.label}${item.details ? ` · ${item.details}` : ""}`} aria-label={`${item.label}${item.details ? ` · ${item.details}` : ""}`}
          aria-pressed={!!active} disabled={disabled} onClick={() => onChange(active
            ? items.filter(value => value !== active) : [...items, item])}>
          {renderIcon(item)}<span><span className="belonging-personal-label">{item.label}</span>{item.details && <small className="belonging-personal-details">{item.details}</small>}</span>
          <Check className="belonging-card-check" size={16} aria-hidden="true" />
        </Button>;
      })}
    </div>
    {!creating && <Button ref={addButton} type="button" variant="ghost" size="operational" className="belonging-add-personal"
      disabled={disabled} aria-expanded={false} onClick={() => { restoreAddFocus.current = true; setCreating(true); setMessage(""); }}><Plus size={17} aria-hidden="true" />Agregar otro artículo</Button>}
    {creating && <form className="belonging-personal-form" onSubmit={event => { event.preventDefault(); add(); }}>
      <label>¿Qué artículo desea agregar?<input ref={input} maxLength={80} disabled={disabled} value={description}
        placeholder="Ej. Gorra azul" onChange={event => { setDescription(event.target.value); setCorrection(null); }} /></label>
      {description.trim() && (interpretation.recognized || correction) && <div className="belonging-personal-preview">
        {renderIcon(candidate)}<div><strong>{candidate.label || "Nombre del artículo"}</strong>{candidate.details && <p>{candidate.details}</p>}<small>{candidate.returnable ? "Retornable" : "Consumible"}</small></div>
        {!correction && <Button type="button" variant="ghost" size="operational" disabled={disabled}
          onClick={() => setCorrection({ label: candidate.label, details: candidate.details })}><Pencil size={15} aria-hidden="true" />Corregir</Button>}
      </div>}
      {correction && <div className="belonging-personal-correction">
        <label>Nombre<input maxLength={80} disabled={disabled} value={correction.label} onChange={event => setCorrection({ ...correction, label: event.target.value })} /></label>
        <label>Detalles (opcional)<input maxLength={240} disabled={disabled} value={correction.details} onChange={event => setCorrection({ ...correction, details: event.target.value })} /></label>
      </div>}
      {duplicate && <p className="belonging-personal-duplicate" role="status">{duplicate.quantity >= 99 ? "Este artículo ya tiene la cantidad máxima de 99." : `Ya está seleccionado (cantidad ${duplicate.quantity}). Puedes sumar una unidad.`}</p>}
      <div className="belonging-personal-form-actions">
        <Button type="button" variant="outline" size="operational" disabled={disabled} onClick={() => {
          setCreating(false); setDescription(""); setCorrection(null);
        }}>Cancelar</Button>
        <Button type="submit" size="operational" disabled={disabled || !valid || !!duplicate && duplicate.quantity >= 99}>{duplicate ? "Sumar 1 a la cantidad" : "Agregar artículo"}</Button>
      </div>
    </form>}
    {message && <p className="belonging-personal-feedback" role="status">{message}</p>}
  </details>;
}
