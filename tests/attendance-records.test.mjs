import test from "node:test";
import assert from "node:assert/strict";
import { getAttendanceEvents } from "../src/features/children/profile/attendanceRecords.ts";

const record = { date: "2026-06-15", entry: "07:45", exit: "14:15", status: "present", location: "Guardería de ejemplo" };

test("el recorrido escolar distingue entrega, recogida y regreso de la salida final", () => {
  const events = getAttendanceEvents({ ...record, schoolJourney: { schoolName: "Escuela de ejemplo", departure: "08:10", delivered: "08:30", pickedUp: "12:30", returned: "12:50" } });
  assert.deepEqual(events.map(event => event.id), ["entry", "school-departure", "school-delivery", "school-pickup", "school-return", "exit"]);
  assert.equal(events[2].time, "08:30");
  assert.equal(events[3].time, "12:30");
  assert.equal(events[4].location, record.location);
  assert.equal(events.at(-1).time, "14:15");
});

test("las horas faltantes o inválidas no se convierten en movimientos realizados", () => {
  const events = getAttendanceEvents({ ...record, exit: "-", schoolJourney: { schoolName: "Escuela de ejemplo", departure: "24:00", delivered: "08:99", pickedUp: "12:30" } });
  assert.deepEqual(events.map(event => event.id), ["entry", "school-pickup"]);
});

test("una ausencia no fabrica movimientos y los responsables no se infieren del tutor", () => {
  assert.deepEqual(getAttendanceEvents({ ...record, status: "absent" }), []);
  assert.equal(getAttendanceEvents(record)[0].adult, undefined);
  assert.equal(getAttendanceEvents(record)[0].recordedBy, undefined);
  const withAdult = getAttendanceEvents({ ...record, entryAdult: "Adulto del registro", recordedBy: "Recepción" });
  assert.equal(withAdult[0].adult, "Adulto del registro");
  assert.equal(withAdult[1].adult, undefined);
});

test("la consulta ordena las horas disponibles sin cambiar el registro de origen", () => {
  const source = { ...record, schoolJourney: { schoolName: "Escuela de ejemplo", pickedUp: "12:30", delivered: "08:30" } };
  const before = structuredClone(source);
  assert.deepEqual(getAttendanceEvents(source).map(event => event.time), ["07:45", "08:30", "12:30", "14:15"]);
  assert.deepEqual(source, before);
});


test("el responsable del traslado y quien registra el acceso son datos independientes", () => {
  const events = getAttendanceEvents({ ...record, recordedBy: "Recepción", schoolJourney: { schoolName: "Escuela", delivered: "08:30", responsibleName: "Personal de traslado" } });
  assert.equal(events[0].recordedBy, "Recepción");
  assert.equal(events[1].responsibleName, "Personal de traslado");
  assert.equal(events[1].recordedBy, undefined);
});
