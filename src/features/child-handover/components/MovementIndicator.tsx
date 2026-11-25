import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { LogIn, LogOut } from "lucide-react";
import type { Movement } from "../reception";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const prefersReducedMotion = () => window.matchMedia(motionQuery).matches;

interface MovementIndicatorProps {
  movement: Movement | null;
  label: string;
}

export function MovementIndicator({ movement, label }: MovementIndicatorProps) {
  const slot = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => true);
  const nextLabel = movement ? label : "";
  const [view, setView] = useState({ movement, label: nextLabel, exiting: false });

  // Only the visual indicator is retained while exiting; reception state never waits.
  if (reducedMotion) {
    if (view.movement !== movement || view.label !== nextLabel || view.exiting) {
      setView({ movement, label: nextLabel, exiting: false });
    }
  } else if (view.movement !== movement && !view.exiting) {
    setView(view.movement
      ? { ...view, exiting: true }
      : { movement, label: nextLabel, exiting: false });
  } else if (view.movement === movement && (view.exiting || view.label !== nextLabel)) {
    setView({ movement, label: nextLabel, exiting: false });
  }

  useLayoutEffect(() => {
    if (slot.current && content.current) {
      slot.current.style.setProperty("--movement-width", `${content.current.scrollWidth}px`);
    }
  }, [view.movement, view.label]);

  if (!view.movement) return null;
  return <span key={view.movement} ref={slot} className="reception-movement-slot" data-exiting={view.exiting}
    aria-hidden={view.exiting || undefined} inert={view.exiting}>
    <span ref={content} className="reception-movement-label" data-exiting={view.exiting}
      onAnimationEnd={event => {
        if (event.target !== event.currentTarget || event.animationName !== "reception-movement-out") return;
        setView({ movement, label: nextLabel, exiting: false });
      }}>
      {view.movement === "entry" ? <LogIn size={14} aria-hidden="true" /> : <LogOut size={14} aria-hidden="true" />}
      {view.label}
    </span>
  </span>;
}
