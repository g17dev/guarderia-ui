import { useLayoutEffect, useRef } from "react";
import type { ReceptionChild } from "../reception";

// Animate retained rows from their previous position and fade in new results.
// Native animations require no timers, duplicated rows, or changes to selection.
export function useReceptionListMotion(children: ReceptionChild[]) {
  const rows = useRef(new Map<string, HTMLLabelElement>());
  const positions = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    for (const child of children) {
      const element = rows.current.get(child.id);
      if (!element) continue;
      element.getAnimations().forEach(animation => animation.cancel());
      const top = element.offsetTop;
      next.set(child.id, top);
      if (reducedMotion) continue;
      const previous = positions.current.get(child.id);
      if (previous === undefined || previous !== top) {
        element.animate([
          { transform: `translateY(${previous === undefined ? 6 : previous - top}px)`, opacity: previous === undefined ? 0 : 1 },
          { transform: "translateY(0)", opacity: 1 },
        ], { duration: 200, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
    }
    positions.current = next;
  }, [children]);

  return rows;
}
