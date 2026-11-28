import type { OperationsState, StoredMovement } from "./operations.ts";
import { getReviewBelongings } from "./reviewBelongings.ts";

// Reconstruct the presentation from the saved draft and item snapshots, not the
// editable draft or the post-save balance (which already includes this delivery).
export function getReceiptBelongings(movement: StoredMovement, state: OperationsState, childId: string) {
  const { receipt, details, itemSnapshots } = movement;
  const before: OperationsState = {
    ...state,
    belongings: receipt.action === "entry"
      ? itemSnapshots.filter(item => details.checks.some(check => check.itemId === item.id))
      : itemSnapshots,
    events: state.events.filter(event => event.movementId !== receipt.id
      && Date.parse(event.at) <= Date.parse(receipt.savedAt)),
  };
  return getReviewBelongings(childId, receipt.action, details, before);
}
