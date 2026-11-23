import test from "node:test";
import assert from "node:assert/strict";
import { createToastLifecycle } from "../src/context/toastLifecycle.ts";

function setup() {
  let current = 0;
  let nextId = 0;
  const jobs = new Map();
  const events = [];
  const clock = {
    now: () => current,
    setTimeout: (callback, delay) => { const id = ++nextId; jobs.set(id, { at: current + delay, callback }); return id; },
    clearTimeout: id => jobs.delete(id),
  };
  const lifecycle = createToastLifecycle({
    onDismiss: id => events.push(`dismiss:${id}`),
    onRemove: id => events.push(`remove:${id}`),
  }, clock);
  function advance(ms) {
    const target = current + ms;
    for (;;) {
      const next = [...jobs.entries()].filter(([, job]) => job.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      current = next[1].at;
      jobs.delete(next[0]);
      next[1].callback();
    }
    current = target;
  }
  return { lifecycle, events, advance, jobs };
}

test("sin interacción se cierra a los seis segundos y termina la animación de salida", () => {
  const { lifecycle, events, advance } = setup();
  lifecycle.start("one"); advance(5999);
  assert.deepEqual(events, []);
  advance(1); assert.deepEqual(events, ["dismiss:one"]);
  advance(350); assert.deepEqual(events, ["dismiss:one", "remove:one"]);
});

test("el cursor mantiene la notificación más allá de seis segundos y deja dos segundos al salir", () => {
  const { lifecycle, events, advance } = setup();
  lifecycle.start("one"); advance(1000); lifecycle.pause("one", "pointer"); advance(10_000);
  assert.deepEqual(events, []);
  lifecycle.resume("one", "pointer"); advance(1999); assert.deepEqual(events, []);
  advance(1); assert.deepEqual(events, ["dismiss:one"]);
});

test("salir temprano no reduce los seis segundos originales", () => {
  const { lifecycle, events, advance } = setup();
  lifecycle.start("one"); advance(1000); lifecycle.pause("one", "pointer"); advance(1000);
  lifecycle.resume("one", "pointer"); advance(3999); assert.deepEqual(events, []);
  advance(1); assert.deepEqual(events, ["dismiss:one"]);
});

test("salir cerca del vencimiento concede al menos dos segundos", () => {
  const { lifecycle, events, advance } = setup();
  lifecycle.start("one"); advance(5000); lifecycle.pause("one", "pointer"); advance(900);
  lifecycle.resume("one", "pointer"); advance(1999); assert.deepEqual(events, []);
  advance(1); assert.deepEqual(events, ["dismiss:one"]);
});

test("volver a entrar cancela el cierre y renueva el margen al retirarse", () => {
  const { lifecycle, events, advance } = setup();
  lifecycle.start("one"); lifecycle.pause("one", "pointer"); advance(7000);
  lifecycle.resume("one", "pointer"); advance(1000); lifecycle.pause("one", "pointer"); advance(3000);
  assert.deepEqual(events, []);
  lifecycle.resume("one", "pointer"); advance(1999); assert.deepEqual(events, []);
  advance(1); assert.deepEqual(events, ["dismiss:one"]);
});

test("salir con el cursor mantiene la pausa mientras el foco continúa dentro", () => {
  const { lifecycle, events, advance } = setup();
  lifecycle.start("one"); lifecycle.pause("one", "pointer"); lifecycle.pause("one", "focus"); advance(7000);
  lifecycle.resume("one", "pointer"); advance(3000); assert.deepEqual(events, []);
  lifecycle.resume("one", "focus"); advance(2000); assert.deepEqual(events, ["dismiss:one"]);
});

test("la X cierra durante la pausa y las llamadas repetidas no duplican el cierre", () => {
  const { lifecycle, events, advance } = setup();
  lifecycle.start("one"); lifecycle.pause("one", "pointer"); advance(7000);
  lifecycle.dismiss("one"); lifecycle.dismiss("one"); lifecycle.resume("one", "pointer");
  assert.deepEqual(events, ["dismiss:one"]);
  advance(10_000); assert.deepEqual(events, ["dismiss:one", "remove:one"]);
});

test("cada notificación conserva sus propios tiempos", () => {
  const { lifecycle, events, advance } = setup();
  lifecycle.start("one"); lifecycle.start("two"); lifecycle.pause("one", "pointer"); advance(6350);
  assert.deepEqual(events, ["dismiss:two", "remove:two"]);
  lifecycle.resume("one", "pointer"); advance(2350);
  assert.deepEqual(events, ["dismiss:two", "remove:two", "dismiss:one", "remove:one"]);
});

test("desmontar elimina los temporizadores activos y los de animación", () => {
  const { lifecycle, events, advance, jobs } = setup();
  lifecycle.start("one"); lifecycle.start("two"); lifecycle.dismiss("one"); lifecycle.dispose(); advance(10_000);
  assert.equal(jobs.size, 0);
  assert.deepEqual(events, ["dismiss:one"]);
});
