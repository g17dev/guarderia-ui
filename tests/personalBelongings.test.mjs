import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonalBelonging, interpretPersonalBelonging, samePersonalBelonging } from '../src/features/child-handover/personalBelongings.ts';
import { validateEntry, outstandingBelongings } from '../src/features/child-handover/belongings.ts';
import { commitMovement } from '../src/features/child-handover/operations.ts';

for (const [input, label, details, category] of [
  ['Gorra azul', 'Gorra', 'azul', 'cap'], ['Peluche pequeño', 'Peluche', 'pequeño', 'plush'],
  ['Sombrero rojo', 'Sombrero', 'rojo', 'hat'], ['Termo de dinosaurios', 'Termo', 'de dinosaurios', 'thermos'],
  [' CACHUCHA Azul ', 'Gorra', 'Azul', 'cap'], ['BIBERÓN verde', 'Biberón', 'verde', 'bottle'],
  ['Osito de peluche suave', 'Peluche', 'suave', 'plush'], ['Botella de agua, azul', 'Botella de agua', 'azul', 'water'],
  ['pan\u0303ales pequeños', 'Pañales', 'pequeños', 'diapers'], ['Mamila rosa', 'Biberón', 'rosa', 'bottle'],
]) test(`interpreta ${input} sin perder la descripción original`, () => {
  const result = interpretPersonalBelonging(input);
  assert.deepEqual([result.label, result.details, result.category, result.originalText], [label, details, category, input]);
  assert.equal(result.recognized, true);
});

for (const input of ['Gorrazo azul', 'Termómetro digital', 'Mochilazo', 'Bolsita misteriosa azul', '2 pañales', 'Azul gorra']) {
  test(`no inventa una interpretación para ${input}`, () => {
    const result = interpretPersonalBelonging(input);
    assert.equal(result.recognized, false); assert.equal(result.label, input); assert.equal(result.details, '');
    assert.equal(result.category, 'generic'); assert.equal(result.returnable, true);
  });
}
test('permite corregir categoría y detalle conservando el original', () => {
  const item = createPersonalBelonging('Gorra azul', 'id', { label: 'Termo', details: 'rojo' });
  assert.equal(item.label, 'Termo'); assert.equal(item.details, 'rojo'); assert.equal(item.custom.category, 'thermos');
  assert.equal(item.custom.originalText, 'Gorra azul'); assert.equal(item.quantity, 1); validateEntry(item);
});
test('consumibles conocidos y artículos desconocidos conservan su comportamiento de devolución', () => {
  assert.equal(createPersonalBelonging('Pañales talla 3', 'a').returnable, false);
  assert.equal(createPersonalBelonging('Objeto azul desconocido', 'b').returnable, true);
});
test('detecta duplicados normalizados y distingue características diferentes', () => {
  const blue = createPersonalBelonging('Gorra azul', 'a');
  assert.equal(samePersonalBelonging(blue, createPersonalBelonging('CACHUCHA AZUL', 'b')), true);
  assert.equal(samePersonalBelonging(blue, createPersonalBelonging('Gorra roja', 'c')), false);
});
test('el registro preserva metadatos, texto original y pertenencias independientes para la salida', () => {
  const a = createPersonalBelonging('Gorra azul', 'a'); const b = createPersonalBelonging('Pañales chicos', 'b');
  const state = { children: [{ id: 'one' }, { id: 'two' }], belongings: [], events: [], movements: [], stays: {} };
  const details = { entries: { one: { registration: 'recorded', items: [a] }, two: { registration: 'recorded', items: [b] } }, checks: [], commonComment: '', childComments: {} };
  const receipt = { id: 'receipt', action: 'entry', childIds: ['one', 'two'], savedAt: '2026-11-24T10:00:00Z' };
  const registered = commitMovement(state, { action: 'entry', childIds: ['one', 'two'], details }, receipt, 'Adulto ficticio');
  assert.deepEqual(outstandingBelongings(registered.belongings, [], 'one')[0].custom, a.custom);
  assert.equal(outstandingBelongings(registered.belongings, [], 'two')[0].returnable, false);
  assert.equal(outstandingBelongings(registered.belongings, [], 'one')[0].details, 'azul');
});
