import test from 'node:test';
import assert from 'node:assert/strict';
import { createReceptionSimulation } from '../src/features/child-handover/receptionSimulation.ts';
import { addStayBelongings, commitMovement, recordResolution } from '../src/features/child-handover/operations.ts';
import { belongingCatalog, checkRemaining, emptyMovementDetails, frequentBelongings, outstandingBelongings } from '../src/features/child-handover/belongings.ts';

const children = ['one', 'two'].map(id => ({ id, name: id, lastName: 'Familia ficticia', slug: id, birthDate: '2023-04-05', classroom: 'Maternal A', status: 'active', enrollmentDate: '2026-01-01', tutor: { name: 'Adulto', lastName: 'Ficticio', phone: '0000000000', relationship: 'Tutor' }, allergies: [], attendanceStatus: 'pending', serviceStatus: 'active' }));
const adults = [{ id: 'adult', name: 'Adulto Ficticio', permissions: children.map(child => ({ childId: child.id, actions: ['entry', 'pickup'], relationship: 'Tutor' })) }];
const article = (kind = 'backpack', quantity = 1) => ({ ...belongingCatalog.find(item => item.kind === kind), quantity, details: '' });
function setup() {
  let state = { children: structuredClone(children), belongings: [], events: [], movements: [], stays: {} };
  const gateway = createReceptionSimulation(children, adults, { verificationDelayMs: 0, saveDelayMs: 0, onCommit(request, receipt) { state = commitMovement(state, request, receipt, 'Adulto Ficticio'); } });
  return {
    get state() { return state; }, setState(next) { state = next; }, gateway,
    async prepare(action, details = emptyMovementDetails(), ids = ['one']) {
      const authorization = await gateway.identify({ childIds: ids, action, candidateAdultIds: ['adult'] });
      return { childIds: ids, action, authorizationToken: authorization.token, idempotencyKey: crypto.randomUUID(), details };
    },
    async move(action, details = emptyMovementDetails(), ids = ['one']) { return gateway.save(await this.prepare(action, details, ids)); },
  };
}
const registration = (items) => ({ ...emptyMovementDetails(), entries: { one: { registration: 'recorded', items } } });
const pending = (s, child = 'one') => outstandingBelongings(s.belongings, s.events, child);
const checks = (s, outcome = 'delivered') => ({ ...emptyMovementDetails(), checks: checkRemaining(pending(s), [], outcome) });

test('entry without interaction and explicit no belongings are different records', async () => {
  const a = setup(); await a.move('entry');
  assert.equal(a.state.stays.one.registration, 'unrecorded');
  assert.equal(a.state.belongings.length, 0);
  const b = setup(); await b.move('entry', { ...emptyMovementDetails(), entries: { one: { registration: 'none', items: [] } } });
  assert.equal(b.state.stays.one.registration, 'none');
});
test('entry creates backpack, bottle, custom items and independent sibling quantities', async () => {
  const app = setup();
  const details = registration([article(), article('water'), { kind: 'custom', label: 'Sombrero ficticio', quantity: 2, returnable: true, details: 'Azul' }]);
  details.entries.two = { registration: 'recorded', items: [article('diapers', 3)] };
  await app.move('entry', details, ['one', 'two']);
  assert.equal(pending(app.state).length, 3);
  assert.equal(pending(app.state, 'two')[0].remaining, 3);
  assert.equal(app.state.movements.length, 1);
  assert.equal(app.state.children.every(child => child.attendanceStatus === 'inside'), true);
});
test('one explicit bulk action delivers remaining items without overriding exceptions', async () => {
  const app = setup(); await app.move('entry', registration([article(), article('water')]));
  const items = pending(app.state);
  const exception = { itemId: items[1].id, outcome: 'later', quantity: 1, comment: 'Se recogerá mañana' };
  const details = { ...emptyMovementDetails(), checks: checkRemaining(items, [exception], 'delivered') };
  await app.move('pickup', details);
  assert.equal(pending(app.state).length, 1);
  assert.equal(pending(app.state)[0].lastOutcome, 'later');
  assert.equal(app.state.events.find(event => event.itemId === exception.itemId).comment, 'Se recogerá mañana');
});
test('unreviewed belongings require an explicit unchecked choice and do not block an authorized pickup', async () => {
  const app = setup(); await app.move('entry', registration([article()]));
  const before = app.state;
  const request = await app.prepare('pickup');
  await assert.rejects(app.gateway.save(request), /Sin comprobar/);
  assert.equal(app.state, before);
  await app.gateway.save({ ...request, details: checks(app.state, 'unchecked') });
  assert.equal(app.state.children[0].attendanceStatus, 'out');
  assert.equal(pending(app.state)[0].lastOutcome, 'unchecked');
});
test('partial deliveries and consumption preserve remaining quantities and the original movement', async () => {
  const app = setup(); await app.move('entry', registration([article('diapers', 3)]));
  const original = structuredClone(app.state.movements[0]);
  const item = pending(app.state)[0];
  await app.move('pickup', { ...emptyMovementDetails(), checks: [{ itemId: item.id, quantity: 1, outcome: 'consumed', comment: 'Se utilizó durante la jornada' }] });
  assert.equal(pending(app.state)[0].remaining, 2);
  app.setState(recordResolution(app.state, 'one', { itemId: item.id, quantity: 1, outcome: 'delivered', comment: '' }, 'resolution-one', new Date().toISOString()));
  assert.equal(pending(app.state)[0].remaining, 1);
  app.setState(recordResolution(app.state, 'one', { itemId: item.id, quantity: 1, outcome: 'delivered', comment: 'Último artículo' }, 'resolution-two', new Date().toISOString()));
  assert.equal(pending(app.state).length, 0);
  assert.deepEqual(app.state.movements[0], original);
});
test('a retained item survives reentry in a new stay without duplication', async () => {
  const app = setup(); await app.move('entry', registration([article('water')]));
  const item = pending(app.state)[0]; const oldStay = item.stayId;
  await app.move('pickup', { ...emptyMovementDetails(), checks: [{ itemId: item.id, quantity: 1, outcome: 'stays', comment: 'La familia solicitó dejarla aquí' }] });
  await app.move('entry');
  assert.notEqual(app.state.stays.one.id, oldStay);
  assert.equal(pending(app.state).length, 1);
  assert.equal(pending(app.state)[0].stayId, oldStay);
});
test('mid-stay additions are atomic, scoped to the child and keep the original entry', async () => {
  const app = setup(); await app.move('entry');
  const original = structuredClone(app.state.movements[0]);
  app.setState(addStayBelongings(app.state, 'one', [article('blanket')], new Date().toISOString(), () => 'extra-blanket'));
  assert.equal(pending(app.state)[0].label, 'Cobija');
  assert.deepEqual(app.state.movements[0], original);
  const before = app.state;
  assert.throws(() => addStayBelongings(before, 'one', [article(), { ...article(), quantity: -1 }], new Date().toISOString(), () => 'bad'), /cantidad/);
  assert.equal(app.state, before);
  assert.throws(() => addStayBelongings(before, 'two', [article()], new Date().toISOString(), () => 'bad'), /estancia activa/);
});
test('comments remain tied to the confirmed movement and the appropriate sibling', async () => {
  const app = setup(); const details = emptyMovementDetails();
  details.commonComment = 'La familia avisó que mañana no asistirán.';
  details.childComments.one = 'Llegó con un raspón en la rodilla.';
  await app.move('entry', details, ['one', 'two']);
  assert.equal(app.state.movements[0].details.commonComment, details.commonComment);
  assert.equal(app.state.movements[0].details.childComments.two, undefined);
  details.commonComment = 'Cambio de borrador';
  assert.notEqual(app.state.movements[0].details.commonComment, details.commonComment);
});
test('invalid quantities, child assignments and duplicated checks roll back the entire movement', async () => {
  const app = setup(); const before = app.state;
  const invalid = registration([article(), { ...article('water'), quantity: 0 }]);
  await assert.rejects(app.move('entry', invalid), /cantidad/);
  assert.equal(app.state, before);
  const wrongChild = registration([article()]); wrongChild.childComments.two = 'No pertenece a esta selección';
  await assert.rejects(app.move('entry', wrongChild), /seleccionados/);
  assert.equal(app.state, before);
  await app.move('entry', registration([article()]));
  const check = checks(app.state).checks[0]; const entered = app.state;
  await assert.rejects(app.move('pickup', { ...emptyMovementDetails(), checks: [check, check] }), /más de una vez/);
  assert.equal(app.state, entered);
});
test('an ambiguous retry returns the same receipt without duplicating comments or belongings', async () => {
  const app = setup(); const details = registration([article()]); details.commonComment = 'Comentario de prueba';
  const request = await app.prepare('entry', details);
  const receipt = await app.gateway.save(request);
  const committed = app.state;
  assert.deepEqual(await app.gateway.save(request), receipt);
  assert.equal(app.state, committed);
  assert.equal(app.state.movements.length, 1);
  assert.equal(app.state.belongings.length, 1);
  await assert.rejects(app.gateway.save({ ...request, details: emptyMovementDetails() }), /otro movimiento/);
});
test('consumable outcomes cannot consume a returnable item or exceed its balance', async () => {
  const app = setup(); await app.move('entry', registration([article()]));
  const item = pending(app.state)[0];
  assert.throws(() => recordResolution(app.state, 'one', { itemId: item.id, quantity: 1, outcome: 'consumed', comment: '' }, 'bad', new Date().toISOString()), /resultado/);
  assert.throws(() => recordResolution(app.state, 'one', { itemId: item.id, quantity: 2, outcome: 'delivered', comment: '' }, 'bad', new Date().toISOString()), /cantidad/);
});
test('frequent suggestions require three stays and never select items automatically', () => {
  const history = [1, 2, 3].map(number => ({ ...article('blanket'), id: String(number), childId: 'one', stayId: `stay-${number}`, createdAt: new Date().toISOString() }));
  assert.equal(frequentBelongings(history.slice(0, 2), 'one')[0].kind, 'backpack');
  assert.equal(frequentBelongings(history, 'one')[0].kind, 'blanket');
});


test('bulk confirmation carries historical exceptions instead of silently returning them', async () => {
  const { carryExceptions } = await import('../src/features/child-handover/belongings.ts');
  const app = setup(); await app.move('entry', registration([article('water')]));
  const item = pending(app.state)[0];
  app.setState(recordResolution(app.state, 'one', { itemId: item.id, quantity: 1, outcome: 'stays', comment: 'Se deja intencionalmente' }, 'stay-request', new Date().toISOString()));
  const nextChecks = checkRemaining(pending(app.state), carryExceptions(pending(app.state)), 'delivered');
  assert.equal(nextChecks[0].outcome, 'stays');
  await app.move('pickup', { ...emptyMovementDetails(), checks: nextChecks });
  assert.equal(pending(app.state)[0].lastOutcome, 'stays');
});

test('missing, later and unchecked outcomes preserve balances across journeys', async () => {
  for (const outcome of ['missing', 'later', 'unchecked']) {
    const app = setup(); await app.move('entry', registration([article()]));
    await app.move('pickup', checks(app.state, outcome));
    assert.equal(pending(app.state)[0].remaining, 1);
    assert.equal(pending(app.state)[0].lastOutcome, outcome);
  }
});

test('skipping a partially completed sibling pickup preserves the draft and leaves unchecked items pending', async () => {
  const app = setup();
  const entry = registration([article('diapers', 3), article('water')]);
  entry.entries.two = { registration: 'recorded', items: [article('toy')] };
  await app.move('entry', entry, ['one', 'two']);
  const before = app.state;
  const items = [...pending(before), ...pending(before, 'two')];
  const diapers = items.find(item => item.kind === 'diapers');
  const toy = items.find(item => item.kind === 'toy');
  const details = {
    ...emptyMovementDetails(),
    commonComment: 'Comentario común ficticio',
    childComments: { two: 'Se recogerá el juguete después' },
    checks: checkRemaining(items, [
      { itemId: diapers.id, quantity: 1, outcome: 'delivered', comment: 'Entrega parcial' },
      { itemId: toy.id, quantity: 1, outcome: 'later', comment: 'Pendiente para mañana' },
    ], 'unchecked'),
  };
  const request = await app.prepare('pickup', details, ['one', 'two']);
  assert.equal(app.state, before, 'preparing and identifying do not commit draft details');
  await app.gateway.save(request);
  assert.equal(pending(app.state).find(item => item.kind === 'diapers').remaining, 2);
  assert.equal(pending(app.state).find(item => item.kind === 'water').lastOutcome, 'unchecked');
  assert.equal(pending(app.state, 'two')[0].lastOutcome, 'later');
  assert.deepEqual(app.state.movements.at(-1).details, details);
  const committed = app.state;
  await app.gateway.save(request);
  assert.equal(app.state, committed, 'retry does not duplicate belongings or comments');
});
