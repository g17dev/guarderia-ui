import test from "node:test";
import assert from "node:assert/strict";
import { emptyMovementDetails } from "../src/features/child-handover/belongings.ts";
import { addStayBelongings, commitMovement, recordResolution } from "../src/features/child-handover/operations.ts";
import { BELONGINGS_FOLLOW_UP_DELAY_MS, getOverdueBelongings } from "../src/features/children/profile/overdueBelongings.ts";

const enteredAt = "2026-11-26T08:00:00Z";
const exitedAt = "2026-11-26T18:00:00Z";
const leftAt = Date.parse(exitedAt);
const item = { kind: "backpack", label: "Mochila", quantity: 2, details: "azul", returnable: true };

function movement(state, action, details, id, savedAt, childIds = ["one"]) {
  const receipt = { id, action, savedAt, childIds, adultId: "authorized-demo-adult" };
  return commitMovement(state, { ...receipt, details, authorizationToken: "demo-token", idempotencyKey: id }, receipt, "Responsable ficticio");
}

function example(outcome = "unchecked", quantity = 2, entryItem = item) {
  let state = { children: [{ id: "one", attendanceStatus: "pending", serviceStatus: "active" }], movements: [], belongings: [], events: [], stays: {} };
  const entry = emptyMovementDetails();
  entry.entries.one = { registration: "recorded", items: [entryItem] };
  state = movement(state, "entry", entry, "entry", enteredAt);
  const exit = emptyMovementDetails();
  exit.checks = [{ itemId: state.belongings[0].id, quantity, outcome, comment: "" }];
  return movement(state, "pickup", exit, "exit", exitedAt);
}

test("el aviso aparece exactamente después de 24 horas, sin modificar los datos", () => {
  const state = example(); const before = structuredClone(state);
  assert.equal(getOverdueBelongings(state, "one", leftAt + BELONGINGS_FOLLOW_UP_DELAY_MS - 1), undefined);
  const result = getOverdueBelongings(state, "one", leftAt + BELONGINGS_FOLLOW_UP_DELAY_MS);
  assert.equal(result.movement.receipt.id, "exit");
  assert.deepEqual(result.items.map(item => [item.label, item.remaining]), [["Mochila", 2]]);
  assert.deepEqual(state, before);
});

test("pasar la medianoche sin cumplir 24 horas no activa el aviso", () => {
  assert.equal(getOverdueBelongings(example(), "one", Date.parse("2026-11-27T00:01:00Z")), undefined);
});

for (const outcome of ["stays", "missing", "later", "unchecked"]) {
  test(`un pendiente ${outcome} sí requiere seguimiento después de 24 horas`, () => {
    assert.equal(getOverdueBelongings(example(outcome), "one", leftAt + BELONGINGS_FOLLOW_UP_DELAY_MS).items.length, 1);
  });
}

test("las pertenencias entregadas y un saldo cero no producen ningún aviso", () => {
  assert.equal(getOverdueBelongings(example("delivered"), "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
});

test("una entrega parcial muestra únicamente las unidades que siguen pendientes", () => {
  const result = getOverdueBelongings(example("delivered", 1), "one", leftAt + BELONGINGS_FOLLOW_UP_DELAY_MS);
  assert.equal(result.items[0].remaining, 1);
});

test("resolver la devolución posteriormente elimina el aviso sin reescribir la salida", () => {
  const state = example(); const original = structuredClone(state.movements);
  const resolved = recordResolution(state, "one", { itemId: state.belongings[0].id, quantity: 2, outcome: "delivered", comment: "" }, "resolved", "2026-11-27T19:00:00Z");
  assert.equal(getOverdueBelongings(resolved, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
  assert.deepEqual(resolved.movements, original);
});

test("estar dentro o tener un reingreso posterior impide el aviso", () => {
  const state = example(); state.children[0].attendanceStatus = "inside";
  assert.equal(getOverdueBelongings(state, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
  state.children[0].attendanceStatus = "out";
  const entry = emptyMovementDetails(); entry.entries.one = { registration: "none", items: [] };
  const reentry = movement(state, "entry", entry, "reentry", "2026-11-27T20:00:00Z");
  assert.equal(getOverdueBelongings(reentry, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
});

test("una nueva salida reinicia el periodo de seguimiento y no avisa antes de 24 horas", () => {
  let state = example();
  const entry = emptyMovementDetails(); entry.entries.one = { registration: "none", items: [] };
  state = movement(state, "entry", entry, "reentry", "2026-11-27T20:00:00Z");
  const exit = emptyMovementDetails(); exit.checks = [{ itemId: state.belongings[0].id, quantity: 2, outcome: "unchecked", comment: "" }];
  state = movement(state, "pickup", exit, "new-exit", "2026-11-27T21:00:00Z");
  assert.equal(getOverdueBelongings(state, "one", Date.parse("2026-11-28T20:59:59Z")), undefined);
  assert.equal(getOverdueBelongings(state, "one", Date.parse("2026-11-28T21:00:00Z")).movement.receipt.id, "new-exit");
});

test("el snapshot de una salida basta como evidencia de la estancia, pero sin salida no hay aviso", () => {
  const noEntry = example(); noEntry.movements = noEntry.movements.filter(m => m.receipt.action !== "entry");
  assert.equal(getOverdueBelongings(noEntry, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS).items.length, 1);
  const noExit = example(); noExit.movements = noExit.movements.filter(m => m.receipt.action !== "pickup");
  assert.equal(getOverdueBelongings(noExit, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
});

test("sin adulto en el recibo o sin pertenencias en esa salida no se inventa seguimiento", () => {
  const state = example(); state.movements.at(-1).receipt.adultId = "";
  assert.equal(getOverdueBelongings(state, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
  state.movements.at(-1).receipt.adultId = "demo"; state.movements.at(-1).itemSnapshots = [];
  assert.equal(getOverdueBelongings(state, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
});

test("sin pertenencias, con un menor ajeno o con fechas inválidas no aparece el aviso", () => {
  const state = example();
  assert.equal(getOverdueBelongings(state, "other", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
  assert.equal(getOverdueBelongings(state, "one", NaN), undefined);
  assert.equal(getOverdueBelongings(state, "one", leftAt - 1), undefined);
  state.belongings = [];
  assert.equal(getOverdueBelongings(state, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
});


test("los consumibles no generan avisos de devolución aunque queden sin comprobar", () => {
  const state = example("unchecked", 2, { ...item, kind: "diapers", returnable: false });
  assert.equal(getOverdueBelongings(state, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
});

test("sin estancia asociada o sin presencia en el snapshot de salida no se inventa un pendiente", () => {
  const state = example(); state.belongings[0].stayId = "";
  assert.equal(getOverdueBelongings(state, "one", leftAt + 2 * BELONGINGS_FOLLOW_UP_DELAY_MS), undefined);
});

test("sin comprobar se conserva como incertidumbre, separado de un resultado no localizado", () => {
  const unchecked = getOverdueBelongings(example("unchecked"), "one", leftAt + BELONGINGS_FOLLOW_UP_DELAY_MS);
  const missing = getOverdueBelongings(example("missing"), "one", leftAt + BELONGINGS_FOLLOW_UP_DELAY_MS);
  assert.equal(unchecked.items[0].lastOutcome, "unchecked");
  assert.equal(missing.items[0].lastOutcome, "missing");
});

test("los artículos añadidos durante la estancia siguen disponibles para seguimiento después de la salida", () => {
  let state = example();
  state = { ...state, children: state.children.map(child => ({ ...child, attendanceStatus: "inside" })),
    events: [], movements: state.movements.filter(m => m.receipt.action === "entry") };
  state = addStayBelongings(state, "one", [{ ...item, label: "Botella", quantity: 1 }], "2026-11-26T12:00:00Z", () => "added");
  const details = emptyMovementDetails();
  details.checks = state.belongings.map(item => ({ itemId: item.id, quantity: item.quantity, outcome: "unchecked", comment: "" }));
  state = movement(state, "pickup", details, "exit-with-added", exitedAt);
  const result = getOverdueBelongings(state, "one", leftAt + BELONGINGS_FOLLOW_UP_DELAY_MS);
  assert.deepEqual(result.items.map(item => item.label), ["Mochila", "Botella"]);
});
