import { outstandingBelongings } from "../../child-handover/belongings.ts";
import type { OperationsState } from "../../child-handover/operations.ts";

export const BELONGINGS_FOLLOW_UP_DELAY_MS = 24 * 60 * 60 * 1000;

// Visibility only. A stored receipt is evidence of a completed, authorized
// handover; preview calendar records and today's permissions are not that proof.
export function getOverdueBelongings(state: OperationsState, childId: string, now = Date.now()) {
  const child = state.children.find(candidate => candidate.id === childId);
  if (!child || child.attendanceStatus === "inside" || !Number.isFinite(now)) return undefined;
  const movements = state.movements.filter(movement => movement.receipt.childIds.includes(childId)
    && Number.isFinite(Date.parse(movement.receipt.savedAt)));
  const latest = [...movements].sort((a, b) => Date.parse(a.receipt.savedAt) - Date.parse(b.receipt.savedAt)).at(-1);
  if (!latest || latest.receipt.action !== "pickup" || !latest.receipt.adultId.trim()
    || now - Date.parse(latest.receipt.savedAt) < BELONGINGS_FOLLOW_UP_DELAY_MS) return undefined;

  const leftAt = Date.parse(latest.receipt.savedAt);
  const items = outstandingBelongings(state.belongings, state.events, childId).filter(item => item.returnable
    && !!item.stayId.trim() && Date.parse(item.createdAt) <= leftAt
    && latest.itemSnapshots.some(snapshot => snapshot.id === item.id && snapshot.childId === childId && snapshot.stayId === item.stayId));
  return items.length ? { movement: latest, items } : undefined;
}
