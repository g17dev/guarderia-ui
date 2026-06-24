export type PaymentStatus = "paid" | "pending" | "overdue" | "partial" | "cancelled";
export type PaymentMethod = "cash" | "transfer" | "check";
export type PaymentConcept =
  | "mensualidad"
  | "inscripcion"
  | "materiales"
  | "uniforme"
  | "evento"
  | "otro";

export interface Payment {
  id: string;
  concept: PaymentConcept;
  conceptLabel?: string;
  amount: number;
  discount: number;
  surcharge: number;
  total: number;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  reference?: string;
  dueDate: string;
  paymentDate?: string;
  period: string;
  notes?: string;
  createdAt: string;
}
