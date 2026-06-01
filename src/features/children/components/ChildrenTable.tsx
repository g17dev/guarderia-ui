import { Trash2, Eye } from "lucide-react";
import { ChildAvatar } from "./ChildAvatar";
import { getAge } from "../../../utils/child";
import type { Child } from "../../../types/child";
import "./ChildrenTable.css";

interface ChildrenTableProps {
  children: Child[];
  onViewProfile: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChildrenTable({ children, onViewProfile, onDelete }: ChildrenTableProps) {
  if (children.length === 0) {
    return (
      <div className="table-empty">
        <p>No se encontraron niños.</p>
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
            {/* <th>Acciones</th> */}
          </tr>
        </thead>
        <tbody>
          {children.map(child => (
            <tr key={child.id}>

              <td>
                <div className="td-child-inner">
                    <ChildAvatar child={child} size="sm" />
                    <span>{child.name} {child.lastName}</span>
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
              
              {/* Columna de acciones */}
              {/* <td className="td-actions">
                <button
                  className="action-btn action-btn-view"
                  onClick={() => onViewProfile(child.id)}
                  title="Ver perfil"
                >
                  <Eye size={16} />
                </button>
                <button
                  className="action-btn action-btn-delete"
                  onClick={() => onDelete(child.id)}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </td> */}

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}