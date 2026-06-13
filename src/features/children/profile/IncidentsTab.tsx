import "./ProfileTabs.css";

export function IncidentsTab({ childId }: { childId: string }) {
  const mock = [
    { date: "2024-03-10", description: "Caída leve en el patio durante recreo", severity: "low"    },
    { date: "2024-02-20", description: "Reacción alérgica leve, se administró antihistamínico", severity: "medium" },
  ];

  const SEVERITY: Record<string, { label: string; bg: string; color: string }> = {
    low:    { label: "Leve",     bg: "#dcfce7", color: "#16a34a" },
    medium: { label: "Moderado", bg: "#fef3c7", color: "#d97706" },
    high:   { label: "Severo",   bg: "#fee2e2", color: "#dc2626" },
  };

  if (mock.length === 0) {
    return <div className="tab-empty">Sin incidentes registrados</div>;
  }

  return (
    <div className="tab-content">
      <div className="incidents-list">
        {mock.map((item, i) => (
          <div key={i} className="incident-item">
            <div className="incident-header">
              <span className="incident-date">
                {new Date(item.date).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
              <span className="tab-badge" style={{ background: SEVERITY[item.severity].bg, color: SEVERITY[item.severity].color }}>
                {SEVERITY[item.severity].label}
              </span>
            </div>
            <p className="incident-description">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}