import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../context/toastStore";
import { LogIn, LogOut, RotateCcw, MousePointer2, ArrowLeft, UsersRound, ShieldX, ShieldAlert, CircleCheck, Info, ScanLine, ListX } from "lucide-react";
import { SelectChildStep } from "./SelectChildStep";
import { AuthorizePickupStep } from "./AuthorizePickupStep";
import { ConfirmPickupStep } from "./ConfirmPickupStep";
import { SelectedChildrenTags } from "./components/SelectedChildrenTags";
import { MovementIndicator } from "./components/MovementIndicator";
import { getMovementNotification } from "./movementNotification";
import type { SimulationOutcome } from "./receptionSimulation";
import { RECEPTION_EXAMPLE_CHILDREN } from "./receptionFixtures";
import {
  attendanceLabels, getCompatibleAdults, receptionFilterLabels, matchesReceptionFilter, getReceptionCounts, canMove, disconnectedGateway, ReceptionAuthorizationError, isAuthorized, isCompleteReceipt,
  type ReceptionFilter, type Authorization, type Movement, type MovementReceipt,
  type ReceptionChild, type ReceptionAdult, type ReceptionGateway,
} from "./reception";
import "./ReceptionScreen.css";
import { Button } from "../../components/ui/button";
import { BelongingsEditor } from "./BelongingsEditor";
import { MovementCommentInput } from "./components/MovementCommentInput";
import { carryExceptions, checkRemaining, emptyMovementDetails, outstandingBelongings, type MovementDetails, type EntryRegistration } from "./belongings";
import type { OperationsState } from "./operations";

type Phase = "select" | "blocked" | "denied" | "belongings" | "ready" | "verifying" | "review" | "saving" | "save-error" | "success";
interface ReceptionScreenProps {
  initialChildren?: ReceptionChild[];
  gateway?: ReceptionGateway;
  adults?: ReceptionAdult[];
  onSimulationOutcomeChange?: (outcome: SimulationOutcome) => void;
  sharedState?: OperationsState;
  onSimulateSaveError?: () => void;
}

export function ReceptionScreen({ initialChildren = RECEPTION_EXAMPLE_CHILDREN, gateway = disconnectedGateway, adults = [], onSimulationOutcomeChange, sharedState, onSimulateSaveError }: ReceptionScreenProps) {
  const { toast } = useToast();
  const [localChildren, setChildren] = useState(initialChildren);
  const children = sharedState?.children ?? localChildren;
  const [movementDetails, setMovementDetails] = useState(emptyMovementDetails);
  const [needsDecision, setNeedsDecision] = useState(false);
  const savedDetails = useRef<MovementDetails | undefined>(undefined);
  const entryDrafts = useRef<Record<string, EntryRegistration>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ReceptionFilter>("all");
  const [phase, setPhase] = useState<Phase>("select");
  const [action, setAction] = useState<Movement | null>(null);
  const [authorization, setAuthorization] = useState<Authorization>();
  const [receipt, setReceipt] = useState<MovementReceipt>();
  const [receiptReentry, setReceiptReentry] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef("");
  const operation = useRef(0);
  const busy = useRef(false);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const panelContent = useRef<HTMLDivElement>(null);
  const selected = children.filter(child => selectedIds.includes(child.id));
  const reentry = selected.length > 0 && selected.every(child => child.attendanceStatus === "out");
  const entryLabel = reentry ? "Reingreso" : "Entrada";
  const returningCount = selected.filter(child => child.attendanceStatus === "out").length;
  const absenceCount = selected.filter(child => child.attendanceStatus === "absent").length;
  const entryContext = [
    returningCount > 0 ? `${returningCount === 1 ? "Ya tiene una salida registrada hoy. Se registrará una nueva entrada" : `${returningCount} niños ya salieron hoy. Se registrará su reingreso`}, conservando los movimientos anteriores.` : "",
    absenceCount > 0 ? `${absenceCount === 1 ? "Tenía una ausencia avisada" : `${absenceCount} niños tenían ausencia avisada`}. Al confirmar la entrada, ${absenceCount === 1 ? "su asistencia se actualizará" : "sus asistencias se actualizarán"} a «En guardería».` : "",
  ].filter(Boolean).join(" ");
  const locked = phase !== "select";
  const simulation = gateway.mode === "simulation";
  const compatibleAdults = action ? getCompatibleAdults(adults, { childIds: selectedIds, action }) : [];
  const entryCandidates = getCompatibleAdults(adults, { childIds: selectedIds, action: "entry" });
  const pickupCandidates = getCompatibleAdults(adults, { childIds: selectedIds, action: "pickup" });
  const noCommonAdult = (canMove(selected, "entry") && !entryCandidates.length)
    || (canMove(selected, "pickup") && !pickupCandidates.length);
  const incompatibleSelection = selected.length > 0 && !canMove(selected, "entry") && !canMove(selected, "pickup");
  const selectionIssue = incompatibleSelection
    ? selected.some(child => child.attendanceStatus !== "inside" && child.serviceStatus !== "active")
      ? { title: "Ingreso no habilitado", description: "Solicita una revisión con administración." }
      : { title: "Estados incompatibles", description: "Ajusta la selección para registrar una entrada o salida." }
    : noCommonAdult
      ? { title: "Sin un adulto autorizado en común", description: "Ajusta la selección para continuar." }
      : undefined;
  const identifiedAdult = authorization ? compatibleAdults.find(adult => adult.id === authorization.adult.id) : undefined;
  const relationship = identifiedAdult ? [...new Set(identifiedAdult.permissions.filter(permission => selectedIds.includes(permission.childId))
    .map(permission => permission.relationship))].join(" / ") : undefined;
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const counts = getReceptionCounts(children);
  const visible = children.filter(child => matchesReceptionFilter(child, filter)
    && normalized(`${child.name} ${child.lastName} ${child.classroom}`).includes(normalized(search.trim())));

  const reset = useCallback(() => {
    setSelectedIds([]);
    setSearch("");
    setFilter("all");
    setAction(null);
    setAuthorization(undefined);
    setReceipt(undefined);
    setReceiptReentry(false);
    setError("");
    setPhase("select");
    setMovementDetails(emptyMovementDetails());
    setNeedsDecision(false);
    savedDetails.current = undefined;
    entryDrafts.current = {};
    idempotencyKey.current = "";
  }, [setSelectedIds, setSearch, setFilter, setAction, setAuthorization, setReceipt, setReceiptReentry, setError, setPhase, setMovementDetails, setNeedsDecision]);

  useEffect(() => () => { operation.current += 1; }, []);
  useEffect(() => {
    const content = panelContent.current;
    content?.scrollTo({ top: 0 });
    content?.getAnimations().forEach(animation => animation.cancel());
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      content?.animate([
        { opacity: 0.85, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 180, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
    if (phase !== "select") panelHeading.current?.focus({ preventScroll: true });
  }, [phase, reset]);

  useEffect(() => {
    if (needsDecision) panelContent.current?.querySelector(".belongings-editor [role=alert]")?.scrollIntoView({ block: "nearest" });
  }, [needsDecision]);

  function chooseAction(nextAction: Movement) {
    if (busy.current || phase !== "select" || !canMove(selected, nextAction)) return;
    setAction(nextAction);
    setAuthorization(undefined);
    setError("");
    if (simulation && sharedState && nextAction === "pickup") {
      const pending = selectedIds.flatMap(id => outstandingBelongings(sharedState.belongings, sharedState.events, id));
      setMovementDetails({ ...emptyMovementDetails(), checks: carryExceptions(pending) });
    }
    const candidates = getCompatibleAdults(adults, { childIds: selectedIds, action: nextAction });
    setPhase(!candidates.length ? "blocked" : simulation && sharedState ? "belongings" : "ready");
  }

  function changeSelection() {
    if (busy.current) return;
    setPhase("select");
    setAction(null);
    setAuthorization(undefined);
    setError("");
    idempotencyKey.current = "";
    setMovementDetails(emptyMovementDetails());
    setNeedsDecision(false);
    savedDetails.current = undefined;
    entryDrafts.current = {};
  }

  function toggleNoBelongings(childId: string) {
    if (phase !== "belongings" || action !== "entry" || busy.current || !selectedIds.includes(childId)) return;
    const entry = movementDetails.entries[childId] ?? { registration: "unrecorded", items: [] };
    let next: EntryRegistration;
    if (entry.registration === "none") {
      next = entryDrafts.current[childId] ?? { registration: "unrecorded", items: [] };
      delete entryDrafts.current[childId];
    } else {
      entryDrafts.current[childId] = structuredClone(entry);
      next = { registration: "none", items: [] };
    }
    setMovementDetails(previous => ({ ...previous, entries: { ...previous.entries, [childId]: next } }));
  }

  function continueToBiometrics(skip = false) {
    if (busy.current || phase !== "belongings" || !action) return;
    if (simulation && sharedState && action === "pickup") {
      const pending = selectedIds.flatMap(id => outstandingBelongings(sharedState.belongings, sharedState.events, id));
      if (!skip && pending.some(item => !movementDetails.checks.some(check => check.itemId === item.id))) {
        setNeedsDecision(true);
        return;
      }
      // Skipping preserves the draft and records only untouched items as unchecked.
      // Existing deliveries, partial quantities, exceptions and comments are retained.
      if (skip) setMovementDetails(previous => ({ ...previous, checks: checkRemaining(pending, previous.checks, "unchecked") }));
    }
    setNeedsDecision(false);
    setError("");
    setPhase("ready");
  }

  function backToBelongings() {
    if (busy.current || !["ready", "denied", "review"].includes(phase)) return;
    setAuthorization(undefined);
    idempotencyKey.current = "";
    savedDetails.current = undefined;
    setError("");
    setPhase("belongings");
  }

  async function verify(outcome: SimulationOutcome = "authorized") {
    if (!action || !compatibleAdults.length || !canMove(selected, action) || busy.current || !["ready", "denied"].includes(phase)) return;
    if (!gateway.identify) {
      setError("No se pudo iniciar la identificación. Revisa la conexión con el lector e inténtalo de nuevo.");
      return;
    }
    if (simulation) onSimulationOutcomeChange?.(outcome);
    busy.current = true;
    const currentOperation = ++operation.current;
    const request = { childIds: [...selectedIds], action };
    setPhase("verifying");
    setError("");
    setAuthorization(undefined);
    try {
      const result = await gateway.identify({ ...request, candidateAdultIds: compatibleAdults.map(adult => adult.id) });
      if (currentOperation !== operation.current) return;
      if (!isAuthorized(result, request) || !compatibleAdults.some(adult => adult.id === result.adult.id)) {
        throw new ReceptionAuthorizationError("No se pudo validar la autorización vigente para todos los niños.");
      }
      setAuthorization(result);
      idempotencyKey.current = crypto.randomUUID();
      setPhase("review");
    } catch (cause) {
      if (currentOperation !== operation.current) return;
      setError(cause instanceof Error ? cause.message : "No se pudo leer la huella. Inténtalo de nuevo.");
      setPhase(cause instanceof ReceptionAuthorizationError ? "denied" : "ready");
    } finally {
      if (currentOperation === operation.current) busy.current = false;
    }
  }

  async function save() {
    if (!action || !authorization || busy.current || (phase !== "review" && phase !== "save-error")) return;
    const request = { childIds: [...selectedIds], action };
    // An ambiguous retry must reach the server with the same key, even if the
    // authorization has since expired: the first call may already have committed.
    if (phase === "review" && (!canMove(selected, action) || !isAuthorized(authorization, { ...request, adultId: authorization.adult.id })
      || !compatibleAdults.some(adult => adult.id === authorization.adult.id))) {
      setAuthorization(undefined);
      setError("La autorización cambió o venció. Vuelve a verificar la huella antes de registrar.");
      setPhase(compatibleAdults.length ? "ready" : "blocked");
      return;
    }
    busy.current = true;
    const currentOperation = ++operation.current;
    setError("");
    setPhase("saving");
    try {
      if (!savedDetails.current) savedDetails.current = structuredClone(movementDetails);
      const result = await gateway.save({ ...request, authorizationToken: authorization.token, idempotencyKey: idempotencyKey.current, ...(simulation && sharedState ? { details: savedDetails.current } : {}) });
      if (currentOperation !== operation.current) return;
      if (!isCompleteReceipt(result, request, authorization.adult.id)) {
        throw new Error("El servicio no confirmó el grupo completo. Reintenta para consultar el resultado del registro.");
      }
      setReceipt(result);
      setReceiptReentry(action === "entry" && reentry);
      setChildren(previous => previous.map(child => selectedIds.includes(child.id)
        ? { ...child, attendanceStatus: action === "entry" ? "inside" : "out" } : child));
      setPhase("success");
      const notification = getMovementNotification({
        receipt: result, children: selected, adult: authorization.adult, adultProfile: identifiedAdult,
        reentry,
      });
      toast(
        "success",
        notification.title,
        notification.description,
        {
          badge: simulation ? "Simulación" : undefined,
        },
      );
    } catch {
      if (currentOperation !== operation.current) return;
      setError("No se pudo confirmar el registro completo. Reintenta para recuperar el resultado sin duplicar movimientos.");
      setPhase("save-error");
    } finally {
      if (currentOperation === operation.current) busy.current = false;
    }
  }

  return (
    <div className="reception" data-phase={phase}
      data-selection-blocked={incompatibleSelection}>
      <div className="reception-body">
        <div className="reception-page-heading">
          <h1>Entradas y salidas</h1>
          {simulation && <p className="reception-mode">Simulación · datos ficticios · solo durante esta sesión</p>}
        </div>
        <div className="reception-stats" role="group" aria-label="Resumen de asistencia de hoy">
          {(["inside", "pending", "out", "all"] as const).map(value => (
            <div key={value} className="reception-stat">
              <strong>{counts[value]}</strong>
              <span>{value === "all" ? "Esperados hoy" : value === "out" ? "Ya salieron" : attendanceLabels[value]}</span>
            </div>
          ))}
        </div>
        <div className="reception-layout">
          <SelectChildStep children={visible} selectedIds={selectedIds} search={search} filterLabel={receptionFilterLabels[filter]}
            pendingCounts={sharedState ? Object.fromEntries(children.map(child => [child.id, outstandingBelongings(sharedState.belongings, sharedState.events, child.id).filter(item => item.stayId !== sharedState.stays[child.id]?.id || child.attendanceStatus !== "inside").length])) : undefined}
            filter={filter} onFilterChange={setFilter} disabled={locked} onSearch={setSearch} onToggle={id => {
              if (locked) return;
              setSelectedIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
            }} />
          <section className="reception-panel" aria-labelledby="movement-heading" aria-busy={phase === "verifying" || phase === "saving"}>
            <div className="reception-critical-context">
              <div className="reception-panel-top">
                <div className="reception-panel-title">
                  <h2 id="movement-heading" ref={panelHeading} tabIndex={-1}>Registrar movimiento</h2>
                  {phase !== "success" && selected.length > 0 && <span className="reception-selection-count"><UsersRound size={20} aria-hidden="true" /><strong key={selected.length}>{selected.length}</strong> {selected.length === 1 ? "alumno" : "alumnos"}</span>}
                </div>
                {!locked && selected.length > 0 && <Button type="button" variant="ghost" size="operational" className="reception-clear-selection" onClick={() => setSelectedIds([])}><ListX size={16} aria-hidden="true" />Limpiar selección</Button>}
              </div>
              <div className="reception-selection-context">
                <MovementIndicator movement={phase === "success" ? null : action}
                  label={action === "entry" ? entryLabel : "Salida"} />
                {phase !== "success" && <SelectedChildrenTags children={selected} />}
              </div>

            </div>
            <div className="reception-panel-content" ref={panelContent} tabIndex={0} role="region" aria-label="Contenido del movimiento">
              {authorization && ["review", "saving", "save-error"].includes(phase) && <AuthorizePickupStep relationship={relationship} candidateCount={compatibleAdults.length} childCount={selected.length} simulation={simulation} verifying={false} authorization={authorization} />}
              {phase === "select" && (selectionIssue
                ? <div className="reception-placeholder reception-selection-issue" role="status">
                    <div className="reception-symbol" key={selectionIssue.title}><ShieldAlert aria-hidden="true" /></div>
                    <h3>{selectionIssue.title}</h3>
                    <p>{selectionIssue.description}</p>
                  </div>
                : <div className="reception-placeholder"><div className="reception-symbol" key={selected.length ? "choose-movement" : "choose-child"}><MousePointer2 aria-hidden="true" /></div>
                    <h2>{selected.length ? "Elige el movimiento" : "¿Quién llega o se retira?"}</h2>
                    <p>{selected.length ? "Selecciona Entrada o Salida para continuar con el registro." : "Selecciona uno o varios niños de la lista para comenzar."}</p>
                  </div>)}
              {simulation && sharedState && action && phase === "belongings" && <>
                <h2>Pertenencias y comentarios</h2>
                <BelongingsEditor selected={selected} action={action} state={sharedState} details={movementDetails} disabled={false} needsDecision={needsDecision} onToggleNone={toggleNoBelongings} onChange={details => { setMovementDetails(details); setNeedsDecision(false); }} />
                <section className="movement-comment" aria-labelledby="movement-comment-heading">
                  <h3 id="movement-comment-heading">Comentario del movimiento</h3>
                  {selected.length > 1 && <label>Comentario común
                    <MovementCommentInput maxLength={1000} rows={2} value={movementDetails.commonComment}
                      placeholder="Opcional. Solo para este movimiento; no se envía a la familia."
                      onChange={event => setMovementDetails(previous => ({ ...previous, commonComment: event.target.value }))} />
                  </label>}
                  {selected.map(child => <label key={child.id}>Comentario para {child.name} {child.lastName}
                    <MovementCommentInput maxLength={1000} rows={2} value={movementDetails.childComments[child.id] ?? ""}
                      placeholder="Opcional. Solo para este movimiento; no se envía a la familia."
                      onChange={event => setMovementDetails(previous => ({ ...previous, childComments: { ...previous.childComments, [child.id]: event.target.value } }))} />
                  </label>)}
                </section>
              </>}

              {phase === "blocked" && <div className="reception-blocked" role="alert">
                <div className="reception-symbol"><ShieldAlert aria-hidden="true" /></div>
                <h2>No hay un adulto autorizado en común</h2>
                <p>Revisa los permisos o selecciona los niños de una misma familia para continuar.</p>
              </div>}
              {action && !authorization && compatibleAdults.length > 0 && ["ready", "denied", "verifying"].includes(phase) && <AuthorizePickupStep key={phase}
                denied={phase === "denied"} relationship={relationship} candidateCount={compatibleAdults.length} childCount={selected.length}
                simulation={simulation} verifying={phase === "verifying"} authorization={authorization} />}
              {error && phase !== "denied" && <p className="reception-warning reception-error" role="alert">{error}</p>}
              {simulation && sharedState && ["review", "saving", "save-error"].includes(phase) && <>
                <details className="reception-belonging-review"><summary>Pertenencias del movimiento · {action === "entry" ? Object.values(movementDetails.entries).reduce((sum, entry) => sum + entry.items.length, 0) : movementDetails.checks.length} artículos</summary>{selected.map(child => <div key={child.id}><strong>{child.name} {child.lastName}</strong><p>{action === "entry" ? movementDetails.entries[child.id]?.items.map(item => `${item.label} × ${item.quantity}`).join(", ") || (movementDetails.entries[child.id]?.registration === "none" ? "Sin pertenencias declaradas" : "Sin registro de pertenencias") : movementDetails.checks.filter(check => sharedState.belongings.some(item => item.id === check.itemId && item.childId === child.id)).map(check => `${sharedState.belongings.find(item => item.id === check.itemId)?.label}: ${check.quantity} · ${check.outcome === "delivered" ? "Entregado" : check.outcome === "unchecked" ? "Sin comprobar" : "Con excepción"}`).join(", ")}</p></div>)}</details>
                {(movementDetails.commonComment || Object.values(movementDetails.childComments).some(Boolean)) && <details className="reception-belonging-review"><summary>Comentarios del movimiento</summary>{movementDetails.commonComment && <p className="reception-comment-text">{movementDetails.commonComment}</p>}{selected.map(child => movementDetails.childComments[child.id] && <div key={child.id}><strong>{child.name} {child.lastName}</strong><p className="reception-comment-text">{movementDetails.childComments[child.id]}</p></div>)}</details>}
              </>}
              {["review", "saving", "save-error"].includes(phase) && <p className="reception-note reception-save-note" role="note">
                <Info size={18} aria-hidden="true" />
                <span>{action === "pickup"
                  ? `Antes de entregar ${selected.length === 1 ? "al niño" : "a los niños"}, verifica que el adulto presente sea la persona identificada.`
                  : "Antes de registrar la entrada, verifica que el adulto presente sea la persona identificada."}</span>
              </p>}
              {simulation && onSimulationOutcomeChange && phase === "ready" && <details className="reception-simulation-options"><summary>Pruebas de simulación</summary><button className="reception-button quiet"
                  title="Simular la huella de un adulto sin autorización para este grupo" onClick={() => verify("unauthorized")}>
                  <ShieldX size={16} aria-hidden="true" />Probar rechazo
                </button></details>}
              {simulation && onSimulateSaveError && phase === "review" && <details className="reception-simulation-options"><summary>Pruebas de simulación</summary><button className="reception-button quiet" onClick={() => { onSimulateSaveError(); setError("El siguiente guardado fallará antes de confirmar; podrás reintentar sin duplicar."); }}>Probar error en el siguiente guardado</button></details>}
              {phase === "success" && receipt && authorization && <ConfirmPickupStep receipt={receipt} selectedChildren={selected} adultName={authorization.adult.name} reentry={receiptReentry} simulation={simulation} />}
            </div>
            <footer className="reception-panel-footer" aria-label="Acciones del movimiento">
              {phase === "select" && entryContext && canMove(selected, "entry") && <p className="reception-entry-context" role="status"><Info size={22} aria-hidden="true" /><span>{entryContext}</span></p>}
              {phase === "select" && <div className="reception-actions">
                <Button size="operational" variant="outline" className="reception-button" disabled={!canMove(selected, "entry") || !entryCandidates.length} onClick={() => chooseAction("entry")}>{reentry ? <RotateCcw size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}{entryLabel}</Button>
                <Button size="operational" variant="outline" className="reception-button" disabled={!canMove(selected, "pickup") || !pickupCandidates.length} onClick={() => chooseAction("pickup")}><LogOut size={18} aria-hidden="true" />Salida</Button>
              </div>}
              {phase === "belongings" && <>
                <div className="reception-actions">
                  <Button size="operational" variant="outline" className="reception-button" onClick={() => continueToBiometrics(true)}>Omitir</Button>
                  <Button size="operational" className="reception-button primary" onClick={() => continueToBiometrics()}>Continuar</Button>
                </div>
              </>}
              {action && compatibleAdults.length > 0 && ["ready", "denied", "verifying"].includes(phase) && <Button size="operational" className="reception-button primary full" loading={phase === "verifying"} onClick={() => verify()}>
                {phase !== "verifying" && <ScanLine size={18} aria-hidden="true" />}
                {phase === "verifying" ? "Leyendo huella…" : phase === "denied" ? "Intentar de nuevo" : simulation ? "Simular huella" : "Leer huella"}
              </Button>}
              {["review", "saving", "save-error"].includes(phase) && <Button size="operational" className="reception-button primary full" loading={phase === "saving"} onClick={save}>
                {phase !== "saving" && <CircleCheck size={18} aria-hidden="true" />}
                {phase === "saving" ? "Guardando registro…" : phase === "save-error" ? "Reintentar registro" : `Confirmar ${action === "entry" ? entryLabel.toLocaleLowerCase("es") : "salida"}`}
              </Button>}

              {action && ["blocked", "belongings", "ready", "denied", "review"].includes(phase) && <div className="reception-flow-navigation">
                {simulation && sharedState && ["ready", "denied", "review"].includes(phase) && <button className="reception-button quiet" onClick={backToBelongings}><ArrowLeft size={16} aria-hidden="true" />Volver a pertenencias</button>}
                <button className="reception-button quiet" onClick={changeSelection}><ArrowLeft size={16} aria-hidden="true" />Cambiar selección</button>
              </div>}
              {phase === "success" && <Button size="operational" className="reception-button primary full" onClick={reset} autoFocus>Siguiente familia</Button>}
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
