import test from "node:test";
import assert from "node:assert/strict";
import { getMovementNotification } from "../src/features/child-handover/movementNotification.ts";

const mia = { id: "mia", name: "Mía", lastName: "García López" };
const mateo = { id: "mateo", name: "Mateo", lastName: "Ruiz Soto" };
const identity = { id: "adult", name: "Ana García" };
function message({ kids = [mia], roles = ["Madre"], action = "pickup", profileId = "adult", permissions, savedAt = "2026-11-21T18:00:00Z", reentry = false } = {}) {
  return getMovementNotification({
    receipt: { id: "receipt", childIds: kids.map(child => child.id), action, adultId: "adult", savedAt },
    children: kids,
    adult: identity,
    adultProfile: { ...identity, id: profileId, permissions: permissions ?? kids.map((child, index) => ({ childId: child.id, relationship: roles[index], actions: ["entry", "pickup"] })) },
    timeZone: "UTC", reentry,
  });
}

test("un niño recibe una frase singular con su relación confirmada y la hora del registro", () => {
  const result = message();
  assert.equal(result.title, "Salida registrada con éxito");
  assert.match(result.description, /^Mía García se retiró en compañía de su mamá a las 6:00\s*p/);
  assert.ok(!result.description.endsWith(".."));
});

test("la entrada cambia el verbo y conserva la confirmación breve", () => {
  const result = message({ action: "entry", roles: ["father"] });
  assert.equal(result.title, "Entrada registrada con éxito");
  assert.match(result.description, /^Mía García llegó con su papá /);
});

test("varios niños comparten la relación solo si pertenece al mismo adulto para todos", () => {
  const result = message({ kids: [mia, mateo], roles: ["Madre", "mother"] });
  assert.match(result.description, /^Mía García y Mateo Ruiz se retiraron en compañía de su mamá /);
});

test("relaciones distintas usan el nombre identificado sin atribuir un parentesco común", () => {
  const result = message({ kids: [mia, mateo], roles: ["Madre", "Tía autorizada"] });
  assert.match(result.description, /^Mía García y Mateo Ruiz se retiraron en compañía de Ana García /);
  assert.ok(!result.description.includes("su mamá"));
});

test("un parentesco desconocido o un perfil ajeno también usa el nombre identificado", () => {
  assert.match(message({ roles: ["Persona autorizada"] }).description, /en compañía de Ana García /);
  assert.match(message({ profileId: "different-adult" }).description, /en compañía de Ana García /);
});

test("solo las relaciones autorizadas para el movimiento actual sirven para redactar el mensaje", () => {
  const result = message({ permissions: [{ childId: "mia", relationship: "Madre", actions: ["entry"] }] });
  assert.match(result.description, /en compañía de Ana García /);
});

test("los grupos grandes muestran cantidad y no una lista difícil de leer", () => {
  const result = message({ kids: [mia, mateo, { id: "leo", name: "Leo", lastName: "Luna" }], roles: ["Madre", "Tía", "Otra persona"] });
  assert.match(result.description, /^Los 3 niños se retiraron en compañía de Ana García /);
  assert.ok(result.description.length < 100);
});

test("el parentesco se normaliza sin asumirlo a partir del apellido", () => {
  assert.match(message({ roles: ["Tía autorizada"] }).description, /en compañía de su tía /);
  assert.match(message({ roles: ["Tutor legal"] }).description, /en compañía de su responsable legal /);
});

test("nombres abreviados iguales conservan los apellidos completos para distinguir niños", () => {
  const result = message({ kids: [mia, { ...mia, id: "other-mia", lastName: "García Soto" }], roles: ["Madre", "Madre"] });
  assert.match(result.description, /^Mía García López y Mía García Soto se retiraron en compañía de /);
});

test("la hora de la una usa una frase natural en singular", () => {
  assert.match(message({ savedAt: "2026-11-21T13:00:00Z" }).description, / a la 1:00\s*p/);
});

test("los apellidos compuestos conservan el nombre legible", () => {
  const result = message({ kids: [{ ...mia, lastName: "De la Cruz Martínez" }] });
  assert.match(result.description, /^Mía De la Cruz Martínez se retiró en compañía de /);
});

test("la entrada de varios niños usa llegaron con y conserva la relación compartida", () => {
  const result = message({ kids: [mia, mateo], action: "entry", roles: ["Madre", "mother"] });
  assert.match(result.description, /^Mía García y Mateo Ruiz llegaron con su mamá /);
});


test("el reingreso tiene una confirmación breve singular o plural", () => {
  assert.equal(message({ action: "entry", reentry: true }).title, "Reingreso registrado con éxito");
  assert.match(message({ action: "entry", reentry: true }).description, /^Mía García regresó con su mamá /);
  assert.match(message({ kids: [mia, mateo], roles: ["Madre", "Madre"], action: "entry", reentry: true }).description, /regresaron con su mamá /);
  assert.equal(message({ action: "pickup", reentry: true }).title, "Salida registrada con éxito");
});
