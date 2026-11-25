import { useEffect, useRef, useState } from "react";
import { canMove, getCompatibleAdults, isAuthorized, isCompleteReceipt, type Authorization, type Movement, type MovementReceipt, type ReceptionChild } from "../child-handover/reception";
import { createLabSimulation } from "./labSimulation";
import { labAdults, scenarioSelection, type Scenario } from "./labData";

export function useLabReception(initialChildren: ReceptionChild[], scenario: Scenario) {
  const [children, setChildren] = useState(initialChildren);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => scenarioSelection(scenario));
  const [action, setAction] = useState<Movement>();
  const [wasReentry, setWasReentry] = useState(false);
  const [phase, setPhase] = useState<"select" | "identify" | "verifying" | "review" | "saving" | "error" | "success">("select");
  const [authorization, setAuthorization] = useState<Authorization>();
  const [receipt, setReceipt] = useState<MovementReceipt>();
  const [error, setError] = useState("");
  const busy = useRef(false);
  const alive = useRef(true);
  const key = useRef("");
  const [gateway] = useState(() => createLabSimulation(initialChildren, labAdults, scenario));
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const selected = children.filter(child => selectedIds.includes(child.id));
  const candidates = action ? getCompatibleAdults(labAdults, { childIds: selectedIds, action }) : [];
  function toggle(id: string) {
    if (phase !== "select") return;
    setSelectedIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  }
  function choose(next: Movement) {
    if (busy.current || phase !== "select" || !canMove(selected, next)) return;
    if (!getCompatibleAdults(labAdults, { childIds: selectedIds, action: next }).length) return;
    setWasReentry(next === "entry" && selected.every(child => child.attendanceStatus === "out"));
    setAction(next); setError(""); setPhase("identify");
  }
  function reset() {
    if (busy.current) return;
    setPhase("select"); setAuthorization(undefined); setReceipt(undefined); setAction(undefined); setWasReentry(false); setSelectedIds([]); setError(""); key.current = "";
  }
  async function identify() {
    if (busy.current || !action || !["identify"].includes(phase) || !canMove(selected, action) || !candidates.length) return;
    busy.current = true; setPhase("verifying"); setError("");
    const request = { childIds: [...selectedIds], action };
    try {
      const result = await gateway.identify!({ ...request, candidateAdultIds: candidates.map(adult => adult.id) });
      if (!alive.current) return;
      if (!isAuthorized(result, request) || !candidates.some(adult => adult.id === result.adult.id)) throw new Error("No se pudo comprobar el permiso para todo el grupo.");
      key.current = crypto.randomUUID(); setAuthorization(result); setPhase("review");
    } catch (cause) {
      if (alive.current) { setError(cause instanceof Error ? cause.message : "No se pudo identificar al adulto."); setPhase("identify"); }
    } finally { busy.current = false; }
  }
  async function save() {
    if (busy.current || !action || !authorization || !["review", "error"].includes(phase)) return;
    const request = { childIds: [...selectedIds], action };
    // Ambiguous retries use the same key, even after the original authorization expires.
    if (phase === "review" && (!canMove(selected, action) || !isAuthorized(authorization, request) || !candidates.some(adult => adult.id === authorization.adult.id))) {
      setAuthorization(undefined); setError("La autorización venció o cambió. Identifica al adulto otra vez."); setPhase("identify"); return;
    }
    busy.current = true; setPhase("saving"); setError("");
    try {
      const result = await gateway.save({ ...request, authorizationToken: authorization.token, idempotencyKey: key.current });
      if (!alive.current) return;
      if (!isCompleteReceipt(result, request, authorization.adult.id)) throw new Error("Recibo incompleto");
      setReceipt(result); setChildren(previous => previous.map(child => selectedIds.includes(child.id) ? { ...child, attendanceStatus: action === "entry" ? "inside" : "out" } : child)); setPhase("success");
    } catch {
      if (alive.current) { setError("No se confirmó el resultado completo. Reintenta para recuperar el registro sin duplicar movimientos."); setPhase("error"); }
    } finally { busy.current = false; }
  }
  return { children, selectedIds, selected, action, wasReentry, phase, authorization, receipt, error, candidates, toggle, choose, reset, identify, save };
}
