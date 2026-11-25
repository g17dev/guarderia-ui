import { useState } from "react";
import { Check, Backpack, BottleWine, Box, CookingPot, Gamepad2, Milk, Package, Plus, Shirt, Utensils, Waves } from "lucide-react";
import { Button } from "../../components/ui/button";
import { belongingCatalog, checkRemaining, frequentBelongings, outcomeLabels, outstandingBelongings, type BelongingKind, type BelongingCheck, type EntryBelonging, type MovementDetails, type OutstandingBelonging } from "./belongings";
import type { OperationsState } from "./operations";
import type { Movement, ReceptionChild } from "./reception";
import "./Belongings.css";

const icons = { backpack: Backpack, water: BottleWine, container: CookingPot, toy: Gamepad2, lunchbox: Utensils, bottle: Milk, clothes: Shirt, blanket: Waves, diapers: Package, custom: Box };
export function BelongingIcon({ kind }: { kind: BelongingKind }) { const Icon = icons[kind]; return <Icon size={18} aria-hidden="true" />; }

export function CheckBelonging({ item, check, onChange, disabled = false }: { item: OutstandingBelonging; check?: BelongingCheck; onChange: (check: BelongingCheck) => void; disabled?: boolean }) {
  const choose = (outcome: BelongingCheck["outcome"]) => onChange({ itemId: item.id, quantity: item.remaining, outcome, comment: "" });
  return <div className="belonging-check-row" data-belonging-id={item.id}>
    <div className="belonging-item-name"><BelongingIcon kind={item.kind} /><span><strong>{item.label}{item.remaining > 1 ? ` × ${item.remaining}` : ""}</strong><small>{item.returnable ? "Retornable" : "Consumible"}{item.details ? ` · ${item.details}` : ""}</small>{item.lastOutcome !== "unchecked" && <small>{outcomeLabels[item.lastOutcome]}{item.lastComment ? ` · ${item.lastComment}` : ""}</small>}</span></div>
    <div className="belonging-item-actions">
      <Button type="button" variant={check?.outcome === "delivered" ? "secondary" : "outline"} size="operational" aria-label={`${check?.outcome === "delivered" ? "Entregado" : "Entregar"}: ${item.label}`} aria-pressed={check?.outcome === "delivered"} disabled={disabled} onClick={() => choose("delivered")}>{check?.outcome === "delivered" ? "Entregado" : "Entregar"}</Button>
      <details><summary>Opciones de {item.label}</summary><div className="belonging-exception">
        <label>Resultado para {item.label}<select disabled={disabled} value={check?.outcome ?? ""} onChange={event => choose(event.target.value as BelongingCheck["outcome"])}><option value="" disabled>Seleccionar resultado</option>{Object.entries(outcomeLabels).filter(([key]) => key !== "consumed" || !item.returnable).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {check && <>{item.remaining > 1 && <label>Cantidad de {item.label}<input type="number" min={1} max={item.remaining} disabled={disabled} value={check.quantity} onChange={event => onChange({ ...check, quantity: Math.max(1, Math.min(item.remaining, Math.trunc(Number(event.target.value)) || 1)) })} /></label>}<label>Observación de esta pertenencia (opcional)<input maxLength={240} disabled={disabled} value={check.comment} onChange={event => onChange({ ...check, comment: event.target.value })} placeholder="Ej. Se quedó en el salón" /></label>{check.quantity < item.remaining && <p>Los {item.remaining - check.quantity} restantes seguirán pendientes.</p>}</>}
      </div></details>
    </div>
    {check && <p className="belonging-check-result" role="status">{outcomeLabels[check.outcome]}{check.quantity < item.remaining ? ` · ${check.quantity} de ${item.remaining}` : ""}{check.comment ? ` · ${check.comment}` : ""}</p>}
  </div>;
}

export function EntryBelongings({ items, onChange, childId, history, registration, onNone, disabled = false }: { items: EntryBelonging[]; onChange: (items: EntryBelonging[]) => void; childId: string; history: OperationsState["belongings"]; registration?: string; onNone?: () => void; disabled?: boolean }) {
  const [custom, setCustom] = useState("");
  const [returnable, setReturnable] = useState(true);
  const common = frequentBelongings(history, childId);
  function toggle(kind: typeof belongingCatalog[number]) {
    onChange(items.some(item => item.kind === kind.kind) ? items.filter(item => item.kind !== kind.kind) : [...items, { ...kind, quantity: 1, details: "" }]);
  }
  const articleButton = (article: typeof belongingCatalog[number]) => <Button key={article.kind} type="button" size="operational" variant={items.some(item => item.kind === article.kind) ? "secondary" : "outline"} disabled={disabled} aria-pressed={items.some(item => item.kind === article.kind)} onClick={() => toggle(article)}><BelongingIcon kind={article.kind} />{article.label}{items.some(item => item.kind === article.kind) && <Check size={14} aria-hidden="true" />}</Button>;
  return <div className="belonging-entry">
    <div className="belonging-shortcuts">{common.map(articleButton)}</div>
    <details><summary>Otros artículos o uno personalizado</summary><div className="belonging-shortcuts">{belongingCatalog.filter(article => !common.some(item => item.kind === article.kind)).map(articleButton)}</div><div className="belonging-custom"><label>Nombre del artículo<input disabled={disabled} maxLength={80} value={custom} onChange={event => setCustom(event.target.value)} placeholder="Ej. Sombrero azul" /></label><label className="belonging-checkbox"><input type="checkbox" checked={returnable} disabled={disabled} onChange={event => setReturnable(event.target.checked)} />Se devuelve a la familia</label><Button type="button" size="operational" variant="outline" disabled={disabled || !custom.trim()} onClick={() => { onChange([...items, { kind: "custom", label: custom.trim(), quantity: 1, details: "", returnable }]); setCustom(""); }}><Plus size={16} aria-hidden="true" />Agregar artículo</Button>{onNone && <Button type="button" variant="ghost" size="operational" disabled={disabled} aria-pressed={registration === "none"} onClick={onNone}>{registration === "none" ? "Declarado: no trae pertenencias" : "No trae pertenencias"}</Button>}</div></details>
    {items.length > 0 && <details className="belonging-entry-details">
      <summary>Cantidades y detalles · {items.length} {items.length === 1 ? "artículo" : "artículos"}</summary>
      {items.map((item, index) => <div className="belonging-entry-fields" key={`${item.kind}-${index}`}>
        <strong>{item.label}</strong>
        <label>Cantidad de {item.label}<input type="number" min={1} max={99} disabled={disabled} value={item.quantity} onChange={event => onChange(items.map((value, position) => position === index ? { ...value, quantity: Math.max(1, Math.min(99, Math.trunc(Number(event.target.value)) || 1)) } : value))} /></label>
        <label>Detalles de {item.label} (opcional)<input maxLength={240} disabled={disabled} value={item.details} onChange={event => onChange(items.map((value, position) => position === index ? { ...value, details: event.target.value } : value))} placeholder="Color, marca u otra referencia" /></label>
        <Button type="button" variant="ghost" size="operational" disabled={disabled} onClick={() => onChange(items.filter((_, position) => position !== index))}>Quitar {item.label}</Button>
      </div>)}
    </details>}

    {!items.length && registration !== "none" && onNone && <p className="belonging-hint">Opcional. Omitir conserva «Sin registro» si no capturas pertenencias.</p>}
  </div>;
}

export function BelongingsEditor({ selected, action, state, details, onChange, disabled, needsDecision }: { selected: ReceptionChild[]; action: Movement; state: OperationsState; details: MovementDetails; onChange: (details: MovementDetails) => void; disabled: boolean; needsDecision: boolean }) {
  const allPending = selected.flatMap(child => outstandingBelongings(state.belongings, state.events, child.id));
  function updateCheck(check: BelongingCheck) { onChange({ ...details, checks: [...details.checks.filter(item => item.itemId !== check.itemId), check] }); }
  return <section className="belongings-editor" aria-label="Pertenencias del movimiento"><h3>Pertenencias <span>{action === "entry" ? "Opcional" : "De esta estancia y pendientes"}</span></h3>
    {selected.map(child => {
      const pending = allPending.filter(item => item.childId === child.id);
      const entry = details.entries[child.id];
      const stay = state.stays[child.id];
      return <div className="belonging-child" key={child.id} role="group" aria-label={`Pertenencias de ${child.name} ${child.lastName}`}><h4 className={selected.length === 1 ? "belonging-single-child" : undefined}>{child.name} {child.lastName}</h4>
        {action === "entry" ? <EntryBelongings childId={child.id} history={state.belongings} registration={entry?.registration} items={entry?.items ?? []} disabled={disabled} onNone={() => onChange({ ...details, entries: { ...details.entries, [child.id]: { registration: entry?.registration === "none" ? "unrecorded" : "none", items: [] } } })} onChange={items => onChange({ ...details, entries: { ...details.entries, [child.id]: { registration: items.length ? "recorded" : "unrecorded", items } } })} /> : !pending.length && <p className="belonging-hint">{stay?.registration === "none" ? "Sin pertenencias declaradas en esta estancia." : stay?.registration === "recorded" ? "Todas las pertenencias de esta estancia ya fueron entregadas o utilizadas." : "Sin registro de pertenencias para esta estancia."}</p>}
        {pending.length > 0 && (action === "entry" ? <details><summary>{pending.length} {pending.length === 1 ? "pertenencia pendiente" : "pertenencias pendientes"} de visitas anteriores</summary>{pending.map(item => <CheckBelonging key={item.id} item={item} check={details.checks.find(check => check.itemId === item.id)} onChange={updateCheck} disabled={disabled} />)}</details> : pending.map(item => <div key={item.id}>{item.stayId !== stay?.id && <p className="belonging-previous">Pendiente anterior · {new Date(item.createdAt).toLocaleDateString("es-MX")}</p>}<CheckBelonging item={item} check={details.checks.find(check => check.itemId === item.id)} onChange={updateCheck} disabled={disabled} /></div>))}
      </div>;
    })}
    {action === "pickup" && allPending.some(item => !details.checks.some(check => check.itemId === item.id)) && <div className="belonging-bulk"><Button type="button" size="operational" variant="outline" disabled={disabled} onClick={() => onChange({ ...details, checks: checkRemaining(allPending, details.checks, "delivered") })}>Entregar todos los restantes</Button><p className="belonging-hint">Las excepciones ya registradas se conservan.</p></div>}
    {needsDecision && <p role="alert" className="reception-warning">Comprueba los artículos restantes o elige «Omitir» para dejarlos sin comprobar. Ninguna excepción impide una salida autorizada.</p>}
  </section>;
}
