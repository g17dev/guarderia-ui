import test from "node:test";
import assert from "node:assert/strict";
import { getReviewBelongings } from "../src/features/child-handover/reviewBelongings.ts";
import { emptyMovementDetails, outcomeLabels } from "../src/features/child-handover/belongings.ts";

const item = { id: "bottle", childId: "one", stayId: "stay", kind: "water", label: "Botella", details: "azul", quantity: 3, returnable: true, createdAt: "2026-11-27T08:00:00Z" };
const state = { children: [], movements: [], stays: { one: { id: "stay", registration: "recorded" } }, events: [], belongings: [item] };

test("el resumen conserva detalles y cantidades de artículos personalizados y no mezcla hermanos", () => {
  const draft = emptyMovementDetails();
  draft.entries.one = { registration: "recorded", items: [{ ...item, kind: "custom", label: "Gorra", quantity: 1 }] };
  draft.entries.two = { registration: "recorded", items: [{ ...item, label: "Mochila" }] };
  const rows = getReviewBelongings("one", "entry", draft, { ...state, belongings: [] });
  assert.deepEqual(rows.map(row => [row.label, row.details, row.quantity]), [["Gorra", "azul", 1]]);
  assert.equal(rows[0].outcome, undefined);
});

test("una entrega parcial nunca muestra las unidades restantes como entregadas", () => {
  const draft = emptyMovementDetails();
  draft.checks = [{ itemId: item.id, outcome: "delivered", quantity: 1, comment: "Recibe el padre" }];
  const before = structuredClone({ state, draft });
  const rows = getReviewBelongings("one", "pickup", draft, state);
  assert.deepEqual(rows.map(row => [row.quantity, row.outcome, row.comment]), [[1, "delivered", "Recibe el padre"], [2, "unchecked", ""]]);
  assert.deepEqual({ state, draft }, before);
});

test("todos los resultados de salida conservan su significado y observación", () => {
  for (const outcome of Object.keys(outcomeLabels)) {
    const draft = emptyMovementDetails();
    draft.checks = [{ itemId: item.id, outcome, quantity: 3, comment: "Observación ficticia" }];
    const [row] = getReviewBelongings("one", "pickup", draft, state);
    assert.equal(row.outcome, outcome);
    assert.equal(row.comment, "Observación ficticia");
    assert.equal(row.quantity, 3);
  }
});

test("omitir la comprobación y las entregas anteriores no inventa nuevas entregas", () => {
  const next = { ...state, events: [{ itemId: item.id, outcome: "delivered", quantity: 1 }] };
  const rows = getReviewBelongings("one", "pickup", emptyMovementDetails(), next);
  assert.deepEqual(rows.map(row => [row.quantity, row.outcome]), [[2, "unchecked"]]);
});

test("los pendientes anteriores conservan excepción, comentario y asociación al menor", () => {
  const next = { ...state, belongings: [{ ...item, stayId: "previous" }, { ...item, id: "sibling", childId: "two" }],
    events: [{ itemId: item.id, outcome: "missing", quantity: 3, comment: "Buscar en el salón" }] };
  const [row] = getReviewBelongings("one", "entry", emptyMovementDetails(), next);
  assert.equal(row.previous, true);
  assert.equal(row.outcome, "missing");
  assert.equal(row.comment, "Buscar en el salón");
  assert.equal(getReviewBelongings("one", "entry", emptyMovementDetails(), next).length, 1);
});
