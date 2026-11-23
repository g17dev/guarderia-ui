import test from "node:test";
import assert from "node:assert/strict";
import { getCareState, getSpecialCareSummary, validateSpecialCarePlan, withCareInstructions, localDateKey } from "../src/features/children/profile/specialCare.ts";

const instruction = {
  id: "care-1", category: "mobility", instruction: "Requiere apoyo para desplazarse.", when: "Al cambiar de espacio",
  priority: "routine", validity: "temporary", startDate: "2026-11-20", endDate: "2026-11-22",
  reportedBy: "Familiar de prueba", updatedAt: "2026-11-20T12:00:00Z", authorizationStatus: "pending", authorizationReference: "",
};

test("la vigencia incluye el último día y separa futuras y finalizadas", () => {
  assert.equal(getCareState(instruction, "2026-11-19"), "upcoming");
  assert.equal(getCareState(instruction, "2026-11-20"), "active");
  assert.equal(getCareState(instruction, "2026-11-22"), "active");
  assert.equal(getCareState(instruction, "2026-11-23"), "expired");
  assert.equal(getCareState({ ...instruction, validity: "ongoing", endDate: "" }, "2027-01-01"), "active");
});

test("el resumen prioriza solo indicaciones vigentes y conserva las demás para consulta", () => {
  const plan = { instructions: [instruction, { ...instruction, id: "priority", priority: "priority" }, { ...instruction, id: "future", priority: "priority", startDate: "2026-12-01", endDate: "2026-12-10" }, { ...instruction, id: "past", endDate: "2026-11-21" }] };
  const summary = getSpecialCareSummary(plan, "2026-11-22");
  assert.deepEqual(summary.active.map(item => item.id), ["priority", "care-1"]);
  assert.equal(summary.priorityCount, 1);
  assert.equal(summary.upcoming.length, 1);
  assert.equal(summary.expired.length, 1);
});

test("la falta de indicaciones no equivale a una revisión y editar invalida la revisión previa", () => {
  assert.equal(getSpecialCareSummary().reviewed, false);
  const reviewed = { instructions: [], review: { reviewedBy: "Recepción", reviewedAt: "2026-11-22T12:00:00Z" } };
  assert.equal(getSpecialCareSummary(reviewed).reviewed, true);
  const changed = withCareInstructions(reviewed, [instruction]);
  assert.equal(changed.review, undefined);
  assert.ok(reviewed.review);
});

test("valida indicación, contexto, fuente y fechas reales sin descartar el cuidado continuo", () => {
  assert.equal(validateSpecialCarePlan({ instructions: [instruction] }), undefined);
  for (const patch of [{ instruction: " " }, { when: "" }, { reportedBy: " " }, { endDate: "2026-11-19" }, { endDate: "" }, { startDate: "2026-02-30" }]) {
    assert.equal(validateSpecialCarePlan({ instructions: [{ ...instruction, ...patch }] }).id, instruction.id);
  }
  assert.equal(validateSpecialCarePlan({ instructions: [{ ...instruction, validity: "ongoing", endDate: "" }] }), undefined);
});

test("una referencia médica exige el documento indicado y permite dejar la autorización explícitamente pendiente", () => {
  const medical = { ...instruction, category: "medical", authorizationStatus: "documented" };
  assert.match(validateSpecialCarePlan({ instructions: [medical] }).message, /referencia/);
  assert.equal(validateSpecialCarePlan({ instructions: [{ ...medical, authorizationReference: "Documento de prueba" }] }), undefined);
  assert.equal(validateSpecialCarePlan({ instructions: [{ ...medical, authorizationStatus: "pending" }] }), undefined);
});

test("la clave de fecha usa el día local", () => {
  assert.equal(localDateKey(new Date(2026, 10, 22, 23, 59)), "2026-11-22");
});
