import { useRef, useEffect, useState } from "react";
import type { Step } from "../types/stepper";
import "./Stepper.css";

interface Props {
  steps: Step[];
  orientation?: "horizontal" | "vertical";
}

export default function Stepper({ steps, orientation = "horizontal" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [segments, setSegments] = useState<Array<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    progress: number;
  }>>([]);

  const completedSegments = steps.filter(s => s.status === "completed").length;

  useEffect(() => {
    const calculatePositions = () => {
      if (!containerRef.current) return;

      const circles = containerRef.current.querySelectorAll(".circle");
      const newSegments = [];

      for (let i = 0; i < circles.length - 1; i++) {
        const currentCircle = circles[i] as HTMLElement;
        const nextCircle = circles[i + 1] as HTMLElement;

        const currentRect = currentCircle.getBoundingClientRect();
        const nextRect = nextCircle.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        const currentCenterX = currentRect.left + currentRect.width / 2;
        const currentCenterY = currentRect.top + currentRect.height / 2;
        const nextCenterX = nextRect.left + nextRect.width / 2;
        const nextCenterY = nextRect.top + nextRect.height / 2;

        const radius = 20;
        const dx = nextCenterX - currentCenterX;
        const dy = nextCenterY - currentCenterY;
        const angle = Math.atan2(dy, dx);

        const startX = currentCenterX + radius * Math.cos(angle);
        const startY = currentCenterY + radius * Math.sin(angle);
        const endX = nextCenterX - radius * Math.cos(angle);
        const endY = nextCenterY - radius * Math.sin(angle);

        newSegments.push({
          startX: startX - containerRect.left,
          startY: startY - containerRect.top,
          endX: endX - containerRect.left,
          endY: endY - containerRect.top,
          progress: i < completedSegments ? 100 : 0,
        });
      }

      setSegments(newSegments);
    };

    calculatePositions();

    const resizeObserver = new ResizeObserver(() => calculatePositions());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", calculatePositions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculatePositions);
    };
  }, [steps, completedSegments]);

  return (
    <div
      className={`stepper stepper-${orientation}`}
      ref={containerRef}
    >
      <svg className="stepper-svg">
        {segments.map((segment, index) => {
          const length = Math.sqrt(
            Math.pow(segment.endX - segment.startX, 2) +
            Math.pow(segment.endY - segment.startY, 2)
          );
          return (
            <g key={index}>
              <line
                x1={segment.startX} y1={segment.startY}
                x2={segment.endX}   y2={segment.endY}
                className="line-base"
              />
              <line
                x1={segment.startX} y1={segment.startY}
                x2={segment.endX}   y2={segment.endY}
                className="line-progress"
                style={{
                  strokeDasharray: length,
                  strokeDashoffset: length - (segment.progress / 100) * length,
                }}
              />
            </g>
          );
        })}
      </svg>

      {steps.map((step, index) => (
        <div className={`step ${step.status}`} key={index}>
          <div className={`circle ${step.status}`}>
            {step.status === "completed" ? "✓" : index + 1}
          </div>
          <div className="content">
            <h3>{step.title}</h3>
            <span className={`badge ${step.status}`}>
              {step.status === "completed"
                ? "Completado"
                : step.status === "current"
                ? "En progreso"
                : "Pendiente"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}