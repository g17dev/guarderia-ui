import { useMemo, useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LogIn, LogOut, Calendar as CalendarIcon, MapPin } from "lucide-react";

import "./ProfileTabs.css";

import { Calendar } from "../../../components/ui/calendar";

type AttendanceStatus = "present" | "absent" | "early";

type AttendanceRecord = {
  date: string;
  entry: string;
  exit: string;
  status: AttendanceStatus;
  location: string;
};

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

const MOCK_ATTENDANCE = generateMockAttendance("2026-06-15", "2026-06-21");

interface EventCardProps {
  selectedDate: Date;
  label: string;
  type: "entry" | "exit" | "status";
  datetime: string;
  location: string;
  iconBgColor: string;
  iconColor: string;
}

function EventCard({
  selectedDate,
  label,
  type,
  datetime,
  location,
}: EventCardProps) {
  const MONTHS_SHORT = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const [hours, minutes] = dateStr.split(":").map(Number);
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "pm" : "am";
    const monthName = MONTHS_SHORT[selectedDate.getMonth()];
    const monthCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${monthCap} ${selectedDate.getDate()} a las ${hour12}:${String(minutes).padStart(2, "0")}${ampm}`;
  };

  const truncateLocation = (loc: string, maxChars = 22) => {
    if (!loc) return "";

    const parts = loc.split(",").map((p) => p.trim());
    let result = parts[0];

    // Si el primer segmento (calle) ya excede el límite, lo truncamos con "…"
    if (result.length > maxChars) {
      return result.slice(0, maxChars).trimEnd() + "…";
    }

    // Si hay un segundo segmento (ciudad), intentamos agregarlo
    if (parts[1]) {
      const withCity = `${result}, ${parts[1]}`;
      if (withCity.length <= maxChars) {
        result = withCity;
      } else {
        // No cabe completo, agregamos "…" para indicar que hay más info
        result = result + "…";
      }
    } else {
      // No hay segundo segmento, pero si quedó espacio igual indicamos truncado
      result = result + "…";
    }

    return result;
  };

  return (
    <div className="event-card">
      <div className="event-card-icon-container">
        <span className="event-card-day-number">
          {format(selectedDate, "d")}
        </span>
        <span className="event-card-day-name">
          {format(selectedDate, "EEEE", { locale: es })}
        </span>
      </div>
      <div className="event-card-info">
        <span className="event-card-label">{label}</span>
        <div className="event-card-details">
          <div className="event-card-badges">
            {type === "entry" && (
              <span className="badge badge-type badge-type-entry">
                <LogIn size={12} />
                <span>Entrada</span>
              </span>
            )}
            {type === "exit" && (
              <span className="badge badge-type badge-type-exit">
                <LogOut size={12} />
                <span>Salida</span>
              </span>
            )}
            {type === "status" && (
              <span className="badge badge-type badge-type-status">
                <LogIn size={12} />
                <span>{label}</span>
              </span>
            )}
            {datetime && (
              <span className="badge badge-datetime">
                <CalendarIcon size={12} />
                <span>{formatDateTime(datetime)}</span>
              </span>
            )}
            {location && (
              <span className="badge badge-location" title={location}>
                <MapPin size={12} />
                <span>{truncateLocation(location)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttendanceTab({ childId }: { childId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const containerRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const checkScroll = () => {
    const el = containerRef.current;
    if (el) {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowTopFade(scrollTop > 2);
      setShowBottomFade(scrollHeight - scrollTop - clientHeight > 2);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 50);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const maskStyle = useMemo(() => {
    if (!showTopFade && !showBottomFade) return {};

    const top = showTopFade ? "transparent 0%, black 24px" : "black 0px";
    const bottom = showBottomFade
      ? "black calc(100% - 24px), transparent 100%"
      : "black 100%";

    const gradient = `linear-gradient(to bottom, ${top}, ${bottom})`;
    return {
      WebkitMaskImage: gradient,
      maskImage: gradient,
    };
  }, [showTopFade, showBottomFade]);

  const toDateKey = (date: Date) => date.toISOString().split("T")[0];

  const attendanceMap = useMemo(
    () => new Map(MOCK_ATTENDANCE.map((record) => [record.date, record])),
    [],
  );

  const selectedRecord = attendanceMap.get(toDateKey(selectedDate));

  const modifiers = {
    present: MOCK_ATTENDANCE.filter((r) => r.status === "present").map(
      (r) => new Date(r.date),
    ),

    absent: MOCK_ATTENDANCE.filter((r) => r.status === "absent").map(
      (r) => new Date(r.date),
    ),

    early: MOCK_ATTENDANCE.filter((r) => r.status === "early").map(
      (r) => new Date(r.date),
    ),
  };

  const cardsData = useMemo(() => {
    if (!selectedRecord) return [];

    const isEntryValid = selectedRecord.entry !== "-";
    const isExitValid = selectedRecord.exit !== "-";

    return [
      {
        id: "entry",
        type: "entry" as const,
        label: "Hora de Entrada",
        datetime: isEntryValid ? selectedRecord.entry : "",
        location: selectedRecord.location,
        iconBgColor: isEntryValid ? "#dcfce7" : "#f1f5f9",
        iconColor: isEntryValid ? "#15803d" : "#94a3b8",
      },
      {
        id: "exit",
        type: "exit" as const,
        label: "Hora de Salida",
        datetime: isExitValid ? selectedRecord.exit : "",
        location: selectedRecord.location,
        iconBgColor: isExitValid ? "#e0f2fe" : "#f1f5f9",
        iconColor: isExitValid ? "#0369a1" : "#94a3b8",
      },
    ];
  }, [selectedRecord]);

  return (
    <div className="tab-content" data-child-id={childId}>
      <div className="attendance-split">
        {/* CALENDARIO */}
        <div className="attendance-left">
          <Calendar
            mode="single"
            locale={es}
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
              }
            }}
            captionLayout="dropdown"
            showOutsideDays
            startMonth={new Date(2026, 5)}
            endMonth={new Date(2026, 5)}
            modifiers={modifiers}
            modifiersClassNames={{
              present: "attendance-present",

              absent: "attendance-absent",

              early: "attendance-early",
            }}
            className="rounded-xl w-full h-full"
          />
        </div>

        {/* DETALLES */}

        <div className="attendance-right">
          <h3>Registros</h3>
          {selectedRecord ? (
            <div
              ref={containerRef}
              className="record-details"
              onScroll={checkScroll}
              style={maskStyle}
            >
              {cardsData.map((card) => (
                <EventCard
                  key={card.id}
                  selectedDate={selectedDate}
                  label={card.label}
                  type={card.type}
                  datetime={card.datetime}
                  location={card.location}
                  iconBgColor={card.iconBgColor}
                  iconColor={card.iconColor}
                />
              ))}
            </div>
          ) : (
            <div className="attendance-no-record">
              <div className="no-record-icon">📅</div>

              <p className="no-record-title">Sin registros</p>

              <p className="no-record-desc">
                No se encontraron registros para el día{" "}
                {format(selectedDate, "PPP", { locale: es })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
