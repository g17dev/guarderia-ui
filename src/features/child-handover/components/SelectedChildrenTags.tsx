import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReceptionChild } from "../reception";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const prefersReducedMotion = () => window.matchMedia(motionQuery).matches;

type Tag = { id: string; label: string; exiting: boolean };

export function SelectedChildrenTags({ children }: { children: ReceptionChild[] }) {
  const reducedMotion = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => true);
  const selection = children.map(child => ({ id: child.id, label: `${child.name} ${child.lastName}`, exiting: false }));
  const [view, setView] = useState({ selection, tags: selection });
  const list = useRef<HTMLUListElement>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const movements = useRef(new Map<string, Animation>());
  const changed = selection.length !== view.selection.length
    || selection.some((tag, index) => tag.id !== view.selection[index].id || tag.label !== view.selection[index].label);

  // Retain only the visual tag during its exit. The real selection updates immediately.
  if (changed || (reducedMotion && view.tags.some(tag => tag.exiting))) {
    const tags: Tag[] = [...selection];
    if (!reducedMotion) {
      view.tags.forEach((tag, index) => {
        if (!selection.some(selected => selected.id === tag.id)) {
          tags.splice(Math.min(index, tags.length), 0, { ...tag, exiting: true });
        }
      });
    }
    setView({ selection, tags });
  }

  useLayoutEffect(() => {
    const next = new Map<string, { x: number; y: number }>();
    list.current?.querySelectorAll<HTMLLIElement>("li").forEach(element => {
      const id = element.dataset.childId!;
      const point = { x: element.offsetLeft, y: element.offsetTop };
      const previous = positions.current.get(id);
      movements.current.get(id)?.cancel();
      if (!reducedMotion && element.dataset.exiting !== "true" && previous
        && (previous.x !== point.x || previous.y !== point.y)) {
        movements.current.set(id, element.animate([
          { transform: `translate(${previous.x - point.x}px, ${previous.y - point.y}px)` },
          { transform: "translate(0, 0)" },
        ], { duration: 300, easing: "cubic-bezier(.22,1,.36,1)" }));
      }
      next.set(id, point);
    });
    for (const id of movements.current.keys()) {
      if (!next.has(id)) movements.current.delete(id);
    }
    positions.current = next;
  }, [view.tags, reducedMotion]);

  if (!view.tags.length) return null;
  return <ul ref={list} className="reception-picked" aria-label="Alumnos seleccionados" aria-hidden={!children.length || undefined}>
    {view.tags.map(tag => <li key={tag.id} className="reception-child-tag" data-child-id={tag.id}
      data-exiting={tag.exiting} aria-hidden={tag.exiting || undefined}
      onAnimationEnd={event => {
        if (event.target !== event.currentTarget || event.animationName !== "reception-tag-out") return;
        setView(previous => ({ ...previous, tags: previous.tags.filter(item => item.id !== tag.id || !item.exiting) }));
      }}>{tag.label}</li>)}
  </ul>;
}
