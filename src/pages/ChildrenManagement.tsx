import { useState } from "react";
import { Plus, Filter, Download } from "lucide-react";
import { InputSearch } from "../components/InputSearch";
import { ChildrenTable } from "../features/children/components/ChildrenTable";
import { Pagination } from "../features/children/components/Pagination";
import { MOCK_CHILDREN } from "../data/mockChildren";
import type { Child } from "../types/child";
import type { ChangeEvent } from "react";
import "./ChildrenManagement.css";

const PAGE_SIZE = 10;

export function ChildrenManagement() {
  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const filtered = children.filter(child =>
    `${child.name} ${child.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );


  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
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
          <h2>Gestion de niños</h2>
          <p>Consulta y administra la información de los menores inscritos.</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Agregar niño
        </button>
      </div>

      {/* Barra de herramientas */}
      <div className="children-toolbar">
        <div className="toolbar-left">
          <span className="children-count-label">
            Todos los niños <span className="children-count">{filtered.length}</span>
          </span>
        </div>
        <div className="toolbar-right">
          <button className="btn-tool">
            <Filter size={15} />
            Filtrar
          </button>
          <InputSearch
            placeholder="Buscar por nombre..."
            value={search}
            onChange={handleSearch}
            className="toolbar-search"
          />
        </div>
      </div>

      {/* Tabla */}
      <ChildrenTable
        children={paginated}
        onViewProfile={handleViewProfile}
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

    </div>
  );
}