import { outstandingBelongings, type BelongingKind, type PersonalCategory, type BelongingOutcome, type MovementDetails } from "./belongings.ts";
import type { OperationsState } from "./operations.ts";
import type { Movement } from "./reception.ts";

export interface ReviewBelonging {
  id: string;
  articleId: string;
  label: string;
  kind: BelongingKind;
  category?: PersonalCategory;
  details: string;
  quantity: number;
  outcome?: BelongingOutcome;
  comment: string;
  previous: boolean;
}

// Presentation only: retain unchecked quantities, exceptions and previous stays.
export function getReviewBelongings(childId: string, action: Movement, draft: MovementDetails, state: OperationsState): ReviewBelonging[] {
  const entries: ReviewBelonging[] = action === "entry" ? (draft.entries[childId]?.items ?? []).map((item, index) => ({
    id: `entry-${index}`, articleId: `entry-${index}`, label: item.label, kind: item.kind, category: item.custom?.category, details: item.details, quantity: item.quantity,
    comment: "", previous: false,
  })) : [];
  const pending = outstandingBelongings(state.belongings, state.events, childId).flatMap(item => {
    const check = draft.checks.find(candidate => candidate.itemId === item.id);
    const base = { id: item.id, articleId: item.id, label: item.label, kind: item.kind, category: item.custom?.category, details: item.details,
      previous: action === "entry" || item.stayId !== state.stays[childId]?.id };
    if (!check) return [{ ...base, quantity: item.remaining,
      outcome: action === "entry" ? item.lastOutcome : "unchecked" as const,
      comment: action === "entry" ? item.lastComment : "" }];
    const rows: ReviewBelonging[] = [{ ...base, quantity: check.quantity, outcome: check.outcome, comment: check.comment }];
    if (check.quantity < item.remaining) rows.push({ ...base, id: `${item.id}-remaining`,
      quantity: item.remaining - check.quantity, outcome: "unchecked", comment: "" });
    return rows;
  });
  return [...entries, ...pending];
}
