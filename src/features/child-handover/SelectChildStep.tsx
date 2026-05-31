import { useState, useEffect } from "react";
import { InputSearch } from "../../components/InputSearch";
import "./SelectChildStep.css";
import type { Child } from "../../types/child";
import { getInitials, getAvatarColor } from "../../utils/child";

interface SeleccionarStepProps {
  data: { childIds: string[]; childrenNames: string };
  onChange: (data: { childIds: string[]; childrenNames: string }, selectedChildren: Child[]) => void; // ✅ MODIFICADO
  errors: { [key: string]: string };
  children?: Child[];
}

// DATOS DE PRUEBA (MOCK)
const MOCK_CHILDREN: Child[] = [
  { id: "1", name: "Mateo", lastName: "García", datebirth: "2020-01-01", classroom: "Maternal" },
  { id: "2", name: "Valentina", lastName: "Rodríguez", datebirth: "2020-01-01", classroom: "Preescolar" },
  { id: "3", name: "Santiago", lastName: "López", datebirth: "2024-01-01", classroom: "Primaria" },
  { id: "4", name: "Emma", lastName: "Martínez", datebirth: "2022-01-01", classroom: "Maternal" },
  { id: "5", name: "Lucas", lastName: "Fernández", datebirth: "2015-01-01", classroom: "Preescolar" },
  { id: "6", name: "Sofía", lastName: "González", datebirth: "2019-01-01", classroom: "Primaria" }
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
    } else {
      setSelectedChildren([]);
    }
  }, [data.childIds, children]);

  // ✅ Función para seleccionar/deseleccionar (toggle) - MODIFICADA
  const handleToggleChild = (child: Child) => {
    const isAlreadySelected = selectedChildren.some(c => c.id === child.id);
    let newSelected: Child[];

    if (isAlreadySelected) {
      newSelected = selectedChildren.filter(c => c.id !== child.id);
    } else {
      newSelected = [...selectedChildren, child];
    }

    setSelectedChildren(newSelected);
    
    // ✅ MODIFICADO: Pasar también los niños completos como segundo parámetro
    onChange({
      childIds: newSelected.map(c => c.id),
      childrenNames: newSelected.map(c => `${c.name} ${c.lastName}`).join(", ")
    }, newSelected);
  };

  // ✅ Limpiar toda la selección - MODIFICADA
  const handleClearAllSelection = () => {
    setSelectedChildren([]);
    setSearchTerm("");
    onChange({ childIds: [], childrenNames: "" }, []); // ✅ Pasar array vacío
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
        />
        {errors.childIds && <span className="error-message">{errors.childIds}</span>}
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando niños...</p>
        </div>
      )}

      {/* Mostrar cards seleccionadas siempre */}
      {selectedChildren.length > 0 && !searchTerm && (
        <div className="cards-results">
          <div className="results-header">
            <span>{selectedChildren.length} niño(s) seleccionado(s)</span>
          </div>
          <div className="children-cards">
            {selectedChildren.map((child) => {
              const isSelected = selectedChildren.some(c => c.id === child.id);
              return (
                <div 
                  key={child.id} 
                  className={`child-card ${isSelected ? 'selected' : ''}`} 
                  onClick={() => handleToggleChild(child)}
                >
                  <div
                    className="card-avatar"
                    style={{ background: getAvatarColor(child.name, child.lastName) }}
                  >
                    <span className="card-initials">
                      {getInitials(child.name, child.lastName)}
                    </span>
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

      {/* Mostrar resultados de búsqueda (solo cuando se busca) */}
      {searchTerm && filteredChildren.length > 0 && (
        <div className="cards-results">
          <div className="results-header">
            <span>Resultados encontrados con "{searchTerm}": {filteredChildren.length} niño(s)</span>
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
                  <div
                    className="card-avatar"
                    style={{ background: getAvatarColor(child.name, child.lastName) }}
                  >
                    <span className="card-initials">
                      {getInitials(child.name, child.lastName)}
                    </span>
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
                    <div className="select-arrow">
                      <svg className="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <svg className="icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
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