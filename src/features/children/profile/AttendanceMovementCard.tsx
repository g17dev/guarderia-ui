import { BusFront, ChevronRight, Clock3, LogIn, LogOut, MapPin, School, UserRound } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { AttendanceEvent } from "./attendanceRecords";

const movementIcons = { entry: LogIn, exit: LogOut, school: School, transport: BusFront };

interface AttendanceMovementCardProps {
  label: string;
  kind: AttendanceEvent["kind"];
  timestamp: Date;
  location?: string;
  person?: string;
  personLabel?: string;
  delay?: number;
  onOpen: (trigger: HTMLButtonElement) => void;
}

// EventCard presentation recovered from daaaa77. Only available movement data
// is supplied by the caller; confirmed receipts do not acquire preview locations.
export function AttendanceMovementCard({ label, kind, timestamp, location, person, personLabel = "Responsable", delay = 0, onOpen }: AttendanceMovementCardProps) {
  const Icon = movementIcons[kind];
  return <button type="button" className={`event-card event-card-${kind}`} aria-haspopup="dialog"
    aria-label={`Ver detalle: ${label}, ${format(timestamp, "d MMMM", { locale: es })}, ${format(timestamp, "HH:mm")}${person ? `, ${personLabel}: ${person}` : ""}`}
    style={{ animationDelay: `${delay}ms` }} onClick={event => onOpen(event.currentTarget)}>
    <span className="event-card-icon-container"><span className={`event-card-movement-icon ${kind}`}><Icon size={20} aria-hidden="true" /></span></span>
    <span className="event-card-info">
      <span className="event-card-label">{label}</span>
      <span className="event-card-badges">
        <span className="badge badge-datetime"><Clock3 size={13} aria-hidden="true" /><time dateTime={timestamp.toISOString()}>{format(timestamp, "h:mm a", { locale: es })}</time></span>
        {location && <span className="badge badge-location" title={location}><MapPin size={13} aria-hidden="true" /><span>{location}</span></span>}
      </span>
      {person && <span className="event-card-person"><UserRound size={13} aria-hidden="true" /><span>{personLabel}: {person}</span></span>}
    </span>
    <ChevronRight size={15} className="event-card-chevron" aria-hidden="true" />
  </button>;
}
