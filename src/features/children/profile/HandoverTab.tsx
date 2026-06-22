import "./ProfileTabs.css";

export function HandoverTab({ childId }: { childId: string }) {
  const mock = [
    { date: "2024-03-15", time: "14:35", person: "Carlos García", relation: "Padre",  verified: true  },
    { date: "2024-03-14", time: "14:20", person: "Ana López",     relation: "Madre",  verified: true  },
    { date: "2024-03-13", time: "15:10", person: "María García",  relation: "Abuela", verified: true  },
  ];

  return (
    <div className="tab-content">
      <div className="tab-table-wrapper">
        <table className="tab-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Persona</th>
              <th>Relación</th>
              <th>Verificación</th>
            </tr>
          </thead>
          <tbody>
            {mock.map((row, i) => (
              <tr key={i}>
                <td>{new Date(row.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td>{row.time}</td>
                <td style={{ fontWeight: 500 }}>{row.person}</td>
                <td>{row.relation}</td>
                <td>
                  <span className="tab-badge" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    ✓ Verificado
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