export type IncidentComment = {
  id: string;
  incidentId: string;
  author: string;
  role: string;
  createdAt: string;
  text: string;
};
export type ChildIncident = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  location: string;
  severity: "low" | "medium" | "high";
  status: "reported" | "in_attention" | "notified" | "resolved" | "escalated";
  reportedBy: string;
  initialResponse: string;
  comments: IncidentComment[];
};
export const incidentSeverityLabels = { low: "Leve", medium: "Moderado", high: "Severo" };
export const incidentStatusLabels = { reported: "Reportado", in_attention: "En atención", notified: "Familia notificada", resolved: "Resuelto", escalated: "Escalado" };
export const demoIncidentAuthor = { author: "Ana Torres", role: "Maestra · Demo" };

// Fictional examples for reviewing documentation UX, not real incident records.
export const previewIncidents: ChildIncident[] = [
  {
    id: "playground-fall", occurredAt: "2024-03-10T10:20:00", title: "Caída leve en el patio durante recreo",
    description: "Durante el juego en el patio, el niño tropezó y se lastimó la rodilla. La maestra que estaba a cargo documentó lo sucedido.",
    severity: "low", status: "reported", location: "Patio de juegos", reportedBy: "Ana Torres · Maestra",
    initialResponse: "Se acompañó al niño y se registró la atención brindada. El equipo quedó pendiente de su evolución.",
    comments: [
      { id: "fall-1", incidentId: "playground-fall", author: "Ana Torres", role: "Maestra", createdAt: "2024-03-10T10:30:00", text: "Después del incidente se quedó acompañado en el salón. Documenté lo sucedido para el siguiente turno." },
      { id: "fall-2", incidentId: "playground-fall", author: "Laura Mendoza", role: "Maestra", createdAt: "2024-03-10T12:15:00", text: "Al recibir el grupo revisé el reporte con Ana. Continuaremos anotando cualquier cambio durante la jornada." },
      { id: "fall-3", incidentId: "playground-fall", author: "María Ruiz", role: "Recepción", createdAt: "2024-03-10T16:10:00", text: "Se compartió el reporte con la familia al momento de la recogida." },
    ],
  },
  {
    id: "allergic-reaction", occurredAt: "2024-02-20T11:05:00", title: "Reacción alérgica durante la jornada",
    description: "La maestra observó una reacción y la reportó al personal responsable. Se abrió este registro para concentrar la atención y el seguimiento.",
    severity: "medium", status: "in_attention", location: "Comedor", reportedBy: "Laura Mendoza · Maestra",
    initialResponse: "Se informó al personal responsable y se contactó a la familia. La atención se documenta en el seguimiento.",
    comments: [{ id: "allergy-1", incidentId: "allergic-reaction", author: "Laura Mendoza", role: "Maestra", createdAt: "2024-02-20T11:15:00", text: "Compartí con recepción las observaciones y el momento en que se detectó la reacción, para informar a la familia." }],
  },
  {
    id: "fever", occurredAt: "2024-01-15T12:10:00", title: "Fiebre y malestar general",
    description: "Durante la jornada se reportó malestar. El equipo informó a la familia y documentó los hechos observados.",
    severity: "high", status: "notified", location: "Salón", reportedBy: "Ana Torres · Maestra",
    initialResponse: "Se contactó a la familia y se dejó constancia del aviso. El niño permaneció acompañado por personal de guardería.", comments: [],
  },
  {
    id: "head-bump", occurredAt: "2024-04-05T09:40:00", title: "Golpe durante el juego en el salón",
    description: "El niño se golpeó durante una actividad en el salón. La maestra registró el incidente y la atención brindada.",
    severity: "medium", status: "resolved", location: "Salón de actividades", reportedBy: "Ana Torres · Maestra",
    initialResponse: "Se brindó acompañamiento, se documentó la atención y se avisó a la familia.",
    comments: [
      { id: "bump-1", incidentId: "head-bump", author: "Ana Torres", role: "Maestra", createdAt: "2024-04-05T10:00:00", text: "Quedaron registrados el lugar y las circunstancias del incidente para compartirlos con la familia." },
      { id: "bump-2", incidentId: "head-bump", author: "María Ruiz", role: "Recepción", createdAt: "2024-04-05T17:30:00", text: "La familia recibió el reporte. El equipo dio por concluido el seguimiento de este ejemplo." },
    ],
  },
  {
    id: "group-conflict", occurredAt: "2024-05-01T10:35:00", title: "Conflicto durante una actividad en grupo",
    description: "Se presentó un conflicto entre compañeros durante una actividad. El equipo registró lo observado para dar seguimiento de forma conjunta con la familia.",
    severity: "high", status: "escalated", location: "Salón de actividades", reportedBy: "Laura Mendoza · Maestra",
    initialResponse: "Se acompañó a los niños involucrados y se solicitó apoyo de coordinación para revisar lo sucedido.",
    comments: [
      { id: "group-1", incidentId: "group-conflict", author: "Laura Mendoza", role: "Maestra", createdAt: "2024-05-01T10:45:00", text: "Documenté las circunstancias de la actividad y compartí el reporte con coordinación." },
      { id: "group-2", incidentId: "group-conflict", author: "Ana Torres", role: "Maestra", createdAt: "2024-05-01T12:00:00", text: "Revisamos el contexto con el equipo del siguiente turno para mantener un seguimiento consistente." },
      { id: "group-3", incidentId: "group-conflict", author: "Elena García", role: "Coordinación", createdAt: "2024-05-01T13:15:00", text: "Se acordó una conversación con la familia para revisar juntos el reporte." },
    ],
  },
];
