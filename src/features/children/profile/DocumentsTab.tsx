import { FiFile, FiDownload } from "react-icons/fi";
import "./ProfileTabs.css";

export function DocumentsTab({ childId }: { childId: string }) {
  const mock = [
    { name: "Acta de nacimiento.pdf",  size: "245 KB", date: "2023-08-01" },
    { name: "CURP.pdf",                size: "89 KB",  date: "2023-08-01" },
    { name: "Cartilla de vacunación.pdf", size: "1.2 MB", date: "2023-08-01" },
  ];

  if (mock.length === 0) {
    return <div className="tab-empty">Sin documentos registrados</div>;
  }

  return (
    <div className="tab-content">
      <div className="documents-list">
        {mock.map((doc, i) => (
          <div key={i} className="document-item">
            <div className="document-icon">
              <FiFile size={18} />
            </div>
            <div className="document-info">
              <p className="document-name">{doc.name}</p>
              <p className="document-meta">{doc.size} · {new Date(doc.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
            <button className="document-download">
              <FiDownload size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}