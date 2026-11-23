import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../context/toastStore";
import { LogIn, LogOut, RotateCcw, MousePointer2, ArrowLeft, UsersRound, ShieldX, ShieldAlert, CircleCheck, LoaderCircle, Info } from "lucide-react";
import { SelectChildStep } from "./SelectChildStep";
import { AuthorizePickupStep } from "./AuthorizePickupStep";
import { ConfirmPickupStep } from "./ConfirmPickupStep";
import { getMovementNotification } from "./movementNotification";
import type { SimulationOutcome } from "./receptionSimulation";
import { RECEPTION_EXAMPLE_CHILDREN } from "./receptionFixtures";
import {
  attendanceLabels, getCompatibleAdults, receptionFilterLabels, matchesReceptionFilter, getReceptionCounts, canMove, disconnectedGateway, ReceptionAuthorizationError, isAuthorized, isCompleteReceipt,
  type ReceptionFilter, type Authorization, type Movement, type MovementReceipt,
  type ReceptionChild, type ReceptionAdult, type ReceptionGateway,
} from "./reception";
import "./ReceptionScreen.css";

type Phase = "select" | "blocked" | "denied" | "ready" | "verifying" | "review" | "saving" | "save-error" | "success";
interface ReceptionScreenProps {
  initialChildren?: ReceptionChild[];
  gateway?: ReceptionGateway;
  adults?: ReceptionAdult[];
  onSimulationOutcomeChange?: (outcome: SimulationOutcome) => void;
}

export function ReceptionScreen({ initialChildren = RECEPTION_EXAMPLE_CHILDREN, gateway = disconnectedGateway, adults = [], onSimulationOutcomeChange }: ReceptionScreenProps) {
  const { toast } = useToast();
  const [children, setChildren] = useState(initialChildren);
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
    idempotencyKey.current = "";
  }, [setSelectedIds, setSearch, setFilter, setAction, setAuthorization, setReceipt, setError, setPhase]);

  useEffect(() => () => { operation.current += 1; }, []);
  useEffect(() => {
    if (phase !== "select") panelHeading.current?.focus({ preventScroll: true });
    if (phase === "success") {
      const timer = window.setTimeout(reset, 5000);
      return () => window.clearTimeout(timer);
    }
  }, [phase, reset]);

  function chooseAction(nextAction: Movement) {
    if (busy.current || phase !== "select" || !canMove(selected, nextAction)) return;
    setAction(nextAction);
    setAuthorization(undefined);
    setError("");
    const candidates = getCompatibleAdults(adults, { childIds: selectedIds, action: nextAction });
    setPhase(!candidates.length ? "blocked" : "ready");
  }

  function changeSelection() {
    if (busy.current) return;
    setPhase("select");
    setAction(null);
    setAuthorization(undefined);
    setError("");
    idempotencyKey.current = "";
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
      const result = await gateway.save({ ...request, authorizationToken: authorization.token, idempotencyKey: idempotencyKey.current });
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
      data-selection-blocked={selected.length > 0 && !canMove(selected, "entry") && !canMove(selected, "pickup")}>
      <div className="reception-body">
        <div className="reception-page-heading">
          <div><p className="reception-eyebrow">RECEPCIÓN{simulation && <span className="reception-demo-label">Simulación · lector listo</span>}</p><h1>Entradas y Salidas</h1>
            <p className="reception-subtitle">Selecciona a los niños. La huella valida quién los entrega o recoge.</p></div>
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
            filter={filter} onFilterChange={setFilter} disabled={locked} onSearch={setSearch} onToggle={id => {
              if (locked) return;
              setSelectedIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
            }} />
          <section className="reception-panel" aria-labelledby="movement-heading" aria-busy={phase === "verifying" || phase === "saving"}>
            <div className="reception-panel-top"><h2 id="movement-heading" ref={panelHeading} tabIndex={-1}>{phase === "success" ? "Todo listo" : action ? `${action === "entry" ? entryLabel : "Salida"} · ${selected.length} ${selected.length === 1 ? "niño" : "niños"}` : selected.length ? `Selección · ${selected.length} ${selected.length === 1 ? "niño" : "niños"}` : "Registrar movimiento"}</h2>
              {!locked && selected.length > 0 && <button className="reception-text-button" onClick={() => setSelectedIds([])}>Limpiar selección</button>}</div>
            {phase !== "success" && <>
              {selected.length > 0 && <div className="reception-picked" aria-label="Niños seleccionados">
                <strong><UsersRound size={14} aria-hidden="true" />{selected.length} {selected.length === 1 ? "niño" : "niños"}</strong>
                <span title={selected.map(child => `${child.name} ${child.lastName}`).join(", ")}>
                  {selected.map(child => `${child.name} ${child.lastName}`).join(", ")}
                </span>
              </div>}
              <div className="reception-actions">
                <button className={`reception-button ${action === "entry" ? "primary" : ""}`} disabled={locked || !canMove(selected, "entry") || !entryCandidates.length} onClick={() => chooseAction("entry")}>{reentry ? <RotateCcw size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}{entryLabel}</button>
                <button className={`reception-button ${action === "pickup" ? "primary" : ""}`} disabled={locked || !canMove(selected, "pickup") || !pickupCandidates.length} onClick={() => chooseAction("pickup")}><LogOut size={18} aria-hidden="true" />Salida</button>
              </div>
            </>}
            {phase === "select" && <div className="reception-placeholder"><div className="reception-symbol"><MousePointer2 aria-hidden="true" /></div>
              <h2>{selected.length ? "Elige el movimiento" : "¿A quién vienen a buscar?"}</h2>
              <p>{selected.length ? "Selecciona Entrada o Salida para continuar con el registro." : "Selecciona uno o varios niños de la lista para comenzar."}</p>
              {noCommonAdult && <p className="reception-warning" role="status"><ShieldAlert size={16} aria-hidden="true" />No hay un adulto autorizado en común. Ajusta la selección para continuar.</p>}
              {selected.length > 0 && !canMove(selected, "entry") && !canMove(selected, "pickup") && <p className="reception-warning" role="status">{selected.some(child => child.attendanceStatus !== "inside" && child.serviceStatus !== "active")
                  ? "Ingreso no habilitado. Solicita una revisión con administración."
                  : "Estados incompatibles: ajusta la selección para registrar."}</p>}
            </div>}
            {phase === "select" && entryContext && canMove(selected, "entry") && <p className="reception-entry-context" role="status"><Info size={22} aria-hidden="true" /><span>{entryContext}</span></p>}
            {phase === "blocked" && <div className="reception-blocked" role="alert">
              <div className="reception-symbol"><ShieldAlert aria-hidden="true" /></div>
              <h2>No hay un adulto autorizado en común</h2>
              <p>Revisa los permisos o selecciona los niños de una misma familia para continuar.</p>
            </div>}
            {action && compatibleAdults.length > 0 && ["ready", "denied", "verifying", "review", "saving", "save-error"].includes(phase) && <AuthorizePickupStep key={phase}
              denied={phase === "denied"} relationship={relationship} candidateCount={compatibleAdults.length} childCount={selected.length}
              simulation={simulation} verifying={phase === "verifying"} authorization={authorization} onVerify={() => verify()} onChangeSelection={changeSelection} />}
            {error && phase !== "denied" && <p className="reception-warning reception-error" role="alert">{error}</p>}
            {["review", "saving", "save-error"].includes(phase) && <button className="reception-button primary full" disabled={phase === "saving"} onClick={save}>
              {phase === "saving" ? <LoaderCircle size={18} className="reception-spin" aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
              {phase === "saving" ? "Guardando registro…" : phase === "save-error" ? "Reintentar registro" : `Confirmar ${action === "entry" ? entryLabel.toLocaleLowerCase("es") : "salida"}`}
            </button>}
            {phase === "review" && <p className="reception-note reception-save-note" role="note">
              <Info size={18} aria-hidden="true" />
              <span>{action === "pickup"
                ? `Antes de entregar ${selected.length === 1 ? "al niño" : "a los niños"}, verifica que el adulto presente sea la persona identificada.`
                : "Antes de registrar la entrada, verifica que el adulto presente sea la persona identificada."}</span>
            </p>}
            {action && ["blocked", "ready", "review"].includes(phase) && <div className="reception-flow-navigation">
              {simulation && onSimulationOutcomeChange && phase === "ready" && <button className="reception-button quiet"
                title="Simular la huella de un adulto sin autorización para este grupo" onClick={() => verify("unauthorized")}>
                <ShieldX size={16} aria-hidden="true" />Probar rechazo
              </button>}
              <button className="reception-button quiet" onClick={changeSelection}><ArrowLeft size={16} aria-hidden="true" />Cambiar selección</button>
            </div>}
            {phase === "success" && receipt && authorization && <ConfirmPickupStep receipt={receipt} selectedChildren={selected} adultName={authorization.adult.name} reentry={receiptReentry} simulation={simulation} onFinish={reset} />}
          </section>
        </div>
      </div>
    </div>
  );
}
