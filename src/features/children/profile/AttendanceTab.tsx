import { useMemo, useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import "./ProfileTabs.css";

import { Calendar } from "../../../components/ui/calendar";

type AttendanceStatus = "present" | "absent" | "early";

type AttendanceRecord = {
  date: string;
  entry: string;
  exit: string;
  status: AttendanceStatus;
};

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    date: "2024-03-15",
    entry: "07:45",
    exit: "14:30",
    status: "present",
  },
  {
    date: "2024-03-14",
    entry: "08:00",
    exit: "14:15",
    status: "present",
  },
  {
    date: "2024-03-13",
    entry: "-",
    exit: "-",
    status: "absent",
  },
  {
    date: "2024-03-12",
    entry: "07:50",
    exit: "14:30",
    status: "present",
  },
  {
    date: "2024-03-11",
    entry: "08:10",
    exit: "13:00",
    status: "early",
  },
];

const ATTENDANCE_STATUS_CONFIG = {
  present: {
    label: "Presente",
    bg: "#dcfce7",
    text: "#16a34a",
  },

  absent: {
    label: "Ausente",
    bg: "#fee2e2",
    text: "#dc2626",
  },

  early: {
    label: "Salida temprana",
    bg: "#fef3c7",
    text: "#d97706",
  },
};

interface EventCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBgColor: string;
  iconColor: string;
}

function EventCard({
  icon,
  label,
  value,
  iconBgColor,
  iconColor,
}: EventCardProps) {
  return (
    <div className="event-card">
      <div
        className="event-card-icon-container"
        style={{ backgroundColor: iconBgColor, color: iconColor }}
      >
        {icon}
      </div>
      <div className="event-card-info">
        <span className="event-card-label">{label}</span>
        <span className="event-card-value">{value}</span>
      </div>
    </div>
  );
}

export function AttendanceTab({ childId }: { childId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date("2024-03-15"),
  );

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

    const statusConfig = ATTENDANCE_STATUS_CONFIG[selectedRecord.status];
    const statusIcon = {
      present: <CheckCircle size={20} />,
      absent: <XCircle size={20} />,
      early: <AlertTriangle size={20} />,
    }[selectedRecord.status];

    return [
      {
        id: "entry",
        icon: <LogIn size={20} />,
        label: "Hora de Entrada",
        value: isEntryValid ? selectedRecord.entry : "Sin registro",
        iconBgColor: isEntryValid ? "#dcfce7" : "#f1f5f9",
        iconColor: isEntryValid ? "#15803d" : "#94a3b8",
      },
      {
        id: "exit",
        icon: <LogOut size={20} />,
        label: "Hora de Salida",
        value: isExitValid ? selectedRecord.exit : "Sin registro",
        iconBgColor: isExitValid ? "#e0f2fe" : "#f1f5f9",
        iconColor: isExitValid ? "#0369a1" : "#94a3b8",
      },
      {
        id: "status",
        icon: statusIcon,
        label: "Estado de Asistencia",
        value: statusConfig.label,
        iconBgColor: statusConfig.bg,
        iconColor: statusConfig.text,
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
            startMonth={new Date(2020, 0)}
            endMonth={new Date()}
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
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
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
                No se encontró asistencia para el día{" "}
                {format(selectedDate, "PPP", { locale: es })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
