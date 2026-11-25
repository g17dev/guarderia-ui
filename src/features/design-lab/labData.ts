import { RECEPTION_EXAMPLE_CHILDREN, RECEPTION_EXAMPLE_ADULTS } from "../child-handover/receptionFixtures";
import { MOCK_CHILDREN } from "../../data/mockChildren";
import type { ReceptionChild } from "../child-handover/reception";

export type Direction = "editorial" | "precision" | "human";
export type LabView = "reception" | "profile" | "children";
export type Scenario = "daily" | "siblings" | "reentry" | "absence" | "rejected" | "offline" | "save-error" | "restricted";

export const directions = {
  editorial: { letter: "A", name: "Cuidado editorial", idea: "El cuidado, en primer plano.", description: "Un expediente vivo. Jerarquía editorial, tinta berenjena y espacio para leer con calma.", type: "Georgia en titulares · sans del sistema en operación", rhythm: "Secciones abiertas · ritmo amplio · controles de 46 px", shape: "Radios de 4–12 px · superficies continuas · líneas finas", motion: "Apariciones suaves de 160 ms, sin demorar las acciones", colors: ["#55354F", "#F8F5F1", "#302A30", "#A56A52"], strength: "Cercanía profesional y una lectura clara de los cuidados.", tradeoff: "Requiere contener los titulares para conservar densidad en recepción." },
  precision: { letter: "B", name: "Precisión cotidiana", idea: "Todo en su lugar. Cada movimiento, claro.", description: "Una estación de trabajo. Navegación lateral, alineación precisa y una densidad que ayuda a decidir.", type: "Geist Variable · cifras tabulares · títulos compactos", rhythm: "Filas compactas · columnas alineadas · controles de 44 px", shape: "Radios de 4–6 px · reglas estructurales · sin sombras", motion: "Cambios de estado de 120 ms y respuesta inmediata", colors: ["#354BC0", "#F5F6F8", "#232C3B", "#DCE2F4"], strength: "Escaneo rápido y un espacio de trabajo eficiente.", tradeoff: "La calidez depende más del lenguaje y del trato a las personas." },
  human: { letter: "C", name: "Vínculo humano", idea: "Cada día comienza con alguien.", description: "Personas antes que registros. Identidades amplias, una franja cálida y navegación cercana a la tarea.", type: "Sans humanista del sistema · titulares redondeados", rhythm: "Listas de personas · grupos legibles · controles de 48 px", shape: "Radios de 18–24 px en áreas clave · fondos cálidos", motion: "Selección acompañada de color y transiciones de 180 ms", colors: ["#944A3C", "#FCFAF6", "#382E2B", "#EEDCD2"], strength: "Reconocimiento personal y una identidad cálida con presencia.", tradeoff: "Los bloques de identidad ocupan más espacio; el rojo de error debe seguir siendo inequívoco." },
} as const;

export const views: { id: LabView; label: string }[] = [
  { id: "reception", label: "Recepción" }, { id: "profile", label: "Perfil del menor" }, { id: "children", label: "Gestión de niños" },
];
export const scenarios: { id: Scenario; label: string; hint: string }[] = [
  { id: "daily", label: "Jornada habitual", hint: "Busca a Mateo y selecciona Salida. Comprueba los cuidados antes de confirmar." },
  { id: "siblings", label: "Salida de hermanos", hint: "Mateo y Mía comparten adultos autorizados. Comprueba la selección completa." },
  { id: "reentry", label: "Reingreso", hint: "Lucas ya salió. Su nueva entrada conserva el movimiento previo." },
  { id: "absence", label: "Ausencia avisada", hint: "Lucía tenía una ausencia avisada; una entrada actualizará su asistencia." },
  { id: "rejected", label: "Adulto sin autorización", hint: "La identificación simulada se rechazará. No se puede confirmar una salida." },
  { id: "offline", label: "Lector desconectado", hint: "La identificación fallará. Conserva la selección y revisa la recuperación." },
  { id: "save-error", label: "Confirmación interrumpida", hint: "El primer guardado pierde su respuesta. El reintento recupera el mismo recibo, sin duplicar." },
  { id: "restricted", label: "Sin permiso de edición", hint: "La consulta sigue disponible. Las acciones de edición explican la restricción." },
];

// One fictional cohort for all nine screens. No photos or network requests.
export function createLabChildren(): ReceptionChild[] {
  const reception = RECEPTION_EXAMPLE_CHILDREN.map(child => ({ ...structuredClone(child), photoUrl: "" }));
  for (const child of MOCK_CHILDREN) if (!reception.some(item => item.id === child.id)) reception.push({ ...structuredClone(child), photoUrl: "", attendanceStatus: "pending", serviceStatus: "inactive" });
  return reception.map(child => ({ ...child,
    birthDate: child.id === "1" || child.id === "reception-example-sibling" ? "2023-03-15" : child.birthDate,
    classroom: child.id === "1" || child.id === "reception-example-sibling" ? "Maternal A" : child.classroom,
  }));
}
export const labAdults = RECEPTION_EXAMPLE_ADULTS;
export const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX");
export const fullName = (child: ReceptionChild) => `${child.name} ${child.lastName}`;
export function scenarioSelection(scenario: Scenario) {
  if (scenario === "siblings") return ["1", "reception-example-sibling"];
  if (scenario === "reentry") return ["5"];
  if (scenario === "absence") return ["reception-example-absence"];
  if (["rejected", "offline", "save-error"].includes(scenario)) return ["1"];
  return [];
}
