import { useState, useEffect } from "react";
import { InputSearch } from "../../components/InputSearch";
import "./SelectChildStep.css";

// Tipos para el niño
interface Child {
  id: string;
  name: string;
  lastName: string;
  classroom?: string;
}

interface SeleccionarStepProps {
  data: { childIds: string[]; childrenNames: string };
  onChange: (data: { childIds: string[]; childrenNames: string }) => void;
  errors: { [key: string]: string };
  children?: Child[];
}

// DATOS DE PRUEBA (MOCK)
const MOCK_CHILDREN: Child[] = [
  { id: "1", name: "Mateo", lastName: "García", classroom: "Maternal" },
  { id: "2", name: "Valentina", lastName: "Rodríguez", classroom: "Preescolar" },
  { id: "3", name: "Santiago", lastName: "López", classroom: "Primaria" },
  { id: "4", name: "Emma", lastName: "Martínez", classroom: "Maternal" },
  { id: "5", name: "Lucas", lastName: "Fernández", classroom: "Preescolar" },
  { id: "6", name: "Sofía", lastName: "González", classroom: "Primaria" }
];

export function SelectChildStep({ 
  data, 
  onChange, 
  errors, 
  children: propChildren 
}: SeleccionarStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChildren, setSelectedChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const children = propChildren && propChildren.length > 0 ? propChildren : MOCK_CHILDREN;

  // Filtrar niños por búsqueda
  const filteredChildren = children.filter((child) => {
    const fullName = `${child.name} ${child.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower);
  });

  // Cargar niños seleccionados desde props
  useEffect(() => {
    if (data.childIds.length > 0 && children.length > 0) {
      const selected = children.filter(c => data.childIds.includes(c.id));
      setSelectedChildren(selected);
    }
  }, [data.childIds, children]);

  // ✅ Función para seleccionar/deseleccionar (toggle)
  const handleToggleChild = (child: Child) => {
    const isAlreadySelected = selectedChildren.some(c => c.id === child.id);
    let newSelected: Child[];

    if (isAlreadySelected) {
      newSelected = selectedChildren.filter(c => c.id !== child.id);
    } else {
      newSelected = [...selectedChildren, child];
    }

    setSelectedChildren(newSelected);
    onChange({
      childIds: newSelected.map(c => c.id),
      childrenNames: newSelected.map(c => `${c.name} ${c.lastName}`).join(", ")
    });
  };

  // Limpiar toda la selección
  const handleClearAllSelection = () => {
    setSelectedChildren([]);
    setSearchTerm("");
    onChange({ childIds: [], childrenNames: "" });
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="select-child-step">
      <div className="step-header">
        <h2>Seleccionar niños</h2>
        <p>Busque y seleccione los niños que saldrán de la guardería.</p>
      </div>

      <div className="input-group">
        <InputSearch 
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          showClearButton={true}
          // ✅ Eliminado disabled
        />
        {errors.childIds && <span className="error-message">{errors.childIds}</span>}
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando niños...</p>
        </div>
      )}

      {/* ✅ Mostrar resultados de búsqueda (sin !selectedChild) */}
      {searchTerm && filteredChildren.length > 0 && (
        <div className="cards-results">
          <div className="results-header">
            <span>{filteredChildren.length} niño(s) encontrado(s)</span>
          </div>
          <div className="children-cards">
            {filteredChildren.map((child) => {
              const isSelected = selectedChildren.some(c => c.id === child.id);
              return (
                <div 
                  key={child.id} 
                  className={`child-card ${isSelected ? 'selected' : ''}`} 
                  onClick={() => handleToggleChild(child)}
                >
                  <div className="card-avatar">
                    <span className="avatar-emoji">👶</span>
                  </div>
                  <div className="card-info">
                    <div className="card-name">
                      {child.name} {child.lastName}
                    </div>
                    <div className="card-details">
                      <span className="card-classroom">{child.classroom || "Sin aula"}</span>
                    </div>
                  </div>
                  <div className="card-select-icon">
                    <span className="select-arrow">
                      {isSelected ? '✓' : '+'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mostrar mensaje cuando no hay resultados */}
      {searchTerm && filteredChildren.length === 0 && (
        <div className="no-results">
          <p>No se encontraron niños con "{searchTerm}"</p>
          <button className="clear-search-btn" onClick={handleClearSearch}>
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* Mostrar resumen de niños seleccionados */}
      {selectedChildren.length > 0 && (
        <div className="selected-summary">
          <div className="selected-summary-header">
            <span className="selected-summary-label">
              ✓ {selectedChildren.length} niño(s) seleccionado(s):
            </span>
            <button className="clear-all-btn" onClick={handleClearAllSelection}>
              Limpiar todos
            </button>
          </div>
          <div className="selected-summary-list">
            {selectedChildren.map((child) => (
              <span key={child.id} className="selected-summary-badge">
                {child.name} {child.lastName}
                <button 
                  className="remove-badge-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleChild(child);
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mostrar mensaje si no hay niños en la lista */}
      {children.length === 0 && (
        <div className="no-children-message">
          <p>⚠️ No hay niños registrados en el sistema.</p>
          <p>Por favor, contacte al administrador.</p>
        </div>
      )}
    </div>
  );
}