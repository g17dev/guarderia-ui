export type AttendanceStatus = "present" | "absent" | "early";
export type AttendancePlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  mapsUrl: string;
};
export type AttendanceRecord = {
  date: string;
  entry: string;
  exit: string;
  status: AttendanceStatus;
  location: string;
  place?: AttendancePlace;
  entryAdult?: string;
  exitAdult?: string;
  recordedBy?: string;
  notes?: string;
  schoolJourney?: {
    schoolName: string;
    place?: AttendancePlace;
    departure?: string;
    delivered?: string;
    pickedUp?: string;
    returned?: string;
    responsibleName?: string;
    deliveredTo?: string;
    pickedUpFrom?: string;
    recordedBy?: string;
  };
};
export type AttendanceEvent = {
  id: "entry" | "school-departure" | "school-delivery" | "school-pickup" | "school-return" | "exit";
  label: string;
  time: string;
  location: string;
  kind: "entry" | "exit" | "school" | "transport";
  adult?: string;
  responsibleName?: string;
  recordedBy?: string;
  handoverPerson?: string;
};

// Presentation chronology only. Missing times never become completed events.
export function getAttendanceEvents(record: AttendanceRecord): AttendanceEvent[] {
  if (record.status === "absent") return [];
  const events: AttendanceEvent[] = [];
  const add = (event: AttendanceEvent) => {
    if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.time)) events.push(event);
  };
  add({ id: "entry", label: "Entrada a guardería", time: record.entry, location: record.location, kind: "entry", adult: record.entryAdult, recordedBy: record.recordedBy });
  const journey = record.schoolJourney;
  if (journey) {
    add({ id: "school-departure", label: "Salida hacia la escuela", time: journey.departure ?? "", location: `Guardería → ${journey.schoolName}`, kind: "transport", responsibleName: journey.responsibleName });
    add({ id: "school-delivery", label: "Entrega en la escuela", time: journey.delivered ?? "", location: journey.schoolName, kind: "school", responsibleName: journey.responsibleName, handoverPerson: journey.deliveredTo, recordedBy: journey.recordedBy });
    add({ id: "school-pickup", label: "Recogida en la escuela", time: journey.pickedUp ?? "", location: journey.schoolName, kind: "school", responsibleName: journey.responsibleName, handoverPerson: journey.pickedUpFrom, recordedBy: journey.recordedBy });
    add({ id: "school-return", label: "Regreso a guardería", time: journey.returned ?? "", location: record.location, kind: "transport", responsibleName: journey.responsibleName });
  }
  add({ id: "exit", label: "Recogida en guardería", time: record.exit, location: record.location, kind: "exit", adult: record.exitAdult, recordedBy: record.recordedBy });
  return events.sort((a, b) => a.time.localeCompare(b.time));
}
