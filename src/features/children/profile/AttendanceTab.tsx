import "./ProfileTabs.css";

export function AttendanceTab({ childId }: { childId: string }) {
  const mock = [
    { date: "2024-03-15", entry: "07:45", exit: "14:30", status: "present" },
    { date: "2024-03-14", entry: "08:00", exit: "14:15", status: "present" },
    { date: "2024-03-13", entry: "-",     exit: "-",     status: "absent"  },
    { date: "2024-03-12", entry: "07:50", exit: "14:30", status: "present" },
    { date: "2024-03-11", entry: "08:10", exit: "13:00", status: "early"   },
  ];

  const STATUS: Record<string, { label: string; color: string }> = {
    present: { label: "Presente",       color: "#dcfce7 #16a34a" },
    absent:  { label: "Ausente",        color: "#fee2e2 #dc2626" },
    early:   { label: "Salida temprana", color: "#fef3c7 #d97706" },
  };

  return (
    <div className="tab-content">
      <div className="tab-table-wrapper">
        <table className="tab-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {mock.map((row, i) => {
              const [bg, text] = STATUS[row.status].color.split(" ");
              return (
                <tr key={i}>
                  <td>{new Date(row.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>{row.entry}</td>
                  <td>{row.exit}</td>
                  <td>
                    <span className="tab-badge" style={{ background: bg, color: text }}>
                      {STATUS[row.status].label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}