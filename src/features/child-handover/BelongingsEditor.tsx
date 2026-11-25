import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowLeft, Check, Backpack, BottleWine, Box, CookingPot, Gamepad2, HatGlasses, Milk, Package, PackageCheck, PackageX, Minus, Pencil, Plus, Trash2, Shirt, Utensils, Waves } from "lucide-react";
import { Button } from "../../components/ui/button";
import { belongingCatalog, checkRemaining, frequentBelongings, outcomeLabels, outstandingBelongings, type BelongingKind, type BelongingCheck, type EntryBelonging, type PersonalCategory, type MovementDetails, type OutstandingBelonging } from "./belongings";
import type { OperationsState } from "./operations";
import type { Movement, ReceptionChild } from "./reception";
import "./Belongings.css";
import { AdditionalBelongings } from "./AdditionalBelongings";

const icons = { backpack: Backpack, water: BottleWine, container: CookingPot, toy: Gamepad2, lunchbox: Utensils, bottle: Milk, clothes: Shirt, blanket: Waves, diapers: Package, custom: Box };
export function BelongingIcon({ kind, category }: { kind: BelongingKind; category?: PersonalCategory }) {
  const personalIcons = { ...icons, cap: HatGlasses, hat: HatGlasses, plush: Gamepad2, thermos: BottleWine, generic: Package };
  const Icon = kind === "custom" ? personalIcons[category ?? "generic"] : icons[kind];
  return <Icon size={18} aria-hidden="true" />;
}

export function CheckBelonging({ item, check, onChange, disabled = false, compact = false }: { compact?: boolean; item: OutstandingBelonging; check?: BelongingCheck; onChange: (check: BelongingCheck) => void; disabled?: boolean }) {
  const choose = (outcome: BelongingCheck["outcome"]) => onChange({ itemId: item.id, quantity: item.remaining, outcome, comment: "" });
  return <div className="belonging-check-row" data-belonging-id={item.id}>
    <div className="belonging-item-name"><BelongingIcon kind={item.kind} category={item.custom?.category} /><span><strong>{item.label}{item.remaining > 1 ? ` × ${item.remaining}` : ""}</strong><small>{item.returnable ? "Retornable" : "Consumible"}{item.details ? ` · ${item.details}` : ""}</small>{item.lastOutcome !== "unchecked" && <small>{outcomeLabels[item.lastOutcome]}{item.lastComment ? ` · ${item.lastComment}` : ""}</small>}</span></div>
    <div className="belonging-item-actions">
      <Button type="button" variant={check?.outcome === "delivered" ? "secondary" : "outline"} size="operational" aria-label={`${check?.outcome === "delivered" ? "Entregado" : "Entregar"}: ${item.label}`} aria-pressed={check?.outcome === "delivered"} disabled={disabled} onClick={() => choose("delivered")}>{check?.outcome === "delivered" ? "Entregado" : "Entregar"}</Button>
      <details><summary aria-label={`Opciones de ${item.label}`}>{compact ? "Opciones" : `Opciones de ${item.label}`}</summary><div className="belonging-exception">
        <label>Resultado para {item.label}<select disabled={disabled} value={check?.outcome ?? ""} onChange={event => choose(event.target.value as BelongingCheck["outcome"])}><option value="" disabled>Seleccionar resultado</option>{Object.entries(outcomeLabels).filter(([key]) => key !== "consumed" || !item.returnable).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {check && <>{item.remaining > 1 && <label>Cantidad de {item.label}<input type="number" min={1} max={item.remaining} disabled={disabled} value={check.quantity} onChange={event => onChange({ ...check, quantity: Math.max(1, Math.min(item.remaining, Math.trunc(Number(event.target.value)) || 1)) })} /></label>}<label>Observación de esta pertenencia (opcional)<input maxLength={240} disabled={disabled} value={check.comment} onChange={event => onChange({ ...check, comment: event.target.value })} placeholder="Ej. Se quedó en el salón" /></label>{check.quantity < item.remaining && <p>Los {item.remaining - check.quantity} restantes seguirán pendientes.</p>}</>}
      </div></details>
    </div>
    {check && <p className="belonging-check-result" role="status">{outcomeLabels[check.outcome]}{check.quantity < item.remaining ? ` · ${check.quantity} de ${item.remaining}` : ""}{check.comment ? ` · ${check.comment}` : ""}</p>}
  </div>;
}

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const prefersReducedMotion = () => window.matchMedia(motionQuery).matches;

function EntryBelongingsTransition({ none, children }: { none: boolean; children: ReactNode }) {
  const reducedMotion = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => true);
  const [view, setView] = useState({ none, content: children, exiting: false });
  const container = useRef<HTMLDivElement>(null);
  const previousState = useRef(none);
  const animation = useRef<Animation | null>(null);
  const latest = useRef({ none, content: children });
  // Retain the previous visual content until its exit ends; the draft updates immediately.
  if (reducedMotion || view.none === none) {
    if (view.none !== none || view.exiting || view.content !== children) {
      setView({ none, content: children, exiting: false });
    }
  } else if (!view.exiting) {
    setView({ ...view, exiting: true });
  }
  useLayoutEffect(() => { latest.current = { none, content: children }; });
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const continuing = animation.current?.effect instanceof KeyframeEffect
      && animation.current.effect.target === element;
    const style = getComputedStyle(element);
    const from = continuing ? { opacity: style.opacity, transform: style.transform }
      : { opacity: "0", transform: "translateY(8px)" };
    animation.current?.cancel();
    if (reducedMotion) { animation.current = null; return; }
    const next = element.animate([from, {
      opacity: view.exiting ? "0" : "1",
      transform: view.exiting ? "translateY(-8px)" : "translateY(0)",
    }], { duration: view.exiting ? 170 : 230, easing: "ease-out", fill: "both" });
    animation.current = next;
    if (view.exiting) next.onfinish = () => setView({ ...latest.current, exiting: false });
  }, [view.none, view.exiting, reducedMotion]);
  useEffect(() => () => animation.current?.cancel(), []);
  useLayoutEffect(() => {
    if (view.exiting || previousState.current === view.none) return;
    previousState.current = view.none;
    container.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [view.none, view.exiting]);

  return <div key={String(view.none)} ref={container} className="belonging-state-transition"
    data-exiting={view.exiting} inert={view.exiting} aria-hidden={view.exiting || undefined}>{view.content}</div>;
}

function SelectedEntryItem({ item, onChange, onRemove, disabled, exiting, reducedMotion, onExit }: {
  item: EntryBelonging; onChange: (item: EntryBelonging) => void; onRemove: () => void; disabled: boolean;
  exiting: boolean; reducedMotion: boolean; onExit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editorPresent, setEditorPresent] = useState(false);
  if ((expanded && !editorPresent) || (reducedMotion && editorPresent !== expanded)) setEditorPresent(expanded);
  const id = useId();
  const editButton = useRef<HTMLButtonElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const editorAnimation = useRef<Animation | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const finish = useRef(onExit);
  useLayoutEffect(() => { finish.current = onExit; });
  useLayoutEffect(() => {
    const element = row.current;
    if (!element) return;
    const previous = animation.current;
    const height = element.getBoundingClientRect().height;
    const style = getComputedStyle(element);
    const from = { height: `${height}px`, opacity: style.opacity, transform: style.transform };
    previous?.cancel();
    if (reducedMotion || (!exiting && !previous)) return;
    const next = element.animate([from, {
      height: exiting ? "0px" : `${element.scrollHeight}px`, opacity: exiting ? "0" : "1",
      transform: exiting ? "translateY(-6px)" : "translateY(0)",
    }], { duration: exiting ? 320 : 240, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" });
    animation.current = next;
    next.onfinish = () => {
      if (exiting) finish.current();
      else { next.cancel(); animation.current = null; }
    };
  }, [exiting, reducedMotion]);
  useEffect(() => () => animation.current?.cancel(), []);
  useLayoutEffect(() => {
    const element = editor.current;
    if (!element) return;
    const previous = editorAnimation.current;
    const style = getComputedStyle(element);
    const from = expanded && !previous
      ? { height: "0px", opacity: "0", transform: "translateY(6px)" }
      : { height: `${element.getBoundingClientRect().height}px`, opacity: style.opacity, transform: style.transform };
    previous?.cancel();
    editorAnimation.current = null;
    if (!editorPresent || reducedMotion) return;
    const next = element.animate([from, {
      height: expanded ? `${element.scrollHeight}px` : "0px",
      opacity: expanded ? "1" : "0", transform: expanded ? "translateY(0)" : "translateY(-8px)",
    }], { duration: expanded ? 240 : 360, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" });
    editorAnimation.current = next;
    next.onfinish = () => {
      if (expanded) { next.cancel(); editorAnimation.current = null; }
      // Keep <details> open throughout the exit, then hide its content.
      else setEditorPresent(false);
    };
  }, [expanded, editorPresent, reducedMotion]);
  useEffect(() => () => editorAnimation.current?.cancel(), []);
  return <div ref={row} className="belonging-selected-item" data-exiting={exiting}
    inert={exiting} aria-hidden={exiting || undefined}>
    <div className="belonging-selected-row">
      <span className="belonging-selected-name"><BelongingIcon kind={item.kind} category={item.custom?.category} /><span>{item.label} <span className="belonging-quantity-value" key={item.quantity}>× {item.quantity}</span></span></span>
      <div className="belonging-selected-actions">
        <Button ref={editButton} type="button" variant="ghost" size="operational-icon" className="belonging-edit-action"
          disabled={disabled} aria-label={`Editar ${item.label}`} title={`Editar ${item.label}`}
          aria-expanded={expanded} aria-controls={`${id}-editor`} onClick={() => setExpanded(value => !value)}><Pencil size={17} aria-hidden="true" /></Button>
        <Button type="button" variant="ghost" size="operational-icon" className="belonging-delete-action"
          disabled={disabled} aria-label={`Eliminar ${item.label}`} title={`Eliminar ${item.label}`} onClick={() => {
            setExpanded(false);
            onRemove();
          }}><Trash2 size={17} aria-hidden="true" /></Button>
      </div>
    </div>
    <details className="belonging-item-disclosure" name="reception-entry-item-editor" open={editorPresent}
      onToggle={event => {
        if (!event.currentTarget.open) { setExpanded(false); setEditorPresent(false); }
      }}>
      <summary hidden>Editar {item.label}</summary>
      <div ref={editor} className="belonging-editor-reveal" data-closing={editorPresent && !expanded}
        inert={!expanded} aria-hidden={!expanded || undefined}>
      <div id={`${id}-editor`} className="belonging-inline-editor" role="group" aria-label={`Editar ${item.label}`}>
        <div className="belonging-quantity-field">
          <label htmlFor={`${id}-quantity`}>Cantidad</label>
          <div className="belonging-quantity-control">
            <Button type="button" variant="outline" size="operational" aria-label={`Reducir cantidad de ${item.label}`}
              disabled={disabled || item.quantity <= 1} onClick={() => onChange({ ...item, quantity: item.quantity - 1 })}><Minus size={16} aria-hidden="true" /></Button>
            <input id={`${id}-quantity`} type="number" min={1} max={99} step={1}
              disabled={disabled} value={item.quantity} onChange={event => onChange({ ...item, quantity: Math.max(1, Math.min(99, Math.trunc(Number(event.target.value)) || 1)) })} />
            <Button type="button" variant="outline" size="operational" aria-label={`Aumentar cantidad de ${item.label}`}
              disabled={disabled || item.quantity >= 99} onClick={() => onChange({ ...item, quantity: item.quantity + 1 })}><Plus size={16} aria-hidden="true" /></Button>
          </div>
        </div>
        <label>Detalles (opcional)<input maxLength={240} disabled={disabled} value={item.details}
          onChange={event => onChange({ ...item, details: event.target.value })} placeholder="Color, marca o referencia" /></label>
        <div className="belonging-editor-actions">
          <Button type="button" className="belonging-apply-action" size="operational" disabled={disabled} onClick={() => {
            setExpanded(false);
            editButton.current?.focus({ preventScroll: true });
          }}><Check size={16} aria-hidden="true" />Aplicar cambios</Button>
        </div>
      </div>
      </div>
    </details>
  </div>;
}

function SelectedEntryItems({ items, onChange, disabled }: {
  items: EntryBelonging[]; onChange: (items: EntryBelonging[]) => void; disabled: boolean;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  if (!items.length && confirmClear) setConfirmClear(false);
  const container = useRef<HTMLDivElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => true);
  const [view, setView] = useState({ items, rows: items.map((item, id) => ({ id, item, exiting: false })), nextId: items.length });
  // Only visual rows wait for exit. Selection, drafts and registration update immediately.
  if (view.items !== items || (reducedMotion && view.rows.some(row => row.exiting))) {
    const exact = items.map(item => view.rows.find(row => row.item === item));
    const used = new Set<number>();
    let nextId = view.nextId;
    const rows = items.map((item, index) => {
      const previous = exact[index] ?? view.rows.find(row => !used.has(row.id) && !exact.includes(row)
        && row.item.kind === item.kind && row.item.label === item.label);
      const id = previous?.id ?? nextId++;
      used.add(id);
      return { id, item, exiting: false };
    });
    if (!reducedMotion) view.rows.forEach((row, index) => {
      if (!used.has(row.id)) rows.splice(Math.min(index, rows.length), 0, { ...row, exiting: true });
    });
    setView({ items, rows, nextId });
  }
  useLayoutEffect(() => {
    if (items.length && header.current) {
      header.current.style.setProperty("--selected-heading-height", `${header.current.getBoundingClientRect().height}px`);
    }
  }, [items.length]);
  useLayoutEffect(() => {
    if (confirmClear) cancelButton.current?.focus({ preventScroll: true });
  }, [confirmClear]);
  const focusSelection = (kind?: BelongingKind) => {
    const entry = container.current?.closest(".belonging-entry");
    const cards = [...entry?.querySelectorAll<HTMLButtonElement>(".belonging-frequent-card") ?? []];
    (cards.find(button => !kind || button.dataset.kind === kind)
      ?? entry?.querySelector<HTMLElement>(".belonging-more summary"))?.focus({ preventScroll: true });
  };
  const clear = () => { focusSelection(); onChange([]); };
  if (!view.rows.length) return null;
  return <div ref={container} className="belonging-selected" data-empty={!items.length} aria-label="Artículos seleccionados">
    <div ref={header} className="belonging-selected-header" inert={!items.length} aria-hidden={!items.length || undefined}>
      <p className="belonging-selected-heading">Artículos seleccionados</p>
      <Button ref={clearButton} type="button" variant="ghost" size="operational" className="belonging-clear-action"
        disabled={disabled} aria-expanded={confirmClear} onClick={() => {
          if (items.length > 1 || items.some(item => item.quantity !== 1 || item.details.trim())) setConfirmClear(true);
          else clear();
        }}><Trash2 size={15} aria-hidden="true" />Limpiar todos</Button>
    </div>
    {confirmClear && items.length > 0 && <div className="belonging-clear-confirmation" role="group" aria-label="Confirmar limpieza de artículos">
      <p>Se quitarán los artículos seleccionados de este menor y sus detalles.</p>
      <div>
        <Button ref={cancelButton} type="button" variant="outline" size="operational" disabled={disabled} onClick={() => {
          setConfirmClear(false);
          clearButton.current?.focus({ preventScroll: true });
        }}>Cancelar</Button>
        <Button type="button" variant="ghost" size="operational" className="belonging-delete-action" disabled={disabled} onClick={clear}><Trash2 size={15} aria-hidden="true" />Confirmar limpieza</Button>
      </div>
    </div>}
    {view.rows.map(({ id, item, exiting }) => <SelectedEntryItem key={id}
      item={item} disabled={disabled || exiting} exiting={exiting} reducedMotion={reducedMotion}
      onExit={() => setView(previous => ({ ...previous, rows: previous.rows.filter(row => row.id !== id || !row.exiting) }))}
      onChange={updated => { if (!exiting) onChange(items.map(value => value === item ? updated : value)); }}
      onRemove={() => { if (!exiting) { focusSelection(item.kind); onChange(items.filter(value => value !== item)); } }} />)}
  </div>;
}

export function EntryBelongings({ items, onChange, childId, history, registration, onNone, disabled = false, compact = false }: { compact?: boolean; items: EntryBelonging[]; onChange: (items: EntryBelonging[]) => void; childId: string; history: OperationsState["belongings"]; registration?: string; onNone?: () => void; disabled?: boolean }) {
  const [custom, setCustom] = useState("");
  const [returnable, setReturnable] = useState(true);
  const common = frequentBelongings(history, childId);
  function toggle(kind: typeof belongingCatalog[number]) {
    onChange(items.some(item => item.kind === kind.kind) ? items.filter(item => item.kind !== kind.kind) : [...items, { ...kind, quantity: 1, details: "" }]);
  }
  const articleButton = (article: typeof belongingCatalog[number]) => <Button key={article.kind} type="button" size="operational" variant={items.some(item => item.kind === article.kind) ? "secondary" : "outline"} disabled={disabled} aria-pressed={items.some(item => item.kind === article.kind)} onClick={() => toggle(article)}><BelongingIcon kind={article.kind} /><span>{article.label}</span>{items.some(item => item.kind === article.kind) && <Check size={14} aria-hidden="true" />}</Button>;
  const frequentArticleButton = (article: typeof belongingCatalog[number]) => compact
    ? <Button key={article.kind} type="button" className="belonging-frequent-card" data-kind={article.kind}
      size="operational" variant="outline" disabled={disabled}
      aria-pressed={items.some(item => item.kind === article.kind)} onClick={() => toggle(article)}>
      <BelongingIcon kind={article.kind} /><span>{article.label}</span><Check className="belonging-card-check" size={16} aria-hidden="true" />
    </Button> : articleButton(article);
  const none = compact && registration === "none" && !!onNone;
  const emptyState = <div className="belonging-empty-state">
    <div role="status">
      <PackageCheck size={32} aria-hidden="true" />
      <p className="belonging-empty-title">Sin pertenencias para registrar</p>
      <p>Se indicó que el menor no trae artículos personales</p>
    </div>
    <button
      type="button"
      className="reception-button quiet"
      disabled={disabled}
      onClick={onNone}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Cambiar selección
    </button>
  </div>;
  const controls = <>
    <div className={`belonging-shortcuts${compact ? " belonging-frequent-grid" : ""}`}>{common.map(frequentArticleButton)}</div>
    {compact ? <AdditionalBelongings articles={belongingCatalog.filter(article => !common.some(item => item.kind === article.kind))}
      items={items} onChange={onChange} disabled={disabled} renderArticle={frequentArticleButton}
      renderIcon={item => <BelongingIcon kind={item.kind} category={item.custom?.category} />} /> : <details className="belonging-more"><summary>{compact ? "Otros artículos" : "Otros artículos o uno personalizado"}</summary><div className="belonging-shortcuts">{belongingCatalog.filter(article => !common.some(item => item.kind === article.kind)).map(articleButton)}</div><div className="belonging-custom"><label>Nombre del artículo<input disabled={disabled} maxLength={80} value={custom} onChange={event => setCustom(event.target.value)} placeholder="Ej. Sombrero azul" /></label><label className="belonging-checkbox"><input type="checkbox" checked={returnable} disabled={disabled} onChange={event => setReturnable(event.target.checked)} />Se devuelve a la familia</label><Button type="button" size="operational" variant="outline" disabled={disabled || !custom.trim()} onClick={() => { onChange([...items, { kind: "custom", label: custom.trim(), quantity: 1, details: "", returnable }]); setCustom(""); }}><Plus size={16} aria-hidden="true" />Agregar artículo</Button>{onNone && !compact && <Button type="button" variant="ghost" size="operational" disabled={disabled} aria-pressed={registration === "none"} onClick={onNone}>{registration === "none" ? "Declarado: no trae pertenencias" : "No trae pertenencias"}</Button>}</div></details>}
    {compact && <SelectedEntryItems items={items} onChange={onChange} disabled={disabled} />}
     {items.length > 0 && !compact && <details className="belonging-entry-details">
      <summary>Cantidades y detalles · {items.length} {items.length === 1 ? "artículo" : "artículos"}</summary>
      {items.map((item, index) => <div className="belonging-entry-fields" key={`${item.kind}-${index}`}>
        <strong>{item.label}</strong>
        <label>Cantidad de {item.label}<input type="number" min={1} max={99} disabled={disabled} value={item.quantity} onChange={event => onChange(items.map((value, position) => position === index ? { ...value, quantity: Math.max(1, Math.min(99, Math.trunc(Number(event.target.value)) || 1)) } : value))} /></label>
        <label>Detalles de {item.label} (opcional)<input maxLength={240} disabled={disabled} value={item.details} onChange={event => onChange(items.map((value, position) => position === index ? { ...value, details: event.target.value } : value))} placeholder="Color, marca u otra referencia" /></label>
        <Button type="button" variant="ghost" size="operational" disabled={disabled} onClick={() => onChange(items.filter((_, position) => position !== index))}>Quitar {item.label}</Button>
      </div>)}
    </details>}

    {!compact && !items.length && registration !== "none" && onNone && <p className="belonging-hint">Opcional. Omitir conserva «Sin registro» si no capturas pertenencias.</p>}
  </>;
  return <div className={`belonging-entry ${compact ? "is-compact" : ""}`}>
    {compact && onNone && <div className="belonging-instruction-row">
      <p className="belonging-stage-hint">Opcional · selecciona los artículos que trae cada niño.</p>
      <Button type="button" className="belonging-none" variant="outline" size="operational" disabled={disabled} aria-pressed={none} onClick={onNone}>
        <PackageX size={16} aria-hidden="true" />No trae pertenencias{none && <Check size={14} aria-hidden="true" />}
      </Button>
    </div>}
    {compact ? <EntryBelongingsTransition none={none}>{none ? emptyState : <div className="belonging-article-controls">{controls}</div>}</EntryBelongingsTransition> : controls}
  </div>;
}

export function BelongingsEditor({ selected, action, state, details, onChange, disabled, needsDecision, onToggleNone }: { selected: ReceptionChild[]; action: Movement; state: OperationsState; details: MovementDetails; onChange: (details: MovementDetails) => void; disabled: boolean; needsDecision: boolean; onToggleNone: (childId: string) => void }) {
  const allPending = selected.flatMap(child => outstandingBelongings(state.belongings, state.events, child.id));
  function updateCheck(check: BelongingCheck) { onChange({ ...details, checks: [...details.checks.filter(item => item.itemId !== check.itemId), check] }); }
  return <section className="belongings-editor" aria-label="Pertenencias del movimiento">{action === "pickup" && <p className="belonging-stage-hint">Comprueba los artículos de esta estancia y los pendientes anteriores.</p>}
    {selected.map(child => {
      const pending = allPending.filter(item => item.childId === child.id);
      const entry = details.entries[child.id];
      const stay = state.stays[child.id];
      return <div className="belonging-child" key={child.id} role="group" aria-label={`Pertenencias de ${child.name} ${child.lastName}`}><h4 className={selected.length === 1 ? "belonging-single-child" : undefined}>{child.name} {child.lastName}</h4>
        {action === "entry" ? <EntryBelongings compact childId={child.id} history={state.belongings} registration={entry?.registration} items={entry?.items ?? []} disabled={disabled} onNone={() => onToggleNone(child.id)} onChange={items => onChange({ ...details, entries: { ...details.entries, [child.id]: { registration: items.length ? "recorded" : "unrecorded", items } } })} /> : !pending.length && <p className="belonging-hint">{stay?.registration === "none" ? "Sin pertenencias declaradas en esta estancia." : stay?.registration === "recorded" ? "Todas las pertenencias de esta estancia ya fueron entregadas o utilizadas." : "Sin registro de pertenencias para esta estancia."}</p>}
        {pending.length > 0 && (action === "entry" ? <details><summary>{pending.length} {pending.length === 1 ? "pertenencia pendiente" : "pertenencias pendientes"} de visitas anteriores</summary>{pending.map(item => <CheckBelonging compact key={item.id} item={item} check={details.checks.find(check => check.itemId === item.id)} onChange={updateCheck} disabled={disabled} />)}</details> : pending.map(item => <div key={item.id}>{item.stayId !== stay?.id && <p className="belonging-previous">Pendiente anterior · {new Date(item.createdAt).toLocaleDateString("es-MX")}</p>}<CheckBelonging compact item={item} check={details.checks.find(check => check.itemId === item.id)} onChange={updateCheck} disabled={disabled} /></div>))}
      </div>;
    })}
    {action === "pickup" && allPending.some(item => !details.checks.some(check => check.itemId === item.id)) && <div className="belonging-bulk"><Button type="button" size="operational" variant="outline" disabled={disabled} onClick={() => onChange({ ...details, checks: checkRemaining(allPending, details.checks, "delivered") })}>Entregar todos los restantes</Button><p className="belonging-hint">Las excepciones ya registradas se conservan.</p></div>}
    {needsDecision && <p role="alert" className="reception-warning">Comprueba los artículos restantes o elige «Omitir» para dejarlos sin comprobar. Ninguna excepción impide una salida autorizada.</p>}
  </section>;
}
