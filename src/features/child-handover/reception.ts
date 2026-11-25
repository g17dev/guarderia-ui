import type { Child } from "../../types/child";
import type { MovementDetails } from "./belongings";

export type Movement = "entry" | "pickup";
export type AttendanceStatus = "inside" | "pending" | "out" | "absent";
export type ReceptionFilter = AttendanceStatus | "all";
export type ReceptionChild = Child & {
  attendanceStatus: AttendanceStatus;
  // Today's service validity is supplied by the backend, independently of enrollment.
  serviceStatus: "active" | "inactive";
};
export type MovementRequest = { childIds: string[]; action: Movement };
export type VerificationRequest = MovementRequest & { adultId: string };
export type IdentificationRequest = MovementRequest & { candidateAdultIds: string[] };

export class ReceptionAuthorizationError extends Error {
  readonly code = "not_authorized";
  constructor(message = "Esta huella no tiene autorización para los niños seleccionados.") {
    super(message);
    this.name = "ReceptionAuthorizationError";
  }
}

export interface ReceptionAdult {
  id: string;
  name: string;
  photoUrl?: string;
  permissions: { childId: string; actions: Movement[]; relationship: string }[];
}

export function getCompatibleAdults(adults: ReceptionAdult[], request: MovementRequest) {
  if (!request.childIds.length) return [];
  return adults.filter(adult => request.childIds.every(childId => adult.permissions.some(permission =>
    permission.childId === childId && permission.actions.includes(request.action))));
}

export interface Authorization extends MovementRequest {
  token: string;
  adult: { id: string; name: string; photoUrl?: string };
  expiresAt: string;
  permissions: { childId: string; authorized: boolean }[];
}

export interface MovementReceipt extends MovementRequest {
  id: string;
  adultId: string;
  savedAt: string;
}

// Implement this boundary with the real reader/backend. Verification must resolve
// identity AND current permissions. Save must recheck them and commit atomically.
// A failed/ambiguous save must be retried with the SAME idempotencyKey.
export interface ReceptionGateway {
  readonly mode?: "simulation" | "live";
  // The reader searches only this gallery. The backend must independently
  // recheck current permissions; client-provided candidate IDs are not proof.
  identify?(request: IdentificationRequest): Promise<Authorization>;
  verify(request: VerificationRequest): Promise<Authorization>;
  save(request: MovementRequest & { authorizationToken: string; idempotencyKey: string; details?: MovementDetails }): Promise<MovementReceipt>;
}

export const disconnectedGateway: ReceptionGateway = {
  async verify() {
    throw new Error("El lector no está conectado. Revisa la conexión antes de volver a intentar.");
  },
  async save() {
    throw new Error("No se pudo conectar con el servicio de registro.");
  },
};

export const attendanceLabels: Record<AttendanceStatus, string> = {
  inside: "En guardería", pending: "Por llegar", out: "Ya salió", absent: "Ausencia avisada",
};

export const receptionFilterLabels: Record<ReceptionFilter, string> = {
  all: "Todos", inside: "En guardería", pending: "Por llegar", out: "Ya salieron",
  absent: "Ausencias",
};

export function matchesReceptionFilter(child: ReceptionChild, filter: ReceptionFilter) {
  // Keep today's recorded movements available even if service has expired.
  // Children without active service and without a movement do not belong here.
  if (child.serviceStatus !== "active" && child.attendanceStatus !== "inside" && child.attendanceStatus !== "out") return false;
  if (filter === "all") return true;
  if (filter === "pending") return child.attendanceStatus === "pending" && child.serviceStatus === "active";
  return child.attendanceStatus === filter;
}

export function getReceptionCounts(children: ReceptionChild[]) {
  return {
    inside: children.filter(child => child.attendanceStatus === "inside").length,
    pending: children.filter(child => matchesReceptionFilter(child, "pending")).length,
    out: children.filter(child => child.attendanceStatus === "out").length,
    // The source list represents today's schedule; notified absences and expired
    // service do not belong to the expected cohort. Physical movements stay visible.
    all: children.filter(child => child.serviceStatus === "active" && child.attendanceStatus !== "absent").length,
  };
}

export function canMove(children: ReceptionChild[], action: Movement) {
  return children.length > 0 && children.every(child => action === "entry"
    ? ["pending", "out", "absent"].includes(child.attendanceStatus) && child.serviceStatus === "active"
    : child.attendanceStatus === "inside");
}

function sameIds(actual: string[], expected: string[]) {
  return actual.length === expected.length && new Set(actual).size === actual.length
    && new Set(expected).size === expected.length
    && expected.every(id => actual.includes(id));
}

export function isAuthorized(authorization: Authorization, request: MovementRequest & { adultId?: string }, now = Date.now()) {
  return request.childIds.length > 0
    && Boolean(authorization.token && authorization.adult.id && authorization.adult.name)
    && (!request.adultId || authorization.adult.id === request.adultId)
    && Date.parse(authorization.expiresAt) > now
    && authorization.action === request.action
    && sameIds(authorization.childIds, request.childIds)
    && authorization.permissions.length === request.childIds.length
    && sameIds(authorization.permissions.map(permission => permission.childId), request.childIds)
    && authorization.permissions.every(permission => permission.authorized);
}

export function isCompleteReceipt(receipt: MovementReceipt, request: MovementRequest, adultId: string) {
  return Boolean(receipt.id) && Number.isFinite(Date.parse(receipt.savedAt))
    && receipt.adultId === adultId && receipt.action === request.action
    && sameIds(receipt.childIds, request.childIds);
}
