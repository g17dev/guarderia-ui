import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

const OPEN_DURATION = 480;
const CLOSE_DURATION = 400;
const SNAPSHOT_STYLES = ["display", "position", "top", "right", "bottom", "left", "width", "height", "min-width", "max-width", "min-height", "padding", "margin", "gap", "align-items", "justify-content", "flex-direction", "flex-grow", "flex-shrink", "flex-basis", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "text-transform", "white-space", "color", "background-color", "border", "border-radius", "box-sizing", "overflow", "text-overflow"];

// A visual-only snapshot carries the original date/type/time through the morph.
// It is inert and aria-hidden; the real dialog remains the accessible UI.
function createRecordSnapshot(source: HTMLElement, host: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement;
  const originals = [source, ...source.querySelectorAll<HTMLElement>("*")];
  const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  originals.forEach((node, index) => {
    const computed = getComputedStyle(node);
    SNAPSHOT_STYLES.forEach(property => copies[index].style.setProperty(property, computed.getPropertyValue(property)));
    copies[index].style.animation = "none";
    copies[index].style.transition = "none";
    copies[index].removeAttribute("id");
  });
  const rect = source.getBoundingClientRect();
  clone.removeAttribute("data-record-origin");
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("inert", "");
  clone.tabIndex = -1;
  Object.assign(clone.style, { position: "fixed", top: "0", left: "0", margin: "0", width: `${rect.width}px`, height: `${rect.height}px`, opacity: "1", backgroundColor: "transparent", borderColor: "transparent", boxShadow: "none", transformOrigin: "top left", transform: `translate(${rect.left}px, ${rect.top}px)`, pointerEvents: "none", willChange: "transform, opacity" });
  host.replaceChildren(clone);
  return clone;
}
function snapshotFrame(clone: HTMLElement, rect: { left: number; top: number; width: number; height: number }) {
  return `translate(${rect.left}px, ${rect.top}px) scale(${rect.width / clone.offsetWidth}, ${rect.height / clone.offsetHeight})`;
}
function summaryRect(sheet: HTMLElement, hero: HTMLElement | null) {
  const panel = sheet.getBoundingClientRect();
  const summary = hero?.getBoundingClientRect();
  if (summary && summary.top >= panel.top && summary.bottom <= panel.bottom) return summary;
  return { left: panel.left + 24, top: panel.top + 28, width: panel.width - 96, height: 94 };
}
function sourceFrame(sheet: HTMLElement, source: HTMLElement) {
  const rect = source.getBoundingClientRect();
  const sx = Math.max(.01, rect.width / sheet.offsetWidth);
  const sy = Math.max(.01, rect.height / sheet.offsetHeight);
  const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
  const dy = rect.top + rect.height / 2 - window.innerHeight / 2;
  const radius = parseFloat(getComputedStyle(source).borderTopLeftRadius) || 14;
  return {
    transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${sx}, ${sy})`,
    borderRadius: `${radius / sx}px / ${radius / sy}px`,
    boxShadow: "0 0 0 rgb(25 36 58 / 0%)",
  };
}

export function useCardMorph({ source, open, onClose, anchor }: {
  source: HTMLButtonElement;
  open: boolean;
  onClose: () => void;
  anchor: RefObject<HTMLElement | null>;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const bridge = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const closing = useRef(false);
  const startMorph = useCallback(() => {
    const element = sheet.current;
    if (!open || !element || element.dataset.morphReady === "true") return;
    element.dataset.morphReady = "true";
    if (overlay.current) overlay.current.dataset.morphReady = "true";
    closing.current = false;
    delete element.dataset.closing;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const from = source.isConnected ? sourceFrame(element, source) : { transform: "translate(-50%, -48%) scale(.97)", borderRadius: "22px", boxShadow: "none" };
      const clone = bridge.current && source.isConnected ? createRecordSnapshot(source, bridge.current) : undefined;
      const destination = summaryRect(element, anchor.current);
      source.setAttribute("data-record-origin", "true");
      const movement = element.animate([from, { transform: "translate(-50%, -50%) scale(1, 1)", borderRadius: "22px", boxShadow: "0 24px 80px rgb(25 36 58 / 20%)" }], { duration: OPEN_DURATION, easing: "cubic-bezier(.2, .75, .2, 1)" });
      const continuity = clone?.animate([{ transform: clone.style.transform, opacity: 1, offset: 0 }, { opacity: 1, offset: .22 }, { transform: snapshotFrame(clone, destination), opacity: 0, offset: 1 }], { duration: OPEN_DURATION * .9, easing: "cubic-bezier(.2, .75, .2, 1)", fill: "forwards" });
      const fades = [...element.children].map((child, index) => child.animate([{ opacity: index === 0 ? .25 : .12 }, { opacity: 1 }], { duration: 300, delay: 35 + index * 20, fill: "backwards", easing: "ease-out" }));
      const background = overlay.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 340, easing: "ease-out" });
      animations.current = [movement, ...fades, ...(continuity ? [continuity] : []), ...(background ? [background] : [])];
    } else {
      source.setAttribute("data-record-origin", "true");
    }
  }, [open, source, anchor]);
  useLayoutEffect(() => {
    startMorph();
    const element = sheet.current;
    const continuityHost = bridge.current;
    return () => {
      animations.current.forEach(animation => animation.cancel());
      animations.current = [];
      continuityHost?.replaceChildren();
      source.removeAttribute("data-record-origin");
      if (element) delete element.dataset.morphReady;
    };
  }, [source, startMorph]);
  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    const element = sheet.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      source.removeAttribute("data-record-origin"); onClose(); return;
    }
    // Read the in-flight frame before cancelling: reversing a fast second click
    // must not jump to the fully expanded position.
    const current = { transform: getComputedStyle(element).transform, borderRadius: getComputedStyle(element).borderRadius, boxShadow: getComputedStyle(element).boxShadow };
    const childOpacity = [...element.children].map(child => getComputedStyle(child).opacity);
    const backgroundOpacity = overlay.current ? getComputedStyle(overlay.current).opacity : "1";
    const existingClone = bridge.current?.firstElementChild as HTMLElement | null;
    const snapshot = existingClone ? { transform: getComputedStyle(existingClone).transform, opacity: getComputedStyle(existingClone).opacity } : undefined;
    animations.current.forEach(animation => animation.cancel());
    element.dataset.closing = "true";
    const target = source.isConnected ? sourceFrame(element, source) : { transform: "translate(-50%, -48%) scale(.97)", borderRadius: "22px", boxShadow: "none" };
    const movement = element.animate([current, target], { duration: CLOSE_DURATION, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "forwards" });
    let continuity: Animation | undefined;
    if (source.isConnected && bridge.current) {
      const inFlight = existingClone && snapshot && Number(snapshot.opacity) > .04;
      const clone = inFlight ? existingClone : createRecordSnapshot(source, bridge.current);
      const from = inFlight ? snapshot : { transform: snapshotFrame(clone, summaryRect(element, anchor.current)), opacity: "0" };
      continuity = clone.animate([from, { opacity: 1, offset: .3 }, { transform: snapshotFrame(clone, source.getBoundingClientRect()), opacity: 1 }], { duration: CLOSE_DURATION, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "forwards" });
    }
    const fades = [...element.children].map((child, index) => child.animate([{ opacity: childOpacity[index] }, { opacity: 0 }], { duration: 230, delay: 25, fill: "forwards", easing: "ease-out" }));
    const background = overlay.current?.animate([{ opacity: backgroundOpacity }, { opacity: 0 }], { duration: CLOSE_DURATION, fill: "forwards", easing: "ease-in-out" });
    animations.current = [movement, ...fades, ...(continuity ? [continuity] : []), ...(background ? [background] : [])];
    movement.onfinish = () => { source.removeAttribute("data-record-origin"); onClose(); };
  }
  return { sheet, overlay, bridge, startMorph, requestClose };
}
