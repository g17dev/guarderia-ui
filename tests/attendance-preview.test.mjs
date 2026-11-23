import test from "node:test";
import assert from "node:assert/strict";
import { createCurrentMonthAttendance } from "../src/features/children/profile/attendancePreview.ts";
import { getAttendanceEvents } from "../src/features/children/profile/attendanceRecords.ts";

test("los ejemplos usan el mes local actual, incluyen hoy y no añaden días futuros", () => {
  const today = new Date(2026, 10, 22, 23, 30);
  const before = today.getTime();
  const records = createCurrentMonthAttendance("1", today);
  assert.ok(records.length > 0);
  assert.ok(records.every(record => record.date.startsWith("2026-11-") && record.date <= "2026-11-22"));
  assert.equal(records.at(-1).date, "2026-11-22");
  assert.equal(today.getTime(), before);
});

test("un día hábil muestra familia, personal de guardería, entrega escolar y recogida", () => {
  const record = createCurrentMonthAttendance("1", new Date(2026, 10, 20)).at(-1);
  const events = getAttendanceEvents(record);
  assert.equal(events.length, 6);
  assert.equal(events[0].adult, "Carlos García");
  assert.equal(events.at(-1).adult, "María López");
  assert.ok(events[2].responsibleName.includes("Laura Mendoza"));
  assert.ok(events[2].handoverPerson.includes("Patricia Ruiz"));
  assert.ok(events[3].handoverPerson.includes("Patricia Ruiz"));
  assert.equal(events[2].time, "08:30");
  assert.equal(events[3].time, "12:30");
  assert.equal(events.at(-1).time, "18:05");
});

test("el ejemplo de hoy en fin de semana no inventa un traslado escolar", () => {
  const record = createCurrentMonthAttendance("2", new Date(2026, 10, 22)).at(-1);
  assert.equal(record.schoolJourney, undefined);
  assert.equal(getAttendanceEvents(record).length, 2);
});

test("las ausencias de ejemplo no tienen entradas, salidas ni traslados", () => {
  const records = createCurrentMonthAttendance("1", new Date(2026, 10, 22));
  const absences = records.filter(record => record.status === "absent");
  assert.ok(absences.length > 0);
  for (const record of absences) assert.deepEqual(getAttendanceEvents(record), []);
});

test("el cambio de mes y año no arrastra registros de meses anteriores", () => {
  const records = createCurrentMonthAttendance("unknown", new Date(2027, 0, 1));
  assert.equal(records.length, 1);
  assert.equal(records[0].date, "2027-01-01");
  assert.equal(records[0].entryAdult, "Familiar de ejemplo");
});

test("los cuatro niños de prueba tienen escuela y recogida familiar independientes", () => {
  const schools = new Set();
  for (const id of ["1", "2", "4", "5"]) {
    const record = createCurrentMonthAttendance(id, new Date(2026, 10, 20)).at(-1);
    const events = getAttendanceEvents(record);
    assert.equal(record.place.id, "pequenos-exploradores");
    assert.ok(record.schoolJourney.place.latitude > 32.57 && record.schoolJourney.place.latitude < 32.60);
    assert.ok(record.schoolJourney.place.longitude > -115.38 && record.schoolJourney.place.longitude < -115.34);
    schools.add(record.schoolJourney.place.id);
    assert.equal(events.length, 6);
    assert.equal(events[2].location, record.schoolJourney.place.name);
    assert.equal(events.at(-1).location, record.place.name);
    assert.equal(events.at(-1).adult, record.exitAdult);
    assert.notEqual(events.at(-1).adult, record.schoolJourney.responsibleName);
  }
  assert.equal(schools.size, 2);
});

test("no se asigna una escuela a niños sin un ejemplo explícito", () => {
  for (const id of ["unknown", "3", "6"]) {
    const records = createCurrentMonthAttendance(id, new Date(2026, 10, 20));
    assert.ok(records.every(record => !record.schoolJourney));
  }
});
