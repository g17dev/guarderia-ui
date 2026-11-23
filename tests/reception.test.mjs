import test from "node:test";
import assert from "node:assert/strict";
import { canMove, getCompatibleAdults, getReceptionCounts, matchesReceptionFilter, disconnectedGateway, isAuthorized, isCompleteReceipt } from "../src/features/child-handover/reception.ts";

const request = { childIds: ["1", "2"], action: "pickup" };
const now = Date.parse("2026-11-21T12:00:00Z");
const authorization = {
  ...request,
  token: "backend-issued-token",
  adult: { id: "adult-1", name: "Adulto identificado" },
  expiresAt: "2026-11-21T12:02:00Z",
  permissions: request.childIds.map(childId => ({ childId, authorized: true })),
};
const receipt = { ...request, id: "movement-1", adultId: "adult-1", savedAt: "2026-11-21T12:01:00Z" };
const children = (...statuses) => statuses.map((attendanceStatus, index) => ({ id: String(index), attendanceStatus, serviceStatus: "active" }));

test("las acciones requieren una selección completa compatible", () => {
  assert.equal(canMove([], "entry"), false);
  assert.equal(canMove([], "pickup"), false);
  assert.equal(canMove(children("pending", "pending"), "entry"), true);
  assert.equal(canMove(children("inside", "inside"), "pickup"), true);
  for (const selection of [children("inside", "pending"), children("inside", "out")]) {
    assert.equal(canMove(selection, "entry"), false);
    assert.equal(canMove(selection, "pickup"), false);
  }
});

test("reconocer al adulto no autoriza a un grupo con un permiso denegado o ausente", () => {
  assert.equal(isAuthorized(authorization, request, now), true);
  assert.equal(isAuthorized({ ...authorization, permissions: [{ childId: "1", authorized: true }, { childId: "2", authorized: false }] }, request, now), false);
  assert.equal(isAuthorized({ ...authorization, permissions: authorization.permissions.slice(0, 1) }, request, now), false);
  assert.equal(isAuthorized({ ...authorization, permissions: [authorization.permissions[0], authorization.permissions[0]] }, request, now), false);
});

test("la autorización queda ligada a selección, acción, identidad y vigencia", () => {
  for (const patch of [
    { childIds: ["1", "3"] }, { childIds: ["1", "1"] }, { action: "entry" },
    { token: "" }, { adult: { id: "", name: "" } }, { expiresAt: "invalid" },
    { expiresAt: "2026-11-21T12:00:00Z" },
  ]) assert.equal(isAuthorized({ ...authorization, ...patch }, request, now), false);
  assert.equal(isAuthorized(authorization, { ...request, childIds: [] }, now), false);
});

test("solo un comprobante del grupo completo confirma el guardado", () => {
  assert.equal(isCompleteReceipt(receipt, request, "adult-1"), true);
  assert.equal(isCompleteReceipt({ ...receipt, childIds: ["2", "1"] }, request, "adult-1"), true);
  for (const patch of [
    { childIds: ["1"] }, { childIds: ["1", "1"] }, { childIds: ["1", "3"] },
    { adultId: "another-adult" }, { action: "entry" }, { savedAt: "invalid" }, { id: "" },
  ]) assert.equal(isCompleteReceipt({ ...receipt, ...patch }, request, "adult-1"), false);
});

test("sin integración no se fabrican autorizaciones ni movimientos", async () => {
  await assert.rejects(disconnectedGateway.verify(request), /lector no está conectado/);
  await assert.rejects(disconnectedGateway.save({ ...request, authorizationToken: authorization.token, idempotencyKey: "retry-key" }), /servicio de registro/);
});

test("ausencias y servicio inactivo no inflan Por llegar ni Esperados hoy", () => {
  const group = [
    ...children("inside", "pending", "out", "absent"),
    { id: "expired", attendanceStatus: "pending", serviceStatus: "inactive" },
  ];
  assert.deepEqual(getReceptionCounts(group), { inside: 1, pending: 1, out: 1, all: 3 });
  assert.equal(group.filter(child => matchesReceptionFilter(child, "all")).length, 4);
  assert.equal(group.filter(child => matchesReceptionFilter(child, "pending")).length, 1);
  assert.equal(group.filter(child => matchesReceptionFilter(child, "absent")).length, 1);
});

test("la falta de servicio bloquea Entrada sin impedir Recogida de quien está dentro", () => {
  const expired = { id: "expired", attendanceStatus: "pending", serviceStatus: "inactive" };
  assert.equal(canMove([expired], "entry"), false);
  assert.equal(canMove([...children("pending"), expired], "entry"), false);
  assert.equal(canMove(children("absent"), "entry"), true);
  const insideExpired = { ...expired, attendanceStatus: "inside" };
  assert.equal(canMove([insideExpired], "pickup"), true);
  assert.deepEqual(getReceptionCounts([insideExpired]), { inside: 1, pending: 0, out: 0, all: 0 });
});

test("el adulto elegido debe coincidir con la identidad devuelta por la huella", () => {
  assert.equal(isAuthorized(authorization, { ...request, adultId: "adult-1" }, now), true);
  assert.equal(isAuthorized(authorization, { ...request, adultId: "another-adult" }, now), false);
});

test("los candidatos a adulto son la intersección de permisos por niño y movimiento", () => {
  const adults = [
    { id: "both", permissions: [{ childId: "1", actions: ["entry", "pickup"] }, { childId: "2", actions: ["pickup"] }] },
    { id: "one", permissions: [{ childId: "1", actions: ["entry", "pickup"] }] },
  ];
  assert.deepEqual(getCompatibleAdults(adults, request).map(adult => adult.id), ["both"]);
  assert.deepEqual(getCompatibleAdults(adults, { ...request, action: "entry" }), []);
  assert.deepEqual(getCompatibleAdults(adults, { ...request, childIds: [] }), []);
});

test("la lista oculta niños sin servicio y conserva los movimientos del día para completar y consultar salidas", () => {
  const group = children("pending", "absent", "inside", "out").map(child => ({ ...child, serviceStatus: "inactive" }));
  assert.deepEqual(group.filter(child => matchesReceptionFilter(child, "all")).map(child => child.id), ["2", "3"]);
  assert.equal(group.filter(child => matchesReceptionFilter(child, "pending")).length, 0);
  assert.equal(group.filter(child => matchesReceptionFilter(child, "absent")).length, 0);
  assert.equal(group.filter(child => matchesReceptionFilter(child, "inside")).length, 1);
  assert.equal(group.filter(child => matchesReceptionFilter(child, "out")).length, 1);
});


test("la entrada admite reingresos y ausencias, incluso en grupos mixtos con servicio activo", () => {
  assert.equal(canMove(children("pending", "out", "absent"), "entry"), true);
  assert.equal(canMove(children("pending", "out", "absent"), "pickup"), false);
  for (const attendanceStatus of ["out", "absent"]) {
    assert.equal(canMove([{ attendanceStatus, serviceStatus: "inactive" }], "entry"), false);
  }
  const group = children("pending", "out", "absent");
  assert.deepEqual(getReceptionCounts(group), { inside: 0, pending: 1, out: 1, all: 2 });
  assert.deepEqual(getReceptionCounts(group.map(child => ({ ...child, attendanceStatus: "inside" }))), { inside: 3, pending: 0, out: 0, all: 3 });
});
