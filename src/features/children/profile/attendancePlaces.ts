import type { AttendancePlace } from "./attendanceRecords";

// Real public locations used only as the setting for fictional UX records.
// Nursery coordinates: the Google Maps link provided by the user.
export const previewNursery: AttendancePlace = {
  id: "pequenos-exploradores",
  name: "Estancia Infantil Pequeños Exploradores",
  address: "Av. Selenita 1400, Valle del Pedregal, Mexicali, Baja California",
  latitude: 32.5861013, longitude: -115.357289,
  mapsUrl: "https://maps.app.goo.gl/QJKh9x8hGLaxywz86",
};

// Location sources are retained here to make demo fixtures easy to review.
// https://escuelasmex.com/directorio/DN80718/escuela-primaria-reforma-educativa
export const previewPrimary: AttendancePlace = {
  id: "reforma-educativa",
  name: "Primaria Reforma Educativa",
  address: "Av. Azabache s/n, entre Sanidina y Grunerita, Valle del Pedregal, Mexicali, Baja California",
  latitude: 32.58127439, longitude: -115.35133354,
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=32.58127439%2C-115.35133354",
};

// https://guia-baja-california.portaldeeducacion.com.mx/preescolar/PREESCOLAR-CARMEN-SARA-WELLS-VILLAESCUSA-valle-del-pedregal-mexicali-baja-california-i53686.htm
export const previewPreschool: AttendancePlace = {
  id: "carmen-sara-wells",
  name: "Preescolar Carmen Sara Wells Villaescusa",
  address: "Calle Moldavita, Valle del Pedregal, Mexicali, Baja California",
  latitude: 32.583279, longitude: -115.361708,
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=32.583279%2C-115.361708",
};

export const previewSchoolByChild: Readonly<Record<string, AttendancePlace>> = {
  "1": previewPrimary,
  "2": previewPreschool,
  "4": previewPreschool,
  "5": previewPreschool,
};
