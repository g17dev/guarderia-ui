import { useSyncExternalStore } from "react";
import { MOCK_CHILDREN } from "../../data/mockChildren";
import { RECEPTION_EXAMPLE_ADULTS, RECEPTION_EXAMPLE_CHILDREN } from "./receptionFixtures";
import { createReceptionSimulation, type SimulationOutcome } from "./receptionSimulation";
import { addStayBelongings, commitMovement, recordResolution, type OperationsState } from "./operations";
import { type BelongingCheck, type BelongingItem, type EntryBelonging } from "./belongings";
import type { ReceptionChild, ReceptionGateway } from "./reception";

const children: ReceptionChild[] = [...RECEPTION_EXAMPLE_CHILDREN, ...MOCK_CHILDREN.filter(child => !RECEPTION_EXAMPLE_CHILDREN.some(item => item.id === child.id)).map(child => ({ ...child, attendanceStatus: "pending" as const, serviceStatus: "inactive" as const }))];
const started = new Date(); started.setHours(8, 0, 0, 0);
const yesterday = new Date(started); yesterday.setDate(yesterday.getDate() - 1);
const seed = (id: string, childId: string, kind: EntryBelonging["kind"], label: string, quantity = 1, previous = false): BelongingItem => ({ id, childId, kind, label, quantity, details: "Ejemplo ficticio", returnable: kind !== "diapers", stayId: previous ? "demo-previous" : `demo-stay-${childId}`, createdAt: (previous ? yesterday : started).toISOString() });
let snapshot: OperationsState = {
  children, movements: [],
  stays: Object.fromEntries(children.filter(child => child.attendanceStatus === "inside").map(child => [child.id, { id: `demo-stay-${child.id}`, registration: child.id === "reception-example-sibling" ? "none" : "recorded" }])),
  belongings: [seed("demo-backpack", "1", "backpack", "Mochila"), seed("demo-water", "1", "water", "Botella de agua"), seed("demo-toy", "1", "toy", "Juguete", 1, true), seed("demo-diapers", "4", "diapers", "Pañales", 3)],
  events: [{ id: "demo-later", itemId: "demo-toy", outcome: "later", quantity: 1, comment: "Se recogerá en la próxima visita.", at: yesterday.toISOString() }],
};
const listeners = new Set<() => void>();
function publish(next: OperationsState) { snapshot = next; for (const listener of listeners) listener(); }
let outcome: SimulationOutcome = "authorized";
let failNext = false;
const gateway = createReceptionSimulation(children, RECEPTION_EXAMPLE_ADULTS, {
  getFingerprintAdultId: () => outcome === "unauthorized" ? "demo-not-authorized" : undefined,
  onCommit(request, receipt) {
    const adult = RECEPTION_EXAMPLE_ADULTS.find(item => item.id === receipt.adultId);
    const next = commitMovement(snapshot, request, receipt, adult?.name ?? "Adulto de prueba");
    publish(next);
  },
});
export const operationalSimulation = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  changeOutcome(value: SimulationOutcome) { outcome = value; },
  failNextSave() { failNext = true; },
  gateway: { ...gateway, async save(request) {
    // A transport failure before commitment must leave every part unchanged.
    if (failNext) { failNext = false; throw new Error("Fallo de guardado simulado"); }
    return gateway.save(request);
  } } satisfies ReceptionGateway,
  resolve(childId: string, check: BelongingCheck) {
    publish(recordResolution(snapshot, childId, check, crypto.randomUUID(), new Date().toISOString()));
  },
  addDuringStay(childId: string, items: EntryBelonging[]) {
    publish(addStayBelongings(snapshot, childId, items, new Date().toISOString(), () => crypto.randomUUID()));
  },
};
export function useOperationalSimulation() {
  return useSyncExternalStore(operationalSimulation.subscribe, operationalSimulation.getSnapshot);
}
