import { MOCK_CHILDREN } from "../../data/mockChildren";
import type { AttendanceStatus, ReceptionAdult, ReceptionChild } from "./reception";

// Presentation data only. Do not infer today's attendance from enrollment status.
// Replace this fixture with today's expected children and their backend attendance.
const exampleStatuses: AttendanceStatus[] = ["inside", "pending", "inside", "out"];
const scheduledExamples: ReceptionChild[] = MOCK_CHILDREN
  .filter(child => child.status === "active")
  .map((child, index) => ({ ...child, attendanceStatus: exampleStatuses[index % exampleStatuses.length], serviceStatus: "active" }));

// Additional reception-only examples. These do not modify the child directory or
// infer service validity from a child's active/inactive enrollment status.
export const RECEPTION_EXAMPLE_CHILDREN: ReceptionChild[] = [
  ...scheduledExamples,
  { ...scheduledExamples[0], id: "reception-example-sibling", slug: "mia-garcia-lopez-example",
    name: "Mía", lastName: "García López", photoUrl: "", attendanceStatus: "inside" },
  { ...scheduledExamples[0], id: "reception-example-absence", slug: "lucia-soto-example",
    name: "Lucía", lastName: "Soto", photoUrl: "", attendanceStatus: "absent" },
  { ...scheduledExamples[1], id: "reception-example-service", slug: "nicolas-ruiz-example",
    name: "Nicolás", lastName: "Ruiz", photoUrl: "", serviceStatus: "inactive", attendanceStatus: "pending" },
];

// Explicit demonstration permissions, independent of the directory's tutor data.
export const RECEPTION_EXAMPLE_ADULTS: ReceptionAdult[] = [
  { id: "demo-carlos", name: "Carlos García", permissions: ["1", "reception-example-sibling"].map(childId =>
    ({ childId, actions: ["entry", "pickup"], relationship: "Padre" })) },
  { id: "demo-maria", name: "María López", permissions: ["1", "reception-example-sibling"].map(childId =>
    ({ childId, actions: ["entry", "pickup"], relationship: "Madre" })) },
  { id: "demo-ana", name: "Ana Soto", permissions: ["2", "reception-example-absence"].map(childId =>
    ({ childId, actions: ["entry", "pickup"], relationship: "Madre" })) },
  { id: "demo-diego", name: "Diego Rodríguez", permissions: [{ childId: "2", actions: ["entry", "pickup"], relationship: "Padre" }] },
  { id: "demo-pedro", name: "Pedro Martínez", permissions: [{ childId: "4", actions: ["entry", "pickup"], relationship: "Padre" }] },
  { id: "demo-elena", name: "Elena Ruiz", permissions: [{ childId: "4", actions: ["entry", "pickup"], relationship: "Tía autorizada" }] },
  { id: "demo-laura", name: "Laura Gil", permissions: [{ childId: "5", actions: ["entry", "pickup"], relationship: "Madre" }] },
];
