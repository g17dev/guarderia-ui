import { useMemo, useState, type ChangeEvent } from "react";
import { Check, FilterX, ListFilterPlus, Plus } from "lucide-react";
import { InputSearch } from "../components/InputSearch";
import { ChildrenTable } from "../features/children/components/ChildrenTable";
import { Pagination } from "../features/children/components/Pagination";
import { ChildDrawer } from "../features/children/components/ChildDrawer";
import { MOCK_CHILDREN } from "../data/mockChildren";
import type { Child } from "../types/child";
import { useNavigate } from "react-router-dom";
import "./ChildrenManagement.css";

const PAGE_SIZE = 10;

export function ChildrenManagement() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [statusFilters, setStatusFilters] = useState<Set<Child["status"]>>(new Set());
  const [classroomFilters, setClassroomFilters] = useState<Set<string>>(new Set());

  const classrooms = useMemo(() => [...new Set(children.map(child => child.classroom))].sort(), [children]);
  const activeFilterCount = statusFilters.size + classroomFilters.size;
  const filtered = children.filter(child => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    const searchable = `${child.name} ${child.lastName} ${child.tutor.name} ${child.tutor.lastName} ${child.classroom}`.toLocaleLowerCase("es-MX");
    return (!query || searchable.includes(query))
      && (statusFilters.size === 0 || statusFilters.has(child.status))
      && (classroomFilters.size === 0 || classroomFilters.has(child.classroom));
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );


  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const toggleStatus = (status: Child["status"]) => {
    setStatusFilters(previous => {
      const next = new Set(previous);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
    setCurrentPage(1);
  };

  const toggleClassroom = (classroom: string) => {
    setClassroomFilters(previous => {
      const next = new Set(previous);
      next.has(classroom) ? next.delete(classroom) : next.add(classroom);
      return next;
    });
    setCurrentPage(1);
  };

  const handleViewProfile = (id: string) => {
    const child = children.find(c => c.id === id);
    if (child) setSelectedChild(child);
  };

  const handleDelete = (id: string) => {
    setChildren(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="children-page">

      {/* Header principal */}
      <div className="children-header">
        <div className="children-header-text">
          <p className="children-eyebrow">Niños</p>
          <h1>Gestión de niños</h1>
          <p>Consulta y administra la información de los menores inscritos.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/children/new")}>
          <Plus size={18} />
          Agregar niño
        </button>
      </div>

      {/* Barra de herramientas */}
      <div className="children-toolbar">
        <div className="toolbar-left">
          <span className="children-count-label" aria-live="polite">
            Niños <span className="children-count">{filtered.length}</span>
          </span>
        </div>
        <div className="toolbar-right">
          <button className={`btn-tool ${activeFilterCount ? "is-active" : ""}`} popoverTarget="children-filter-popover" aria-label={`Filtrar niños${activeFilterCount ? `, ${activeFilterCount} filtros activos` : ""}`}>
            <ListFilterPlus size={16} />
            Filtrar
            {activeFilterCount > 0 && <span className="btn-filter-count">{activeFilterCount}</span>}
          </button>
          <InputSearch
            placeholder="Buscar niño, tutor o aula..."
            value={search}
            onChange={handleSearch}
            className="toolbar-search"
          />
        </div>
      </div>

      <div id="children-filter-popover" popover="auto" className="children-filter-popover">
        <section className="children-filter-section" aria-labelledby="children-filter-status">
          <h3 id="children-filter-status">Estado</h3>
          {(["active", "inactive"] as const).map(status => {
            const active = statusFilters.has(status);
            return <button type="button" key={status} className={`children-filter-option ${active ? "active" : ""}`} aria-pressed={active} onClick={() => toggleStatus(status)}>
              <span className="children-filter-check"><Check size={12} strokeWidth={3} /></span>
              <span className={`badge badge-status ${status === "active" ? "badge-active" : "badge-inactive"}`}>{status === "active" ? "Activo" : "Inactivo"}</span>
              <span className="children-filter-option-count">{children.filter(child => child.status === status).length}</span>
            </button>;
          })}
        </section>
        <section className="children-filter-section" aria-labelledby="children-filter-classroom">
          <h3 id="children-filter-classroom">Aula</h3>
          <div className="children-filter-classrooms">
            {classrooms.map(classroom => {
              const active = classroomFilters.has(classroom);
              return <button type="button" key={classroom} className={`children-filter-option ${active ? "active" : ""}`} aria-pressed={active} onClick={() => toggleClassroom(classroom)}>
                <span className="children-filter-check"><Check size={12} strokeWidth={3} /></span>
                <span className="children-filter-option-label">{classroom}</span>
                <span className="children-filter-option-count">{children.filter(child => child.classroom === classroom).length}</span>
              </button>;
            })}
          </div>
        </section>
        {activeFilterCount > 0 && <div className="children-filter-footer">
          <button type="button" onClick={() => { setStatusFilters(new Set()); setClassroomFilters(new Set()); setCurrentPage(1); }}>
            <FilterX size={15} /> Limpiar filtros
          </button>
        </div>}
      </div>

      {/* Tabla */}
      <ChildrenTable
        children={paginated}
        onRowClick={handleViewProfile}
        onDelete={handleDelete}
      />

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      <ChildDrawer
        child={selectedChild}
        onClose={() => setSelectedChild(null)}
        // onDelete={handleDelete}
      />

    </div>
  );
}
