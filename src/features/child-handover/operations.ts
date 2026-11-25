import { emptyMovementDetails, outstandingBelongings, validateCheck, validateEntry, type BelongingCheck, type BelongingEvent, type BelongingItem, type EntryBelonging, type EntryRegistration, type MovementDetails } from "./belongings.ts";
import type { MovementReceipt, ReceptionChild, ReceptionGateway } from "./reception.ts";

export type StoredMovement = { receipt: MovementReceipt; adultName: string; details: MovementDetails; itemSnapshots: BelongingItem[] };
export type OperationsState = {
  children: ReceptionChild[];
  belongings: BelongingItem[];
  events: BelongingEvent[];
  movements: StoredMovement[];
  stays: Record<string, { id: string; registration: EntryRegistration["registration"] }>;
};

export function recordResolution(state: OperationsState, childId: string, check: BelongingCheck, id: string, at: string): OperationsState {
  const item = outstandingBelongings(state.belongings, state.events, childId).find(candidate => candidate.id === check.itemId);
  if (!item) throw new Error("Esta pertenencia ya no está pendiente.");
  validateCheck(item, check);
  return { ...state, events: [...state.events, { ...check, id, at }] };
}

export function addStayBelongings(state: OperationsState, childId: string, items: EntryBelonging[], at: string, newId: () => string): OperationsState {
  const child = state.children.find(candidate => candidate.id === childId);
  if (child?.attendanceStatus !== "inside") throw new Error("Solo puedes agregar pertenencias durante una estancia activa.");
  items.forEach(validateEntry);
  const stayId = state.stays[childId]?.id ?? `demo-stay-${childId}`;
  return { ...state,
    stays: { ...state.stays, [childId]: { id: stayId, registration: "recorded" } },
    belongings: [...state.belongings, ...items.map(item => ({ ...item, label: item.label.trim(), id: newId(), childId, stayId, createdAt: at }))],
  };
}

// Pure transition: errors never mutate the previous snapshot.
export function commitMovement(state: OperationsState, request: Parameters<ReceptionGateway["save"]>[0], receipt: MovementReceipt, adultName: string): OperationsState {
  if (state.movements.some(movement => movement.receipt.id === receipt.id)) return state;
  const details = structuredClone(request.details ?? emptyMovementDetails());
  const selectedIds = new Set(request.childIds);
  if ([...Object.keys(details.entries), ...Object.keys(details.childComments)].some(id => !selectedIds.has(id))) throw new Error("Los detalles deben corresponder a los menores seleccionados.");
  if (details.commonComment.length > 1000 || Object.values(details.childComments).some(text => text.length > 1000)) throw new Error("Los comentarios admiten hasta 1000 caracteres.");
  if (new Set(details.checks.map(check => check.itemId)).size !== details.checks.length) throw new Error("Una pertenencia aparece más de una vez.");
  const stays = { ...state.stays };
  const additions: BelongingItem[] = [];
  if (request.action === "entry") {
    for (const childId of request.childIds) {
      const registration = details.entries[childId] ?? { registration: "unrecorded", items: [] };
      if (!["unrecorded", "none", "recorded"].includes(registration.registration) || (registration.registration !== "recorded" && registration.items.length) || (registration.registration === "recorded" && !registration.items.length)) throw new Error("Revisa el registro de pertenencias de entrada.");
      stays[childId] = { id: `${receipt.id}:${childId}`, registration: registration.registration };
      registration.items.forEach((item, index) => {
        validateEntry(item);
        additions.push({ ...item, label: item.label.trim(), details: item.details.trim(), childId, id: `${receipt.id}:${childId}:${index}`, stayId: stays[childId].id, createdAt: receipt.savedAt });
      });
    }
  } else if (Object.values(details.entries).some(entry => entry.items.length)) throw new Error("Las pertenencias nuevas se registran en la entrada o durante la estancia.");

  const outstanding = request.childIds.flatMap(id => outstandingBelongings(state.belongings, state.events, id));
  for (const check of details.checks) {
    const item = outstanding.find(candidate => candidate.id === check.itemId);
    if (!item) throw new Error("La pertenencia ya no está pendiente o corresponde a otro menor.");
    validateCheck(item, check);
  }
  // An unchecked result on pickup is explicit, never inferred by a successful save.
  if (request.action === "pickup" && outstanding.some(item => !details.checks.some(check => check.itemId === item.id))) throw new Error("Comprueba las pertenencias restantes o elige «Sin comprobar».");
  const events = details.checks.map((check, index): BelongingEvent => ({ ...check, id: `${receipt.id}:event:${index}`, at: receipt.savedAt, movementId: receipt.id }));
  return {
    children: state.children.map(child => selectedIds.has(child.id) ? { ...child, attendanceStatus: request.action === "entry" ? "inside" : "out" } : child),
    belongings: [...state.belongings, ...additions], events: [...state.events, ...events], stays,
    movements: [...state.movements, { receipt: structuredClone(receipt), adultName, details, itemSnapshots: [...additions, ...outstanding.map(item => ({ ...item }))] }],
  };
}
