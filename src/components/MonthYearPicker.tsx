import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useId, useMemo, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import "./MonthYearPicker.css";

interface MonthYearPickerProps {
  value: Date;
  onChange: (month: Date) => void;
  minYear?: number;
  maxYear?: number;
  locale?: string;
  disabled?: boolean;
}
const ROW = 44;
// Five rows, two border pixels, and a 44px trigger: share the center line.
const OFFSET = -(ROW * 5 + 2 + 44) / 2;
type WheelHandle = { commit: () => void; focus: () => void };
interface WheelProps {
  label: string;
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  onConfirm: () => void;
}

const PeriodWheel = forwardRef<WheelHandle, WheelProps>(function PeriodWheel({ label, options, selectedIndex, onChange, onConfirm }, ref) {
  const id = useId();
  const initial = useRef(selectedIndex);
  const viewport = useRef<HTMLDivElement>(null);
  const position = useRef(selectedIndex);
  const committed = useRef(selectedIndex);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ pointerId: number; y: number; top: number; moved: boolean } | undefined>(undefined);
  const suppressClick = useRef(false);
  const search = useRef({ text: "", at: 0 });
  const [visualPosition, setVisualPosition] = useState(selectedIndex);
  const clamp = (index: number) => Math.max(0, Math.min(options.length - 1, index));
  const nearest = clamp(Math.round(visualPosition));
  function commit() {
    const index = clamp(Math.round((viewport.current?.scrollTop ?? position.current * ROW) / ROW));
    if (committed.current !== index) { committed.current = index; onChange(index); }
  }
  function moveTo(index: number, smooth: boolean) {
    const next = clamp(index);
    if (!smooth) {
      position.current = next;
      setVisualPosition(next);
      if (committed.current !== next) { committed.current = next; onChange(next); }
    }
    viewport.current?.scrollTo({ top: next * ROW, behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  }
  useLayoutEffect(() => { if (viewport.current) viewport.current.scrollTop = initial.current * ROW; }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  useImperativeHandle(ref, () => ({ commit, focus: () => viewport.current?.focus({ preventScroll: true }) }));

  return <>
    <span className="sr-only" id={`${id}-help`}>Desliza o usa la rueda del mouse. Usa las flechas para cambiar, Inicio y Fin para ir a los extremos. Pulsa Enter o el valor central para cerrar.</span>
    <div className="period-wheel-selection" aria-hidden="true" />
    <div ref={viewport} className="period-wheel-scroll" role="listbox" aria-label={label} aria-describedby={`${id}-help`} aria-activedescendant={`${id}-option-${nearest}`} tabIndex={0}
      onScroll={event => {
        const current = event.currentTarget.scrollTop / ROW;
        position.current = current;
        setVisualPosition(current);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { if (!drag.current?.moved) commit(); }, 140);
      }}
      onPointerDown={event => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        viewport.current?.focus({ preventScroll: true });
        drag.current = { pointerId: event.pointerId, y: event.clientY, top: event.currentTarget.scrollTop, moved: false };
      }}
      onPointerMove={event => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId) return;
        const distance = event.clientY - current.y;
        if (!current.moved && Math.abs(distance) < 4) return;
        current.moved = true;
        event.currentTarget.dataset.dragging = "true";
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.scrollTop = current.top - distance;
        event.preventDefault();
      }}
      onPointerUp={event => {
        const current = drag.current;
        if (!current) return;
        drag.current = undefined;
        delete event.currentTarget.dataset.dragging;
        if (current.moved) {
          suppressClick.current = true;
          moveTo(Math.round(position.current), true);
          commit();
          requestAnimationFrame(() => { suppressClick.current = false; });
        }
      }}
      onPointerCancel={event => { if (!drag.current) return; drag.current = undefined; delete event.currentTarget.dataset.dragging; moveTo(Math.round(position.current), true); commit(); }}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); } }}
      onKeyDown={event => {
        const offsets: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 };
        if (event.key in offsets || event.key === "Home" || event.key === "End") {
          event.preventDefault();
          moveTo(event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : Math.round(position.current) + offsets[event.key], false);
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault(); commit(); onConfirm();
        } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
          const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
          const now = event.timeStamp;
          const text = now - search.current.at < 700 ? search.current.text + event.key : event.key;
          search.current = { text, at: now };
          const index = options.findIndex(option => normalize(option).startsWith(normalize(text)));
          if (index >= 0) { event.preventDefault(); moveTo(index, false); }
        }
      }}>
      {options.map((option, index) => {
        const distance = index - visualPosition;
        return <div key={option} id={`${id}-option-${index}`} role="option" aria-selected={index === nearest} className="period-wheel-option" data-wheel-index={index}
          style={{ opacity: Math.max(.12, 1 - Math.abs(distance) * .3), transform: `perspective(240px) rotateX(${Math.max(-45, Math.min(45, distance * 14))}deg) scale(${Math.max(.85, 1 - Math.abs(distance) * .045)})` }}
          onClick={() => { if (Math.abs(position.current - index) < .08) { commit(); onConfirm(); } else moveTo(index, true); }}>{option}</div>;
      })}
    </div>
    <button type="button" className="period-wheel-confirm" aria-label={`Confirmar ${label.toLocaleLowerCase()}`} onClick={() => { commit(); onConfirm(); }}><Check size={16} aria-hidden="true" /></button>
  </>;
});

export function MonthYearPicker({ value, onChange, minYear = new Date().getFullYear() - 10, maxYear = new Date().getFullYear() + 1, locale = "es-MX", disabled = false }: MonthYearPickerProps) {
  const [open, setOpen] = useState<"month" | "year" | null>(null);
  const [lockedWidth, setLockedWidth] = useState<number>();
  const monthTrigger = useRef<HTMLButtonElement>(null);
  const yearTrigger = useRef<HTMLButtonElement>(null);
  const monthWheel = useRef<WheelHandle>(null);
  const yearWheel = useRef<WheelHandle>(null);
  const months = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, month) => formatter.format(new Date(2020, month, 1)));
  }, [locale]);
  const years = useMemo(() => Array.from({ length: Math.max(0, maxYear - minYear + 1) }, (_, i) => String(minYear + i)), [minYear, maxYear]);
  function changeOpen(next: boolean, panel: "month" | "year") {
    if (next) setLockedWidth((panel === "month" ? monthTrigger : yearTrigger).current?.getBoundingClientRect().width);
    else if (open === panel) (panel === "month" ? monthWheel : yearWheel).current?.commit();
    setOpen(current => next ? panel : current === panel ? null : current);
  }
  return <div className="month-year-picker" role="group" aria-label="Elegir mes y año">
    <Popover.Root open={!disabled && open === "month"} onOpenChange={next => changeOpen(next, "month")}>
      <Popover.Trigger asChild><button ref={monthTrigger} type="button" className="month-year-trigger month-trigger" style={{ width: open === "month" ? lockedWidth : undefined }} disabled={disabled} aria-label={`Cambiar mes, ${months[value.getMonth()]}`}><span>{months[value.getMonth()]}</span><ChevronDown size={14} aria-hidden="true" /></button></Popover.Trigger>
      <Popover.Portal><Popover.Content className="month-year-wheel month-wheel" sideOffset={OFFSET} align="center" collisionPadding={8} aria-label="Seleccionar mes" onOpenAutoFocus={event => { event.preventDefault(); monthWheel.current?.focus(); }}>
        <PeriodWheel ref={monthWheel} label="Mes" options={months} selectedIndex={value.getMonth()} onChange={index => onChange(new Date(value.getFullYear(), index, 1))} onConfirm={() => setOpen(null)} />
      </Popover.Content></Popover.Portal>
    </Popover.Root>
    <Popover.Root open={!disabled && open === "year"} onOpenChange={next => changeOpen(next, "year")}>
      <Popover.Trigger asChild><button ref={yearTrigger} type="button" className="month-year-trigger year-trigger" style={{ width: open === "year" ? lockedWidth : undefined }} disabled={disabled || !years.length} aria-label={`Cambiar año, ${value.getFullYear()}`}><span>{value.getFullYear()}</span><ChevronDown size={14} aria-hidden="true" /></button></Popover.Trigger>
      <Popover.Portal><Popover.Content className="month-year-wheel year-wheel" sideOffset={OFFSET} align="center" collisionPadding={8} aria-label="Seleccionar año" onOpenAutoFocus={event => { event.preventDefault(); yearWheel.current?.focus(); }}>
        <PeriodWheel ref={yearWheel} label="Año" options={years} selectedIndex={Math.max(0, Math.min(years.length - 1, value.getFullYear() - minYear))} onChange={index => onChange(new Date(minYear + index, value.getMonth(), 1))} onConfirm={() => setOpen(null)} />
      </Popover.Content></Popover.Portal>
    </Popover.Root>
  </div>;
}
