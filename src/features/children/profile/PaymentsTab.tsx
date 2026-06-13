import "./ProfileTabs.css";

export function PaymentsTab({ childId }: { childId: string }) {
  const mock = [
    { date: "2024-03-01", concept: "Mensualidad Marzo",  amount: "$2,500", status: "paid"    },
    { date: "2024-02-01", concept: "Mensualidad Febrero", amount: "$2,500", status: "paid"    },
    { date: "2024-01-01", concept: "Mensualidad Enero",   amount: "$2,500", status: "paid"    },
    { date: "2024-04-01", concept: "Mensualidad Abril",   amount: "$2,500", status: "pending" },
  ];

  return (
    <div className="tab-content">
      <div className="tab-table-wrapper">
        <table className="tab-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {mock.map((row, i) => (
              <tr key={i}>
                <td>{new Date(row.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td>{row.concept}</td>
                <td style={{ fontWeight: 600 }}>{row.amount}</td>
                <td>
                  <span className="tab-badge" style={{
                    background: row.status === "paid" ? "#dcfce7" : "#fef3c7",
                    color:      row.status === "paid" ? "#16a34a" : "#d97706",
                  }}>
                    {row.status === "paid" ? "Pagado" : "Pendiente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}