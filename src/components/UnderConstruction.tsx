import "./UnderConstruction.css";

interface UnderConstructionProps {
  pageName: string;
  route: string;
}

export function UnderConstruction({ pageName, route }: UnderConstructionProps) {
  return (
    <div className="uc-wrapper">
      <div className="uc-illustration">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Nubes */}
          <ellipse cx="30" cy="158" rx="22" ry="12" fill="var(--primary-soft)" />
          <ellipse cx="48" cy="150" rx="18" ry="12" fill="var(--primary-soft)" />
          <ellipse cx="170" cy="155" rx="20" ry="11" fill="var(--primary-soft)" />
          <ellipse cx="152" cy="148" rx="16" ry="11" fill="var(--primary-soft)" />
          <ellipse cx="100" cy="162" rx="30" ry="13" fill="var(--primary-soft)" />

          {/* Torre grúa */}
          <line x1="130" y1="40" x2="130" y2="130" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
          <line x1="80" y1="40" x2="150" y2="40" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
          <line x1="130" y1="40" x2="145" y2="55" stroke="var(--primary)" strokeWidth="2" />
          <line x1="140" y1="40" x2="145" y2="55" stroke="var(--primary)" strokeWidth="2" />

          {/* Cabina grúa */}
          <rect x="133" y="44" width="16" height="14" rx="2" fill="var(--primary)" stroke="var(--primary)" strokeWidth="1" />
          <rect x="136" y="46" width="6" height="5" rx="1" fill="var(--illustration-fill)" />

          {/* Cuerpo torre (celosía) */}
          <rect x="126" y="55" width="8" height="75" rx="1" fill="none" stroke="var(--primary)" strokeWidth="1.5" />
          <line x1="126" y1="65" x2="134" y2="75" stroke="var(--primary)" strokeWidth="1" />
          <line x1="134" y1="65" x2="126" y2="75" stroke="var(--primary)" strokeWidth="1" />
          <line x1="126" y1="80" x2="134" y2="90" stroke="var(--primary)" strokeWidth="1" />
          <line x1="134" y1="80" x2="126" y2="90" stroke="var(--primary)" strokeWidth="1" />
          <line x1="126" y1="95" x2="134" y2="105" stroke="var(--primary)" strokeWidth="1" />
          <line x1="134" y1="95" x2="126" y2="105" stroke="var(--primary)" strokeWidth="1" />

          {/* Cable que cuelga */}
          <line x1="105" y1="40" x2="100" y2="72" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Gancho */}
          <path d="M97 72 Q94 78 99 80 Q104 82 104 76" stroke="var(--primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Pantalla / ventana colgante */}
          <rect x="58" y="82" width="76" height="56" rx="5" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
          {/* Barra título ventana */}
          <rect x="58" y="82" width="76" height="12" rx="5" fill="var(--primary)" />
          <rect x="62" y="86" width="4" height="4" rx="2" fill="var(--illustration-fill)" />
          <rect x="69" y="86" width="4" height="4" rx="2" fill="var(--illustration-fill)" />
          <rect x="76" y="86" width="4" height="4" rx="2" fill="var(--illustration-fill)" />

          {/* Contenido ventana — barras placeholder */}
          <rect x="66" y="101" width="58" height="6" rx="3" fill="var(--primary-soft)" />
          <rect x="66" y="112" width="42" height="6" rx="3" fill="var(--primary-soft)" />
          <rect x="66" y="123" width="50" height="6" rx="3" fill="var(--illustration-fill)" />

          {/* Cables de sujeción ventana */}
          <line x1="68" y1="82" x2="90" y2="72" stroke="var(--primary)" strokeWidth="1.2" />
          <line x1="124" y1="82" x2="110" y2="72" stroke="var(--primary)" strokeWidth="1.2" />
        </svg>
      </div>

      <div className="uc-body">
        <span className="uc-badge">En construcción</span>
        <h1 className="uc-title">{pageName}</h1>
        <p className="uc-description">
          Esta sección todavía está siendo desarrollada. Pronto estará disponible.
        </p>
        <div className="uc-route">
          <span className="uc-route-label">Ruta</span>
          <code className="uc-route-code">{route}</code>
        </div>
      </div>
    </div>
  );
}