import { useEffect, useId, useState } from "react";
import { ExternalLink, House, MapPin, School } from "lucide-react";
import type { AttendancePlace } from "./attendanceRecords";

type Props = {
  nursery?: AttendancePlace;
  school?: AttendancePlace;
  initialLocation: "nursery" | "school";
};

function MapFrame({ place, url }: { place: AttendancePlace; url: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "delayed">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setStatus(current => current === "ready" ? current : "delayed"), 10000);
    return () => window.clearTimeout(timer);
  }, [attempt]);
  return <div className="attendance-map-frame">
    <iframe key={attempt} className="attendance-real-map" src={url} title={`Mapa de ${place.name}`} referrerPolicy="no-referrer" onLoad={() => setStatus("ready")} onError={() => setStatus("delayed")} />
    {status !== "ready" && <div className="attendance-map-loading" role="status"><MapPin size={24} aria-hidden="true" /><span>{status === "loading" ? "Cargando ubicación…" : "El mapa está tardando en cargar"}</span>{status === "delayed" && <><small>Puedes consultar la dirección en «Abrir mapa».</small><button type="button" onClick={() => { setStatus("loading"); setAttempt(current => current + 1); }}>Reintentar</button></>}</div>}
  </div>;
}

export function AttendanceMiniMap({ nursery, school, initialLocation }: Props) {
  const id = useId();
  const [selected, setSelected] = useState(initialLocation);
  const place = selected === "school" ? school ?? nursery : nursery ?? school;
  if (!place) return <section className="attendance-mini-map attendance-map-unavailable"><MapPin size={18} aria-hidden="true" /><p>Ubicación sin registrar<span>Este registro anterior no tiene una ubicación en el mapa.</span></p></section>;
  // Official OpenStreetMap share embed. Only public place coordinates are sent;
  // no child names, event times or family information are included in the URL.
  const params = new URLSearchParams({
    bbox: [place.longitude - .004, place.latitude - .0025, place.longitude + .004, place.latitude + .0025].join(","),
    layer: "mapnik", marker: `${place.latitude},${place.longitude}`,
  });
  return <section className="attendance-mini-map" aria-labelledby={`${id}-heading`}>
    <div className="attendance-map-heading"><h3 id={`${id}-heading`}><MapPin size={14} aria-hidden="true" />Ubicación del movimiento</h3><span>Ubicaciones reales</span></div>
    {nursery && school && <div className="attendance-map-switch" role="group" aria-label="Lugar que se muestra en el mapa">
      <button type="button" aria-pressed={selected === "nursery"} onClick={() => setSelected("nursery")}><House size={16} aria-hidden="true" />Guardería</button>
      <button type="button" aria-pressed={selected === "school"} onClick={() => setSelected("school")}><School size={16} aria-hidden="true" />Escuela</button>
    </div>}
    <MapFrame key={place.id} place={place} url={`https://www.openstreetmap.org/export/embed.html?${params}`} />
    <div className="attendance-map-place"><p><strong>{place.name}</strong><span>{place.address}</span></p><a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${place.name} en Google Maps (pestaña nueva)`}><ExternalLink size={16} aria-hidden="true" />Abrir mapa</a></div>
    <p className="attendance-map-caption">Referencia del lugar · Movimientos de ejemplo</p>
  </section>;
}
