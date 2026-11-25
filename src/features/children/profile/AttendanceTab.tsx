import { createContext, lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addMonths, format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { LogIn, LogOut, Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight, Info, BusFront, School, UserRound, Clock3 } from "lucide-react";

import type { WeekdayProps } from "react-day-picker";
import { createCurrentMonthAttendance } from "./attendancePreview";
import { getAttendanceEvents, type AttendanceEvent, type AttendanceRecord, type AttendanceStatus } from "./attendanceRecords";

import "./ProfileTabs.css";

import { Calendar } from "../../../components/ui/calendar";
import "./AttendanceCalendar.css";
import { useOperationalSimulation } from "../../child-handover/operationalSimulation";
import { OperationalHistory, BelongingsFollowUp } from "./OperationalHistory";
import { localDateKey } from "./specialCare";

const AttendanceRecordDetail = lazy(() => import("./AttendanceRecordDetail").then(module => ({ default: module.AttendanceRecordDetail })));
const MonthYearPicker = lazy(() => import("../../../components/MonthYearPicker").then(module => ({ default: module.MonthYearPicker })));

const LOCATIONS = [
  "3890 Poplar Dr, Mexicali, BC, 21000",
  "Av. Reforma 345, Mexicali, BC, 21000",
];

const STATUS_POOL: AttendanceStatus[] = [
  "present",
  "present",
  "present",
  "present",
  "absent",
  "early",
];

function generateMockAttendance(
  startStr: string,
  endStr: string,
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const [sy, sm, sd] = startStr.split("-").map(Number);
  const [ey, em, ed] = endStr.split("-").map(Number);
  const current = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Saltar fines de semana (sábado y domingo)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateStr = format(current, "yyyy-MM-dd");
      const day = current.getDate();
      const status = STATUS_POOL[day % STATUS_POOL.length];
      const location = LOCATIONS[day % LOCATIONS.length];

      let entry = "-";
      let exit = "-";
      if (status !== "absent") {
        const entryHour = 7 + (day % 4 === 0 ? 1 : 0);
        const entryMin = (day * 7) % 60;
        entry = `${String(entryHour).padStart(2, "0")}:${String(entryMin).padStart(2, "0")}`;

        const exitHour = 13 + (day % 5 === 0 ? 1 : 0);
        const exitMin = (day * 13) % 60;
        exit = `${String(exitHour).padStart(2, "0")}:${String(exitMin).padStart(2, "0")}`;
      }

      records.push({ date: dateStr, entry, exit, status, location });
    }
    current.setDate(current.getDate() + 1);
  }

  return records;
}

// One explicit school-journey preview. Real movements are supplied later by the backend.
const MOCK_ATTENDANCE: AttendanceRecord[] = generateMockAttendance("2026-06-15", "2026-06-21").map(record => record.date === "2026-06-15"
  ? { ...record, schoolJourney: { schoolName: "Escuela de ejemplo", departure: "08:10", delivered: "08:30", pickedUp: "12:30", returned: "12:50" } } : record);

interface EventCardProps {
  selectedDate: Date;
  event: AttendanceEvent;
  delay: number;
  onOpen: (trigger: HTMLButtonElement) => void;
}

const movementIcons = { entry: LogIn, exit: LogOut, school: School, transport: BusFront };

function EventCard({ selectedDate, event, delay, onOpen }: EventCardProps) {
  const Icon = movementIcons[event.kind];
  const timestamp = parseISO(`${format(selectedDate, "yyyy-MM-dd")}T${event.time}`);
  const person = event.adult ?? event.responsibleName;
  const personLabel = event.adult ? event.kind === "entry" ? "Entregó" : "Recogió" : "Responsable";
  return (
    <button type="button" className={`event-card event-card-${event.kind}`} aria-haspopup="dialog" aria-label={`Ver detalle: ${event.label}, ${format(selectedDate, "d MMMM", { locale: es })}, ${event.time}${person ? `, ${personLabel}: ${person}` : ""}`} style={{ animationDelay: `${delay}ms` }} onClick={e => onOpen(e.currentTarget)}>
      <span className="event-card-icon-container"><span className={`event-card-movement-icon ${event.kind}`}><Icon size={20} aria-hidden="true" /></span></span>
      <span className="event-card-info">
        <span className="event-card-label">{event.label}</span>
        <span className="event-card-badges">
          <span className="badge badge-datetime"><Clock3 size={13} aria-hidden="true" /><time dateTime={format(timestamp, "yyyy-MM-dd'T'HH:mm")}>{format(timestamp, "h:mm a", { locale: es })}</time></span>
          <span className="badge badge-location" title={event.location}><MapPin size={13} aria-hidden="true" /><span>{event.location}</span></span>
        </span>
        {person && <span className="event-card-person"><UserRound size={13} aria-hidden="true" /><span>{personLabel}: {person}</span></span>}
      </span>
      <ChevronRight size={15} className="event-card-chevron" aria-hidden="true" />
    </button>
  );
}

const SelectedWeekdayContext = createContext<string | undefined>(undefined);

function AttendanceWeekday({ children, ...props }: WeekdayProps) {
  const selectedWeekday = useContext(SelectedWeekdayContext);
  return <th {...props} data-selected-weekday={children === selectedWeekday || undefined}>{children}</th>;
}

export function AttendanceTab({ childId, childName = "Niño seleccionado" }: { childId: string; childName?: string }) {
  const operationState = useOperationalSimulation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [detail, setDetail] = useState<{ record: AttendanceRecord; event: AttendanceEvent["id"] | "journey"; request: number; source: HTMLButtonElement }>();
  const [detailOpen, setDetailOpen] = useState(false);
  const detailRequest = useRef(0);
  const detailTrigger = useRef<HTMLButtonElement>(null);
  const attendanceRoot = useRef<HTMLDivElement>(null);
  const displayedMonth = format(month, "yyyy-MM");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const grid = attendanceRoot.current?.querySelector(".rdp-month_grid");
    const animation = grid?.animate([{ opacity: .5, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 360, easing: "cubic-bezier(.2,.75,.25,1)" });
    return () => animation?.cancel();
  }, [displayedMonth]);
  function openDetail(record: AttendanceRecord, event: AttendanceEvent["id"] | "journey", trigger: HTMLButtonElement) {
    detailTrigger.current = trigger;
    setDetail({ record, event, request: ++detailRequest.current, source: trigger });
    setDetailOpen(true);
  }
  const [today] = useState(() => new Date());
  const previewRecords = useMemo(() => {
    const current = createCurrentMonthAttendance(childId, today);
    const dates = new Set(current.map(record => record.date));
    return [...MOCK_ATTENDANCE.filter(record => !dates.has(record.date)), ...current];
  }, [childId, today]);
  const firstYear = Math.min(today.getFullYear() - 10, 2026);
  const lastYear = today.getFullYear() + 1;
  const changeMonth = (next: Date) => {
    if (next.getFullYear() >= firstYear && next.getFullYear() <= lastYear) setMonth(startOfMonth(next));
  };

  const toDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  const attendanceMap = useMemo(
    () => new Map(previewRecords.map((record) => [record.date, record])),
    [previewRecords],
  );

  const selectedRecord = attendanceMap.get(toDateKey(selectedDate));
  const confirmedMovements = operationState.movements.filter(movement => movement.receipt.childIds.includes(childId) && localDateKey(new Date(movement.receipt.savedAt)) === toDateKey(selectedDate));

  const confirmedDates = new Set(operationState.movements.filter(movement => movement.receipt.childIds.includes(childId)).map(movement => localDateKey(new Date(movement.receipt.savedAt))));
  const modifiers = {
    present: [...previewRecords.filter((r) => r.status === "present").map(r => parseISO(r.date)), ...operationState.movements.filter(m => m.receipt.childIds.includes(childId)).map(m => parseISO(localDateKey(new Date(m.receipt.savedAt))))],

    absent: previewRecords.filter((r) => r.status === "absent" && !confirmedDates.has(r.date)).map(
      (r) => parseISO(r.date),
    ),

    early: previewRecords.filter((r) => r.status === "early" && !confirmedDates.has(r.date)).map(
      (r) => parseISO(r.date),
    ),
  };

  const cardsData = useMemo(() => selectedRecord ? getAttendanceEvents(selectedRecord) : [], [selectedRecord]);

  const movementCount = confirmedMovements.length || cardsData.length;

  return (
    <div className="tab-content attendance-content" data-child-id={childId} ref={attendanceRoot}>
      <div className="attendance-split">
        {/* CALENDARIO */}
        <div className="attendance-left">
          <div className="attendance-calendar-toolbar">
            <Suspense fallback={<span className="attendance-period-loading" aria-busy="true">{format(month, "MMMM yyyy", { locale: es })}</span>}><MonthYearPicker value={month} onChange={changeMonth} minYear={firstYear} maxYear={lastYear} /></Suspense>
            <div className="attendance-month-navigation" role="group" aria-label="Navegar por meses">
              <button type="button" className="attendance-today" disabled={isSameMonth(month, today) && toDateKey(selectedDate) === toDateKey(today)} onClick={() => { setSelectedDate(today); setMonth(startOfMonth(today)); }}>Hoy</button>
              <button type="button" aria-label="Mes anterior" disabled={month.getFullYear() === firstYear && month.getMonth() === 0} onClick={() => changeMonth(addMonths(month, -1))}><ChevronLeft size={18} aria-hidden="true" /></button>
              <button type="button" aria-label="Mes siguiente" disabled={month.getFullYear() === lastYear && month.getMonth() === 11} onClick={() => changeMonth(addMonths(month, 1))}><ChevronRight size={18} aria-hidden="true" /></button>
            </div>
          </div>
          <span className="sr-only" role="status">{format(month, "MMMM yyyy", { locale: es })}</span>
          <SelectedWeekdayContext.Provider value={isSameMonth(selectedDate, month) ? format(selectedDate, "EEE", { locale: es }) : undefined}>
          <Calendar
            mode="single"
            required
            locale={es}
            components={{ Weekday: AttendanceWeekday }}
            formatters={{ formatWeekdayName: date => format(date, "EEE", { locale: es }) }}
            labels={{ labelDayButton: (date, dayModifiers) => [
              format(date, "PPPP", { locale: es }),
              dayModifiers.today ? "hoy" : "",
              dayModifiers.selected ? "seleccionado" : "",
              dayModifiers.present ? "asistencia registrada" : "",
              dayModifiers.absent ? "ausencia registrada" : "",
              dayModifiers.early ? "salida anticipada" : "",
            ].filter(Boolean).join(", ") }}
            selected={selectedDate}
            month={month}
            onMonthChange={changeMonth}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                changeMonth(date);
              }
            }}
            hideNavigation
            fixedWeeks
            weekStartsOn={1}
            showOutsideDays
            startMonth={new Date(firstYear, 0)}
            endMonth={new Date(lastYear, 11)}
            classNames={{ month_caption: "attendance-calendar-caption" }}
            modifiers={modifiers}
            modifiersClassNames={{
              present: "attendance-present",

              absent: "attendance-absent",

              early: "attendance-early",
            }}
            className="attendance-calendar"
          />
          </SelectedWeekdayContext.Provider>
          <div className="attendance-calendar-legend" aria-label="Indicadores de asistencia">
            <span><i className="attendance-legend-dot present" aria-hidden="true" />Asistencia</span>
            <span><i className="attendance-legend-dot absent" aria-hidden="true" />Ausencia</span>
            <span><i className="attendance-legend-dot early" aria-hidden="true" />Salida anticipada</span>
          </div>
        </div>

        {/* DETALLES */}

        <div className="attendance-right">
          <div className="attendance-record-heading"><div><h3>Registros del día <span className="attendance-record-preview" title="Datos ficticios de demostración">Demo</span></h3><p>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</p></div>{movementCount > 0 && <span className="attendance-movement-count"><Clock3 size={13} aria-hidden="true" />{movementCount} {movementCount === 1 ? "movimiento" : "movimientos"}</span>}</div>
          <OperationalHistory childId={childId} date={toDateKey(selectedDate)} />
          {confirmedMovements.length ? null : selectedRecord?.status === "absent" ? <div key={`absence-${selectedRecord.date}`} className="attendance-no-record"><div className="no-record-icon"><Info size={28} aria-hidden="true" /></div><p className="no-record-title">Ausencia registrada</p><p className="no-record-desc">No hay entradas ni salidas registradas para este día.</p></div> : selectedRecord && cardsData.length > 0 ? (
            <ol className="record-details attendance-day-timeline" key={selectedRecord.date} aria-label={`Movimientos del ${format(selectedDate, "d MMMM", { locale: es })}`} tabIndex={0}>
              {cardsData.map((event, index) => (
                <li key={event.id}>
                  <EventCard selectedDate={selectedDate} event={event} delay={index * 55} onOpen={trigger => openDetail(selectedRecord, event.id, trigger)} />
                </li>
              ))}
            </ol>
          ) : (
            <div key={`empty-${toDateKey(selectedDate)}`} className="attendance-no-record">
              <div className="no-record-icon"><CalendarIcon size={28} aria-hidden="true" /></div>

              <p className="no-record-title">Sin registros</p>

              <p className="no-record-desc">
                No se encontraron registros para el día{" "}
                {format(selectedDate, "PPP", { locale: es })}
              </p>
            </div>
          )}
          <BelongingsFollowUp childId={childId} />
        </div>
      </div>
      {detail && <Suspense fallback={null}><AttendanceRecordDetail key={detail.request} record={detail.record} source={detail.source} initialEvent={detail.event} childName={childName} open={detailOpen} onClose={() => setDetailOpen(false)} onRestoreFocus={() => { if (detailTrigger.current?.isConnected) detailTrigger.current.focus(); }} /></Suspense>}
    </div>
  );
}
