import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Columns3, ExternalLink, FlaskConical, RotateCcw } from "lucide-react";
import { directions, scenarios, views, type Direction, type LabView, type Scenario } from "./labData";
import { LabPreview } from "./LabPreview";
import "./DesignLab.css";

const sizes = [{ value: "fit", label: "Adaptable" }, ...[390, 768, 1024, 1280, 1440].map(size => ({ value: String(size), label: `${size} px` }))];
const validDirection = (value: string | null): Direction => value === "precision" || value === "human" ? value : "editorial";
const validView = (value: string | null): LabView => value === "profile" || value === "children" ? value : "reception";
const validScenario = (value: string | null): Scenario => scenarios.find(item => item.id === value)?.id ?? "daily";

export default function DesignLab() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const direction = validDirection(params.get("direction"));
  const view = validView(params.get("view"));
  const scenario = validScenario(params.get("scenario"));
  const compare = params.get("compare") === "true";
  const size = sizes.some(item => item.value === params.get("width")) ? params.get("width")! : "fit";
  const short = params.get("height") === "short";
  const [revision, setRevision] = useState(0);
  const preview = location.pathname.endsWith("/preview");
  function update(values: Record<string, string>) {
    setParams(previous => { const next = new URLSearchParams(previous); Object.entries(values).forEach(([key, value]) => next.set(key, value)); return next; }, { replace: true });
  }
  useEffect(() => {
    if (preview) return;
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || ![...document.querySelectorAll(".dl iframe")].some(frame => (frame as HTMLIFrameElement).contentWindow === event.source)) return;
      if (event.data?.type === "design-lab-navigate" && views.some(item => item.id === event.data.view)) {
        setParams(previous => { const next = new URLSearchParams(previous); next.set("view", event.data.view); next.set("child", event.data.child ?? "1"); return next; }, { replace: true });
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [preview, setParams]);
  useEffect(() => {
    const previousLang = document.documentElement.lang;
    document.documentElement.lang = "es-MX";
    document.title = preview ? `${directions[direction].name} · Junto` : "Laboratorio de diseño · Guardería";
    return () => { document.title = "guarderia-ui"; document.documentElement.lang = previousLang; };
  }, [preview, direction]);

  if (preview) return <LabPreview key={scenario} direction={direction} view={view} scenario={scenario} childId={params.get("child") ?? "1"} onNavigate={(nextView, child) => {
    if (window.parent !== window) window.parent.postMessage({ type: "design-lab-navigate", view: nextView, child }, window.location.origin);
    else update({ view: nextView, child: child ?? "1" });
  }} />;
  const shown: Direction[] = compare ? ["editorial", "precision", "human"] : [direction];
  const previewUrl = (item: Direction) => `/design-lab/preview?${new URLSearchParams({ direction: item, view, scenario, child: params.get("child") ?? "1" })}`;
  const info = directions[direction];
  return <main className="dl">
    <a className="dl-skip" href="#dl-stage">Saltar a las propuestas</a>
    <header className="dl-header"><div><span className="dl-kicker"><FlaskConical size={16} aria-hidden="true" />ESTUDIO DE PRODUCTO</span><h1>Tres maneras de cuidar.</h1><p>Un laboratorio para encontrar nuestra propia forma de hacer las cosas.</p></div><Link className="dl-exit" to="/children">Volver a la aplicación</Link></header>
    <div className="dl-controls" aria-label="Controles del laboratorio">
      <div className="dl-direction-group" role="group" aria-label="Dirección creativa">{(Object.keys(directions) as Direction[]).map(item => <button key={item} type="button" aria-pressed={!compare && direction === item} onClick={() => update({ direction: item, compare: "false" })}><span className={`dl-direction-dot dl-dot-${item}`}>{directions[item].letter}</span><span>{directions[item].name}</span></button>)}</div>
      <button className="dl-compare" aria-pressed={compare} onClick={() => update({ compare: String(!compare) })}><Columns3 size={17} aria-hidden="true" />Comparar las tres</button>
      <div className="dl-options"><div className="dl-view-group" role="group" aria-label="Pantalla de referencia">{views.map(item => <button key={item.id} aria-pressed={view === item.id} onClick={() => update({ view: item.id })}>{item.label}</button>)}</div><label>Ancho<select value={size} onChange={event => update({ width: event.target.value })}>{sizes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Altura<select value={short ? "short" : "regular"} onChange={event => update({ height: event.target.value })}><option value="regular">900 px</option><option value="short">480 px</option></select></label><button className="dl-reset" onClick={() => setRevision(value => value + 1)}><RotateCcw size={16} aria-hidden="true" />Reiniciar</button></div>
      <div className="dl-scenario"><label>Escenario compartido<select value={scenario} onChange={event => update({ scenario: event.target.value })}>{scenarios.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><p>{scenarios.find(item => item.id === scenario)?.hint}</p><span>Datos ficticios · Junto es un nombre de trabajo</span></div>
    </div>
    <section id="dl-stage" className="dl-stage" aria-label="Propuestas interactivas" tabIndex={-1}>
      <p className="dl-stage-note">{compare ? "Las tres propuestas usan el mismo escenario. Desplaza el lienzo para compararlas a tamaño real." : "Interactúa con la propuesta. El marco tiene su propio viewport; los controles de arriba no forman parte del producto."} Cambiar pantalla o dirección reinicia el escenario.</p>
      <div className={`dl-canvas ${compare ? "dl-canvas-compare" : ""}`}><div className="dl-frames">{shown.map(item => <article key={item} className="dl-frame" style={{ width: size === "fit" ? compare ? "min(100%, 480px)" : "100%" : `${Number(size) + 2}px`, minWidth: size === "fit" ? compare ? "340px" : "0" : `${Number(size) + 2}px` }}><header><span><b>{directions[item].letter}</b> {directions[item].name}</span><a href={previewUrl(item)} target="_blank" rel="noopener noreferrer">Abrir propuesta <ExternalLink size={14} aria-hidden="true" /></a></header><iframe key={`${item}-${revision}`} title={`${directions[item].name} · ${views.find(value => value.id === view)?.label}`} src={previewUrl(item)} style={{ height: short ? 480 : 900 }} /></article>)}</div></div>
    </section>
    <section className="dl-foundations" aria-labelledby="dl-foundations-title"><div className="dl-foundations-intro"><span className="dl-kicker">FUNDAMENTOS · {info.letter}</span><h2 id="dl-foundations-title">{info.name}</h2><p>{info.description}</p><div className="dl-swatches">{info.colors.map(color => <div key={color}><span style={{ background: color }} /><code>{color}</code></div>)}</div></div><dl><div><dt>Tipografía</dt><dd>{info.type}</dd></div><div><dt>Ritmo y densidad</dt><dd>{info.rhythm}</dd></div><div><dt>Forma y superficies</dt><dd>{info.shape}</dd></div><div><dt>Movimiento</dt><dd>{info.motion}</dd></div></dl><div className="dl-tradeoffs"><h3>Lo que aporta</h3><p>{info.strength}</p><h3>Lo que debemos vigilar</h3><p>{info.tradeoff}</p></div></section>
    <footer className="dl-footer">Exploración, no identidad aprobada. Sin servicios reales ni captura biométrica. <span>Evalúa: encontrar un menor · consultar cuidados · registrar hermanos · recuperar un error.</span></footer>
  </main>;
}
