import test from "node:test";
import assert from "node:assert/strict";
import { emptyMovementDetails } from "../src/features/child-handover/belongings.ts";
import { commitMovement } from "../src/features/child-handover/operations.ts";
import { getReceiptBelongings } from "../src/features/child-handover/receiptBelongings.ts";

const at = "2026-11-28T10:00:00Z";
const item = { id: "bottle", childId: "one", stayId: "stay", kind: "water", label: "Botella", details: "azul", quantity: 3, returnable: true, createdAt: "2026-11-28T08:00:00Z" };
const initial = () => ({ children: [{ id: "one", attendanceStatus: "inside", serviceStatus: "active" }],
  movements: [], belongings: [item], events: [], stays: { one: { id: "stay", registration: "recorded" } } });

function save(state, action, details, ids = ["one"]) {
  const receipt = { id: "saved", childIds: ids, adultId: "adult", action, savedAt: at };
  return commitMovement(state, { ...receipt, details, authorizationToken: "demo", idempotencyKey: "demo" }, receipt, "Adulto ficticio");
}

test("el comprobante muestra una entrega completa aunque el saldo posterior ya sea cero", () => {
  const details = emptyMovementDetails();
  details.checks = [{ itemId: item.id, outcome: "delivered", quantity: 3, comment: "" }];
  const state = save(initial(), "pickup", details);
  const before = structuredClone(state);
  assert.deepEqual(getReceiptBelongings(state.movements[0], state, "one").map(row => [row.quantity, row.outcome]), [[3, "delivered"]]);
  assert.deepEqual(state, before);
});

test("una entrega parcial conserva el saldo sin comprobar y descuenta entregas históricas una sola vez", () => {
  const old = initial();
  old.events = [{ id: "previous", itemId: item.id, outcome: "delivered", quantity: 1, comment: "", at: "2026-11-28T09:00:00Z" }];
  const details = emptyMovementDetails();
  details.checks = [{ itemId: item.id, outcome: "delivered", quantity: 1, comment: "" }];
  const state = save(old, "pickup", details);
  assert.deepEqual(getReceiptBelongings(state.movements[0], state, "one").map(row => [row.quantity, row.outcome]), [[1, "delivered"], [1, "unchecked"]]);
});

test("las pertenencias nuevas de entrada no se duplican al leer los snapshots confirmados", () => {
  const old = initial(); old.belongings = []; old.children[0].attendanceStatus = "pending";
  const details = emptyMovementDetails();
  details.entries.one = { registration: "recorded", items: [{ ...item, kind: "custom", label: "Gorra", quantity: 1 }] };
  const state = save(old, "entry", details);
  const rows = getReceiptBelongings(state.movements[0], state, "one");
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].label, rows[0].details, rows[0].quantity, rows[0].outcome], ["Gorra", "azul", 1, undefined]);
});

test("las excepciones guardadas y las asociaciones entre hermanos conservan su significado", () => {
  const old = initial();
  old.children.push({ id: "two", attendanceStatus: "inside", serviceStatus: "active" });
  old.belongings.push({ ...item, id: "backpack", childId: "two", label: "Mochila", quantity: 1 });
  const details = emptyMovementDetails();
  details.checks = [{ itemId: item.id, outcome: "missing", quantity: 3, comment: "Buscar en el salón" },
    { itemId: "backpack", outcome: "unchecked", quantity: 1, comment: "" }];
  const state = save(old, "pickup", details, ["one", "two"]);
  const first = getReceiptBelongings(state.movements[0], state, "one");
  const second = getReceiptBelongings(state.movements[0], state, "two");
  assert.deepEqual(first.map(row => [row.label, row.outcome, row.comment]), [["Botella", "missing", "Buscar en el salón"]]);
  assert.deepEqual(second.map(row => [row.label, row.outcome]), [["Mochila", "unchecked"]]);
});

test("resolver un pendiente después del movimiento no reescribe su comprobante", () => {
  const details = emptyMovementDetails();
  details.checks = [{ itemId: item.id, outcome: "unchecked", quantity: 3, comment: "" }];
  const state = save(initial(), "pickup", details);
  state.events.push({ id: "later", itemId: item.id, outcome: "delivered", quantity: 3, comment: "", at: "2026-11-28T11:00:00Z" });
  assert.deepEqual(getReceiptBelongings(state.movements[0], state, "one").map(row => [row.quantity, row.outcome]), [[3, "unchecked"]]);
});
