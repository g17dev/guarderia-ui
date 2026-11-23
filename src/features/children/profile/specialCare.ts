export const careCategoryLabels = {
  feeding: "Alimentación", allergy: "Alergias", mobility: "Movilidad",
  communication: "Comunicación", rest: "Descanso", medication: "Medicamentos",
  medical: "Cuidado médico", other: "Otro cuidado",
};
export type CareInstruction = {
  id: string;
  category: keyof typeof careCategoryLabels;
  instruction: string;
  when: string;
  priority: "routine" | "priority";
  validity: "ongoing" | "temporary";
  startDate: string;
  endDate: string;
  reportedBy: string;
  updatedAt: string;
  authorizationStatus: "pending" | "documented";
  authorizationReference: string;
};
export type SpecialCarePlan = {
  instructions: CareInstruction[];
  review?: { reviewedBy: string; reviewedAt: string };
};
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function isMedicalCare(item: CareInstruction) {
  return item.category === "medication" || item.category === "medical";
}
export function getCareState(item: CareInstruction, today = localDateKey()) {
  if (item.startDate > today) return "upcoming";
  if (item.validity === "temporary" && item.endDate && item.endDate < today) return "expired";
  return "active";
}
export function getSpecialCareSummary(plan?: SpecialCarePlan, today = localDateKey()) {
  const instructions = plan?.instructions ?? [];
  const active = instructions.filter(item => getCareState(item, today) === "active")
    .sort((a, b) => Number(b.priority === "priority") - Number(a.priority === "priority"));
  return {
    active,
    priorityCount: active.filter(item => item.priority === "priority").length,
    upcoming: instructions.filter(item => getCareState(item, today) === "upcoming"),
    expired: instructions.filter(item => getCareState(item, today) === "expired"),
    reviewed: Boolean(plan?.review),
  };
}
// Any change to an instruction requires a new explicit review.
export function withCareInstructions(plan: SpecialCarePlan, instructions: CareInstruction[]): SpecialCarePlan {
  return { ...plan, instructions, review: undefined };
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateSpecialCarePlan(plan: SpecialCarePlan) {
  for (const [index, item] of plan.instructions.entries()) {
    const prefix = `Cuidado ${index + 1}:`;
    if (!item.instruction.trim() || !item.when.trim() || !item.reportedBy.trim()) {
      return { id: item.id, message: `${prefix} completa la indicación, cuándo aplica y quién la proporcionó.` };
    }
    if (!validDate(item.startDate) || (item.validity === "temporary" && (!validDate(item.endDate) || item.endDate < item.startDate))) {
      return { id: item.id, message: `${prefix} revisa las fechas de vigencia. La fecha final debe ser igual o posterior al inicio.` };
    }
    if (isMedicalCare(item) && item.authorizationStatus === "documented" && !item.authorizationReference.trim()) {
      return { id: item.id, message: `${prefix} indica la referencia de la autorización o déjala como pendiente.` };
    }
  }
}
