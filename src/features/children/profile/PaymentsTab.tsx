import { useState, useRef, useEffect } from "react";
import {
  Banknote,
  Clock3,
  Tag,
  CalendarDays,
  CircleCheck,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  FilterX,
} from "lucide-react";
import { InputSearch } from "../../../components/InputSearch";
import { ListFilterPlus } from "lucide-react";
import { Pagination } from "../components/Pagination";
import { type DateRange } from "react-day-picker";
import { Calendar } from "../../../components/ui/calendar";

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
  "partial",
  "cancelled",
];
const ALL_METHODS: PaymentMethod[] = ["cash", "transfer", "check"];
const ALL_CONCEPTS: PaymentConcept[] = [
  "mensualidad",
  "inscripcion",
  "materiales",
  "uniforme",
  "evento",
  "otro",
];

// Preset inteligente: estados que representan dinero que aún se le debe a la escuela
const PENDING_PAYMENT_STATUSES: PaymentStatus[] = ["pending", "partial"];

type FilterCategoryId = "estado" | "metodo" | "concepto" | "fecha";

const FILTER_CATEGORIES: {
  id: FilterCategoryId;
  label: string;
  icon: typeof CalendarDays;
}[] = [
  { id: "estado", label: "Estado", icon: CircleCheck },
  { id: "metodo", label: "Método", icon: CreditCard },
  // { id: "concepto", label: "Concepto", icon: Tag },
  { id: "fecha", label: "Fecha", icon: CalendarDays },
];

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

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

// Modifica la función FilterOptionRow para verificar el estado del popover
function FilterOptionRow({
  active,
  onClick,
  icon: Icon,
  dotClassName,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: typeof CalendarDays;
  dotClassName?: string;
  children: React.ReactNode;
}) {
  const [isMainPopoverOpen, setIsMainPopoverOpen] = useState(false);

  useEffect(() => {
    const mainPopover = document.getElementById("payments-filter-popover");
    if (!mainPopover) return;

    const checkPopoverState = () => {
      setIsMainPopoverOpen(mainPopover.matches(":popover-open"));
    };

    // Verificar estado inicial
    checkPopoverState();

    // Escuchar cambios en el popover
    mainPopover.addEventListener("toggle", checkPopoverState);

    return () => {
      mainPopover.removeEventListener("toggle", checkPopoverState);
    };
  }, []);

  const handleClick = () => {
    // Solo ejecutar onClick si el popover principal está abierto
    if (isMainPopoverOpen) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={`payments-filter-row ${active ? "active" : ""}`}
      onClick={handleClick}
      style={{
        pointerEvents: isMainPopoverOpen ? "auto" : "none",
        opacity: isMainPopoverOpen ? 1 : 0.7,
      }}
    >
      <span className="payments-filter-row-check">
        <Check size={11} strokeWidth={3} />
      </span>
      {dotClassName && (
        <span className={`payments-filter-row-dot ${dotClassName}`} />
      )}
      {Icon && <Icon size={14} className="payments-filter-row-icon" />}
      <span className="payments-filter-row-label">{children}</span>
    </button>
  );
}

function isDateWithinRange(value: string | undefined, from?: Date, to?: Date) {
  if (!value) return false;

  const date = new Date(value);

  if (from && date < from) return false;

  if (to && date > to) return false;

  return true;
}

type DatePreset = "today" | "yesterday" | "last7" | "last14" | "last30";

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  last7: "Últimos 7 días",
  last14: "Últimos 14 días",
  last30: "Últimos 30 días",
};

const ALL_DATE_PRESETS: DatePreset[] = [
  "today",
  "yesterday",
  "last7",
  "last14",
  "last30",
];

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
  const [statusFilters, setStatusFilters] = useState<Set<PaymentStatus>>(
    new Set(),
  );
  const [methodFilters, setMethodFilters] = useState<Set<PaymentMethod>>(
    new Set(),
  );
  const [conceptFilters, setConceptFilters] = useState<Set<PaymentConcept>>(
    new Set(),
  );
  const [discountOnly, setDiscountOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategoryId | null>(
    null,
  );
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCustomDateActive, setIsCustomDateActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  let filterFrom: Date | undefined;
  let filterTo: Date | undefined;

  const today = new Date();

  if (datePreset) {
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    switch (datePreset) {
      case "today": {
        filterFrom = new Date(today);
        filterFrom.setHours(0, 0, 0, 0);
        filterTo = end;
        break;
      }

      case "yesterday": {
        filterFrom = new Date(today);
        filterFrom.setDate(filterFrom.getDate() - 1);
        filterFrom.setHours(0, 0, 0, 0);

        filterTo = new Date(filterFrom);
        filterTo.setHours(23, 59, 59, 999);
        break;
      }

      case "last7": {
        filterFrom = new Date(today);
        filterFrom.setDate(filterFrom.getDate() - 6);
        filterFrom.setHours(0, 0, 0, 0);
        filterTo = end;
        break;
      }

      case "last14": {
        filterFrom = new Date(today);
        filterFrom.setDate(filterFrom.getDate() - 13);
        filterFrom.setHours(0, 0, 0, 0);
        filterTo = end;
        break;
      }

      case "last30": {
        filterFrom = new Date(today);
        filterFrom.setDate(filterFrom.getDate() - 29);
        filterFrom.setHours(0, 0, 0, 0);
        filterTo = end;
        break;
      }
    }
  }

  if (isCustomDateActive) {
    filterFrom = dateRange?.from;

    filterTo = dateRange?.to
      ? new Date(dateRange.to.setHours(23, 59, 59, 999))
      : undefined;
  }

  const filtered = MOCK_PAYMENTS.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      CONCEPT_LABELS[p.concept].toLowerCase().includes(q) ||
      (p.conceptLabel && p.conceptLabel.toLowerCase().includes(q)) ||
      (p.reference && p.reference.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    const matchesStatus =
      statusFilters.size === 0 || statusFilters.has(p.status);
    const matchesMethod =
      methodFilters.size === 0 ||
      (p.paymentMethod && methodFilters.has(p.paymentMethod));
    const matchesConcept =
      conceptFilters.size === 0 || conceptFilters.has(p.concept);
    const matchesDiscount = !discountOnly || p.discount > 0;

    const matchesDate =
      (!filterFrom && !filterTo) ||
      isDateWithinRange(p.paymentDate ?? p.createdAt, filterFrom, filterTo);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMethod &&
      matchesConcept &&
      matchesDiscount &&
      matchesDate
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const isPendingPresetActive =
    PENDING_PAYMENT_STATUSES.every((s) => statusFilters.has(s)) &&
    statusFilters.size === PENDING_PAYMENT_STATUSES.length;

  const togglePendingPreset = () => {
    setStatusFilters(
      isPendingPresetActive ? new Set() : new Set(PENDING_PAYMENT_STATUSES),
    );
  };

  const clearAllFilters = () => {
    setStatusFilters(new Set());
    setMethodFilters(new Set());
    setConceptFilters(new Set());

    setDiscountOnly(false);

    setDatePreset(null);

    setDateRange(undefined);

    setIsCustomDateActive(false);
  };

  const activeFilters =
    statusFilters.size +
    methodFilters.size +
    conceptFilters.size +
    (datePreset !== null || isCustomDateActive ? 1 : 0);

  const hasFilters =
    activeFilters > 0 || datePreset !== null || isCustomDateActive;

  const categoryCounts: Record<FilterCategoryId, number> = {
    estado: statusFilters.size,
    metodo: methodFilters.size,
    concepto: conceptFilters.size,
    fecha: datePreset !== null || isCustomDateActive ? 1 : 0,
  };

  const detailsPanelRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (id: FilterCategoryId) => {
    const panel = detailsPanelRef.current;
    const mainPopover = document.getElementById("payments-filter-popover");

    // Verificar si el popover principal está abierto
    const isMainPopoverOpen = mainPopover?.matches(":popover-open");

    // Si el popover principal no está abierto, no hacer nada
    if (!isMainPopoverOpen) {
      return;
    }

    if (!panel) return;

    if (activeCategory === id) {
      setActiveCategory(null);
      panel.togglePopover(false);
      return;
    }

    (panel.style as any).positionAnchor = `--nav-anchor-${id}`;
    setActiveCategory(id);
    panel.togglePopover(true);
  };
  useEffect(() => {
    const panel = detailsPanelRef.current;
    if (!panel) return;

    const handleNativeToggle = (e: Event) => {
      const evt = e as ToggleEvent; // tiene .newState: "open" | "closed"
      if (evt.newState === "closed") {
        setActiveCategory(null); // sincroniza React con lo que el navegador ya hizo
        setShowCustomCalendar(false); // si se cierra todo, regresa a la vista de lista
      }
    };

    panel.addEventListener("toggle", handleNativeToggle);
    return () => panel.removeEventListener("toggle", handleNativeToggle);
  }, []);

  const dateRangeLabel =
    dateRange?.from && dateRange?.to
      ? `${formatDate(dateRange.from.toISOString())} – ${formatDate(dateRange.to.toISOString())}`
      : dateRange?.from
        ? formatDate(dateRange.from.toISOString())
        : "Selecciona un rango";

  // Agrega este useEffect al componente principal PaymentsTab
  useEffect(() => {
    const mainPopover = document.getElementById("payments-filter-popover");
    if (!mainPopover) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Si el popover está abierto y el click es fuera de él y fuera del botón que lo abre
      if (mainPopover.matches(":popover-open")) {
        const target = e.target as HTMLElement;
        const filterButton = document.querySelector(
          '.btn-filter[popovertarget="payments-filter-popover"]',
        );

        if (!mainPopover.contains(target) && !filterButton?.contains(target)) {
          // Cerrar el popover principal
          mainPopover.togglePopover(false);
          // También cerrar el panel de detalles
          if (detailsPanelRef.current) {
            detailsPanelRef.current.togglePopover(false);
            setActiveCategory(null);
            setShowCustomCalendar(false);
          }
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="tab-content payments-tab">
      <div className="payments-toolbar">
        <InputSearch
          placeholder="Buscar por concepto, referencia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="payments-search"
        />

        <button
          className={`btn-filter edit ${hasFilters ? "active" : ""}`}
          popoverTarget="payments-filter-popover"
          style={{ anchorName: "--payments-btn-filter" } as any}
        >
          <ListFilterPlus size={16} strokeWidth={2.5} />
          Filtrar
          {activeFilters > 0 && (
            <span className="btn-filter-count">{activeFilters}</span>
          )}
        </button>
      </div>

      <div
        id="payments-filter-popover"
        popover="auto"
        className="payments-filter-popover"
      >
        <div className="payments-filter-body">
          <div className="payments-filter-nav">
            {FILTER_CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                style={{ anchorName: `--nav-anchor-${id}` } as any}
                className={`payments-filter-nav-item ${activeCategory === id ? "active" : ""}`}
                onClick={() => handleCategoryClick(id)}
              >
                <Icon size={14} strokeWidth={2.2} />
                <span className="payments-filter-nav-label">{label}</span>
                {categoryCounts[id] > 0 && (
                  <span className="payments-filter-nav-count">
                    {categoryCounts[id]}
                  </span>
                )}
                <ChevronRight
                  size={14}
                  className="payments-filter-nav-chevron"
                />
              </button>
            ))}
          </div>
          <div
            ref={detailsPanelRef}
            id="filter-details-panel"
            popover="auto"
            className={`filter-details-panel ${
              activeCategory === "fecha" ? "filter-details-panel--fecha" : ""
            } ${showCustomCalendar ? "filter-details-panel--calendar" : ""}`}
          >
            <div className="payments-filter-panel">
              {activeCategory === "estado" && (
                <div className="payments-filter-panel-section">
                  {ALL_STATUSES.map((status) => (
                    <FilterOptionRow
                      key={status}
                      active={statusFilters.has(status)}
                      onClick={() =>
                        setStatusFilters((prev) => toggleInSet(prev, status))
                      }
                    >
                      <span className={`payment-badge status-${status}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </FilterOptionRow>
                  ))}
                </div>
              )}

              {activeCategory === "metodo" && (
                <div className="payments-filter-panel-section">
                  {ALL_METHODS.map((method) => (
                    <FilterOptionRow
                      key={method}
                      active={methodFilters.has(method)}
                      onClick={() =>
                        setMethodFilters((prev) => toggleInSet(prev, method))
                      }
                    >
                      <span className={`payment-badge method-${method}`}>
                        {METHOD_LABELS[method]}
                      </span>
                    </FilterOptionRow>
                  ))}
                </div>
              )}

              {/*{activeCategory === "concepto" && (
                <div className="payments-filter-panel-section">
                  {ALL_CONCEPTS.map((concept) => (
                    <FilterOptionRow
                      key={concept}
                      active={conceptFilters.has(concept)}
                      onClick={() =>
                        setConceptFilters((prev) => toggleInSet(prev, concept))
                      }
                      label={CONCEPT_LABELS[concept]}
                      icon={Tag}
                    />
                  ))}
                </div>
              )}*/}

              {activeCategory === "fecha" && (
                <div className="payments-filter-panel-section">
                  {showCustomCalendar ? (
                    <div className="payments-filter-calendar-view">
                      <div className="payments-filter-calendar-header">
                        <button
                          type="button"
                          className="payments-filter-back-btn"
                          onClick={() => setShowCustomCalendar(false)}
                        >
                          <ChevronLeft size={14} strokeWidth={2.5} />
                          Volver
                        </button>
                        <span className="payments-filter-range-label">
                          {dateRangeLabel}
                        </span>
                      </div>

                      <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />

                      <button
                        type="button"
                        className="payments-filter-btn-apply payments-filter-calendar-apply"
                        disabled={!dateRange?.from}
                        onClick={() => {
                          setDatePreset(null);
                          setIsCustomDateActive(true);
                          setShowCustomCalendar(false);
                        }}
                      >
                        Aceptar
                      </button>
                    </div>
                  ) : (
                    <>
                      {ALL_DATE_PRESETS.map((preset) => (
                        <FilterOptionRow
                          key={preset}
                          active={datePreset === preset}
                          onClick={() => {
                            setDatePreset((prev) =>
                              prev === preset ? null : preset,
                            );

                            setIsCustomDateActive(false);

                            setDateRange(undefined);
                          }}
                        >
                          {DATE_PRESET_LABELS[preset]}
                        </FilterOptionRow>
                      ))}

                      <button
                        type="button"
                        className={`payments-filter-row payments-filter-row-custom ${isCustomDateActive ? "active" : ""}`}
                        onClick={() => setShowCustomCalendar(true)}
                      >
                        <span className="payments-filter-row-check">
                          <Check size={11} strokeWidth={3} />
                        </span>

                        <span className="payments-filter-row-label">
                          Personalizar fecha
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          {activeFilters > 0 && (
            <div className="payments-filter-footer">
              <button
                type="button"
                className="payments-filter-clear-btn"
                onClick={clearAllFilters}
              >
                <FilterX size={15} strokeWidth={2.3} />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

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
              <tr className="payments-empty-row">
                <td colSpan={10} className="payments-empty">
                  <div className="payments-empty-icon">
                    <Banknote size={62} />
                  </div>
                  <span>
                    No se encontraron pagos
                    {activeFilters > 0 ? " con los filtros seleccionados" : ""}.
                  </span>
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
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

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        label="pagos"
      />
    </div>
  );
}
