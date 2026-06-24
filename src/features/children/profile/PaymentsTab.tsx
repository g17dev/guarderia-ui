import { useState } from "react";
import { Banknote } from "lucide-react";
import { InputSearch } from "../../../components/InputSearch";
import type {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentConcept,
} from "../../../types/payment";
import "./ProfileTabs.css";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  overdue: "Vencido",
  partial: "Parcial",
  cancelled: "Cancelado",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  check: "Cheque",
};

const CONCEPT_LABELS: Record<PaymentConcept, string> = {
  mensualidad: "Mensualidad",
  inscripcion: "Inscripción",
  materiales: "Materiales",
  uniforme: "Uniforme",
  evento: "Evento",
  otro: "Otro",
};

const ALL_STATUSES: PaymentStatus[] = [
  "paid",
  "pending",
  "overdue",
  "partial",
  "cancelled",
];
const ALL_METHODS: PaymentMethod[] = ["cash", "transfer", "check"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "1",
    concept: "mensualidad",
    amount: 2500,
    discount: 0,
    surcharge: 0,
    total: 2500,
    status: "paid",
    paymentMethod: "transfer",
    reference: "TRA-12345",
    dueDate: "2026-01-10",
    paymentDate: "2026-01-08",
    period: "Ene 2026",
    createdAt: "2025-12-20",
  },
  {
    id: "2",
    concept: "mensualidad",
    amount: 2500,
    discount: 250,
    surcharge: 0,
    total: 2250,
    status: "paid",
    paymentMethod: "cash",
    dueDate: "2026-02-10",
    paymentDate: "2026-02-05",
    period: "Feb 2026",
    createdAt: "2025-12-20",
  },
  {
    id: "3",
    concept: "mensualidad",
    amount: 2500,
    discount: 0,
    surcharge: 0,
    total: 2500,
    status: "paid",
    paymentMethod: "check",
    reference: "CHE-001",
    dueDate: "2026-03-10",
    paymentDate: "2026-03-09",
    period: "Mar 2026",
    createdAt: "2025-12-20",
  },
  {
    id: "4",
    concept: "mensualidad",
    amount: 2500,
    discount: 0,
    surcharge: 0,
    total: 2500,
    status: "pending",
    dueDate: "2026-04-10",
    period: "Abr 2026",
    createdAt: "2026-03-15",
  },
  {
    id: "5",
    concept: "mensualidad",
    amount: 2500,
    discount: 0,
    surcharge: 100,
    total: 2600,
    status: "overdue",
    dueDate: "2026-05-10",
    period: "May 2026",
    createdAt: "2026-04-15",
  },
  {
    id: "6",
    concept: "inscripcion",
    amount: 1000,
    discount: 0,
    surcharge: 0,
    total: 1000,
    status: "paid",
    paymentMethod: "cash",
    dueDate: "2026-01-05",
    paymentDate: "2026-01-03",
    period: "Ene 2026",
    createdAt: "2025-12-01",
  },
  {
    id: "7",
    concept: "materiales",
    amount: 850,
    discount: 0,
    surcharge: 0,
    total: 850,
    status: "partial",
    paymentMethod: "transfer",
    reference: "TRA-67890",
    dueDate: "2026-02-28",
    paymentDate: "2026-02-20",
    period: "Feb 2026",
    createdAt: "2026-01-15",
  },
  {
    id: "8",
    concept: "uniforme",
    amount: 1200,
    discount: 0,
    surcharge: 0,
    total: 1200,
    status: "cancelled",
    paymentMethod: "check",
    reference: "CHE-002",
    dueDate: "2026-03-15",
    period: "Mar 2026",
    createdAt: "2026-02-01",
  },
  {
    id: "9",
    concept: "evento",
    amount: 350,
    discount: 0,
    surcharge: 0,
    total: 350,
    status: "paid",
    paymentMethod: "cash",
    dueDate: "2026-04-20",
    paymentDate: "2026-04-18",
    period: "Abr 2026",
    createdAt: "2026-03-20",
  },
  {
    id: "10",
    concept: "otro",
    conceptLabel: "Terapia de lenguaje",
    amount: 1500,
    discount: 0,
    surcharge: 0,
    total: 1500,
    status: "pending",
    dueDate: "2026-05-30",
    period: "May 2026",
    createdAt: "2026-05-01",
  },
];

export function PaymentsTab({ childId }: { childId: string }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all",
  );
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">(
    "all",
  );

  const filtered = MOCK_PAYMENTS.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      CONCEPT_LABELS[p.concept].toLowerCase().includes(q) ||
      (p.conceptLabel && p.conceptLabel.toLowerCase().includes(q)) ||
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesMethod =
      methodFilter === "all" || p.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const activeFilters =
    (statusFilter !== "all" ? 1 : 0) + (methodFilter !== "all" ? 1 : 0);

  return (
    <div className="tab-content payments-tab">
      <div className="payments-toolbar">
        <InputSearch
          placeholder="Buscar por concepto, referencia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="payments-search"
        />
      </div>

      <div className="payments-filters"></div>

      <div className="tab-table-wrapper payments-table-wrapper">
        <table className="tab-table payments-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Concepto</th>
              <th>Vencimiento</th>
              <th>Monto</th>
              <th>Desc.</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Método</th>
              <th>Referencia</th>
              <th>Fecha pago</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="payments-empty">
                  <div className="payments-empty-icon">
                    <Banknote size={32} />
                  </div>
                  <span>
                    No se encontraron pagos
                    {activeFilters > 0 ? " con los filtros seleccionados" : ""}.
                  </span>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="cell-period">{p.period}</td>
                  <td className="cell-concept">
                    {CONCEPT_LABELS[p.concept]}
                    {p.conceptLabel && (
                      <span className="concept-sublabel">{p.conceptLabel}</span>
                    )}
                  </td>
                  <td>{formatDate(p.dueDate)}</td>
                  <td className="cell-number">{formatCurrency(p.amount)}</td>
                  <td className="cell-number cell-discount">
                    {p.discount > 0 ? `-${formatCurrency(p.discount)}` : "—"}
                  </td>
                  <td className="cell-number cell-total">
                    {formatCurrency(p.total)}
                  </td>
                  <td>
                    <span className={`payment-badge status-${p.status}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td>
                    {p.paymentMethod ? (
                      <span
                        className={`payment-badge method-${p.paymentMethod}`}
                      >
                        {METHOD_LABELS[p.paymentMethod]}
                      </span>
                    ) : (
                      <span className="cell-muted">—</span>
                    )}
                  </td>
                  <td className="cell-mono">
                    {p.reference || <span className="cell-muted">—</span>}
                  </td>
                  <td>{formatDate(p.paymentDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
