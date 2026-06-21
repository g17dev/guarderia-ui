import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import "./ProfileTabs.css";

import { Calendar } from "../../../components/ui/calendar";

type AttendanceStatus = "present" | "absent" | "early";

type AttendanceRecord = {
  date: string;
  entry: string;
  exit: string;
  status: AttendanceStatus;
};

export function AttendanceTab({ childId }: { childId: string }) {
  const mock: AttendanceRecord[] = [
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

  const STATUS = {
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

  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date("2024-03-15"),
  );

  const toDateKey = (date: Date) => date.toISOString().split("T")[0];

  const attendanceMap = useMemo(
    () => new Map(mock.map((record) => [record.date, record])),
    [],
  );

  const selectedRecord = attendanceMap.get(toDateKey(selectedDate));

  const modifiers = {
    present: mock
      .filter((r) => r.status === "present")
      .map((r) => new Date(r.date)),

    absent: mock
      .filter((r) => r.status === "absent")
      .map((r) => new Date(r.date)),

    early: mock
      .filter((r) => r.status === "early")
      .map((r) => new Date(r.date)),
  };

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
          {selectedRecord ? (
            <div className="record-details">
              <h3>{format(selectedDate, "PPP", { locale: es })}</h3>

              <div
                className="attendance-badge"
                style={{
                  background: STATUS[selectedRecord.status].bg,

                  color: STATUS[selectedRecord.status].text,
                }}
              >
                {STATUS[selectedRecord.status].label}
              </div>

              <div className="attendance-fields">
                <div>
                  <strong>Entrada</strong>

                  <p>{selectedRecord.entry}</p>
                </div>

                <div>
                  <strong>Salida</strong>

                  <p>{selectedRecord.exit}</p>
                </div>
              </div>
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
