import type { AttendanceRecord } from "./attendanceRecords";
import { previewNursery, previewSchoolByChild } from "./attendancePlaces.ts";

// Explicit fictional history for UX review. Never infer a real handover or an
// authorization from these names, from a tutor, or from a device response.
const exampleFamilies: Record<string, [string, string]> = {
  "1": ["Carlos García", "María López"], "2": ["Ana Soto", "Diego Rodríguez"],
  "4": ["Pedro Martínez", "Elena Ruiz"], "5": ["Laura Gil", "Laura Gil"],
};
export function createCurrentMonthAttendance(childId: string, today: Date): AttendanceRecord[] {
  const [entryAdult, exitAdult] = exampleFamilies[childId] ?? ["Familiar de ejemplo", "Familiar de ejemplo"];
  const school = previewSchoolByChild[childId];
  const records: AttendanceRecord[] = [];
  for (let day = 1; day <= today.getDate(); day++) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const weekday = date.getDay() !== 0 && date.getDay() !== 6;
    // Include today for an immediately visible demo; school trips use weekdays.
    if (!weekday && day !== today.getDate()) continue;
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const absent = day !== today.getDate() && day % 9 === 0;
    records.push({
      date: dateKey, entry: absent ? "-" : day % 2 ? "07:35" : "07:45", exit: absent ? "-" : "18:05",
      status: absent ? "absent" : "present", location: previewNursery.name, place: previewNursery,
      entryAdult, exitAdult, recordedBy: "Ana Torres · Recepción",
      notes: "Registro ficticio para visualizar la jornada y los responsables de cada movimiento.",
      schoolJourney: !absent && weekday && school ? {
        schoolName: school.name, place: school, departure: "08:10", delivered: "08:30", pickedUp: "12:30", returned: "12:50",
        responsibleName: "Laura Mendoza · Encargada de la guardería", deliveredTo: "Patricia Ruiz · Personal de la escuela", pickedUpFrom: "Patricia Ruiz · Personal de la escuela", recordedBy: "Laura Mendoza · Traslados",
      } : undefined,
    });
  }
  return records;
}
