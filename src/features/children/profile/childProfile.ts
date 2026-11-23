import type { Child } from "../../../types/child";
import type { HealthData } from "../steps/HealthStep";
import type { TutorData } from "../steps/TutorStep";
import { RECEPTION_EXAMPLE_ADULTS, RECEPTION_EXAMPLE_CHILDREN } from "../../child-handover/receptionFixtures";
import type { SpecialCarePlan } from "./specialCare";

export type ProfileAuthorizedAdult = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  canPickup: boolean;
  // Presentation marker only: never a biometric template or proof of identity.
  fingerprintPreview?: { finger: string; capturedAt: string };
};
export type ProfileEditSection = "personal" | "health" | "adults";

// Optional registration fields. Legacy directory records do not contain these
// yet: leave missing values empty instead of inventing medical/personal data.
export type ProfileChild = Child & {
  gender?: "male" | "female" | "";
  lastNamePaternal?: string;
  lastNameMaternal?: string;
  responsibleAdults?: Omit<TutorData, "photoFile">[];
  health?: HealthData;
  authorizedAdults?: ProfileAuthorizedAdult[];
  specialCare?: SpecialCarePlan;
};

export const serviceLabels = {
  active: "Activo", pending: "Pendiente de pago", expired: "Vencido", inactive: "Sin servicio activo",
};
// Explicit presentation examples, independent of enrollment and attendance.
const demoServices: Record<string, keyof typeof serviceLabels> = {
  "1": "active", "2": "pending", "3": "inactive", "4": "active", "5": "expired", "6": "inactive",
};
export function getProfilePreviewState(id: string) {
  return {
    attendance: RECEPTION_EXAMPLE_CHILDREN.find(child => child.id === id)?.attendanceStatus,
    service: demoServices[id],
  };
}

export function getProfileAuthorizedAdults(child: ProfileChild): ProfileAuthorizedAdult[] {
  if (child.authorizedAdults !== undefined) return structuredClone(child.authorizedAdults);
  // Explicit demo grants only. Being listed as a tutor does not grant pickup.
  return RECEPTION_EXAMPLE_ADULTS.filter(adult => adult.permissions.some(permission => permission.childId === child.id))
    .map(adult => ({
      id: adult.id, name: adult.name,
      relationship: adult.permissions.find(permission => permission.childId === child.id)?.relationship ?? "",
      phone: adult.name === `${child.tutor.name} ${child.tutor.lastName}` ? child.tutor.phone : "",
      canPickup: adult.permissions.some(permission => permission.childId === child.id && permission.actions.includes("pickup")),
    }));
}

export function getProfileHealth(child: ProfileChild): HealthData {
  return child.health ?? {
    bloodType: "", conditions: "", conditionSeverity: "", medications: [], doctorName: "", doctorPhone: "",
    allergies: child.allergies.map((name, index) => ({ id: `existing-${index}`, name, category: "other" })),
  };
}
