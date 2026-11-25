import test from 'node:test';
import assert from 'node:assert/strict';
import { createLabSimulation } from './labSimulation.ts';
import { canMove, getCompatibleAdults, isAuthorized, isCompleteReceipt } from '../child-handover/reception.ts';

const children = ['one', 'two'].map(id => ({ id, name: id, lastName: 'Familia ficticia', birthDate: '2023-03-15', classroom: 'Maternal A', status: 'active', enrollmentDate: '2026-01-01', slug: id, tutor: { name: 'Adulto', lastName: 'Ficticio', phone: '0000000000', relationship: 'Tutor' }, allergies: [], attendanceStatus: 'inside', serviceStatus: 'active' }));
const adults = [{ id: 'adult', name: 'Adulto Ficticio', permissions: children.map(child => ({ childId: child.id, actions: ['entry', 'pickup'], relationship: 'Tutor' })) }];
const request = { childIds: ['one', 'two'], action: 'pickup', candidateAdultIds: ['adult'] };
const create = (scenario = 'daily', cohort = children) => createLabSimulation(cohort, adults, scenario, { verificationDelayMs: 0, saveDelayMs: 0 });

test('ambiguous confirmation recovers one complete receipt with the same idempotency key', async () => {
  const gateway = create('save-error');
  const authorization = await gateway.identify(request);
  assert.equal(isAuthorized(authorization, request), true);
  const write = { ...request, authorizationToken: authorization.token, idempotencyKey: 'same-attempt' };
  await assert.rejects(gateway.save(write), /interrumpida/);
  const receipt = await gateway.save(write);
  assert.equal(isCompleteReceipt(receipt, request, 'adult'), true);
  assert.deepEqual(await gateway.save(write), receipt);
  await assert.rejects(gateway.save({ ...write, childIds: ['one'] }), /otro movimiento/);
});
test('reject and offline scenarios never authorize a movement', async () => {
  await assert.rejects(create('rejected').identify(request), /autorizado/);
  await assert.rejects(create('offline').identify(request), /desconectado/);
});
test('the entire selected cohort must permit the movement', async () => {
  const mixed = [children[0], { ...children[1], attendanceStatus: 'pending' }];
  assert.equal(canMove(mixed, 'pickup'), false);
  assert.equal(canMove(mixed, 'entry'), false);
  await assert.rejects(create('daily', mixed).identify(request), /compatible/);
  assert.equal(getCompatibleAdults(adults, { ...request, childIds: ['one', 'unknown-child'] }).length, 0);
});
test('authorization expiry, action and complete child set are checked independently', async () => {
  const authorization = await create().identify(request);
  assert.equal(isAuthorized({ ...authorization, expiresAt: '2000-01-01T00:00:00Z' }, request), false);
  assert.equal(isAuthorized(authorization, { ...request, action: 'entry' }), false);
  assert.equal(isAuthorized(authorization, { ...request, childIds: ['one'] }), false);
  assert.equal(isAuthorized(authorization, { ...request, childIds: ['one', 'one'] }), false);
});
test('reentry and a notified absence allow entry; inactive service blocks it', async () => {
  for (const attendanceStatus of ['out', 'absent']) {
    const cohort = children.map(child => ({ ...child, attendanceStatus }));
    assert.equal(canMove(cohort, 'entry'), true);
    const gateway = create('daily', cohort);
    const entry = { ...request, action: 'entry' };
    const authorization = await gateway.identify(entry);
    const receipt = await gateway.save({ ...entry, authorizationToken: authorization.token, idempotencyKey: attendanceStatus });
    assert.equal(isCompleteReceipt(receipt, entry, 'adult'), true);
  }
  assert.equal(canMove([{ ...children[0], attendanceStatus: 'pending', serviceStatus: 'inactive' }], 'entry'), false);
});
