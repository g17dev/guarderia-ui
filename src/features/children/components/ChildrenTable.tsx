import { ChildAvatar } from "./ChildAvatar";
import { getAge } from "../../../utils/child";
import type { Child } from "../../../types/child";
import "./ChildrenTable.css";

interface ChildrenTableProps {
  children: Child[];
  onRowClick: (id: string) => void;
  onDelete: (id: string) => void;
  isFiltered?: boolean;
}

export function ChildrenTable({ children, onRowClick, isFiltered }: ChildrenTableProps) {
  if (children.length === 0) {
    return (
      <div className="table-empty">
        <p>{isFiltered ? "No hay coincidencias con tu búsqueda y filtros." : "Aún no hay niños registrados."}</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="children-table">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Edad</th>
            <th>Padre o Tutor</th>
            <th>Grupo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {children.map(child => (
            <tr
              key={child.id}
              className="table-row-clickable"
              tabIndex={0}
              aria-label={`Ver información de ${child.name} ${child.lastName}`}
              onClick={() => onRowClick(child.id)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(child.id);
                }
              }}
            >
              <td>
                <div className="td-child-inner">
                  <ChildAvatar child={child} size="sm" />
                  <span className="table-child-name">{child.name} {child.lastName}</span>
                </div>
              </td>
              <td>{getAge(child.birthDate)} años</td>
              <td>
                <div className="td-tutor-inner">
                  <span className="tutor-name">{child.tutor.name} {child.tutor.lastName}</span>
                  <span className="tutor-phone">{child.tutor.phone}</span>
                </div>
              </td>
              <td>
                <span className="badge badge-classroom">{child.classroom}</span>
              </td>
              <td>
                <span className={`badge badge-status ${child.status === "active" ? "badge-active" : "badge-inactive"}`}>
                  {child.status === "active" ? "Activo" : "Inactivo"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
