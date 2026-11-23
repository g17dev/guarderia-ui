import test from "node:test";
import assert from "node:assert/strict";
import { createReceptionSimulation } from "../src/features/child-handover/receptionSimulation.ts";

const children = [
  { id: "one", attendanceStatus: "pending", serviceStatus: "active" },
  { id: "two", attendanceStatus: "pending", serviceStatus: "active" },
];
const adults = [{ id: "guardian", name: "Adulto de prueba", permissions: children.map(child => ({ childId: child.id, actions: ["entry", "pickup"], relationship: "Responsable" })) }];
const request = { childIds: ["one", "two"], action: "entry", adultId: "guardian" };
const create = (kids = children, guardians = adults) => createReceptionSimulation(kids, guardians, { verificationDelayMs: 0, saveDelayMs: 0 });

test("la simulación permite entrada, comprobante idempotente y recogida de todo el grupo", async () => {
  const gateway = create();
  assert.equal(gateway.mode, "simulation");
  const authorization = await gateway.verify(request);
  const saveRequest = { ...request, authorizationToken: authorization.token, idempotencyKey: "entry-key" };
  const receipt = await gateway.save(saveRequest);
  assert.deepEqual(receipt.childIds, request.childIds);
  assert.equal(receipt.adultId, "guardian");
  assert.deepEqual(await gateway.save(saveRequest), receipt);
  await assert.rejects(gateway.verify(request), /compatible/);
  const pickup = { ...request, action: "pickup" };
  const pickupAuthorization = await gateway.verify(pickup);
  await gateway.save({ ...pickup, authorizationToken: pickupAuthorization.token, idempotencyKey: "pickup-key" });
  await assert.rejects(gateway.verify(pickup), /compatible/);
});

test("elegir un adulto sin permiso para todo el grupo no produce autorización", async () => {
  const gateway = create(children, [{ ...adults[0], permissions: adults[0].permissions.slice(0, 1) }]);
  await assert.rejects(gateway.verify(request), /adulto no tiene autorización/);
  await assert.rejects(gateway.verify({ ...request, adultId: "unknown" }), /adulto no tiene autorización/);
});

test("no guarda un grupo distinto con el token de la huella ni reutiliza una clave para otra operación", async () => {
  const gateway = create();
  const auth = await gateway.verify(request);
  const saveRequest = { ...request, authorizationToken: auth.token, idempotencyKey: "key" };
  await assert.rejects(gateway.save({ ...saveRequest, childIds: ["one"] }), /verificar/);
  const receipt = await gateway.save(saveRequest);
  assert.equal(receipt.childIds.length, 2);
  await assert.rejects(gateway.save({ ...saveRequest, action: "pickup" }), /otro movimiento/);
});

test("rechaza el grupo completo si un niño no tiene servicio", async () => {
  for (const patch of [{ serviceStatus: "inactive" }]) {
    const gateway = create([children[0], { ...children[1], ...patch }]);
    await assert.rejects(gateway.verify(request), /compatible/);
    assert.ok(await gateway.verify({ ...request, childIds: ["one"] }));
  }
});

test("un permiso retirado entre huella y confirmación impide el guardado completo", async () => {
  const mutableAdults = structuredClone(adults);
  const gateway = create(children, mutableAdults);
  const auth = await gateway.verify(request);
  mutableAdults[0].permissions.pop();
  await assert.rejects(gateway.save({ ...request, authorizationToken: auth.token, idempotencyKey: "revoked-key" }), /verificar/);
  assert.ok(await gateway.verify({ ...request, childIds: ["one"] }));
});

test("la identificación busca en la galería autorizada y permite confirmar el grupo completo", async () => {
  const partialAdult = { id: "partial", name: "Adulto de otro grupo", permissions: [adults[0].permissions[0]] };
  const gateway = create(children, [partialAdult, ...adults]);
  const auth = await gateway.identify({ childIds: request.childIds, action: "entry", candidateAdultIds: ["partial", "guardian"] });
  assert.equal(auth.adult.id, "guardian");
  assert.equal(auth.permissions.length, 2);
  const receipt = await gateway.save({ ...request, authorizationToken: auth.token, idempotencyKey: "automatic-entry" });
  assert.deepEqual(receipt.childIds, request.childIds);
  assert.equal(receipt.adultId, "guardian");
});

test("la identificación no amplía la galería indicada ni reconoce adultos ajenos al grupo", async () => {
  const partialAdult = { id: "partial", name: "Otro adulto", permissions: [adults[0].permissions[0]] };
  const gateway = create(children, [partialAdult, ...adults]);
  await assert.rejects(gateway.identify({ ...request, candidateAdultIds: ["partial"] }), /huella no corresponde/);
  await assert.rejects(gateway.identify({ ...request, candidateAdultIds: [] }), /huella no corresponde/);
  const unknownFingerprint = createReceptionSimulation(children, adults, {
    verificationDelayMs: 0, saveDelayMs: 0, fingerprintAdultId: "unknown",
  });
  await assert.rejects(unknownFingerprint.identify({ ...request, candidateAdultIds: ["guardian"] }), /huella no corresponde/);
});

test("la verificación dirigida del adaptador rechaza una huella diferente al adulto indicado", async () => {
  const gateway = createReceptionSimulation(children, adults, {
    verificationDelayMs: 0, saveDelayMs: 0, fingerprintAdultId: "another-adult",
  });
  await assert.rejects(gateway.verify(request), /no coincide/);
});

test("una huella rechazada no registra movimientos y otra lectura puede recuperar el flujo", async () => {
  let sample = "unauthorized";
  const gateway = createReceptionSimulation(children, adults, {
    verificationDelayMs: 0, saveDelayMs: 0,
    getFingerprintAdultId: () => sample === "unauthorized" ? "adult-without-permission" : undefined,
  });
  const identifyRequest = { childIds: request.childIds, action: "entry", candidateAdultIds: ["guardian"] };
  await assert.rejects(gateway.identify(identifyRequest), error => error.code === "not_authorized");
  await assert.rejects(gateway.save({ ...request, authorizationToken: "invalid", idempotencyKey: "denied-key" }), /verificar/);
  sample = "authorized";
  const authorization = await gateway.identify(identifyRequest);
  assert.equal(authorization.adult.id, "guardian");
  const receipt = await gateway.save({ ...request, authorizationToken: authorization.token, idempotencyKey: "retry-after-denial" });
  assert.deepEqual(receipt.childIds, request.childIds);
});


test("una ausencia puede llegar y completar entrada, salida y reingreso en la misma sesión", async () => {
  const gateway = create([{ ...children[0], attendanceStatus: "absent" }, { ...children[1], attendanceStatus: "out" }]);
  const receipts = [];
  for (const [index, action] of ["entry", "pickup", "entry", "pickup"].entries()) {
    const operation = { ...request, action };
    const authorization = await gateway.verify(operation);
    const save = { ...operation, authorizationToken: authorization.token, idempotencyKey: `cycle-${index}` };
    const receipt = await gateway.save(save);
    receipts.push(receipt);
    assert.deepEqual(await gateway.save(save), receipt);
    await assert.rejects(gateway.verify(operation), /compatible/);
  }
  assert.equal(new Set(receipts.map(receipt => receipt.id)).size, 4);
});
