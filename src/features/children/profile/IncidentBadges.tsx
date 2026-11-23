import { AlertTriangle, Bell, CheckCheck, CircleAlert, HeartPulse, ShieldAlert } from "lucide-react";
import { incidentSeverityLabels, incidentStatusLabels, type ChildIncident } from "./incidents";

const statusIcons = { reported: CircleAlert, in_attention: HeartPulse, notified: Bell, resolved: CheckCheck, escalated: ShieldAlert };
export function IncidentBadges({ incident }: { incident: ChildIncident }) {
  const StatusIcon = statusIcons[incident.status];
  return <span className="incident-card__badges">
    <span className={`incident-badge incident-severity-${incident.severity}`}><AlertTriangle size={13} aria-hidden="true" />{incidentSeverityLabels[incident.severity]}</span>
    <span className={`incident-badge incident-status-${incident.status}`}><StatusIcon size={13} aria-hidden="true" />{incidentStatusLabels[incident.status]}</span>
  </span>;
}
