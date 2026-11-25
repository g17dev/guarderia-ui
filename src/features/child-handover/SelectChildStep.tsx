import { Search } from "lucide-react";
import { useRef } from "react";
import { attendanceLabels, receptionFilterLabels, type ReceptionFilter, type ReceptionChild } from "./reception";
import { getInitials } from "../../utils/child";
import { useReceptionListMotion } from "./hooks/useReceptionListMotion";

interface SelectChildStepProps {
  children: ReceptionChild[];
  selectedIds: string[];
  search: string;
  filterLabel: string;
  filter: ReceptionFilter;
  onFilterChange: (value: ReceptionFilter) => void;
  disabled: boolean;
  onSearch: (value: string) => void;
  onToggle: (id: string) => void;
  pendingCounts?: Record<string, number>;
}

export function SelectChildStep({ children, selectedIds, search, filterLabel, filter, onFilterChange, disabled, onSearch, onToggle, pendingCounts }: SelectChildStepProps) {
  const rowElements = useReceptionListMotion(children);
  const results = useRef<HTMLDivElement>(null);
  return (
    <section id="reception-child-list" className="reception-list" aria-label="Seleccionar niños">
      <div className="reception-tools">
        <label className="reception-search">
          <Search size={19} aria-hidden="true" />
          <input type="search" aria-label="Buscar por nombre o grupo" placeholder="Buscar por nombre o grupo…"
            value={search} onChange={event => {
              results.current?.scrollTo({ top: 0, behavior: "instant" });
              onSearch(event.target.value);
            }} />
        </label>
        <div className="reception-filter-options" role="group" aria-label="Filtrar niños por asistencia">
          {(["all", "inside", "pending", "out", "absent"] as const).map(value => (
            <button key={value} type="button" className="reception-filter" aria-pressed={filter === value}
              aria-controls="reception-child-results" onClick={() => {
                results.current?.scrollTo({ top: 0, behavior: "instant" });
                onFilterChange(value);
              }}>
              {receptionFilterLabels[value]}
            </button>
          ))}
        </div>
        <div className="reception-list-meta">
          <span>{filterLabel} · {children.length}</span>
          <span aria-live="polite">{selectedIds.length ? `${selectedIds.length} seleccionados` : "Sin selección"}</span>
        </div>
      </div>
      <div id="reception-child-results" className="reception-rows" ref={results} tabIndex={0} aria-label="Resultados de niños">
        {children.map(child => (
          <label className={`reception-row ${selectedIds.includes(child.id) ? "is-selected" : ""}`} key={child.id}
            ref={element => { if (element) rowElements.current.set(child.id, element); else rowElements.current.delete(child.id); }}>
            <input type="checkbox" checked={selectedIds.includes(child.id)} disabled={disabled}
              onChange={() => onToggle(child.id)} aria-label={`Seleccionar a ${child.name} ${child.lastName}`} />
            <span className="reception-avatar" aria-hidden="true">{getInitials(child.name, child.lastName)}</span>
            <span className="reception-person"><strong>{child.name} {child.lastName}</strong><small>{child.classroom || "Sin grupo"}</small></span>
            <span className="reception-child-indicators">
              <span className={`reception-status ${child.attendanceStatus}`}>{attendanceLabels[child.attendanceStatus]}</span>
              {!!pendingCounts?.[child.id] && <span className="reception-pending-belongings">{pendingCounts[child.id]} {pendingCounts[child.id] === 1 ? "pertenencia pendiente" : "pertenencias pendientes"}</span>}
            </span>
          </label>
        ))}
        {children.length === 0 && <div className="reception-empty"><p>No hay niños que coincidan con este filtro y búsqueda.</p>
          {search && <button className="reception-button quiet" onClick={() => onSearch("")}>Limpiar búsqueda</button>}</div>}
      </div>
    </section>
  );
}
