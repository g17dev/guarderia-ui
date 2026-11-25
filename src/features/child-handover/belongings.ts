export const belongingCatalog = [
  { kind: "backpack", label: "Mochila", returnable: true },
  { kind: "water", label: "Botella de agua", returnable: true },
  { kind: "container", label: "Tupper", returnable: true },
  { kind: "toy", label: "Juguete", returnable: true },
  { kind: "lunchbox", label: "Lonchera", returnable: true },
  { kind: "bottle", label: "Biberón", returnable: true },
  { kind: "clothes", label: "Ropa", returnable: true },
  { kind: "blanket", label: "Cobija", returnable: true },
  { kind: "diapers", label: "Pañales", returnable: false },
] as const;
export type BelongingKind = typeof belongingCatalog[number]["kind"] | "custom";
export type EntryBelonging = { kind: BelongingKind; label: string; quantity: number; details: string; returnable: boolean };
export type EntryRegistration = { registration: "unrecorded" | "none" | "recorded"; items: EntryBelonging[] };
export const outcomeLabels = {
  delivered: "Entregado", stays: "Permanece en guardería", missing: "No localizado",
  later: "Se recogerá después", consumed: "Consumido o utilizado", unchecked: "Sin comprobar",
} as const;
export type BelongingOutcome = keyof typeof outcomeLabels;
export type BelongingCheck = { itemId: string; outcome: BelongingOutcome; quantity: number; comment: string };
export type MovementDetails = {
  entries: Record<string, EntryRegistration>;
  checks: BelongingCheck[];
  commonComment: string;
  childComments: Record<string, string>;
};
export type BelongingItem = EntryBelonging & { id: string; childId: string; stayId: string; createdAt: string };
export type BelongingEvent = BelongingCheck & { id: string; at: string; movementId?: string };
export type OutstandingBelonging = BelongingItem & { remaining: number; lastOutcome: BelongingOutcome; lastComment: string };
export const emptyMovementDetails = (): MovementDetails => ({ entries: {}, checks: [], commonComment: "", childComments: {} });

export function outstandingBelongings(items: BelongingItem[], events: BelongingEvent[], childId: string): OutstandingBelonging[] {
  return items.filter(item => item.childId === childId).flatMap(item => {
    const history = events.filter(event => event.itemId === item.id);
    const remaining = item.quantity - history.filter(event => event.outcome === "delivered" || event.outcome === "consumed").reduce((sum, event) => sum + event.quantity, 0);
    const last = history.filter(event => event.outcome !== "delivered" && event.outcome !== "consumed").at(-1);
    return remaining > 0 ? [{ ...item, remaining, lastOutcome: last?.outcome ?? "unchecked", lastComment: last?.comment ?? "" }] : [];
  });
}
export function frequentBelongings(items: BelongingItem[], childId: string) {
  const stays = new Set(items.filter(item => item.childId === childId).map(item => item.stayId));
  if (stays.size < 3) return belongingCatalog.slice(0, 4);
  const counts = new Map<string, number>();
  for (const kind of belongingCatalog.map(item => item.kind)) {
    counts.set(kind, new Set(items.filter(item => item.childId === childId && item.kind === kind).map(item => item.stayId)).size);
  }
  return [...belongingCatalog].sort((a, b) => (counts.get(b.kind) ?? 0) - (counts.get(a.kind) ?? 0)).slice(0, 4);
}
export function checkRemaining(items: OutstandingBelonging[], checks: BelongingCheck[], outcome: "delivered" | "unchecked") {
  return [...checks, ...items.filter(item => !checks.some(check => check.itemId === item.id)).map(item => ({ itemId: item.id, quantity: item.remaining, outcome, comment: "" }))];
}
export function carryExceptions(items: OutstandingBelonging[]): BelongingCheck[] {
  return items.filter(item => ["stays", "missing", "later"].includes(item.lastOutcome)).map(item => ({ itemId: item.id, quantity: item.remaining, outcome: item.lastOutcome, comment: item.lastComment }));
}
export function validateEntry(item: EntryBelonging) {
  if (!item.label.trim() || item.label.length > 80 || item.details.length > 240 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Revisa el nombre, la cantidad (1–99) y los detalles de la pertenencia.");
}
export function validateCheck(item: OutstandingBelonging, check: BelongingCheck) {
  if (!Object.hasOwn(outcomeLabels, check.outcome) || !Number.isInteger(check.quantity) || check.quantity < 1 || check.quantity > item.remaining || check.comment.length > 240 || (item.returnable && check.outcome === "consumed")) throw new Error("Revisa el resultado y la cantidad de la pertenencia.");
}
