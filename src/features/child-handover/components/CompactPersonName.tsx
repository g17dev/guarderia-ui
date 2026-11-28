import { useLayoutEffect, useRef, useState } from "react";

export function CompactPersonName({ name, lastName }: { name: string; lastName: string }) {
  const fullName = `${name} ${lastName}`.trim();
  const surnames = lastName.trim().split(/\s+/).filter(Boolean);
  const initial = (part: string) => `${Array.from(part)[0]}.`;
  const candidates = [...new Set([
    fullName,
    [name, surnames[0], ...surnames.slice(1).map(initial)].filter(Boolean).join(" "),
    [name, ...surnames.map(initial)].filter(Boolean).join(" "),
  ])];
  const element = useRef<HTMLParagraphElement>(null);
  const measurements = useRef<HTMLSpanElement>(null);
  const [view, setView] = useState({ fullName, display: fullName });

  useLayoutEffect(() => {
    const container = element.current;
    const measure = measurements.current;
    if (!container || !measure) return;
    const update = () => {
      const options = Array.from(measure.children);
      const fitting = options.find(option => option.getBoundingClientRect().width <= container.clientWidth);
      const display = (fitting ?? options.at(-1))?.textContent ?? fullName;
      setView(previous => previous.fullName === fullName && previous.display === display
        ? previous : { fullName, display });
    };
    // Observe actual available space, including changes between one and two columns.
    const observer = new ResizeObserver(update);
    observer.observe(container);
    document.fonts.addEventListener("loadingdone", update);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", update);
    };
  }, [fullName]);

  return <p className="movement-review-person-name" ref={element} title={fullName}>
    <span aria-hidden="true">{view.fullName === fullName ? view.display : fullName}</span>
    <span className="sr-only">{fullName}</span>
    <span className="movement-review-name-measure" ref={measurements} aria-hidden="true">
      {candidates.map(candidate => <span key={candidate}>{candidate}</span>)}
    </span>
  </p>;
}
