export type NoteCategory = "general" | "routine" | "development";
export type ProfileNote = {
  id: string;
  category: NoteCategory;
  text: string;
  createdAt: string;
  author: string;
  role: string;
};
export const noteCategoryLabels: Record<NoteCategory, string> = {
  general: "Observación", routine: "Rutina", development: "Desarrollo",
};

// Fictional observations for reviewing the profile UI.
export const previewProfileNotes: ProfileNote[] = [
  { id: "preview-observation", category: "general", text: "Prefiere quedarse cerca del educador durante actividades nuevas. Le ayuda que le expliquen qué van a hacer antes de comenzar.", createdAt: "2024-03-10T09:15:00", author: "Ana Torres", role: "Maestra" },
  { id: "preview-development", category: "development", text: "Progreso notable en actividades de motricidad fina esta semana. Mostró interés en los juegos de ensartar y participó con mayor autonomía.", createdAt: "2024-03-05T12:30:00", author: "Laura Mendoza", role: "Maestra" },
  { id: "preview-routine", category: "routine", text: "Durante el descanso prefiere un espacio tranquilo. Su manta le ayuda a sentirse cómodo al prepararse para la siesta.", createdAt: "2024-03-04T13:10:00", author: "Ana Torres", role: "Maestra" },
];
